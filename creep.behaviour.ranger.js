const mod = new Creep.Behaviour('ranger');
module.exports = mod;
const super_run = mod.run;
mod.run = function(creep) {
    creep.flee = creep.flee || !creep.hasActiveBodyparts([ATTACK, RANGED_ATTACK]);
    creep.attacking = false;
    creep.attackingRanged = false;
    super_run.call(this, creep);
    this.heal(creep);
};
mod.heal = function(creep){
    if (!creep.attacking && creep.data.body.heal !== undefined && creep.hits < creep.hitsMax) {
        creep.heal(creep);
    }
};
mod.actions = (creep) => {
    return [
        Creep.action.defending,
        Creep.action.invading,
        Creep.action.guarding,
    ];
};
