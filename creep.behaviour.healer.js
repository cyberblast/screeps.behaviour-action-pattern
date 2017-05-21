const mod = new Creep.Behaviour('healer');
module.exports = mod;
const super_invalidAction = mod.invalidAction;
mod.invalidAction = function(creep) {
    return super_invalidAction.call(this, creep) || creep.action.name === 'guarding';
};
mod.actions = (creep) => {
    return [
        Creep.action.healing,
        Creep.action.guarding
    ];
};
