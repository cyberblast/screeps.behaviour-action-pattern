const mod = {};
module.exports = mod;
mod.analyzeRoom = function(room, needMemoryResync) {
    if (needMemoryResync) {
        room.saveTowers();
    }
};
mod.executeRoom = function(memory, roomName) {
    const room = Game.rooms[roomName];
    if (room) {
        if (room.structures.towers.length > 0) {
            const p = Util.startProfiling(roomName, {enabled:global.PROFILING.ROOMS});
            Tower.loop(room);
            p.checkCPU('tower.loop', 0.5);
        }
    }
};
mod.extend = function() {
    Object.defineProperties(Room.prototype, {
        'towerFreeCapacity': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._towerFreeCapacity) ) {
                    this._towerFreeCapacity = 0;
                    var addFreeCapacity = tower => this._towerFreeCapacity += (tower.energyCapacity - tower.energy);
                    _.forEach(this.structures.towers, addFreeCapacity);
                }
                return this._towerFreeCapacity;
            }
        },
    });
    Room.prototype.saveTowers = function(){
        let towers = this.find(FIND_MY_STRUCTURES, {
            filter: {structureType: STRUCTURE_TOWER}
        });
        if( towers.length > 0 ){
            var id = obj => obj.id;
            this.memory.towers = _.map(towers, id);
        } else delete this.memory.towers;
    };
};