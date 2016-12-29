module.exports = {
    name: 'privateer',
    run: function(creep) {
        // Assign next Action
        let oldTargetId = creep.data.targetId;
        if( creep.action == null  || creep.action.name == 'idle' ) {
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
        if( creep.flee ) {
            if( SAY_ASSIGNMENT ) creep.say(String.fromCharCode(9855), SAY_PUBLIC);
            let drop = r => { if(creep.carry[r] > 0 ) creep.drop(r); };
            _.forEach(Object.keys(creep.carry), drop);
            let home = Game.spawns[creep.data.motherSpawn];
            creep.drive( home.pos, 1, 1, Infinity);
        }
    },
    nextAction: function(creep){
        let carrySum = creep.sum;
        // at home
        if( creep.pos.roomName == creep.data.homeRoom ){
            // carrier filled
            if( carrySum > 0 ){
                let deposit = [];
                if( creep.carry.energy == carrySum ) deposit = creep.room.structures.links.privateers;
                if( creep.room.storage ) deposit.push(creep.room.storage);
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
                // check invader/cloaking state
                if( creep.room.situation.invasion &&
                    (creep.flag.color != FLAG_COLOR.invade.robbing.color || creep.flag.secondaryColor != FLAG_COLOR.invade.robbing.secondaryColor )) {
                    creep.flag.cloaking = 50; // TODO: set to Infinity & release when solved
                    this.exploitNextRoom(creep);
                    return;
                }

                // get some energy
                if( creep.sum < creep.carryCapacity*0.4 ) {
                    // sources depleted
                    if( creep.room.sourceEnergyAvailable == 0 ){
                        // cloak flag
                        creep.flag.cloaking = _.max([creep.room.ticksToNextRegeneration-20,0]); // approach a bit earlier
                        // travelling
                        this.exploitNextRoom(creep);
                        return;
                    }
                    // energy available
                    else {
                        // harvesting or picking
                        var actions = [
                            Creep.action.dismantling,
                            Creep.action.picking,
                            Creep.action.robbing,
                            Creep.action.harvesting
                        ];
                        // TODO: Add extracting (if extractor present) ?
                        for(var iAction = 0; iAction < actions.length; iAction++) {
                            var action = actions[iAction];
                            if(action.isValidAction(creep) &&
                                action.isAddableAction(creep) &&
                                action.assign(creep))
                                return;
                        }
                        // no targets in current room
                        creep.flag.cloaking = 50;
                        this.exploitNextRoom(creep);
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
                 this.exploitNextRoom(creep);
                 return;
            }
        }
        // fallback
        Creep.action.idle.assign(creep);
    },
    exploitNextRoom: function(creep){
        if( creep.sum < creep.carryCapacity*0.4 ) {
            // calc by distance to home room
            let validColor = flagEntry => (
                (flagEntry.color == FLAG_COLOR.invade.exploit.color && flagEntry.secondaryColor == FLAG_COLOR.invade.exploit.secondaryColor) ||
                (flagEntry.color == FLAG_COLOR.invade.robbing.color && flagEntry.secondaryColor == FLAG_COLOR.invade.robbing.secondaryColor)
            );
            let flag = FlagDir.find(validColor, Game.rooms[creep.data.homeRoom].controller.pos, false, FlagDir.exploitMod, creep.name);
            // new flag found
            if( flag ) {
                // travelling
                if( Creep.action.travelling.assign(creep, flag) ) {
                    Population.registerCreepFlag(creep, flag);
                    return true;
                }
            }
        }
        // no new flag
        // go home
        Population.registerCreepFlag(creep, null);
        Creep.action.travelling.assign(creep, Game.rooms[creep.data.homeRoom].controller);
        return false;
    }
}
