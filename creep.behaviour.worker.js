module.exports = {
    name: 'worker',
    run: function(creep) {
        // Assign next Action
        let oldTargetId = creep.data.targetId;
        if( creep.action == null || creep.action.name == 'idle' ) {
            this.nextAction(creep);
        }
        if( creep.data.targetId != oldTargetId ) {
            delete creep.data.path;
        }
        // Do some work
        if( creep.action && creep.target ) {
            creep.action.step(creep);
        } else {
            logError('Creep without action/activity!\nCreep: ' + creep.name + '\ndata: ' + JSON.stringify(creep.data));
        }
    },
    nextAction: function(creep){
        if( creep.data.creepType == "worker" && creep.pos.roomName != creep.data.homeRoom && Game.rooms[creep.data.homeRoom] && Game.rooms[creep.data.homeRoom].controller ) {
            Creep.action.travelling.assign(creep, Game.rooms[creep.data.homeRoom].controller);
            return;
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
            if( TRACE ) trace('action',{actionName:action.name,creepName:creep.name,action:'valid'}, valid);
            const addable = action.isAddableAction(creep);
            if( TRACE ) trace('action',{actionName:action.name,creepName:creep.name,action:'addable'}, addable);
            if( valid && addable &&
                action.assign(creep)) {
                    if( TRACE ) trace('behaviour',{behaviourName:this.name,creepName:creep.name,behaviour:'action'}, action.name);
                    return;
            }
        }
    }
}
