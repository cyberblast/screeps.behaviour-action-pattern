const mod = {};
module.exports = mod;
mod.extend = function() {
    Object.defineProperties(Room.prototype, {
        'structureMatrix': {
            configurable: true,
            get: function () {
                if (_.isUndefined(this._structureMatrix)) {
                    const COSTMATRIX_CACHE_VERSION = 2; // change this to invalidate previously cached costmatrices
                    const cacheValid = (roomName) => {
                        if (_.isUndefined(Memory.pathfinder)) {
                            Memory.pathfinder = {};
                            Memory.pathfinder[roomName] = {};
                            return false;
                        } else if (_.isUndefined(Memory.pathfinder[roomName])) {
                            Memory.pathfinder[roomName] = {};
                            return false;
                        }
                        const mem = Memory.pathfinder[roomName];
                        const ttl = Game.time - mem.updated;
                        if (mem.version === COSTMATRIX_CACHE_VERSION && mem.costMatrix && ttl < COST_MATRIX_VALIDITY) {
                            if (DEBUG && TRACE) trace('PathFinder', {roomName:this.name, ttl, PathFinder:'CostMatrix'}, 'cached costmatrix');
                            return true;
                        }
                        return false;
                    };

                    if (cacheValid(this.name)) {
                        this._structureMatrix = PathFinder.CostMatrix.deserialize(Memory.pathfinder[this.name].costMatrix);
                    } else {
                        if (DEBUG) logSystem(this.name, 'Calulating cost matrix');
                        var costMatrix = new PathFinder.CostMatrix();
                        let setCosts = structure => {
                            const site = structure instanceof ConstructionSite;
                            // don't walk on allied construction sites.
                            if (site && !structure.my && Task.reputation.allyOwner(structure)) return costMatrix.set(structure.pos.x, structure.pos.y, 0xFF);
                            if (structure.structureType === STRUCTURE_ROAD) {
                                if (!site || USE_UNBUILT_ROADS)
                                    return costMatrix.set(structure.pos.x, structure.pos.y, 1);
                            } else if (OBSTACLE_OBJECT_TYPES.includes(structure.structureType)) {
                                if (!site || Task.reputation.allyOwner(structure)) // don't set for hostile construction sites
                                    return costMatrix.set(structure.pos.x, structure.pos.y, 0xFF);
                            } else if (structure.structureType === STRUCTURE_RAMPART && !(structure.my || structure.isPublic)) {
                                return costMatrix.set(structure.pos.x, structure.pos.y, 0xFF);
                            }
                        };
                        this.structures.all.forEach(setCosts);
                        this.constructionSites.forEach(setCosts);
                        const prevTime = Memory.pathfinder[this.name].updated;
                        Memory.pathfinder[this.name].costMatrix = costMatrix.serialize();
                        Memory.pathfinder[this.name].updated = Game.time;
                        Memory.pathfinder[this.name].version = COSTMATRIX_CACHE_VERSION;
                        if( DEBUG && TRACE ) trace('PathFinder', {roomName:this.name, prevTime, structures:this.structures.all.length, PathFinder:'CostMatrix'}, 'updated costmatrix');
                        this._structureMatrix = costMatrix;
                    }
                }
                return this._structureMatrix;
            }
        },
        'creepMatrix': {
            configurable: true,
            get: function () {
                if (_.isUndefined(this._creepMatrix) ) {
                    const costs = this.structureMatrix.clone();
                    // Avoid creeps in the room
                    this.allCreeps.forEach(function(creep) {
                        costs.set(creep.pos.x, creep.pos.y, 0xff);
                    });
                    this._creepMatrix = costs;
                }
                return this._creepMatrix;
            }
        },
        'hostile': {
            configurable: true,
            get: function() {
                return this.memory.hostile;
            }
        },
    });
    Room.prototype.isWalkable = function(x, y, look) {
        if (!look) look = this.lookAt(x,y);
        else look = look[y][x];
        let invalidObject = o => {
            return ((o.type == LOOK_TERRAIN && o.terrain == 'wall') ||
                OBSTACLE_OBJECT_TYPES.includes(o[o.type].structureType));
        };
        return look.filter(invalidObject).length == 0;
    };
    Room.prototype.printCostMatrix = function(creepMatrix, aroundPos) {
        const matrix = creepMatrix ? this.creepMatrix : this.costMatrix;
        let startY = 0;
        let endY = 50;
        let startX = 0;
        let endX = 50;
        if (aroundPos) {
            startY = Math.max(0, aroundPos.y - 3);
            endY = Math.min(50, aroundPos.y + 4);
            startX = Math.max(0, aroundPos.x - 3);
            endX = Math.min(50, aroundPos.x + 4);
        }
        logSystem(this.name, "costMatrix:");
        for (var y = startY; y < endY; y++) {
            var line = "";
            for (var x = startX; x < endX; x++) {
                var val = matrix.get(x, y).toString(16);
                if (val == "0") val = "";
                line += ("   " + val).slice(-3);
            }
            logSystem(this.name, line);
        }
    };
    Room.prototype.getBorder = function(roomName) {
        return _.findKey(Game.map.describeExits(this.name), function(name) {
            return this.name === name;
        }, {name: roomName});
    };
    Room.prototype.exits = function(findExit, point) {
        if (point === true) point = 0.5;
        let positions;
        if (findExit === 0) {
            // portals
            positions = _.chain(this.find(FIND_STRUCTURES)).filter(function(s) {
                return s.structureType === STRUCTURE_PORTAL;
            }).map('pos').value();
        } else {
            positions = this.find(findExit);
        }

        // assuming in-order
        let maxX, maxY;
        let map = {};
        let limit = -1;
        const ret = [];
        for (let i = 0; i < positions.length; i++) {
            const pos = positions[i];
            if (!(_.get(map,[pos.x-1, pos.y]) || _.get(map,[pos.x,pos.y-1]))) {
                if (point && limit !== -1) {
                    ret[limit].x += Math.ceil(point * (maxX - ret[limit].x));
                    ret[limit].y += Math.ceil(point * (maxY - ret[limit].y));
                }
                limit++;
                ret[limit] = _.pick(pos, ['x','y']);
                maxX = pos.x;
                maxY = pos.y;
                map = {};
            }
            _.set(map, [pos.x, pos.y], true);
            maxX = Math.max(maxX, pos.x);
            maxY = Math.max(maxY, pos.y);
        }
        if (point && limit !== -1) {
            ret[limit].x += Math.ceil(point * (maxX - ret[limit].x));
            ret[limit].y += Math.ceil(point * (maxY - ret[limit].y));
        }
        return ret;
    };
    Room.routeCallback = function(origin, destination, options) {
        return function(roomName) {
            if (Game.map.getRoomLinearDistance(origin, roomName) > options.restrictDistance)
                return false;
            if( roomName !== destination && ROUTE_ROOM_COST[roomName]) {
                return ROUTE_ROOM_COST[roomName];
            }
            let isHighway = false;
            if( options.preferHighway ){
                const parsed = /^[WE]([0-9]+)[NS]([0-9]+)$/.exec(roomName);
                isHighway = (parsed[1] % 10 === 0) || (parsed[2] % 10 === 0);
            }
            let isMyOrNeutralRoom = false;
            if( options.checkOwner ){
                const room = Game.rooms[roomName];
                // allow for explicit overrides of hostile rooms using hostileRooms[roomName] = false
                isMyOrNeutralRoom = this.hostile === false || (room &&
                                    room.controller &&
                                    (room.controller.my ||
                                    (room.controller.owner === undefined)));
            }
            if (!options.allowSK && mod.isSKRoom(roomName)) return 10;
            if (!options.allowHostile && this.hostile &&
                roomName !== destination && roomName !== origin) {
                return Number.POSITIVE_INFINITY;
            }
            if (isMyOrNeutralRoom || roomName == origin || roomName == destination)
                return 1;
            else if (isHighway)
                return 3;
            else if( Game.map.isRoomAvailable(roomName))
                return (options.checkOwner || options.preferHighway) ? 11 : 1;
            return Number.POSITIVE_INFINITY;
        };
    };
    Room.prototype.findRoute = function(destination, checkOwner = true, preferHighway = true){
        if (this.name == destination)  return [];
        const options = { checkOwner, preferHighway};
        return Game.map.findRoute(this, destination, {
            routeCallback: Room.routeCallback(this.name, destination, options)
        });
    };
    Room.prototype.recordMove = function(creep){
        if( !ROAD_CONSTRUCTION_ENABLE ) return;
        let x = creep.pos.x;
        let y = creep.pos.y;
        if ( x == 0 || y == 0 || x == 49 || y == 49 ||
            creep.carry.energy == 0 || creep.data.actionName == 'building' )
            return;

        let key = `${String.fromCharCode(32+x)}${String.fromCharCode(32+y)}_x${x}-y${y}`;
        if( !this.roadConstructionTrace[key] )
            this.roadConstructionTrace[key] = 1;
        else this.roadConstructionTrace[key]++;
    };
    Room.prototype.registerIsHostile = function() {
        if (this.controller) {
            if (_.isUndefined(this.hostile) || typeof this.hostile === 'number') { // not overridden by user
                if (this.controller.owner && !this.controller.my && !this.ally) {
                    this.memory.hostile = this.controller.level;
                } else {
                    delete this.memory.hostile;
                }
            }
        }
    };
};
mod.getCostMatrix = function(roomName) {
    var room = Game.rooms[roomName];
    if(!room) return;
    return room.costMatrix;
};
mod.analyze = function(room) {

};
mod.flush = function(room) {
    delete room.creepMatrix;
};