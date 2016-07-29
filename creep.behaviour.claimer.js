var behaviour = new MODULES.creep.Behaviour();

behaviour.run = function(creep) {
    // TODO: limit to 1 per flag or equal distribution
    // TODO: Add memorization?
    var flag = _.find(Game.flags, FLAG_COLOR.claim.filter);
    if( !flag || !this.assignAction(creep, MODULES.creep.action.claiming) )
        this.assignAction(creep, MODULES.creep.action.idle);

    if( creep.action ) creep.action.step(creep);
    return;
};


module.exports = behaviour;