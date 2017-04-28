let mod = {};
module.exports = mod;
mod.name = 'collapseWorker';
mod.run = function(creep) {
    if( creep.action == null || creep.action.name === 'idle' ) {
        this.nextAction(creep);
    }

    // Do some work
    if( creep.action && creep.target ) {
        creep.action.step(creep);
    } else {
        logError('Creep without action/activity!\nCreep: ' + creep.name + '\ndata: ' + JSON.stringify(creep.data));
    }
};
mod.nextAction = function(creep){
    if( creep.pos.roomName !== creep.data.homeRoom ) {
        if( global.DEBUG && global.TRACE ) trace('Behaviour', {actionName:'travelling', behaviourName:this.name, creepName:creep.name, assigned: true, Behaviour:'nextAction', Action:'assign'});
        Creep.action.travelling.assignRoom(creep, creep.data.homeRoom);
        return true;
    }

    if( !creep.room.collapsed ) {
        if( global.DEBUG && global.TRACE ) trace('Behaviour', {actionName:'recycling', behaviourName:this.name, creepName:creep.name, assigned: true, Behaviour:'nextAction', Action:'assign'});
        return Creep.action.recycling.assign(creep);
    }
    const invasion = creep.room.situation.invasion && creep.room.controller && creep.room.controller.level > 2;
    const outflowPriority = invasion ? 
        [
            Creep.action.feeding,
            Creep.action.fueling,
            Creep.action.repairing
        ] :
        [
            Creep.action.feeding,
            Creep.action.fueling,
            Creep.action.charging,
            Creep.action.repairing,
            Creep.action.building,
            Creep.action.fortifying,
            Creep.action.upgrading
        ];
    let priority = outflowPriority;
    if( creep.sum < (creep.carryCapacity*0.5) ) {
        priority = [
            Creep.action.picking,
            Creep.action.withdrawing,
            Creep.action.uncharging,
            Creep.action.harvesting,
            Creep.action.dismantling,
            Creep.action.reallocating,
            Creep.action.idle
        ];
    }
    else {
        if(!invasion){
            priority.push(Creep.action.storing);
            priority.push(Creep.action.picking);
        }
        if( creep.room.controller && creep.room.controller.ticksToDowngrade < 500 ) { // urgent upgrading
            priority.unshift(Creep.action.upgrading);
        }
        priority.push(Creep.action.idle);
    }
    for(var iAction = 0; iAction < priority.length; iAction++) {
        var action = priority[iAction];
        const valid = action.isValidAction(creep);
        if( global.DEBUG && global.TRACE ) trace('Action', {actionName:action.name, behaviourName:this.name, creepName:creep.name, valid, Action:'isValidAction'});
        if( !valid ) continue;

        const addable = action.isAddableAction(creep);
        if( global.DEBUG && global.TRACE ) trace('Action', {actionName:action.name, behaviourName:this.name, creepName:creep.name, addable, Action:'isAddableAction'});
        if( !addable ) continue;

        const assigned = action.assignDebounce ? action.assignDebounce(creep, outflowPriority) : action.assign(creep);
        if( global.DEBUG && global.TRACE ) trace('Action', {actionName:action.name, behaviourName:this.name, creepName:creep.name, target: creep.target, assigned, Action:'assign'});
        if (assigned) {
            if (action.name !== 'idle') {
                creep.data.lastAction = action.name;
                creep.data.lastTarget = creep.target.id;
            }
            return;
        }
    }
    return false;
};
mod.strategies = {
    defaultStrategy: {
        name: `default-${mod.name}`,
        canWithdrawEnergy: function(creep, target) {
            return function(amount) {
                return amount > 0;
            };
        },
    },
};
mod.selectStrategies = function(actionName) {
    return [mod.strategies.defaultStrategy, mod.strategies[actionName]];
};
