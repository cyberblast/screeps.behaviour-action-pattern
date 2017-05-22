/**
 * To start using Traveler, require it in main.js:
 *
 * There are 6 options available to pass to the module. Options are passed in the form
 *   of an object with one or more of the following:
 *
 *   exportTraveler:    boolean    Whether the require() should return the Traveler class. Defaults to true.
 *   installTraveler:   boolean    Whether the Traveler class should be stored in `global.Traveler`. Defaults to false.
 *   installPrototype:  boolean    Whether Creep.prototype.travelTo() should be created. Defaults to true.
 *   hostileLocation:   string     Where in Memory a list of hostile rooms can be found. If it can be found in
 *                                   Memory.empire, use 'empire'. Defaults to 'empire'.
 *   maxOps:            integer    The maximum number of operations PathFinder should use. Defaults to 20000
 *   defaultStuckValue: integer    The maximum number of ticks the creep is in the same RoomPosition before it
 *                                   determines it is stuck and repaths.
 *   reportThreshold:   integer    The mimimum CPU used on pathing to console.log() warnings on CPU usage. Defaults to 50
 *
 * Examples: var Traveler = require('Traveler')();
 *           require('util.traveler')({exportTraveler: false, installTraveler: false, installPrototype: true, defaultStuckValue: 2});
 */
