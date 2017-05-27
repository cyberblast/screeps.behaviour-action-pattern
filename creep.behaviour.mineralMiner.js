const mod = new Creep.Behaviour('mineralMiner');
module.exports = mod;
mod.actions = function(creep) {
    return Creep.behaviour.miner.actions.call(this, creep);
};
mod.getEnergy = function(creep) {
    return Creep.behaviour.miner.getEnergy.call(this, creep);
};
mod.maintain = function(creep) {
    return Creep.behaviour.miner.maintain.call(this, creep);
};
mod.strategies.mining = {
    newTarget: function(creep) {
        const notOccupied = source => {
            const hasThisSource = data => data.creepName !== creep.name && data.determinatedTarget === source.id;
            return !_.find(Memory.population, hasThisSource);
        };
        return _.find(creep.room.minerals, notOccupied);
    },
};
