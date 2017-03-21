const mod = {};
module.exports = mod;
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
        }
    });
    Room.prototype.saveTowers = function(){
        let towers = this.find(FIND_MY_STRUCTURES, {
            filter: {structureType: STRUCTURE_TOWER}
        });
        if( towers.length > 0 ){
            var id = obj => obj.id;
            this.memory.towers = _.map(towers, id);
        } else this.memory.towers = [];
    };
};
mod.analyze = function(room) {
    if( Game.time % MEMORY_RESYNC_INTERVAL === 0 || room.name == 'sim' ) room.saveTowers();
};
mod.flush = function(room) {
    delete room._towerFreeCapacity;
};