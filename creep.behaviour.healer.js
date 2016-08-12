var behaviour = new Creep.Behaviour('healer');
behaviour.run = function(creep) {
    var assignment = true;
    if( creep.room.situation.invasion )
        assignment = creep.assignAction(Creep.action.healing);
    else {
        var flag = _.find(Game.flags, FLAG_COLOR.destroy.filter) || _.find(Game.flags, FLAG_COLOR.invade.filter);
        if( flag ) 
            assignment = creep.assignAction(Creep.action.settling, flag);
        else {
            assignment = creep.assignAction(Creep.action.healing);
            if(!assignment)
                assignment = creep.assignAction(Creep.action.guarding);
        }
    }
    if( !assignment ) creep.assignAction(Creep.action.idle);    
    if( creep.action ) creep.action.step(creep);
};
behaviour.run.displayName = "creep.behaviour.healer.run";
module.exports = behaviour;