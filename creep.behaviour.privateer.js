// - at home
// - - has energy
// - - - working
// - - has no energy
// - - - new flag found
// - - - - travelling
// - - - no new flag
// - - - - working
// - at target room
// - - carrier not full
// - - - harvesting
// - - carrier full
// - - - travelling home
var behaviour = new Creep.Behaviour('privateer');
behaviour.exploitNextRoom = function(creep){
    let flag = FlagDir.find(FLAG_COLOR.invade.exploit, creep.pos, false, FlagDir.rangeModPrivateer);
    // new flag found
    if( flag ) {
        // travelling
        creep.flag = flag;
        creep.memory.flag = flag.name;
        creep.assignAction(Creep.action.travelling, flag);
        return true;
    }
    return false;
},
behaviour.nextAction = function(creep){
    creep.unregisterTarget();
    // at home
    if( creep.pos.roomName == creep.home ){ 
        // has non energy sources
        if( _.sum(creep.carry) > creep.carry.energy && creep.assignAction(Creep.action.storing) ) 
            return; 
        // has energy
        if( creep.carry.energy > 0 ){
            Creep.behaviour.worker.nextAction(creep);
            return;
        }
        // has no energy
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
        if( creep.memory.flag && Game.flags[creep.memory.flag].pos.roomName == creep.pos.roomName ){
            // carrier not full
            if( _.sum(creep.carry) < creep.carryCapacity ) {
                // sources depleted
                if( creep.room.sourceEnergyAvailable == 0 ){
                    // cloak flag
                    Game.flags[creep.memory.flag].cloaking = creep.room.ticksToNextRegeneration;
                    // travelling
                    if( this.exploitNextRoom(creep) ) 
                        return;
                    else {
                        // no new flag
                        // go home
                        creep.assignAction(Creep.action.travelling, Game.rooms[creep.home].controller);
                        return;
                    }
                }
                // energy available
                else {
                    // harvesting or picking
                    var actions = [Creep.action.picking, Creep.action.harvesting];
                    // TODO: Add extracting (if extractor present)
                    for(var iAction = 0; iAction < actions.length; iAction++) {   
                        var action = actions[iAction];             
                        if(action.isValidAction(creep) && 
                            action.isAddableAction(creep) && 
                            creep.assignAction(action))
                            return;
                    }                
                }
            }
            // carrier full
            else {
                creep.assignAction(Creep.action.travelling, Game.rooms[creep.home].controller);
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
                creep.assignAction(Creep.action.travelling, Game.rooms[creep.home].controller);
                return;
            }
        }
    }
    // fallback
    creep.assignAction(Creep.action.idle);
};
behaviour.run.displayName = "creep.behaviour.privateer.run";
module.exports = behaviour;