module.exports = {
    name: 'remoteWorker',
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
        if( creep.pos.roomName != creep.data.destiny.room ){
            this.gotoTargetRoom(creep);
        }
        // not at home
        else {
            // at target room
            if( creep.data.destiny.room == creep.pos.roomName ){
                let priority;
                // get some energy
                if( creep.sum < creep.carryCapacity * 0.8 ) {
                    priority = [
                        Creep.action.picking,
                        Creep.action.uncharging,
                        Creep.action.reallocating,
                        Creep.action.withdrawing,
                        Creep.action.idle];
                } else {
                    priority = [
                        Creep.action.repairing,
                        Creep.action.building,
                        Creep.action.idle
                    ];
                }

                for(var iAction = 0; iAction < priority.length; iAction++) {
                    var action = priority[iAction];
                    if(action.isValidAction(creep) &&
                        action.isAddableAction(creep) &&
                        action.assign(creep)) {
                        return;
                    }
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
