class RemoteWorker extends Creep.Behaviour {
    constructor(name = 'remoteWorker') {
        super(name);
    }
    run(creep) {
        if (Creep.action.avoiding.run(creep)) {
            return;
        }
        return super.run(creep);
    }
    inflowActions(creep) {
        return [
            Creep.action.picking,
            Creep.action.uncharging,
            Creep.action.withdrawing,
            Creep.action.harvesting
        ];
    }
    outflowActions(creep) {
        return [
            Creep.action.repairing,
            Creep.action.building,
            Creep.action.recycling
        ];
    }
    nextAction(creep) {
        // at target room
        if (creep.data.destiny.room == creep.pos.roomName) {
            if (creep.sum < creep.carryCapacity * 0.8) {
                // get some energy
                return this.selectInflowAction(creep);
            } else {
                return this.selectAction(creep, this.outflowActions(creep));
            }
        } else { // not at target room
            return this.gotoTargetRoom(creep);
        }
        // fallback
        // recycle self
        let mother = Game.spawns[creep.data.motherSpawn];
        if( mother ) {
            Creep.action.recycling.assign(creep, mother);
        }
    }
    gotoTargetRoom(creep){
        const targetFlag = creep.data.destiny ? Game.flags[creep.data.destiny.targetName] : null;
        if (targetFlag) return Creep.action.travelling.assignRoom(creep, targetFlag.pos.roomName);
    }
}
module.exports = RemoteWorker;
