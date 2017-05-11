const strategy = load("strategy");

let mod = {};
module.exports = mod;
mod.extend = function(){
    Creep.prototype.assignAction = function(action, target) {
        if (typeof action === 'string') action = Creep.action[action];
        if (!action || !(action instanceof Creep.Action)) return;
        return action.assign(this, target);
    };
    // to maintain legacy code for now
    Creep.prototype.findGroupMemberByType = function(creepType, flagName) {
        return Creep.prototype.findGroupMemberBy(c => c.creepType === creepType, flagName);
    };
    Creep.prototype.findGroupMemberBy = function(findFunc, flagName) {
        if (_.isUndefined(flagName)) flagName = this.data.flagName;
        if (!_.isUndefined(findFunc) && flagName) {
            const ret = _(Memory.population).filter({flagName}).find(findFunc);
            return ret ? ret.creepName : null;
        } else {
            Util.logError(`${this.name} - Invalid arguments for Creep.findGroupMemberBy ${flagName} ${findFunc}`);
        }
        return null;
    };
    Creep.prototype.findByType = function(creepType) {
        let creep;
        for(let i in Memory.population) {
            creep = Memory.population[i];

            if(creep.creepType === creepType) {
                return i;
            }
        }
    };
    
    Creep.prototype.getBodyparts = function(type) {
        return _(this.body).filter({type}).value().length;
    };
    
    // Check if a creep has body parts of a certain type anf if it is still active. 
    // Accepts a single part type (like RANGED_ATTACK) or an array of part types. 
    // Returns true, if there is at least any one part with a matching type present and active.
    Creep.prototype.hasActiveBodyparts = function(partTypes) {
        return this.hasBodyparts(partTypes, this.body.length - Math.ceil(this.hits * 0.01));
    };
    Creep.prototype.hasBodyparts = function(partTypes, start = 0) {
        const body = this.body;
        const limit = body.length;
        if (!Array.isArray(partTypes)) {
            partTypes = [partTypes];
        }
        for (let i = start; i < limit; i++) {
            if (partTypes.includes(body[i].type)) {
                return true;
            }
        }
        return false;
    };
    Creep.prototype.run = function(behaviour){
        if( !this.spawning ){
            if(!behaviour && this.data && this.data.creepType) {
                behaviour = Creep.behaviour[this.data.creepType];
                if (this.room.skip) return;
                if ( Memory.CPU_CRITICAL && !CRITICAL_ROLES.includes(this.data.creepType) ) {
                    return;
                }
            }
            const total = Util.startProfiling('Creep.run', {enabled:PROFILING.CREEPS});
            const p = Util.startProfiling(this.name + '.run', {enabled:this.data && this.data.creepType && PROFILING.CREEP_TYPE === this.data.creepType});
            if (this.data && !_.contains(['remoteMiner', 'miner', 'upgrader'], this.data.creepType)) {
                this.repairNearby();
                p.checkCPU('repairNearby', PROFILING.MIN_THRESHOLD);
            }
            if( global.DEBUG && global.TRACE ) trace('Creep', {creepName:this.name, pos:this.pos, Behaviour: behaviour && behaviour.name, Creep:'run'});
            if( behaviour ) {
                behaviour.run(this);
                p.checkCPU('behaviour.run', PROFILING.MIN_THRESHOLD);
            }
            else if(!this.data){
                if( global.DEBUG && global.TRACE ) trace('Creep', {creepName:this.name, pos:this.pos, Creep:'run'}, 'memory init');
                let type = this.memory.setup;
                let weight = this.memory.cost;
                let home = this.memory.home;
                let spawn = this.memory.mother;
                let breeding = this.memory.breeding;
                if( type && weight && home && spawn && breeding  ) {
                    //console.log( 'Fixing corrupt creep without population entry: ' + this.name );
                    var entry = Population.setCreep({
                        creepName: this.name,
                        creepType: type,
                        weight: weight,
                        roomName: this.pos.roomName,
                        homeRoom: home,
                        motherSpawn: spawn,
                        actionName: this.action ? this.action.name : null,
                        targetId: this.target ? this.target.id || this.target.name : null,
                        spawningTime: breeding,
                        flagName: null,
                        body: _.countBy(this.body, 'type')
                    });
                    Population.countCreep(this.room, entry);
                } else {
                    console.log( dye(CRAYON.error, 'Corrupt creep without population entry!! : ' + this.name ), Util.stack());
                    // trying to import creep
                    let counts = _.countBy(this.body, 'type');
                    if( counts[WORK] && counts[CARRY])
                    {
                        let weight = (counts[WORK]*BODYPART_COST[WORK]) + (counts[CARRY]*BODYPART_COST[CARRY]) + (counts[MOVE]*BODYPART_COST[MOVE]);
                        var entry = Population.setCreep({
                            creepName: this.name,
                            creepType: 'worker',
                            weight: weight,
                            roomName: this.pos.roomName,
                            homeRoom: this.pos.roomName,
                            motherSpawn: null,
                            actionName: null,
                            targetId: null,
                            spawningTime: -1,
                            flagName: null,
                            body: _.countBy(this.body, 'type')
                        });
                        Population.countCreep(this.room, entry);
                    } else this.suicide();
                    p.checkCPU('!this.data', PROFILING.MIN_THRESHOLD);
                }
            }
            if( this.flee ) {
                this.fleeMove();
                p.checkCPU('fleeMove', PROFILING.MIN_THRESHOLD);
                Creep.behaviour.ranger.heal(this);
                p.checkCPU('heal', PROFILING.MIN_THRESHOLD);
                if( SAY_ASSIGNMENT ) this.say(String.fromCharCode(10133), SAY_PUBLIC);
            }
            total.checkCPU(this.name, PROFILING.EXECUTE_LIMIT / 3, this.data ? this.data.creepType : 'noType');
        }

        strategy.freeStrategy(this);
    };
    Creep.prototype.leaveBorder = function() {
        // if on border move away
        // for emergency case, Path not found
        let dir = 0;
        if( this.pos.y === 0 ){
            dir = BOTTOM;
        } else if( this.pos.x === 0  ){
            dir = RIGHT;
        } else if( this.pos.y === 49  ){
            dir = TOP;
        } else if( this.pos.x === 49  ){
            dir = LEFT;
        }
        if (dir) {
            this.move(dir);
        }
        return dir;
        // TODO: CORNER cases
    };
    Creep.prototype.honk = function(){
        if( HONK ) this.say('\u{26D4}\u{FE0E}', SAY_PUBLIC);
    };
    Creep.prototype.honkEvade = function(){
        if( HONK ) this.say('\u{1F500}\u{FE0E}', SAY_PUBLIC);
    };
    Creep.prototype.fleeMove = function() {
        if( global.DEBUG && global.TRACE ) trace('Creep', {creepName:this.name, pos:this.pos, Action:'fleeMove', Creep:'run'});
        let drop = r => { if(this.carry[r] > 0 ) this.drop(r); };
        _.forEach(Object.keys(this.carry), drop);
        if( this.fatigue > 0 ) return;
        let path;
        if( !this.data.fleePath || this.data.fleePath.length < 2 || this.data.fleePath[0].x != this.pos.x || this.data.fleePath[0].y != this.pos.y || this.data.fleePath[0].roomName != this.pos.roomName ) {
            let goals = _.map(this.room.hostiles, function(o) {
                return { pos: o.pos, range: 5 };
            });

            let ret = PathFinder.search(
                this.pos, goals, {
                    flee: true,
                    plainCost: 2,
                    swampCost: 10,
                    maxOps: 500,
                    maxRooms: 2,

                    roomCallback: function(roomName) {
                        let room = Game.rooms[roomName];
                        if (!room) return;
                        return room.creepMatrix;
                    }
                }
            );
            path = ret.path;

            this.data.fleePath = path;
        } else {
            this.data.fleePath.shift();
            path = this.data.fleePath;
        }
        if( path && path.length > 0 )
            this.move(this.pos.getDirectionTo(new RoomPosition(path[0].x,path[0].y,path[0].roomName)));
    };
    Creep.prototype.idleMove = function( ) {
        if( this.fatigue > 0 ) return;
        // check if on road/structure
        let here = _.chain(this.room.structures.piles).filter('pos', this.pos)
            .concat(this.room.lookForAt(LOOK_STRUCTURES, this.pos))
            .concat(this.room.lookForAt(LOOK_CONSTRUCTION_SITES, this.pos, {filter: s => s.my}))
            .value();
        if( here && here.length > 0 ) {
            let path;
            if( !this.data.idlePath || this.data.idlePath.length < 2 || this.data.idlePath[0].x != this.pos.x || this.data.idlePath[0].y != this.pos.y || this.data.idlePath[0].roomName != this.pos.roomName ) {
                let goals = this.room.structures.all.map(function(o) {
                    return { pos: o.pos, range: 1 };
                }).concat(this.room.sources.map(function (s) {
                    return { pos: s.pos, range: 2 };
                })).concat(this.pos.findInRange(FIND_EXIT, 2).map(function (e) {
                    return { pos: e, range: 1 };
                })).concat(this.room.myConstructionSites.map(function(o) {
                    return { pos: o.pos, range: 1};
                }));

                let ret = PathFinder.search(
                    this.pos, goals, {
                        flee: true,
                        plainCost: 2,
                        swampCost: 10,
                        maxOps: 350,
                        maxRooms: 1,

                        roomCallback: function(roomName) {
                            let room = Game.rooms[roomName];
                            if (!room) return;
                            return room.creepMatrix;
                        }
                    }
                );
                path = ret.path;
                this.data.idlePath = path;
            } else {
                this.data.idlePath.shift();
                path = this.data.idlePath;
            }
            if( path && path.length > 0 )
                this.move(this.pos.getDirectionTo(new RoomPosition(path[0].x,path[0].y,path[0].roomName)));
        }
    };
    Creep.prototype.repairNearby = function() {
        // only repair in rooms that we own, have reserved, or belong to our allies, also SK rooms and highways.
        if (this.room.controller && this.room.controller.owner && !(this.room.my || this.room.reserved || this.room.ally)) return;
        // if it has energy and a work part, remoteMiners do repairs once the source is exhausted.
        if(this.carry.energy > 0 && this.hasActiveBodyparts(WORK)) {
            const repairRange = this.data && this.data.creepType === 'remoteHauler' ? REMOTE_HAULER.DRIVE_BY_REPAIR_RANGE : DRIVE_BY_REPAIR_RANGE;
            let nearby = this.pos.findInRange(this.room.structures.repairable, repairRange);
            if( nearby && nearby.length ){
                if( global.DEBUG && global.TRACE ) trace('Creep', {creepName:this.name, Action:'repairing', Creep:'repairNearby'}, nearby[0].pos);
                this.repair(nearby[0]);
            } else {
                if( global.DEBUG && global.TRACE ) trace('Creep', {creepName:this.name, Action:'repairing', Creep:'repairNearby'}, 'none');
                // enable remote haulers to build their own roads and containers
                if( REMOTE_HAULER.DRIVE_BY_BUILDING && this.data && this.data.creepType === 'remoteHauler' ) {
                    // only search in a range of 1 to save cpu
                    let nearby = this.pos.findInRange(this.room.myConstructionSites, REMOTE_HAULER.DRIVE_BY_BUILD_RANGE, {filter: (site) =>{
                        return site.my && REMOTE_HAULER.DRIVE_BY_BUILD_ALL ||
                            (site.structureType === STRUCTURE_CONTAINER ||
                            site.structureType === STRUCTURE_ROAD);
                    }});
                    if( nearby && nearby.length ){
                        if( global.DEBUG && global.TRACE ) trace('Creep', {creepName:this.name, Action:'building', Creep:'buildNearby'}, nearby[0].pos);
                        if( this.build(nearby[0]) === OK && this.carry.energy <= this.getActiveBodyparts(WORK) * BUILD_POWER ) {
                            Creep.action.idle.assign(this);
                        }
                    } else {
                        if( global.DEBUG && global.TRACE ) trace('Creep', {creepName:this.name, Action:'building', Creep:'buildNearby'}, 'none');
                    }
                }
            }
        } else {
            if( global.DEBUG && global.TRACE ) trace('Creep', {creepName:this.name, pos:this.pos, Action:'repairing', Creep:'repairNearby'}, 'no WORK');
        }
    };
    
    Creep.prototype.controllerSign = function() {
        const signMessage = Util.fieldOrFunction(CONTROLLER_SIGN_MESSAGE, this.room);
        if(CONTROLLER_SIGN && (!this.room.controller.sign || this.room.controller.sign.username !== this.owner.username || (CONTROLLER_SIGN_UPDATE && this.room.controller.sign.text !== signMessage))) {
            this.signController(this.room.controller, signMessage);
        }
    };

    Object.defineProperties(Creep.prototype, {
        'flee': {
            configurable: true,
            get: function() {
                if( !this.data ) {
                    // err
                    return;
                }
                if( this.data.flee ){
                    // release when restored
                    this.data.flee = this.hits != this.hitsMax;
                } else {
                    // set when low
                    this.data.flee = (this.hits/this.hitsMax) < 0.35;
                }
                return this.data.flee;
            },
            set: function(newValue) {
                this.data.flee = newValue;
            }
        },
        'sum': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._sum) || this._sumSet != Game.time ) {
                    this._sumSet = Game.time;
                    this._sum = _.sum(this.carry);
                }
                return this._sum;
            }
        }, 
        'threat': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._threat) ) {
                    this._threat = Creep.bodyThreat(this.body);
                }
                return this._threat;
            }
        },
        'trace': { // only valid on one creep at a time
            configurable: true,
            get: function() {
                return Memory.debugTrace.creepName === this.name;
            },
            set: function(value) {
                if (value) {
                    Memory.debugTrace.creepName = this.name;
                } else if (this.trace) {
                    delete Memory.debugTrace.creepName;
                }
            }
        }
    });

    // errorData = {errorCode, action, target, ...}
    Creep.prototype.handleError = function(errorData) {
        if (Creep.resolvingError) return;

        this.resolvingError = errorData;
        errorData.preventDefault = function() {
            Creep.resolvingError = null;
        };

        Creep.error.trigger(errorData);

        if (Creep.resolvingError) {
            if (global.DEBUG) logErrorCode(this, errorData.errorCode);
            delete this.data.actionName;
            delete this.data.targetId;
            Creep.resolvingError = null;
        }
    };

    // Creep.prototype.strategy = function(actionName, behaviourName, taskName)
    strategy.decorateAgent(Creep.prototype,
        {
            default: creep => creep.action && creep.action.name,
            selector: actionName => Creep.action[actionName],
        },{
            default: creep => creep.data.creepType,
            selector: behaviourName => Creep.behaviour[behaviourName] && Creep.behaviour[behaviourName],
        },{
            default: creep => creep.data.destiny && creep.data.destiny.task,
            selector: taskName => Task[taskName] && Task[taskName],
        });

    // Explain API extension
    Creep.prototype.explainAgent = function() {
        return `ttl:${this.ticksToLive} pos:${this.pos}`;
    };

    // API
    Creep.prototype.staticCustomStrategy = function(actionName, behaviourName, taskName) {};
    Creep.prototype.customStrategy = function(actionName, behaviourName, taskName) {};
};
mod.execute = function(){
    if ( global.DEBUG && Memory.CPU_CRITICAL ) logSystem('system',`${Game.time}: CPU Bucket level is critical (${Game.cpu.bucket}). Skipping non critical creep roles.`);
    let run = creep => {
        try {
            creep.run();
        } catch (e) {
            console.log('<span style="color:FireBrick">Creep ' + creep.name + (e.stack || e.toString()) + '</span>', Util.stack());
        }
    };
    _.forEach(Game.creeps, run);
};
mod.bodyCosts = function(body){
    let costs = 0;
    if( body ){
        body.forEach(function(part){
            costs += BODYPART_COST[part];
        });
    }
    return costs;
};
// params: {minThreat, maxWeight, maxMulti}
mod.multi = function (room, params) {
    let fixedCosts = Creep.bodyCosts(params.fixedBody);
    let multiCosts = Creep.bodyCosts(params.multiBody);
    let maxThreatMulti;
    if( params && params.minThreat ){
        let fixedThreat = Creep.bodyThreat(params.fixedBody);
        let multiThreat = Creep.bodyThreat(params.multiBody);
        maxThreatMulti = 0;
        let iThreat = fixedThreat;
        while(iThreat < params.minThreat){
            maxThreatMulti += 1;
            iThreat += multiThreat;
        }
    } else maxThreatMulti = Infinity;
    if(multiCosts === 0) return 0; // prevent divide-by-zero
    let maxParts = Math.floor((50 - params.fixedBody.length) / params.multiBody.length);
    let maxEnergy = params.currentEnergy ? room.energyAvailable : room.energyCapacityAvailable;
    let maxAffordable = Math.floor((maxEnergy - fixedCosts) / multiCosts);
    let maxWeightMulti = (params && params.maxWeight) ? Math.floor((params.maxWeight-fixedCosts)/multiCosts) : Infinity;
    let maxMulti = (params && params.maxMulti) ? params.maxMulti : Infinity;
    return _.min([maxParts, maxAffordable, maxThreatMulti, maxWeightMulti, maxMulti]);
};
mod.partsComparator = function (a, b) {
    let partsOrder = [TOUGH, CLAIM, WORK, CARRY, ATTACK, RANGED_ATTACK, HEAL, MOVE];
    let indexOfA = partsOrder.indexOf(a);
    let indexOfB = partsOrder.indexOf(b);
    return indexOfA - indexOfB;
};
mod.formatParts = function(parts) {
    if (parts && !Array.isArray(parts) && typeof parts === 'object') {
        const body = [];
        for (const part of BODYPARTS_ALL) {
            if (part in parts) body.push(..._.times(parts[part], n => part));
        }
        parts = body;
    }
    return parts;
};
mod.formatBody = function(fixedBody, multiBody) {
    fixedBody = Creep.formatParts(fixedBody);
    multiBody = Creep.formatParts(multiBody);
    return {fixedBody, multiBody};
};
// params: {minThreat, maxWeight, maxMulti}
mod.compileBody = function (room, params, sort = true) {
    const {fixedBody, multiBody} = Creep.formatBody(params.fixedBody || [], params.multiBody || []);
    _.assign(params, {fixedBody, multiBody});
    if (params.sort !== undefined) sort = params.sort;
    let parts = [];
    let multi = Creep.multi(room, params);
    for (let iMulti = 0; iMulti < multi; iMulti++) {
        parts = parts.concat(params.multiBody);
    }
    for (let iPart = 0; iPart < params.fixedBody.length; iPart++) {
        parts[parts.length] = params.fixedBody[iPart];
    }
    if( sort ) {
        const compareFunction = typeof sort === 'function' ? sort : Creep.partsComparator;
        parts.sort(compareFunction);
    }
    if( parts.includes(HEAL) ) {
        let index = parts.indexOf(HEAL);
        parts.splice(index, 1);
        parts.push(HEAL);
    }
    return parts;
};
mod.partThreat = {
    'move': { common: 0, boosted: 0 },
    'work': { common: 1, boosted: 3 },
    'carry': { common: 0, boosted: 0 },
    'attack': { common: 2, boosted: 5 },
    'ranged_attack': { common: 2, boosted: 5 },
    'heal': { common: 4, boosted: 10 },
    'claim': { common: 1, boosted: 3 },
    'tough': { common: 1, boosted: 3 },
    tower: 25
};
mod.bodyThreat = function(body) {
    let threat = 0;
    let evaluatePart = part => {
        threat += Creep.partThreat[part.type ? part.type : part][part.boost ? 'boosted' : 'common'];
    };
    if( body ) body.forEach(evaluatePart);
    return threat;
};
mod.register = function() {
    for (const action in Creep.action) {
        if (Creep.action[action].register) Creep.action[action].register(this);
    }
    for (const behaviour in Creep.behaviour) {
        if (Creep.behaviour[behaviour].register) Creep.behaviour[behaviour].register(this);
    }
    for (const setup in Creep.setup) {
        if (Creep.setup[setup].register) Creep.setup[setup].register(this);
    }
};
