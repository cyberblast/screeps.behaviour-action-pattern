module.exports = {
    name: 'remoteHauler',
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
        let carrySum = creep.sum;
        // at home
        if( creep.pos.roomName == creep.data.homeRoom ){
            // carrier filled
            if( carrySum > 0 ){
                let deposit = []; // deposit energy in...
                // links?
                if( creep.carry.energy == carrySum ) deposit = creep.room.structures.links.privateers;
                // storage?
                if( creep.room.storage ) deposit.push(creep.room.storage);
                // containers?
                if( creep.room.structures.container ) deposit = deposit.concat( creep.room.structures.container.privateers );
                // Choose the closest
                if( deposit.length > 0 ){
                    let target = creep.pos.findClosestByRange(deposit);
                    if( target.structureType == STRUCTURE_STORAGE && Creep.action.storing.assign(creep, target) ) return;
                    else if(Creep.action.charging.assign(creep, target) ) return;
                }
                //if( Creep.action.storing.assign(creep) ) return;
                if( Creep.action.charging.assign(creep) ) return;
                Creep.behaviour.worker.nextAction(creep);
                return;
            }
            // empty
            // travelling
            this.gotoTargetRoom(creep);
        }
        // not at home
        else {
            // at target room
            if( creep.data.destiny.room == creep.pos.roomName ){

                // get some energy
                if( creep.sum < creep.carryCapacity*0.8 ) {

                    let priority;
                        priority = [
                            Creep.action.picking,
                            Creep.action.uncharging,
                            Creep.action.reallocating,
                            Creep.action.withdrawing,
                            Creep.action.idle];

                    for(var iAction = 0; iAction < priority.length; iAction++) {
                        var action = priority[iAction];
                        if(action.isValidAction(creep) &&
                            action.isAddableAction(creep) &&
                            action.assign(creep)) {
                                return;
                        }
                    }

                // carrier full
                }else {
                    this.goHome(creep);
                    return;
                }
            }
            // not at target room
            else {
                this.gotoTargetRoom(creep);
                return;
            }
        }
        // fallback
        Task.mining.nextAction(creep);
    },
    gotoTargetRoom: function(creep){
        Creep.action.travelling.assign(creep, Game.flags[creep.data.destiny.flagName]);
        return;
    },
    goHome: function(creep){
        Creep.action.travelling.assign(creep, Game.rooms[creep.data.homeRoom].controller);
        return;
    }
}