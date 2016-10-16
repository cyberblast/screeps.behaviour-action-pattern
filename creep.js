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
            robbing:require('./creep.action.robbing')
        };
        Creep.behaviour = {
            claimer: require('./creep.behaviour.claimer'),
            hauler: require('./creep.behaviour.hauler'),
            healer: require('./creep.behaviour.healer'),
            melee: require('./creep.behaviour.melee'),
            miner: require('./creep.behaviour.miner'),
            pioneer: require('./creep.behaviour.pioneer'),
            privateer: require('./creep.behaviour.privateer'),
            ranger: require('./creep.behaviour.ranger'),
            upgrader: require('./creep.behaviour.upgrader'),
            worker: require('./creep.behaviour.worker')
        };
        Creep.setup = {
            claimer: require('./creep.setup.claimer'),
            hauler: require('./creep.setup.hauler'),
            healer: require('./creep.setup.healer'), 
            melee: require('./creep.setup.melee'),
            miner: require('./creep.setup.miner'),
            pioneer: require('./creep.setup.pioneer'),
            privateer: require('./creep.setup.privateer'),
            ranger: require('./creep.setup.ranger'),
            upgrader: require('./creep.setup.upgrader'),
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
                        if( this.body.includes(WORK) && this.body.includes(CARRY))
                        {
                            let counts = _.countBy(this.body, 'type');
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
            if( HONK ) this.say(String.fromCharCode(9940), SAY_PUBLIC);//8655
        },
        Creep.prototype.honkEvade = function(){
            if( HONK ) this.say(String.fromCharCode(9936), SAY_PUBLIC);
        },
        Creep.prototype.drive = function( targetPos, intentionRange, enoughRange, range ) {
            // temporary cleanup
            if( this.data.route ) delete this.data.route;
            if( Memory.pathfinder ) delete Memory.pathfinder;
            
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
            if (ROUTE_PRECALCULATION && this.pos.roomName != targetPos.roomName) {
                var route = Game.map.findRoute(this.room, targetPos.roomName, {
                    routeCallback(roomName) {
                        let parsed = /^[WE]([0-9]+)[NS]([0-9]+)$/.exec(roomName);
                        let isHighway = (parsed[1] % 10 === 0) || (parsed[2] % 10 === 0);
                        let isMyOrNeutralRoom = Game.rooms[roomName] &&
                            Game.rooms[roomName].controller &&
                            (Game.rooms[roomName].controller.my || 
                            (Game.rooms[roomName].controller.owner === undefined));
                        let isExploitationRoom = FlagDir.find(FLAG_COLOR.invade.exploit, new RoomPosition(25, 28, roomName), true);
                        if (isMyOrNeutralRoom || isExploitationRoom) {
                            return 1;
                        } 
                        else if (isHighway)
                            return 3;
                        else {
                            if( Game.map.isRoomAvailable(roomName))
                                return 30;
                            return Infinity;
                        }
                    }
                });
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
    }
}

module.exports = mod;