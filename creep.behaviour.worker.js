let mod = {};
module.exports = mod;
mod.name = 'worker';
mod.run = function(creep) {
    // Assign next Action
    let oldTargetId = creep.data.targetId;
    if( creep.action == null || creep.action.name == 'idle' ) {
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
    if( creep.data.creepType == "worker" && creep.pos.roomName != creep.data.homeRoom && Game.rooms[creep.data.homeRoom] && Game.rooms[creep.data.homeRoom].controller ) {
        if( DEBUG && TRACE ) trace('Behaviour', {actionName:'travelling', behaviourName:this.name, creepName:creep.name, assigned: true, Behaviour:'nextAction', Action:'assign'});
        Creep.action.travelling.assignRoom(creep, creep.data.homeRoom);
        return true;
    }
    let priority;
    if( creep.sum < (creep.carryCapacity*0.5) ) {
        priority = [
            Creep.action.picking,
            Creep.action.dismantling,
            Creep.action.withdrawing,
            Creep.action.uncharging,
            Creep.action.harvesting,
            Creep.action.reallocating,
            Creep.action.idle];
    }
    else {
        if( creep.room.situation.invasion && creep.room.controller && creep.room.controller.level > 2 ){
            priority = [
                Creep.action.fueling,
                Creep.action.feeding,
                Creep.action.repairing,
                Creep.action.idle];
        } else {
            if (creep.data.creepType === "pioneer") { // prioritize building for pioneers, upgrade to RCL2 first
                if (creep.room.controller && creep.room.controller.level < 2) {
                    priority = [
                        Creep.action.feeding,
                        Creep.action.upgrading,
                        Creep.action.building,
                        Creep.action.repairing,
                        Creep.action.fueling,
                        Creep.action.fortifying,
                        Creep.action.charging,
                        Creep.action.storing,
                        Creep.action.picking,
                        Creep.action.idle];
                } else {
                    priority = [
                        Creep.action.feeding,
                        Creep.action.building,
                        Creep.action.repairing,
                        Creep.action.fueling,
                        Creep.action.fortifying,
                        Creep.action.charging,
                        Creep.action.upgrading,
                        Creep.action.storing,
                        Creep.action.picking,
                        Creep.action.idle];
                }
            } else {
                priority = [
                    Creep.action.repairing,
                    Creep.action.feeding,
                    Creep.action.building,
                    Creep.action.fueling,
                    Creep.action.fortifying,
                    Creep.action.charging,
                    Creep.action.upgrading,
                    Creep.action.storing,
                    Creep.action.picking,
                    Creep.action.idle];
            }
        }
        if( creep.room.relativeEnergyAvailable < 1 && (!creep.room.population || !creep.room.population.typeCount['hauler'] || creep.room.population.typeCount['hauler'] < 1 || !creep.room.population.typeCount['miner'] || creep.room.population.typeCount['miner'] < 1) ) {
            priority.unshift(Creep.action.feeding);
        }
        if( creep.room.controller && creep.room.controller.ticksToDowngrade < 2000 ) { // urgent upgrading
            priority.unshift(Creep.action.upgrading);
        }
    }
    if( creep.sum > creep.carry.energy ) {
        priority.unshift(Creep.action.storing);
    }
    for(var iAction = 0; iAction < priority.length; iAction++) {
        var action = priority[iAction];
        const valid = action.isValidAction(creep);
        if( DEBUG && TRACE ) trace('Action', {actionName:action.name, behaviourName:this.name, creepName:creep.name, valid, Action:'isValidAction'});
        if( !valid ) continue;

        const addable = action.isAddableAction(creep);
        if( DEBUG && TRACE ) trace('Action', {actionName:action.name, behaviourName:this.name, creepName:creep.name, addable, Action:'isAddableAction'});
        if( !addable ) continue;

        const assigned = action.assign(creep);
        if( assigned ) {
            if( DEBUG && TRACE ) trace(assigned ? 'Behaviour' : 'Action', {actionName:action.name, behaviourName:this.name, reepName:creep.name, assigned, Behaviour:'nextAction', Action:'assign'});
            return true;
        }
    }
    return false;
};
