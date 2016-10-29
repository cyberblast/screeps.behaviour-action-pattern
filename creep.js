var mod = {
    extend: function(){     
        Creep.Action = require('./creep.Action'),
        Creep.Setup = require('./creep.Setup'),
        Creep.action = {
            building: require('./creep.action.building'), 
            charging: require('./creep.action.charging'),
            claiming: require('./creep.action.claiming'),
            reserving: require('./creep.action.reserving'),
            defending: require('./creep.action.defending'),
            dismantling: require('./creep.action.dismantling'),
            feeding: require('./creep.action.feeding'), 
            fortifying: require('./creep.action.fortifying'), 
            fueling: require('./creep.action.fueling'), 
            guarding: require('./creep.action.guarding'), 
            harvesting: require('./creep.action.harvesting'),
            healing: require('./creep.action.healing'),
            idle: require('./creep.action.idle'),
            invading: require('./creep.action.invading'),
            picking: require('./creep.action.picking'), 
            repairing: require('./creep.action.repairing'), 
            travelling: require('./creep.action.travelling'), 
            storing: require('./creep.action.storing'), 
            uncharging: require('./creep.action.uncharging'),
            upgrading: require('./creep.action.upgrading'), 
            withdrawing: require('./creep.action.withdrawing'),
            robbing:require('./creep.action.robbing'),
            reallocating:require('./creep.action.reallocating')
        };
        Creep.behaviour = {
            claimer: require('./creep.behaviour.claimer'),
            hauler: require('./creep.behaviour.hauler'),
            healer: require('./creep.behaviour.healer'),
            melee: require('./creep.behaviour.melee'),
            miner: require('./creep.behaviour.miner'),
            mineralMiner: require('./creep.behaviour.mineralMiner'),
            pioneer: require('./creep.behaviour.pioneer'),
            privateer: require('./creep.behaviour.privateer'),
            ranger: require('./creep.behaviour.ranger'),
            upgrader: require('./creep.behaviour.upgrader'),
            warrior: require('./creep.behaviour.warrior'),
            worker: require('./creep.behaviour.worker')
        };
        Creep.setup = {
            claimer: require('./creep.setup.claimer'),
            hauler: require('./creep.setup.hauler'),
            healer: require('./creep.setup.healer'), 
            melee: require('./creep.setup.melee'),
            miner: require('./creep.setup.miner'),
            mineralMiner: require('./creep.setup.mineralMiner'),
            pioneer: require('./creep.setup.pioneer'),
            privateer: require('./creep.setup.privateer'),
            ranger: require('./creep.setup.ranger'),
            upgrader: require('./creep.setup.upgrader'),
            warrior: require('./creep.setup.warrior'),
            worker: require('./creep.setup.worker')
        };
        Creep.loop = function(){
            var run = creep => creep.run();
            _.forEach(Game.creeps, run);
        };

        Creep.partThreat = {
            'move': { common: 0, boosted: 0 },
            'work': { common: 1, boosted: 3 },
            'carry': { common: 0, boosted: 0 },
            'attack': { common: 2, boosted: 5 },
            'ranged_attack': { common: 2, boosted: 5 },
            'heal': { common: 2, boosted: 5 },
            'claim': { common: 1, boosted: 3 },
            'tough': { common: 1, boosted: 3 }
        }
        Creep.bodyThreat = function(body) {
            let threat = 0;
            let evaluatePart = part => {
                threat += Creep.partThreat[part.type ? part.type : part][part.boost ? 'boosted' : 'common'];
            };
            body.forEach(evaluatePart);
            return threat;
        }

        Creep.prototype.hasActiveOffensivePart = function(){
            return (this.body.find((part) => ( [ATTACK, RANGED_ATTACK].includes(part.type) && part.hits > 0 )) != null);
        }
        Creep.prototype.hasActiveAttackPart = function(){
            return (this.body.find((part) => ( ATTACK == part.type && part.hits > 0 )) != null);
        }
        Creep.prototype.hasActiveRangedAttackPart = function(){
            return (this.body.find((part) => ( RANGED_ATTACK == part.type && part.hits > 0 )) != null);
        }

        Creep.prototype.run = function(behaviour){
            if( !this.spawning ){
                if(!behaviour && this.data && this.data.creepType) {
                    behaviour = Creep.behaviour[this.data.creepType];
                }
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
                            let weight = (counts[WORK]*PART_COSTS[WORK]) + (counts[CARRY]*PART_COSTS[CARRY]) + (counts[MOVE]*PART_COSTS[MOVE]); 
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
            //if( HONK ) this.say(String.fromCharCode(9940), SAY_PUBLIC);//8655
            if( HONK ) this.say('\u{26D4}\u{FE0E}', SAY_PUBLIC);//8655
            
        },
        Creep.prototype.honkEvade = function(){
            if( HONK ) this.say(String.fromCharCode(9936), SAY_PUBLIC);
        },
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
        Creep.prototype.fleeMove = function( ) {
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
                            let costs = room.costMatrix;
                            // Avoid creeps in the room
                            room.find(FIND_CREEPS).forEach(function(creep) {
                                costs.set(creep.pos.x, creep.pos.y, 0xff);
                            });
                            return costs;
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
        
        Object.defineProperty(Creep.prototype, 'flee', {
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
        });
    
    }
}

module.exports = mod;