module.exports = function(globalOpts = {}){
    const gOpts = _.defaults(globalOpts, {
        exportTraveler:    true,
        installTraveler:   false,
        installPrototype:  true,
        maxOps:            20000,
        defaultStuckValue: 3,
        reportThreshold:   50,
        roomRange:         22,
    });
    class Traveler {
        constructor() {
            this.reverseDirection = {
                TOP:BOTTOM,
                TOP_RIGHT:BOTTOM_LEFT,
                RIGHT:LEFT,
                BOTTOM_RIGHT:TOP_LEFT,
                BOTTOM:TOP,
                BOTTOM_LEFT:TOP_RIGHT,
                LEFT:RIGHT,
                TOP_LEFT:BOTTOM_RIGHT
            };
            this.getHostileRoom = (roomName) => _.get(Memory, ['rooms', roomName, 'hostile']);
            this.registerHostileRoom = (room) => room.registerIsHostile();
        }
        findAllowedRooms(origin, destination, options = {}) {
            _.defaults(options, { restrictDistance: 16 });
            if (Game.map.getRoomLinearDistance(origin, destination) > options.restrictDistance) {
                return;
            }
            let allowedRooms = { [origin]: true, [destination]: true };
            let ret = Game.map.findRoute(origin, destination, {
                routeCallback: (roomName) => {
                    if (options.routeCallback) {
                        let outcome = options.routeCallback(roomName);
                        if (outcome !== undefined) {
                            return outcome;
                        }
                    }
                    if (Game.map.getRoomLinearDistance(origin, roomName) > options.restrictDistance) {
                        return false;
                    }
                    let parsed;
                    if (options.preferHighway) {
                        parsed = /^[WE]([0-9]+)[NS]([0-9]+)$/.exec(roomName);
                        let isHighway = (parsed[1] % 10 === 0) || (parsed[2] % 10 === 0);
                        if (isHighway) {
                            return 1;
                        }
                    }
                    if (!options.allowSK && !Game.rooms[roomName]) {
                        if (!parsed) {
                            parsed = /^[WE]([0-9]+)[NS]([0-9]+)$/.exec(roomName);
                        }
                        let fMod = parsed[1] % 10;
                        let sMod = parsed[2] % 10;
                        let isSK = !(fMod === 5 && sMod === 5) &&
                            ((fMod >= 4) && (fMod <= 6)) &&
                            ((sMod >= 4) && (sMod <= 6));
                        if (isSK) {
                            return 10;
                        }
                    }
                    if (!options.allowHostile && this.getHostileRoom(roomName) &&
                        roomName !== destination && roomName !== origin) {
                        return Number.POSITIVE_INFINITY;
                    }
                    return 2.5;
                }
            });
            if (options.debug && !_.isArray(ret)) {
                console.log(`couldn't findRoute to ${destination}`);
                return;
            }
            for (let value of ret) {
                allowedRooms[value.room] = true;
            }
            allowedRooms.route = ret;
            return allowedRooms;
        }
        findTravelPath(origin, destination, options = {}) {
            _.defaults(options, {
                ignoreCreeps: true,
                range: 1,
                maxOps: gOpts.maxOps,
                obstacles: [],
            });
            let origPos = (origin.pos || origin), destPos = (destination.pos || destination);
            let allowedRooms;
            if (options.useFindRoute || (options.useFindRoute === undefined &&
                Game.map.getRoomLinearDistance(origPos.roomName, destPos.roomName) > 2)) {
                allowedRooms = this.findAllowedRooms(origPos.roomName, destPos.roomName, options);
            }
            let callback = (roomName) => {
                if (options.roomCallback) {
                    let outcome = options.roomCallback(roomName, options.ignoreCreeps);
                    if (outcome !== undefined) {
                        return outcome;
                    }
                }
                if (allowedRooms) {
                    if (!allowedRooms[roomName]) {
                        return false;
                    }
                } else if (this.getHostileRoom(roomName) && !options.allowHostile &&
                    roomName !== origPos.roomName && roomName !== destPos.roomName) {
                    return false;
                }

                let room = Game.rooms[roomName];
                let matrix;
                if (!room) {
                    matrix = this.getStructureMatrix(roomName, options);
                } else if (options.ignoreStructures) {
                    matrix = new PathFinder.CostMatrix();
                    if (!options.ignoreCreeps) {
                        Traveler.addCreepsToMatrix(room, matrix);
                    }
                } else if (options.ignoreCreeps || roomName !== origin.pos.roomName) {
                    matrix = this.getStructureMatrix(room, options);
                } else {
                    matrix = this.getCreepMatrix(room, options);
                }
                for (let obstacle of options.obstacles) {
                    matrix.set(obstacle.pos.x, obstacle.pos.y, 0xff);
                }
                return matrix;
            };
            const ret = PathFinder.search(origPos, { pos: destPos, range: options.range }, {
                maxOps: options.maxOps,
                plainCost: options.ignoreRoads ? 1 : 2,
                roomCallback: callback,
                swampCost: options.ignoreRoads ? 5 : 10,
            });
            ret.route = allowedRooms && allowedRooms.route;
            return ret;
        }
        static isBorder(pos) {
            return pos.x === 0 || pos.x === 49 || pos.y === 0 || pos.y === 49;
        };
        static opposingBorders(p1, p2) {
            return Traveler.isBorder(p1) && Traveler.isBorder(p2) && p1.roomName !== p2.roomName && (p1.x === p2.x || p1.y === p2.y);
        };
        prepareTravel(creep, destPos, options = {}) {
            const p = Util.startProfiling('prepareTravel', {enabled: false});
            // initialize data object
            if (_.isUndefined(creep.memory._travel)) {
                creep.memory._travel = { stuck: 0, tick: Game.time, cpu: 0, count: 0 };
            }
            const travelData = creep.memory._travel;
            const creepPos = creep.pos;
            p.checkCPU('', 5, 'prepareTravel:init1');

            if (creep.fatigue > 0) {
                travelData.tick = Game.time;
                return ERR_BUSY;
            }
            p.checkCPU('', 5, 'prepareTravel:init2');
            if (!destPos) {
                return ERR_INVALID_ARGS;
            }
            p.checkCPU('', 5, 'prepareTravel:init3');
            // check if creep is stuck
            let hasMoved = true;
            if (travelData.prev) {
                if ((creep.pos.x === travelData.prev.x && creep.pos.y === travelData.prev.y && creep.pos.roomName === travelData.prev.roomName) ||
                    Traveler.opposingBorders(creep.pos, travelData.prev)) {
                    hasMoved = false;
                    travelData.stuck++;
                } else {
                    creep.room.recordMove(creep);
                    p.checkCPU('', 5, 'prepareTravel:recordMove');
                    travelData.stuck = 0;
                    if (creepPos.roomName === destPos.roomName) {
                        // manage case where creep is nearby destination
                        let rangeToDestination = creepPos.getRangeTo(destPos.x, destPos.y);
                        p.checkCPU('getRange', 5, 'prepareTravel:getRange');
                        if (rangeToDestination <= options.range) {
                            return OK;
                        } else if (rangeToDestination <= 1) {
                            if (rangeToDestination === 1 && !options.range) {
                                if (options.returnData) {
                                    options.returnData.nextPos = destPos;
                                }
                                return creep.move(creepPos.getDirectionTo(destPos));
                            }
                            return OK;
                        }
                    }
                    p.checkCPU('', 5, 'prepareTravel:beforeHostile');
                    if (creepPos.roomName !== travelData.prev.roomName) {
                        this.registerHostileRoom(creep.room);
                        p.checkCPU('getRange', 5, 'prepareTravel:registerHostileRoom');
                    }
                }
            }
            if (travelData.stuck >= gOpts.defaultStuckValue && !options.ignoreStuck) {
                options.stuck = true;
            }
            travelData.tick = Game.time;
            p.checkCPU('', 5, 'prepareTravel:return');
        }
        travelTo(creep, destination, options = {}) {
            const travelData = creep.memory._travel;
            const creepPos = creep.pos, destPos = (destination.pos || destination);
            // handle case where creep is stuck
            if (options.stuck) {
                options.ignoreCreeps = false;
                delete travelData.path;
            }
            // delete path cache if destination is different
            if (!travelData.dest || travelData.dest.x !== destPos.x || travelData.dest.y !== destPos.y ||
                travelData.dest.roomName !== destPos.roomName) {
                delete travelData.path;
            }
            // pathfinding
            if (!travelData.path) {
                if (creep.spawning) {
                    return ERR_BUSY;
                }
                travelData.dest = destPos;
                travelData.prev = undefined;
                let cpu = Game.cpu.getUsed();
                let ret = this.findTravelPath(creep, destPos, options);
                travelData.cpu += (Game.cpu.getUsed() - cpu);
                travelData.count++;
                travelData.avg = _.round(travelData.cpu / travelData.count, 2);
                if (travelData.count > 25 && travelData.avg > options.reportThreshold) {
                    if (options.debug){
                        console.log(`TRAVELER: heavy cpu use: ${creep.name}, avg: ${travelData.cpu / travelData.count}, total: ${_.round(travelData.cpu, 2)},` +
                            `origin: ${creep.pos}, dest: ${destPos}`);
                    }
                }
                if (ret.incomplete) {
                    const route = ret.route && ret.route.length;
                    if (options.debug) {
                        if (options.range === 0) {
                            console.log(`TRAVELER: incomplete path for ${creep.name} from ${creep.pos} to ${destPos}, destination may be blocked.`);
                        } else {
                            console.log(`TRAVELER: incomplete path for ${creep.name} from ${creep.pos} to ${destPos}, range ${options.range}. Route length ${route}.`);
                        }
                    }
                    if (route > 1) {
                        ret = this.findTravelPath(creep, new RoomPosition(25, 25, ret.route[1].room),
                            _.create(options, {
                                range: gOpts.roomRange,
                                useFindRoute: false,
                            }));
                        if (options.debug) {
                            console.log(`attempting path through next room using known route was ${ret.incomplete ? "not" : ""} successful`);
                        }
                    }
                    if (ret.incomplete && ret.ops < 2000 && travelData.stuck < gOpts.defaultStuckValue) {
                        options.useFindRoute = false;
                        ret = this.findTravelPath(creep, destPos, options);
                        if (options.debug) {
                            console.log(`attempting path without findRoute was ${ret.incomplete ? "not " : ""}successful`);
                        }
                    }
                }
                travelData.path = Traveler.serializePath(creep.pos, ret.path);
                travelData.stuck = 0;
            }
            if (!travelData.path || travelData.path.length === 0) {
                return ERR_NO_PATH;
            }
            // consume path and move
            if (travelData.prev && travelData.stuck === 0) {
                travelData.path = travelData.path.substr(1);
            }
            travelData.prev = creep.pos;
            let nextDirection = parseInt(travelData.path[0], 10);
            if (options.returnData) {
                options.returnData.nextPos = Traveler.positionAtDirection(creep.pos, nextDirection);
             }
            return creep.move(nextDirection);
        }
        getStructureMatrix(room, options) {
            if (options.getStructureMatrix) return options.getStructureMatrix(room);
            this.refreshMatrices();
            if (!this.structureMatrixCache[room.name]) {
                let matrix = new PathFinder.CostMatrix();
                this.structureMatrixCache[room.name] = Traveler.addStructuresToMatrix(room, matrix, 1);
            }
            return this.structureMatrixCache[room.name];
        }
        static initPosition(pos) {
            return new RoomPosition(pos.x, pos.y, pos.roomName);
        }
        static addStructuresToMatrix(room, matrix, roadCost) {
            for (let structure of room.find(FIND_STRUCTURES)) {
                if (structure instanceof StructureRampart) {
                    if (!structure.my && !structure.isPublic) {
                        matrix.set(structure.pos.x, structure.pos.y, 0xff);
                    }
                }
                else if (structure instanceof StructureRoad) {
                    matrix.set(structure.pos.x, structure.pos.y, roadCost);
                }
                else if (structure.structureType !== STRUCTURE_CONTAINER) {
                    // Can't walk through non-walkable buildings
                    matrix.set(structure.pos.x, structure.pos.y, 0xff);
                }
            }
            for (let site of room.find(FIND_CONSTRUCTION_SITES)) {
                if (site.structureType === STRUCTURE_CONTAINER) {
                    continue;
                } else if (site.structureType === STRUCTURE_ROAD) {
                    continue;
                } else if (site.structureType === STRUCTURE_RAMPART) {
                    continue;
                }
                matrix.set(site.pos.x, site.pos.y, 0xff);
            }
            return matrix;
        }
        getCreepMatrix(room, options) {
            if (options.getCreepMatrix) return options.getCreepMatrix(room);
            this.refreshMatrices();
            if (!this.creepMatrixCache[room.name]) {
                this.creepMatrixCache[room.name] = Traveler.addCreepsToMatrix(room, this.getStructureMatrix(room, options).clone());
            }
            return this.creepMatrixCache[room.name];
        }
        static addCreepsToMatrix(room, matrix) {
            room.find(FIND_CREEPS).forEach((creep) => matrix.set(creep.pos.x, creep.pos.y, 0xff));
            return matrix;
        }
        static serializePath(startPos, path) {
            let serializedPath = "";
            let lastPosition = startPos;
            for (let position of path) {
                if (position.roomName === lastPosition.roomName) {
                    serializedPath += lastPosition.getDirectionTo(position);
                }
                lastPosition = position;
            }
            return serializedPath;
        }
        refreshMatrices() {
            if (Game.time !== this.currentTick) {
                this.currentTick = Game.time;
                this.structureMatrixCache = {};
                this.creepMatrixCache = {};
            }
        }
        static positionAtDirection(origin, direction) {
            if (!(direction >= 1 && direction <= 8)) return;
            let offsetX = [0, 0, 1, 1, 1, 0, -1, -1, -1];
            let offsetY = [0, -1, -1, 0, 1, 1, 1, 0, -1];
            return new RoomPosition(origin.x + offsetX[direction], origin.y + offsetY[direction], origin.roomName);
        }
        // try to find a path that links to the next closest spot on the path while considering creeps
        findDetour(startPos, goals, options) {
            startPos = startPos.pos || startPos;
            const rval = PathFinder.search(
                startPos, goals, {
                    maxOps: 350,
                    maxRooms: 1,
                    algorithm: 'dijkstra',
                    roomCallback: roomName => {
                        let room = Game.rooms[roomName];
                        if (!room) return;
                        return options.ignoreCreeps ? this.getStructureMatrix(room, options) : this.getCreepMatrix(room, options);
                    }
                }
            );
            if (rval && !rval.incomplete) {
                return Traveler.serializePath(startPos, rval.path);
            }
        }
    }

    if(gOpts.installTraveler){
        global.Traveler = Traveler;
        global.traveler = new Traveler();
        global.travelerTick = Game.time;
    }

    if(gOpts.installPrototype){
        // prototype requires an instance of traveler be installed in global
        if(!gOpts.installTraveler) {
            global.traveler = new Traveler();
            global.travelerTick = Game.time;
        }
        Creep.prototype.travelTo = function(destination, _options = {}) {
            const p = Util.startProfiling(this.name, {enabled: global.PROFILING.TRAVELER});
            const p2 = Util.startProfiling(this.name, {enabled: global.PROFILING.TRAVELER});
            if (_.isUndefined(global.traveler)) global.traveler = new Traveler();
            destination = destination.pos || destination;
            if (!destination || !destination.roomName) return logError('Room.routeCallback', 'destination must be defined');

            _options = this.getStrategyHandler([this.action && this.action.name], 'moveOptions', _options);
            p2.checkCPU('Creep.travelTo', 1, 'travelTo:getStrategy');
            const options = {
                allowSK: true,
                avoidSKCreeps: true,
                debug: global.DEBUG,
                reportThreshold: global.TRAVELER_THRESHOLD,
                useFindRoute: global.ROUTE_PRECALCULATION || true,
            };
            options.routeCallback = Room.routeCallback(this.pos.roomName, destination.roomName, options);
            options.getStructureMatrix = room => Room.getStructureMatrix(room.name || room, options);
            options.getCreepMatrix = room => room.getCreepMatrix(options.getStructureMatrix(room));
            _.assign(options, _options);
            p2.checkCPU('Creep.travelTo', 1, 'travelTo:defaults');

            // cache all routes for this creep by default
            const cacheThisRoute = (dest) => {
                if (!options.cacheRoutes || options.ignoreCreeps === false) {
                    console.log(this.name, dest, options.cacheRoutes, options.ignoreCreeps);
                    return false;
                }
                // don't do expensive checks each tick once you've determined this destination is not to be cached
                const destId = Room.getDestId(dest);
                if (this.data.cachedRoute && this.data.cachedRoute.dest === destId) {
                    return this.data.cachedRoute.shouldCache;
                }
                const shouldCache = options.cacheThisRoute ? options.cacheThisRoute(dest) : options.cacheRoutes;
                this.data.cachedRoute = {dest: destId, shouldCache};
                return shouldCache;
            }
            let type = '';
            const ret = traveler.prepareTravel(this, destination, options);
            p2.checkCPU('Creep.travelTo', 1, 'travelTo:prepareTravel');
            if (ret) return ret;
            if (cacheThisRoute(destination)) {
                p2.checkCPU('Creep.travelTo', 1, 'travelToCached:cacheThisRoute');
                type = 'Cached';
                const ret = this.room.getPath(this.pos, destination, options);
                p2.checkCPU('Creep.travelTo', 1, 'travelToCached:getPath');
                if (ret && ret.path) {
                    const path = ret.path;
                    let next;
                    const travelData = this.memory._travel;
                    if (options.stuck || travelData.detour) {
                        if (!travelData.detour) {
                            // get the next 5 spots on the path
                            const goals = [];
                            let lastPos = this.pos;
                            for (let i = 0; i < 5 && ret.path.length; i++) {
                                const posId = Room.getPosId(lastPos);
                                const direction = ret.reverse ? Traveler.reverseDirection(path[posId]) : path[posId];
                                let nextPos = Traveler.positionAtDirection(lastPos, direction);
                                if (!nextPos) break; // in case we hit a border
                                goals.push(nextPos);
                                lastPos = nextPos;
                            }
                            const ignoreCreeps = options.ignoreCreeps;
                            options.ignoreCreeps = false; // creeps are the most common reason for a detour
                            travelData.detour = traveler.findDetour(this, goals, options);
                            if (!travelData.detour && options.debug) {
                                console.log(this.name, this.pos, 'could not find a detour, reverting to travelTo');
                                options.ignoreCreeps = ignoreCreeps;
                            }
                        }
                        if (travelData.detour) {
                            next = parseInt(travelData.detour.shift(), 10);
                            if (travelData.detour.length === 0) {
                                delete travelData.detour;
                            }
                        }
                        p2.checkCPU('Creep.travelTo', 1, 'travelToCached:detour');
                    } else {
                        if (ret.reverse) {
                            const dir = Traveler.reverseDirection[path[Room.getPosId(this.pos)]];
                            const prev = Room.getPosId(Traveler.positionAtDirection(this.pos, dir));
                            next = path[Room.getPosId(prev)];
                        } else {
                            next = path[Room.getPosId(this.pos)];
                        }
                        p2.checkCPU('Creep.travelTo', 1, 'travelToCached:next');
                    }
                    if (next) {
                        if (next === 'B') return; // wait for border to cycle
                        else {
                            travelData.prev = this.pos;
                            delete travelData.path; // clean up other memory usage
                            const rVal = this.move(next); // take next step
                            p2.checkCPU('Creep.travelTo', 3, 'travelToCached:move');
                            p.checkCPU('Creep.travelTo', 1, 'travelTo' + type + ':total');
                            return rVal;
                        }
                    } else if (options.debug) {
                        console.log(this.name, 'no next step to take, using traveler.', next, 'from', this.pos, 'to', destination);
                    }
                } else if (options.debug) { // TODO:find closest place to get on the path
                    console.log(this.name, 'could not generate or use cached route, falling back to traveler.');
                }
            } else {
                p2.checkCPU('Creep.travelTo', 1, 'travelTo:noCacheRoute');
            }
            const rVal = traveler.travelTo(this, destination, options);
            p.checkCPU('Creep.travelTo', 1, 'travelTo' + type + ':total');
            return rVal;
        };
    }

    if(gOpts.exportTraveler){
        return Traveler;
    }
};
