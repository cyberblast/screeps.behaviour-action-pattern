const mod = {};
module.exports = mod;
mod.extend = function() {
    Object.defineProperties(Room.prototype, {
        'spawnQueueHigh': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this.memory.spawnQueueHigh) ) {
                    this.memory.spawnQueueHigh = [];
                }
                return this.memory.spawnQueueHigh;
            }
        },
        'spawnQueueMedium': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this.memory.spawnQueueMedium) ) {
                    this.memory.spawnQueueMedium = [];
                }
                return this.memory.spawnQueueMedium;
            }
        },
        'spawnQueueLow': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this.memory.spawnQueueLow) ) {
                    this.memory.spawnQueueLow = [];
                }
                return this.memory.spawnQueueLow;
            }
        },
    });
    Room.prototype.saveSpawns = function(){
        let spawns = this.find(FIND_MY_SPAWNS);
        if( spawns.length > 0 ){
            let id = o => o.id;
            this.memory.spawns = _.map(spawns, id);
        } else this.memory.spawns = [];
    };
};
mod.analyze = function(room) {
    if( Game.time % MEMORY_RESYNC_INTERVAL === 0 || room.name == 'sim' ) room.saveSpawns();
};
mod.flush = function(room) {

};