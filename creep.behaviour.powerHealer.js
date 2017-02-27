let mod = {};
module.exports = mod;
mod.name = 'powerHealer';
mod.run = function(creep) {
    // Assign next Action
    if (!creep.action || creep.action.name === 'idle') this.nextAction(creep);
    // Do some work
    if( creep.action ) {
        creep.action.step(creep);
    } else {
        logError('Creep without action/activity!\nCreep: ' + creep.name + '\ndata: ' + JSON.stringify(creep.data));
    }

    if(creep.data.body.heal !== undefined){
        // Heal self
        if( creep.hits < creep.hitsMax ){
            creep.heal(creep);
        }
        // Heal other
        else if(creep.room.casualties.length > 0 ) {
            const injured = creep.pos.findInRange(creep.room.casualties, 3);
            if( injured.length > 0 ){
                if(creep.pos.isNearTo(injured[0])) {
                    creep.heal(injured[0]);
                } else {
                    creep.rangedHeal(injured[0]);
                }
            }
        }
    }
};
mod.nextAction = function(creep){
    const flag = FlagDir.find(FLAG_COLOR.invade.powerMining, creep.pos, false);
    const homeRoom = creep.data.homeRoom;

    Population.registerCreepFlag(creep, flag);

 
    let target = Game.creeps[Creep.prototype.findGroupMemberByType("powerMiner", creep.data.flagName)];
    if(!target) target = flag;


    if( !flag ){
        Creep.action.recycling.assign(creep);
    } else if( !target ){
        if(creep.pos.roomName != creep.data.homeRoom) {
            return Creep.action.idle.assign(creep); //Creep.action.travelling.assign(creep, creep.data.homeRoom);
        } else {
            return Creep.action.idle.assign(creep);
        }
    } else {
        if(creep.pos.getRangeTo(target) > 1){
            creep.data.ignoreCreeps = false;
            return Creep.action.travelling.assign(creep, target);
        }
        return Creep.action.idle.assign(creep);
    }
};
mod.strategies = {
    defaultStrategy: {
        name: `default-${mod.name}`,
        moveOptions: function(options) {
            // allow routing in and through hostile rooms
            if (_.isUndefined(options.allowHostile)) options.allowHostile = true;
            return options;
        }
    }
};
mod.selectStrategies = function(actionName) {
    return [mod.strategies.defaultStrategy, mod.strategies[actionName]];
};