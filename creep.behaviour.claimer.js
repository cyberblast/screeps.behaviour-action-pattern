var behaviour = new MODULES.creep.Behaviour();

behaviour.run = function(creep) {
    var flag = _.find(Game.flags, {'color': FLAG_COLOR.claim });
    if( !flag || !this.assignAction(creep, MODULES.creep.action.claiming) )
        this.assignAction(creep, MODULES.creep.action.idle);

    if( creep.action ) creep.action.step(creep);
    return;
};


module.exports = behaviour;