var behaviour = new Creep.Behaviour('privateer');
behaviour.nextAction = function(creep){
    creep.unregisterTarget();
    var flag;    
    if( creep.flag && creep.flag.color == FLAG_COLOR.invade.exploit.color && creep.flag.secondaryColor == FLAG_COLOR.invade.exploit.secondaryColor)
        flag = creep.flag;
    else {
        flag = FlagDir.find(FLAG_COLOR.invade.exploit, creep.pos, false, FlagDir.rangeModPrivateer);
        if( flag ) { 
            creep.flag = flag;
            creep.memory.flag = flag.name;
        }
    }     
    if( !flag ) { // no (more) exploit flag
        if( creep.pos.roomName != creep.home ){ // not at home
            creep.assignAction(Creep.action.settling, Game.rooms[creep.home].controller); // go home
        } else creep.run(Creep.behaviour.worker); // at home: behave as worker
        return;
    }
    if(_.sum(creep.carry) == creep.carryCapacity) { // carrier full
        if( creep.pos.roomName != creep.home ){ // not at home
            delete creep.memory.flag;
            creep.assignAction(Creep.action.settling, Game.rooms[creep.home].controller); // go home
        } 
        else { // at home
            if( _.sum(creep.carry) > creep.carry.energy ) { // has non energy sources
                if( creep.assignAction(Creep.action.storing) ) 
                    return; // TODO: handle no storage ?
            } 
            //creep.assignAction(Creep.action.upgrading); 
            Creep.behaviour.worker.nextAction(creep);
        }        
        return;
    }
    // free space in carrier
    // flag is in other room 
    if( flag && (!flag.room || flag.room.name != creep.room.name) ) {
        creep.assignAction(Creep.action.settling, flag); // go to flagged room
        return;
    }     
    // inside flagged room    
    var actions = [Creep.action.picking, Creep.action.harvesting];
    // TODO: Add extracting at first (if extractor present)
    for(var iAction = 0; iAction < actions.length; iAction++) {   
        var action = actions[iAction];             
        if(action.isValidAction(creep) && 
            action.isAddableAction(creep) && 
            creep.assignAction(action))
            return;
    }    
    // idle
    creep.assignAction(Creep.action.idle);
};
behaviour.run.displayName = "creep.behaviour.privateer.run";
module.exports = behaviour;