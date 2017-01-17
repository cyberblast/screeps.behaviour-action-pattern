var mod = {
    extend: function(){
        Creep.loop = function(){
            var run = creep => creep.run();
            _.forEach(Game.creeps, run);
        };

        Creep.prototype.findGroupMemberByType = function(creepType, flagName) {
            let creep;

            if(creepType && flagName) {
                for(let i in Memory.population) {
                    creep = Memory.population[i];

                    if(creep.creepType === creepType && creep.flagName === flagName) {
                        return i;
                    }
                }
            } else {
                logError("Invalid arguments for Creep.findGroupMemberByType");
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
        
        Creep.bodyCosts = function(body){
            let costs = 0;
            if( body ){
                body.forEach(function(part){
                    costs += BODYPART_COST[part];
                });
            }
            return costs;
        };
        Creep.multi = function (room, fixedBody, multiBody) {
            let fixedCosts = Creep.bodyCosts(fixedBody);
            let multiCosts = Creep.bodyCosts(multiBody);
            if(multiCosts === 0) return 0; // prevent divide-by-zero
            let maxParts = Math.floor((50 - fixedBody.length) / multiBody.length);
            let maxAffordable = Math.floor((room.energyCapacityAvailable - fixedCosts) / multiCosts);
            return _.min([maxParts, maxAffordable]);
        };
        Creep.partsComparator = function (a, b) {
            let partsOrder = [TOUGH, CLAIM, WORK, CARRY, ATTACK, RANGED_ATTACK, HEAL, MOVE];
            let indexOfA = partsOrder.indexOf(a);
            let indexOfB = partsOrder.indexOf(b);
            return indexOfA - indexOfB;
        };
        Creep.compileBody = function (room, fixedBody, multiBody, sort = false) {
            var parts = [];
            let multi = Creep.multi(room, fixedBody, multiBody);
            for (let iMulti = 0; iMulti < multi; iMulti++) {
                parts = parts.concat(multiBody);
            }
            for (let iPart = 0; iPart < fixedBody.length; iPart++) {
                parts[parts.length] = fixedBody[iPart];
            }
            if( sort ) parts.sort(Creep.partsComparator);            
            if( parts.includes(HEAL) ) {
                let index = parts.indexOf(HEAL);
                parts.splice(index, 1);
                parts.push(HEAL);
            }
            return parts;
        };

        Creep.partThreat = {
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
        Creep.bodyThreat = function(body) {
            let threat = 0;
            let evaluatePart = part => {
                threat += Creep.partThreat[part.type ? part.type : part][part.boost ? 'boosted' : 'common'];
            };
            body.forEach(evaluatePart);
            return threat;
        };

        Creep.register = function() {
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

        // Check if a creep has body parts of a certain type anf if it is still active. 
        // Accepts a single part type (like RANGED_ATTACK) or an array of part types. 
        // Returns true, if there is at least any one part with a matching type present and active.
        Creep.prototype.hasActiveBodyparts = function(partTypes){
            if(Array.isArray(partTypes))
                return (this.body.some((part) => ( partTypes.includes(part.type) && part.hits > 0 )));
            else return (this.body.some((part) => ( part.type == partTypes && part.hits > 0 )));
        } 
        Creep.prototype.run = function(behaviour){
            if( !this.spawning ){
                if(!behaviour && this.data && this.data.creepType) {
                    behaviour = Creep.behaviour[this.data.creepType];
                }                
                this.repairNearby();
                if( behaviour ) behaviour.run(this);
                else if(!this.data){
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
                        console.log( dye(CRAYON.error, 'Corrupt creep without population entry!! : ' + this.name ));
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
                    }
                }
                if( this.flee ) {
                    this.fleeMove();
                    if( SAY_ASSIGNMENT ) this.say(String.fromCharCode(10133), SAY_PUBLIC);
                }
            }
        };
        Creep.prototype.leaveBorder = function() {
            // if on border move away
            // for emergency case, Path not found
            if( this.pos.y == 0 ){
                this.move(BOTTOM);
            } else if( this.pos.x == 0  ){
                this.move(RIGHT);
            } else if( this.pos.y == 49  ){
                this.move(TOP);
            } else if( this.pos.x == 49  ){
                this.move(LEFT);
            }
            // TODO: CORNER cases
        };
        Creep.prototype.honk = function(){
            if( HONK ) this.say('\u{26D4}\u{FE0E}', SAY_PUBLIC);
        },
        Creep.prototype.honkEvade = function(){
            if( HONK ) this.say('\u{1F500}\u{FE0E}', SAY_PUBLIC);
        },
        // intentionRange: how near should the creep approach?
        // enoughRange: range at wich the creep may calm down and interact with the target (may be higher than intentionRange)
        // range: current distance (optional)
        Creep.prototype.drive = function( targetPos, intentionRange, enoughRange, range ) {
            if( !targetPos || this.fatigue > 0 || range <= intentionRange ) return;
            if( !range ) range = this.pos.getRangeTo(targetPos);
            let lastPos = this.data.lastPos;
            this.data.lastPos = new RoomPosition(this.pos.x, this.pos.y, this.pos.roomName);
            if( this.data.moveMode == null ||
                (lastPos && // moved
                (lastPos.x != this.pos.x || lastPos.y != this.pos.y || lastPos.roomName != this.pos.roomName))
            ) {
                // at this point its sure, that the this DID move in the last loop.
                // from lastPos to this.pos
                this.room.recordMove(this);

                if( this.data.moveMode == null)
                    this.data.moveMode = 'auto';
                if( this.data.path && this.data.path.length > 1 )
                    this.data.path = this.data.path.substr(1);
                else
                    this.data.path = this.getPath( targetPos, true);

                if( this.data.path && this.data.path.length > 0 ) {
                    let moveResult = this.move(this.data.path.charAt(0));
                    if( moveResult == OK ) { // OK is no guarantee that it will move to the next pos.
                        this.data.moveMode = 'auto';
                    } else logErrorCode(this, moveResult);
                    if( moveResult == ERR_NOT_FOUND ) delete this.data.path;
                } else if( range > enoughRange ) {
                    this.say('NO PATH!');
                    this.data.targetId = null;
                    this.leaveBorder();
                }
            } else if( this.data.moveMode == 'auto' ) {
                // try again to use path.
                if( range > enoughRange ) {
                    this.honk();
                    this.data.moveMode = 'evade';
                }
                if( !this.data.path || this.data.path.length == 0 )
                    this.data.path = this.getPath( targetPos, true);

                if( this.data.path && this.data.path.length > 0 ) {
                    let moveResult = this.move(this.data.path.charAt(0));
                    if( moveResult != OK ) logErrorCode(this, moveResult);
                    if( moveResult == ERR_NOT_FOUND ) delete this.data.path;
                } else if( range > enoughRange ) {
                    this.say('NO PATH!');
                    this.data.targetId = null;
                    this.leaveBorder();
                }
            } else { // evade
                // get path (don't ignore thiss)
                // try to move.
                if( range > enoughRange ){
                    this.honkEvade();
                    delete this.data.path;
                    this.data.path = this.getPath( targetPos, false);
                }
                if( this.data.path && this.data.path.length > 0 ) {
                    if( this.data.path.length > 5 )
                        this.data.path = this.data.path.substr(0,4);
                    let moveResult = this.move(this.data.path.charAt(0));
                    if( moveResult != OK ) logErrorCode(this, moveResult);
                } else if( range > enoughRange ){
                    this.say('NO PATH!');
                    this.data.targetId = null;
                    this.leaveBorder();
                }
            }
        };
        Creep.prototype.getPath = function( targetPos, ignoreCreeps ) {
            let tempTarget = targetPos;
            if (ROUTE_PRECALCULATION && this.pos.roomName != targetPos.roomName) {
                var route = this.room.findRoute(targetPos.roomName);
                if ( route.length > 0 )
                    targetPos = new RoomPosition(25,25,route[0].room);
            }

            let path = this.room.findPath(this.pos, targetPos, {
                serialize: true,
                ignoreCreeps: ignoreCreeps
            });
            if( path && path.length > 4 )
                return path.substr(4);
            else return null;
        };
        Creep.prototype.fleeMove = function() {
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
                            return room.currentCostMatrix;
                        }
                    }
                );
                path = ret.path

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
            let here = this.room.lookForAt(LOOK_STRUCTURES, this.pos);
            if( here && here.length > 0 ) {
                let path;
                if( !this.data.idlePath || this.data.idlePath.length < 2 || this.data.idlePath[0].x != this.pos.x || this.data.idlePath[0].y != this.pos.y || this.data.idlePath[0].roomName != this.pos.roomName ) {
                    let goals = _.map(this.room.structures.all, function(o) {
                        return { pos: o.pos, range: 1 };
                    });

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
                                return room.currentCostMatrix;
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
        Creep.prototype.repairNearby = function( ) {
            // if it has energy and a work part
            if(this.carry.energy > 0 && this.hasActiveBodyparts(WORK)) {
                let nearby = this.pos.findInRange(this.room.structures.repairable, 3);
                if( nearby && nearby.length > 0 ){
                    this.repair(nearby[0]);
                }
            }
        };
        
        Creep.prototype.controllerSign = function() {
            if(CONTROLLER_SIGN && (!this.target.sign || this.target.sign.username != this.owner.username)) {
                this.signController(this.target, CONTROLLER_SIGN_MESSAGE);
            }
        };

        Object.defineProperties(Creep.prototype, {
            'flee': {
                configurable: true,
                get: function() {
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
                if (DEBUG) logErrorCode(this, errorData.errorCode);
                delete this.data.actionName;
                delete this.data.targetId;
                Creep.resolvingError = null;
            }
        };
    }
}

module.exports = _.bindAll(mod);
