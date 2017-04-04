class Hauler extends Creep.Behaviour {
    constructor(name = 'hauler') {
        super(name);
        this.strategies.picking = {
            name: `picking-${this.name}`,
            energyOnly: false
        };
    }
    inflowActions(creep) {
        return [
            Creep.action.uncharging,
            Creep.action.picking,
            Creep.action.withdrawing,
        ]; 
    }
    outflowActions(creep) {
        let priority = [
            Creep.action.feeding,
            Creep.action.charging,
            Creep.action.fueling,
            Creep.action.storing
        ];
        if ( creep.sum > creep.carry.energy ||
                ( !creep.room.situation.invasion &&
                    SPAWN_DEFENSE_ON_ATTACK && creep.room.conserveForDefense && creep.room.relativeEnergyAvailable > 0.8)) {
            priority.unshift(Creep.action.storing);
        }
        if (creep.room.structures.urgentRepairable.length > 0 ) {
            priority.unshift(Creep.action.fueling);
        }
        return priority;
    }
    nextAction(creep) {
        if( creep.pos.roomName != creep.data.homeRoom && Game.rooms[creep.data.homeRoom] && Game.rooms[creep.data.homeRoom].controller ) {
            return Creep.action.travelling.assignRoom(creep, creep.data.homeRoom);
        }
        if (creep.sum < creep.carryCapacity / 2)
            return this.selectInflowAction(creep);
        else
            return this.selectAction(creep, this.outflowActions(creep));
    }
}
module.exports = Hauler;
