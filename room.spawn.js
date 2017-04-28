const mod = {};
module.exports = mod;
mod.analyzeRoom = function(room, needMemoryResync) {
    if (needMemoryResync) {
        room.saveSpawns();
    }
};
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

    Room.prototype.saveSpawns = function() {
        let spawns = this.find(FIND_MY_SPAWNS);
        if( spawns.length > 0 ){
            let id = o => o.id;
            this.memory.spawns = _.map(spawns, id);
        } else delete this.memory.spawns;
    };

    Room.bestSpawnRoomFor = function(targetRoomName) {
        var range = room => room.my ? routeRange(room.name, targetRoomName) : Infinity;
        return _.min(Game.rooms, range);
    };

    // find a room to spawn
    // params: { targetRoom, minRCL = 0, maxRange = Infinity, minEnergyAvailable = 0, minEnergyCapacity = 0, callBack = null, allowTargetRoom = false, rangeRclRatio = 3, rangeQueueRatio = 51 }
    // requiredParams: targetRoom
    Room.findSpawnRoom = function(params) {
        if( !params || !params.targetRoom ) return null;
        // filter validRooms
        let isValidRoom = room => (
            room.my && 
            (params.maxRange === undefined || Util.routeRange(room.name, params.targetRoom) <= params.maxRange) &&
            (params.minEnergyCapacity === undefined || params.minEnergyCapacity <= room.energyCapacityAvailable) &&
            (params.minEnergyAvailable === undefined || params.minEnergyAvailable <= room.energyAvailable) &&
            (room.name != params.targetRoom || params.allowTargetRoom === true) &&
            (params.minRCL === undefined || room.controller.level >= params.minRCL) &&
            (params.callBack === undefined || params.callBack(room))
        );
        let validRooms = _.filter(Game.rooms, isValidRoom);
        if( validRooms.length == 0 ) return null;
        // select "best"
        // range + roomLevelsUntil8/rangeRclRatio + spawnQueueDuration/rangeQueueRatio
        let queueTime = queue => _.sum(queue, c => (c.parts.length*3));
        let roomTime = room => ((queueTime(room.spawnQueueLow)*0.9) + queueTime(room.spawnQueueMedium) + (queueTime(room.spawnQueueHigh)*1.1) ) / room.structures.spawns.length;
        let evaluation = room => { return routeRange(room.name, params.targetRoom) +
            ( (8-room.controller.level) / (params.rangeRclRatio||3) ) +
            ( roomTime(room) / (params.rangeQueueRatio||51) );
        };
        return _.min(validRooms, evaluation);
    };
};