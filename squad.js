class Squad {
    constructor(squadType) {
        this.type = squadType;
    };

    run(id) {
    };

    elect(id, creep) {
    };

    join(id, creep) {
    };

    part(id, creep) {
    };
}
module.exports = Squad;

/*
standard loop:

squads (group key)
    ab-priority

    spawning (sector)
    loose (sector)

    fixed roles: per-behaviour squads
        hopper (target room)

        claimer (sector)
        upgrader (room)
        patrol / sourceKiller (route)
        miner (room)

    dynamic roles: per-action squads (uniform low priority?)
        scavenge drops / sources (room)
            workers, haulers, pioneers, privateers, robbers, delivery
        destroyer (task group)
            attack train
        energy distribution (room)
            workers, haulers, pioneers



        privateer (sector?)
        worker (room)
        pioneer (room)
        hauler (route?)

    ab-priority
        healer (task group)
        melee (task group)
        ranged (task group)
        tower (task group)

 */