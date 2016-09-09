module.exports = {
    name: 'privateer',
    run: function(creep) {
        // Assign next Action
        let oldTargetId = creep.data.targetId;
        if( creep.action == null  || creep.action.name == 'idle' ) {
            this.nextAction(creep);
        }
        if( creep.data.targetId != oldTargetId ) {
            creep.data.moveMode = null;
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
        // at home
        if( creep.pos.roomName == creep.data.homeRoom ){ 
            // carrier filled
            if( _.sum(creep.carry) > 0 ){
                if( Creep.action.storing.assign(creep) ) return;
                if( Creep.action.charging.assign(creep) ) return;
                Creep.behaviour.worker.nextAction(creep);
                return;
            }
            // empty
            // travelling
            if( this.exploitNextRoom(creep) ) 
                return;
            else {
                // no new flag
                // behave as worker
                Creep.behaviour.worker.nextAction(creep);
                return;
            }
        }
        // not at home
        else {
            // at target room
            if( creep.flag && creep.flag.pos.roomName == creep.pos.roomName ){
                // carrier not full
                if( _.sum(creep.carry) < creep.carryCapacity ) {
                    // sources depleted
                    if( creep.room.sourceEnergyAvailable == 0 ){
                        // cloak flag
                        creep.flag.cloaking = creep.room.ticksToNextRegeneration;
                        // travelling
                        if( this.exploitNextRoom(creep) ) 
                            return;
                        else {
                            // no new flag
                            // go home
                            Population.registerCreepFlag(creep, null);
                            Creep.action.travelling.assign(creep, Game.rooms[creep.data.homeRoom].controller);
                            return;
                        }
                    }
                    // energy available
                    else {
                        // harvesting or picking
                        var actions = [
                            Creep.action.robbing,
                            Creep.action.picking,
                            Creep.action.harvesting
                        ];
                        // TODO: Add extracting (if extractor present)
                        for(var iAction = 0; iAction < actions.length; iAction++) {   
                            var action = actions[iAction];             
                            if(action.isValidAction(creep) && 
                                action.isAddableAction(creep) && 
                                action.assign(creep))
                                return;
                        }
                        // no targets in current room
                        creep.flag.cloaking = 10;
                        if( this.exploitNextRoom(creep) )
                            return;
                    }
                }
                // carrier full
                else {
                    var actions = [Creep.action.repairing, Creep.action.building];
                    for(var iAction = 0; iAction < actions.length; iAction++) {   
                        var action = actions[iAction];             
                        if(action.isValidAction(creep) && 
                            action.isAddableAction(creep) && 
                            action.assign(creep))
                            return;
                    }
                    Population.registerCreepFlag(creep, null);
                    Creep.action.travelling.assign(creep, Game.rooms[creep.data.homeRoom].controller);
                    return;
                }
            }
            // not at target room
            else {
                // travelling
                if( this.exploitNextRoom(creep) ) 
                    return;
                else {
                    // no new flag
                    // go home
                    Population.registerCreepFlag(creep, null);
                    Creep.action.travelling.assign(creep, Game.rooms[creep.data.homeRoom].controller);
                    return;
                }
            }
        }
        // fallback
        Creep.action.idle.assign(creep);
    },
    exploitNextRoom: function(creep){
        let flag = FlagDir.find(FLAG_COLOR.invade.exploit, creep.pos, false, FlagDir.exploitMod);
        // new flag found
        if( flag ) {
            // travelling
            if( Creep.action.travelling.assign(creep, flag) ) {
                Population.registerCreepFlag(creep, flag);
                return true;
            }
        }
        return false;
    }
}
