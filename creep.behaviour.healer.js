var behaviour = new Creep.Behaviour('healer');
behaviour.run = function(creep) {
    var assignment = true;
    if( creep.room.situation.invasion )
        assignment = Creep.action.healing.assign(creep);
    else {
        var flag = _.find(Game.flags, FLAG_COLOR.destroy.filter) || _.find(Game.flags, FLAG_COLOR.invade.filter);
        if( flag ) 
            assignment = Creep.action.travelling.assign(creep, flag);
        else {
            assignment = Creep.action.healing.assign(creep);
            if(!assignment)
                assignment = Creep.action.guarding.assign(creep);
        }
    }
    if( !assignment ) Creep.action.idle.assign(creep);    
    if( creep.action ) creep.action.step(creep);
};
module.exports = behaviour;