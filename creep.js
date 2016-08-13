var mod = {
    extend: function(){     
        Creep.Action = require('./creep.Action'),
        Creep.Behaviour = require('./creep.Behaviour'),
        Creep.Setup = require('./creep.Setup'),
        Creep.action = {
            building: require('./creep.action.building'), 
            claiming: require('./creep.action.claiming'), 
            defending: require('./creep.action.defending'),
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
            upgrading: require('./creep.action.upgrading'), 
            withdrawing: require('./creep.action.withdrawing')
        };
        Creep.behaviour = {
            claimer: require('./creep.behaviour.claimer'),
            healer: require('./creep.behaviour.healer'),
            melee: require('./creep.behaviour.melee'),
            pioneer: require('./creep.behaviour.pioneer'),
            privateer: require('./creep.behaviour.privateer'),
            ranger: require('./creep.behaviour.ranger'),
            worker: require('./creep.behaviour.worker')
        };
        Creep.setup = {
            claimer: require('./creep.setup.claimer'),
            healer: require('./creep.setup.healer'), 
            melee: require('./creep.setup.melee'),
            pioneer: require('./creep.setup.pioneer'),
            privateer: require('./creep.setup.privateer'),
            ranger: require('./creep.setup.ranger'),
            worker: require('./creep.setup.worker')
        };
        Creep.loop = function(){
            var run = creep => creep.run();
            _.forEach(Game.creeps, run);
        };
        Creep.prototype.run = function(behaviour){
            if( !this.spawning ){
                if(!behaviour && this.type) {
                    behaviour = Creep.behaviour[this.type];
                }
                if( behaviour ) behaviour.run(this);
            }
        };
        Creep.prototype.unregisterTarget = function(){   
            var target = this.target;
            // unassign
            this.target = null;
            this.memory.target = null;
            this.memory.targetAssignmentTime = null;
            // unregister
            if( !this.type || !target) return;   
            if( !target.creeps ) return;
            if( !target.creeps[this.type] ) return;
            if( !target.creeps[this.type].includes(this.name) ) return;

            target.creeps[this.type].splice(target.creeps[this.type].indexOf(this.name), 1);
        };
        Creep.prototype.registerTarget = function(target){ 
            //if( !target ) console.log(JSON.stringify(this.memory));
            //precondition 
            if( target == null ) return;
            //unregister
            var targetId = target.id || target.name;
            //if( !targetId ) console.log(JSON.stringify(this.memory));
            if( this.target != target || this.memory.target != targetId)
                this.unregisterTarget();
            //assign
            this.target = target;
            this.memory.targetAssignmentTime = Game.time;
            this.memory.target = targetId;
            //register
            if( !this.type ) return;   
            if( !target.creeps ) {
                target.creeps = {};
            }
            if( !target.creeps[this.type] ){
                target.creeps[this.type] = [];
            }
            if( !target.creeps[this.type].includes(this.name) ) {
                target.creeps[this.type].push(this.name);            
                if( !target.creeps.sum )
                    target.creeps.sum = 1;
                else target.creeps.sum++;
            }
        };
        Creep.prototype.validateMemoryAction = function(){
            let action = this.action;
            if( action && action.isValidAction(this) ){
                // validate target or new
                if( !action.isValidTarget(this.target) || 
                (action.maxTargetLease && (Game.time-this.memory.targetAssignmentTime) > action.maxTargetLease )){ 
                    // invalid. try to find a new one...
                    this.unregisterTarget();
                    if( action.renewTarget ){
                        var target = action.newTarget(this);
                        if( target ) {
                            this.registerTarget(target);
                            return true;
                        }
                    }
                } else return true;
            } 
            return false;
        };
        Creep.prototype.assignAction = function(action, target){    
            this.action = action;
            if( target === undefined ) target = action.newTarget(this);
            
            if( target != undefined ) {
                this.registerTarget(target);
                return true;
            } 

            this.action = null;
            return false;
        };
        Object.defineProperty(Creep.prototype, 'type', {
            configurable: true,
            get: function() {
                return this.memory.setup || 'unknown';
            },
            set: function(value) {
                this.memory.setup = value;
            }
        });
        Object.defineProperty(Creep.prototype, 'home', {
            configurable: true,
            get: function() {
                return this.memory.home || 'unknown';
            },
            set: function(value) {
                this.memory.home = value;
            }
        });
        Object.defineProperty(Creep.prototype, 'mother', {
            configurable: true,
            get: function() {
                return this.memory.mother || 'unknown';
            },
            set: function(value) {
                this.memory.mother = value;
            }
        });
        Object.defineProperty(Creep.prototype, 'cost', {
            configurable: true,
            get: function() {
                return this.memory.cost || '0';
            },
            set: function(value) {
                this.memory.cost = value;
            }
        });
        Object.defineProperty(Creep.prototype, 'breeding', {
            configurable: true,
            get: function() {
                return this.memory.breeding || this.memory.spawning || '0';
            },
            set: function(value) {
                this.memory.breeding = value;
            }
        });
        Object.defineProperty(Creep.prototype, 'action', {
            configurable: true,
            get: function() {
                if( this.memory.action != null ) {
                    var action = Creep.action[this.memory.action];
                    if( action ) return action;
                }
                return null;
            },
            set: function(value) {
                let actionName = this.memory.action;
                this.unregisterTarget();
                if( actionName && this.room.activities[actionName] )
                    this.room.activities[actionName]--;

                if(_.isObject(value) && value.name){
                    this.memory.action = value.name;
                } else this.memory.action = value;

                actionName = this.memory.action;
                if( actionName ){
                    if(!this.room.activities[actionName])
                        this.room.activities[actionName] = 1;
                    else this.room.activities[actionName]++;
                }
            }
        });
    }
}

module.exports = mod;