const mod = new Creep.Behaviour('remoteMiner');
module.exports = mod;
const super_run = mod.run;
mod.run = function(creep) {
    if (!Creep.action.avoiding.run(creep)) {
        const flag = creep.data.destiny && Game.flags[creep.data.destiny.targetName];
        if (!flag) {
            if (!creep.action || creep.action.name !== 'recycling') {
                this.assignAction(creep, 'recycling');
            }
        } else if (creep.room.name !== creep.data.destiny.room) {
            Creep.action.travelling.assignRoom(creep, flag.pos.roomName);
        }
        super_run.call(this, creep);
    }
};
mod.actions = function(creep) {
    return Creep.behaviour.miner.actions.call(this, creep);
}
mod.getEnergy = function(creep) {
    return Creep.behaviour.miner.getEnergy.call(this, creep);
};
mod.maintain = function(creep) {
    return Creep.behaviour.miner.maintain.call(this, creep);
};
