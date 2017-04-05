const action = class extends Creep.Action {

    newTarget(creep) {
        let target;
        if (creep.room.my && creep.room.structures.spawns.length > 0) {
            // return nearest spawn
            target = creep.findClosestByRange(creep.room.structures.spawns);
        }
        if (!target) target = Game.spawns[creep.data.motherSpawn];
        return target;
    }
    
    work(creep) {
        creep.target.recycleCreep(creep);
    }

};
module.exports = new action('recycling');