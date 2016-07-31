var behaviour = new Creep.Behaviour('privateer');

behaviour.nextAction = function(creep){
    creep.unregisterTarget();

    var flag;    
    if( creep.flag && creep.flag.color == FLAG_COLOR.invade.exploit.color && creep.flag.secondaryColor == FLAG_COLOR.invade.exploit.secondaryColor)
        flag = creep.flag;
    else {
        var flags = _.sortBy(_.filter(Game.flags, FLAG_COLOR.invade.exploit.filter), 
            function(f) { 
                var occupation = ( f.creeps ? f.creeps.sum : 0 );
                var distance = creep.pos.getRangeTo(f);
                return (occupation + (distance == Infinity ? 0.9 : distance/100));
            }
        );
        if( flags && flags.length > 0 ) { 
            flag = flags[0];
            creep.flag = flags[0];
            creep.memory.flag = flags[0].name;
        }
    }
     
    if( !flag ) { // no (more) exploit flag
        if( creep.pos.roomName != creep.memory.home ){ // not at home
            this.assignAction(creep, Creep.action.settling, Game.rooms[creep.memory.home].controller); // go home
        } else creep.run(Creep.behaviour.worker); // at home: behave as worker
        return;
    }

    if(_.sum(creep.carry) == creep.carryCapacity) { // carrier full
        if( creep.pos.roomName != creep.memory.home ){ // not at home
            this.assignAction(creep, Creep.action.settling, Game.rooms[creep.memory.home].controller); // go home
        } 
        else { // at home
            if( _.sum(creep.carry) > creep.carry.energy ) { // has non energy sources
                if( this.assignAction(creep, Creep.action.storing) ) 
                    return; // TODO: handle no storage ?
            } 
            //this.assignAction(creep, Creep.action.upgrading); 
            Creep.behaviour.worker.nextAction(creep);
        }        
        return;
    }

    // free space in carrier

    // flag is in other room 
    if( flag && (!flag.room || flag.room.name != creep.room.name) ) {
        this.assignAction(creep, Creep.action.settling, flag); // go to flagged room
        return;
    } 
    
    // inside flagged room
    
    var actions = [Creep.action.picking, Creep.action.harvesting];
    // TODO: Add extracting at first (if extractor present)

    for(var iAction = 0; iAction < actions.length; iAction++) {   
        var action = actions[iAction];             
        if(action.isValidAction(creep) && 
            action.isAddableAction(creep) && 
            this.assignAction(creep, action))
            return;
    }
    
    // idle
    this.assignAction(creep, Creep.action.idle);
};


module.exports = behaviour;