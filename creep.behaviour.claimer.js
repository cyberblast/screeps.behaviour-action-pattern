var behaviour = new Creep.Behaviour('claimer');
behaviour.run = function(creep) {
    if( !creep.flag ) {
        let flag = FlagDir.find(FLAG_COLOR.claim, creep.pos, false, FlagDir.rangeMod);
        if( flag ) { 
            Population.registerCreepFlag(creep, flag);
        }
    }
    Creep.Behaviour.prototype.run.call(this, creep);
};
behaviour.nextAction = function(creep){ 
    if( !creep.flag || !Creep.action.claiming.assign(creep) )
        Creep.action.idle.assign(creep);
    return;
};
module.exports = behaviour;