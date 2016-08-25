var behaviour = new Creep.Behaviour('ranger');
behaviour.run = function(creep) {
    var assignment = true;
    var flag = _.find(Game.flags, FLAG_COLOR.destroy.filter) || _.find(Game.flags, FLAG_COLOR.invade.filter);
    if( flag ) assignment = Creep.action.invading.assign(creep);
    else if(!creep.validateMemoryAction())
        assignment = Creep.action.guarding.assign(creep);
    if( !assignment ) Creep.action.idle.assign(creep);
    if( creep.action ) creep.action.step(creep);
};
module.exports = behaviour;