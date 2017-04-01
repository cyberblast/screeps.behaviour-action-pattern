const Squad = function(squadType) {
    this.type = squadType;
    this.run = function(id) {

    };
    this.elect = function(id, creep) {

    };
    this.join = function(id, creep) {

    };
    this.part = function(id, creep) {

    };
};

module.exports = Squad;

/*
standard loop:

squads
    ab-priority

    spawning
    loose

    per-room, roles:
        healer
        hopper

        claimer
        upgrader
        sourceKiller
        miner

        destroyer
        privateer

        worker
        pioneer
        hauler

    ab-priority

        melee
        warrior
        ranger
        turret
        tower

 */