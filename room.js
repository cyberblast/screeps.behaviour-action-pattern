// save original API functions
let find = Room.prototype.find;

let mod = {};
module.exports = mod;
mod.extend = function(){
    Room.Containers.extend();
    Room.Defense.extend();
    Room.Labs.extend();
    Room.Links.extend();
    Room.Nukers.extend();
    Room.Observer.extend();
    Room.Orders.extend();
    Room.Pathfinding.extend();
    Room.PowerBank.extend();
    Room.PowerSpawns.extend();
    Room.Resources.extend();
    Room.Spawns.extend();
    Room.Structures.extend();
    Room.Terminal.extend();
    Room.Towers.extend();
    Object.defineProperties(Room.prototype, {
        'creeps': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._creeps) ){
                    this._creeps = this.find(FIND_MY_CREEPS);
                }
                return this._creeps;
            }
        },
        'allCreeps': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._allCreeps) ){
                    this._allCreeps = this.find(FIND_CREEPS);
                }
                return this._allCreeps;
            }
        },
        'situation': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._situation) ){
                    this._situation = {
                        noEnergy: this.sourceEnergyAvailable == 0,
                        invasion: this.hostiles.length > 0 && (!this.controller || !this.controller.safeMode)
                    };
                }
                return this._situation;
            }
        },
        'roadConstructionTrace': {
            configurable: true,
            get: function () {
                if (_.isUndefined(this.memory.roadConstructionTrace) ) {
                    this.memory.roadConstructionTrace = {};
                }
                return this.memory.roadConstructionTrace;
            }
        },
        'adjacentRooms': {
            configurable: true,
            get: function () {
                if (_.isUndefined(this.memory.adjacentRooms) ) {
                    this.memory.adjacentRooms = Room.adjacentRooms(this.name);
                }
                return this.memory.adjacentRooms;
            }
        },
        'adjacentAccessibleRooms': {
            configurable: true,
            get: function () {
                if (_.isUndefined(this.memory.adjacentAccessibleRooms) ) {
                    this.memory.adjacentAccessibleRooms = Room.adjacentAccessibleRooms(this.name);
                }
                return this.memory.adjacentAccessibleRooms;
            }
        },
        'privateerMaxWeight': {
            configurable: true,
            get: function () {
                if (_.isUndefined(this._privateerMaxWeight) ) {
                    this._privateerMaxWeight = 0;
                    if ( !this.situation.invasion && !this.conserveForDefense ) {
                        let base = this.controller.level * 1000;
                        let that = this;
                        let adjacent, ownNeighbor, room, mult;

                        let flagEntries = FlagDir.filter([FLAG_COLOR.invade.robbing, FLAG_COLOR.invade.exploit]);
                        let countOwn = roomName => {
                            if( roomName == that.name ) return;
                            if( Room.isMine(roomName) ) ownNeighbor++;
                        };
                        let calcWeight = flagEntry => {
                            if( !this.adjacentAccessibleRooms.includes(flagEntry.roomName) ) return;
                            room = Game.rooms[flagEntry.roomName];
                            if( room ) {
                                adjacent = room.adjacentAccessibleRooms;
                                mult = room.sources.length;
                            } else {
                                adjacent = Room.adjacentAccessibleRooms(flagEntry.roomName);
                                mult = 1;
                            }
                            ownNeighbor = 1;
                            adjacent.forEach(countOwn);
                            that._privateerMaxWeight += (mult * base / ownNeighbor);
                        };
                        flagEntries.forEach(calcWeight);
                    }
                };
                return this._privateerMaxWeight;
            }
        },
        'claimerMaxWeight': {
            configurable: true,
            get: function () {
                if (_.isUndefined(this._claimerMaxWeight) ) {
                    this._claimerMaxWeight = 0;
                    let base = 1250;
                    let maxRange = 2;
                    let that = this;
                    let distance, reserved, flag;
                    let rcl = this.controller.level;

                    let flagEntries = FlagDir.filter([FLAG_COLOR.claim, FLAG_COLOR.claim.reserve, FLAG_COLOR.invade.exploit]);
                    let calcWeight = flagEntry => {
                        // don't spawn claimer for reservation at RCL < 4 (claimer not big enough)
                        if( rcl > 3 || (flagEntry.color == FLAG_COLOR.claim.color && flagEntry.secondaryColor == FLAG_COLOR.claim.secondaryColor )) {
                            distance = Room.roomDistance(that.name, flagEntry.roomName);
                            if( distance > maxRange )
                                return;
                            flag = Game.flags[flagEntry.name];
                            if( flag.room && flag.room.controller && flag.room.controller.reservation && flag.room.controller.reservation.ticksToEnd > 2500)
                                return;

                            reserved = flag.targetOf && flag.targetOf ? _.sum( flag.targetOf.map( t => t.creepType == 'claimer' ? t.weight : 0 )) : 0;
                            that._claimerMaxWeight += (base - reserved);
                        };
                    };
                    flagEntries.forEach(calcWeight);
                };
                return this._claimerMaxWeight;
            }
        },
        'conserveForDefense': {
            configurable: true,
            get: function () {
                return (this.my && this.storage && this.storage.charge < 0);
            }
        },
        'my': {
            configurable: true,
            get: function () {
                if (_.isUndefined(this._my) ) {
                    this._my = this.controller && this.controller.my;
                }
                return this._my;
            }
        },
        'reserved': {
            configurable: true,
            get: function () {
                if (_.isUndefined(this._reserved) ) {
                    if (this.controller) {
                        const myName = _.find(Game.spawns).owner.username;
                        this._reserved = this.controller.my || (this.controller.reservation
                            && this.controller.reservation.username === myName);
                    } else {
                        this._reserved = false;
                    }
                }
                return this._reserved;
            },
        },
        'owner': {
            configurable: true,
            get: function () {
                if (_.isUndefined(this._owner)) {
                    if (this.controller && this.controller.owner) {
                        this._owner = this.controller.owner.username;
                    } else {
                        this._owner = false;
                    }
                }
                return this._owner;
            },
        },
        'reservation': {
            configurable: true,
            get: function () {
                if (_.isUndefined(this._reservation)) {
                    if (this.controller && this.controller.reservation) {
                        this._reservation = this.controller.reservation.username;
                    } else {
                        this._reservation = false;
                    }
                }
                return this._reservation;
            },
        },
        'ally': {
            configurable: true,
            get: function () {
                if (_.isUndefined(this._ally)) {
                    if (this.reserved) {
                        this._ally = true;
                    } else if (this.controller) {
                        this._ally = Task.reputation.isAlly(this.owner) || Task.reputation.isAlly(this.reservation);
                    } else {
                        this._ally = false;
                    }
                }
                return this._ally;
            },
        },
        'pavementArt': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this.memory.pavementArt) ) {
                    this.memory.pavementArt = [];
                }
                return this.memory.pavementArt;
            }
        },
        'collapsed': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._collapsed) ) {
                    // only if owned
                    if( !this.my ) {
                        this._collapsed = false;
                        return;
                    }
                    // no creeps ? collapsed!
                    if( !this.population ) {
                        this._collapsed = true;
                        return;
                    }
                    // is collapsed if workers + haulers + pioneers in room = 0
                    let workers = this.population.typeCount['worker'] ? this.population.typeCount['worker'] : 0;
                    let haulers = this.population.typeCount['hauler'] ? this.population.typeCount['hauler'] : 0;
                    let pioneers = this.population.typeCount['pioneer'] ? this.population.typeCount['pioneer'] : 0;
                    this._collapsed = (workers + haulers + pioneers) === 0;
                }
                return this._collapsed;
            }
        },
    });
    Room.prototype.find = function (c, opt) {
        if (_.isArray(c)) {
            return _(c)
                .map(x => find.call(this, x, opt))
                .flatten()
                .value();
        } else
            return find.apply(this, arguments);
    };
    Room.prototype.roadConstruction = function( minDeviation = ROAD_CONSTRUCTION_MIN_DEVIATION ) {
        if( !ROAD_CONSTRUCTION_ENABLE || Game.time % ROAD_CONSTRUCTION_INTERVAL != 0 ) return;
        if( _.isNumber(ROAD_CONSTRUCTION_ENABLE) && (!this.my || ROAD_CONSTRUCTION_ENABLE > this.controller.level)) return;

        let data = Object.keys(this.roadConstructionTrace)
            .map( k => {
                return { // convert to [{key,n,x,y}]
                    'n': this.roadConstructionTrace[k], // count of steps on x,y cordinates
                    'x': k.charCodeAt(0)-32, // extract x from key
                    'y': k.charCodeAt(1)-32 // extraxt y from key
                };
            });

        let min = Math.max(ROAD_CONSTRUCTION_ABS_MIN, (data.reduce( (_sum, b) => _sum + b.n, 0 ) / data.length) * minDeviation);
        data = data.filter( e => {
            if (e.n >= min) {
                let structures = this.lookForAt(LOOK_STRUCTURES,e.x,e.y);
                return (structures.length === 0 || structures[0].structureType === STRUCTURE_RAMPART)
                    && this.lookForAt(LOOK_CONSTRUCTION_SITES,e.x,e.y).length === 0;
            } else {
                return false;
            }
        });

        // build roads on all most frequent used fields
        let setSite = pos => {
            if( DEBUG ) logSystem(this.name, `Constructing new road at ${pos.x}'${pos.y} (${pos.n} traces)`);
            this.createConstructionSite(pos.x, pos.y, STRUCTURE_ROAD);
        };
        _.forEach(data, setSite);

        // clear old data
        this.roadConstructionTrace = {};
    };
};
mod.flush = function(){
    Room.Observer.flush();
    
    let clean = room => {
        Room.Containers.flush(room);
        Room.Defense.flush(room);
        Room.Labs.flush(room);
        Room.Links.flush(room);
        Room.Nukers.flush(room);
        Room.Observer.flush(room);
        Room.Orders.flush(room);
        Room.Pathfinding.flush(room);
        Room.PowerBank.flush(room);
        Room.PowerSpawns.flush(room);
        Room.Resources.flush(room);
        Room.Spawns.flush(room);
        Room.Structures.flush(room);
        Room.Terminal.flush(room);
        Room.Towers.flush(room);
        delete room._situation;
        delete room._creeps;
        delete room._privateerMaxWeight;
        delete room._claimerMaxWeight;
        delete room._collapsed;
        if( global.isNewServer ) {
            delete room._my;
            //FIXME: _maxPerJob doesn't appear to be used anywhere?
            delete room._maxPerJob;
        }
    };
    _.forEach(Game.rooms, clean);
};
mod.analyze = function(){
    let getEnvironment = room => {
        try {
            Room.Containers.analyze(room);
            Room.Defense.analyze(room);
            Room.Labs.analyze(room);
            Room.Links.analyze(room);
            Room.Nukers.analyze(room);
            Room.Observer.analyze(room);
            Room.Orders.analyze(room);
            Room.Pathfinding.analyze(room);
            Room.PowerBank.analyze(room);
            Room.PowerSpawns.analyze(room);
            Room.Resources.analyze(room);
            Room.Spawns.analyze(room);
            Room.Structures.analyze(room);
            Room.Terminal.analyze(room);
            Room.Towers.analyze(room);
            room.roadConstruction();
        }
        catch(err) {
            Game.notify('Error in room.js (Room.prototype.loop) for "' + room.name + '" : ' + err.stack ? err + '<br/>' + err.stack : err);
            console.log( dye(CRAYON.error, 'Error in room.js (Room.prototype.loop) for "' + room.name + '": <br/>' + (err.stack || err.toString()) + '<br/>' + err.stack));
        }
    };
    _.forEach(Game.rooms, getEnvironment);
};
mod.execute = function() {
    const run = function(memory, roomName) {
        const room = Game.rooms[roomName];
        if (room) {
            Room.Defense.execute(room);
            if (room.collapsed) Room.collapsed.trigger(room);
        }
    };
    _.forEach(Memory.rooms, run);
};
mod.bestSpawnRoomFor = function(targetRoomName) {
    var range = room => room.my ? routeRange(room.name, targetRoomName) : Infinity;
    return _.min(Game.rooms, range);
};
// find a room to spawn
// params: { targetRoom, minRCL = 0, maxRange = Infinity, minEnergyAvailable = 0, minEnergyCapacity = 0, callBack = null, allowTargetRoom = false, rangeRclRatio = 3, rangeQueueRatio = 51 }
// requiredParams: targetRoom
mod.findSpawnRoom = function(params){
    if( !params || !params.targetRoom ) return null;
    // filter validRooms
    let isValidRoom = room => (
        room.my &&
        (params.minEnergyCapacity === undefined || params.minEnergyCapacity <= room.energyCapacityAvailable) &&
        (params.minEnergyAvailable === undefined || params.minEnergyAvailable <= room.energyAvailable) &&
        (room.name != params.targetRoom || params.allowTargetRoom === true) &&
        (params.minRCL === undefined || room.controller.level >= params.minRCL) &&
        (params.callBack === undefined || params.callBack(room))
    );
    let validRooms = _.filter(Game.rooms, isValidRoom);
    if( validRooms.length === 0 ) return null;
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
mod.isMine = function(roomName) {
    let room = Game.rooms[roomName];
    return( room && room.my );
};
mod.calcCardinalDirection = function(roomName) {
    const parsed = /^([WE])[0-9]+([NS])[0-9]+$/.exec(roomName);
    return [parsed[1], parsed[2]];
};
mod.calcGlobalCoordinates = function(roomName, callBack) {
    if (!callBack) return null;
    const parsed = /^[WE]([0-9]+)[NS]([0-9]+)$/.exec(roomName);
    const x = +parsed[1];
    const y = +parsed[2];
    return callBack(x, y);
};
mod.calcCoordinates = function(roomName, callBack){
    if (!callBack) return null;
    return Room.calcGlobalCoordinates(roomName, (x, y) => {
        return callBack(x % 10, y % 10);
    });
};
mod.isCenterRoom = function(roomName){
    return Room.calcCoordinates(roomName, (x,y) => {
        return x === 5 && y === 5;
    });
};
mod.isCenterNineRoom = function(roomName){
    return Room.calcCoordinates(roomName, (x,y) => {
        return x > 3 && x < 7 && y > 3 && y < 7;
    });
};
mod.isControllerRoom = function(roomName){
    return Room.calcCoordinates(roomName, (x,y) => {
        return x !== 0 && y !== 0 && (x < 4 || x > 6 || y < 4 || y > 6);
    });
};
mod.isSKRoom = function(roomName){
    return Room.calcCoordinates(roomName, (x,y) => {
        return x > 3 && x < 7 && y > 3 && y < 7 && (x !== 5 || y !== 5);
    });
};
mod.isHighwayRoom = function(roomName){
    return Room.calcCoordinates(roomName, (x,y) => {
        return x === 0 || y === 0;
    });
};
mod.adjacentRooms = function(roomName){
    let parts = roomName.split(/([N,E,S,W])/);
    let dirs = ['N','E','S','W'];
    let toggle = q => dirs[ (dirs.indexOf(q)+2) % 4 ];
    let names = [];
    for( let x = parseInt(parts[2])-1; x < parseInt(parts[2])+2; x++ ){
        for( let y = parseInt(parts[4])-1; y < parseInt(parts[4])+2; y++ ){
            names.push( ( x < 0 ? toggle(parts[1]) + '0' : parts[1] + x ) + ( y < 0 ? toggle(parts[3]) + '0' : parts[3] + y ) );
        }
    }
    return names;
};
mod.adjacentAccessibleRooms = function(roomName, diagonal = true) {
    let validRooms = [];
    let exits = Game.map.describeExits(roomName);
    let addValidRooms = (roomName, direction) => {
        if( diagonal ) {
            let roomExits = Game.map.describeExits(roomName);
            let dirA = (direction + 1) % 8 + 1;
            let dirB = (direction + 5) % 8 + 1;
            if( roomExits && roomExits[dirA] && !validRooms.includes(roomExits[dirA]) )
                validRooms.push(roomExits[dirA]);
            if( roomExits && roomExits[dirB] && !validRooms.includes(roomExits[dirB]) )
                validRooms.push(roomExits[dirB]);
        }
        validRooms.push(roomName);
    }
    _.forEach(exits, addValidRooms);
    return validRooms;
};
mod.roomDistance = function(roomName1, roomName2, diagonal, continuous){
    if( diagonal ) return Game.map.getRoomLinearDistance(roomName1, roomName2, continuous);
    if( roomName1 == roomName2 ) return 0;
    let posA = roomName1.split(/([N,E,S,W])/);
    let posB = roomName2.split(/([N,E,S,W])/);
    let xDif = posA[1] == posB[1] ? Math.abs(posA[2]-posB[2]) : posA[2]+posB[2]+1;
    let yDif = posA[3] == posB[3] ? Math.abs(posA[4]-posB[4]) : posA[4]+posB[4]+1;
    //if( diagonal ) return Math.max(xDif, yDif); // count diagonal as 1
    return xDif + yDif; // count diagonal as 2
};
mod.validFields = function(roomName, minX, maxX, minY, maxY, checkWalkable = false, where = null) {
    const room = Game.rooms[roomName];
    const look = checkWalkable ? room.lookAtArea(minY,minX,maxY,maxX) : null;
    let fields = [];
    for( let x = minX; x <= maxX; x++) {
        for( let y = minY; y <= maxY; y++){
            if( x > 1 && x < 48 && y > 1 && y < 48 ){
                if( !checkWalkable || room.isWalkable(x, y, look) ){
                    let p = new RoomPosition(x, y, roomName);
                    if( !where || where(p) )
                        fields.push(p);
                }
            }
        }
    }
    return fields;
};
// args = { spots: [{pos: RoomPosition, range:1}], checkWalkable: false, where: ()=>{}, roomName: abc ) }
mod.fieldsInRange = function(args) {
    let plusRangeX = args.spots.map(spot => spot.pos.x + spot.range);
    let plusRangeY = args.spots.map(spot => spot.pos.y + spot.range);
    let minusRangeX = args.spots.map(spot => spot.pos.x - spot.range);
    let minusRangeY = args.spots.map(spot => spot.pos.y - spot.range);
    let minX = Math.max(...minusRangeX);
    let maxX = Math.min(...plusRangeX);
    let minY = Math.max(...minusRangeY);
    let maxY = Math.min(...plusRangeY);
    return Room.validFields(args.roomName, minX, maxX, minY, maxY, args.checkWalkable, args.where);
};
