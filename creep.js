var mod = {
    extend: function(){     
        Creep.Action = require('creep.Action'),
        Creep.Behaviour = require('creep.Behaviour'),
        Creep.Setup = require('creep.Setup'),
        Creep.action = {
            building: require('creep.action.building'), 
            claiming: require('creep.action.claiming'), 
            defending: require('creep.action.defending'),
            feeding: require('creep.action.feeding'), 
            fueling: require('creep.action.fueling'), 
            guarding: require('creep.action.guarding'), 
            harvesting: require('creep.action.harvesting'),
            healing: require('creep.action.healing'),
            idle: require('creep.action.idle'),
            invading: require('creep.action.invading'),
            picking: require('creep.action.picking'), 
            repairing: require('creep.action.repairing'), 
            settling: require('creep.action.settling'), 
            storing: require('creep.action.storing'), 
            upgrading: require('creep.action.upgrading'), 
            withdrawing: require('creep.action.withdrawing')
        };
        Creep.behaviour = {
            claimer: require('creep.behaviour.claimer'),
            healer: require('creep.behaviour.healer'),
            melee: require('creep.behaviour.melee'),
            pioneer: require('creep.behaviour.pioneer'),
            privateer: require('creep.behaviour.privateer'),
            ranger: require('creep.behaviour.ranger'),
            worker: require('creep.behaviour.worker')
        };
        Creep.setup = {
            claimer: require('creep.setup.claimer'),
            healer: require('creep.setup.healer'), 
            melee: require('creep.setup.melee'),
            pioneer: require('creep.setup.pioneer'),
            privateer: require('creep.setup.privateer'),
            ranger: require('creep.setup.ranger'),
            worker: require('creep.setup.worker')
        };
        Creep.loop = function(){
            var run = creep => creep.run();
            _.forEach(Game.creeps, run);
        };
        Creep.prototype.run = function(behaviour){
            if( !this.spawning ){
                if(!behaviour && this.memory.setup) {
                    behaviour = Creep.behaviour[this.memory.setup];
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
            if( !this.memory.setup || !target) return;   
            if( !target.creeps ) return;
            if( !target.creeps[this.memory.setup] ) return;
            if( !target.creeps[this.memory.setup].includes(this.name) ) return;

            target.creeps[this.memory.setup].splice(target.creeps[this.memory.setup].indexOf(this.name), 1);
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
            if( !this.memory.setup ) return;   
            if( !target.creeps ) {
                target.creeps = {};
            }
            if( !target.creeps[this.memory.setup] ){
                target.creeps[this.memory.setup] = [];
            }
            if( !target.creeps[this.memory.setup].includes(this.name) ) {
                target.creeps[this.memory.setup].push(this.name);            
                if( !target.creeps.sum )
                    target.creeps.sum = 1;
                else target.creeps.sum++;
            }
        };
        Creep.prototype.validateMemoryAction = function(){
            this.action = Creep.action[this.memory.action];

            if( this.action && this.action.isValidAction(this) ){
                // validate target or new
                if( !this.action.isValidTarget(this.target) || 
                (this.action.maxTargetLease && (Game.time-this.memory.targetAssignmentTime) > this.action.maxTargetLease )){ 
                    // invalid. try to find a new one...
                    this.unregisterTarget();
                    var target = this.action.newTarget(this);
                    if( target ) {
                        this.registerTarget(target);
                        return true;
                    }
                } else return true;
            } 
            return false;
        };
        Creep.prototype.registerAction = function(action){
            if( this.memory.action )
                this.room.activities[this.memory.action]--;
            this.memory.action = action.name;
            
            if(!this.room.activities[action])
                this.room.activities[action] = 1;
            else this.room.activities[action]++;
        };
        Creep.prototype.unregisterAction = function(){
            this.unregisterTarget();
            if( this.memory.action && this.room.activities[this.memory.action] )
                this.room.activities[this.memory.action]--;
            this.memory.action = null;
            this.action = null;
        };
        Creep.prototype.assignAction = function(action, target){
            this.unregisterAction();
            
            this.action = action;
            if( target === undefined ) target = action.newTarget(this);
            
            if( target != undefined ) {
                this.registerAction(action);
                this.registerTarget(target);
                return true;
            } 

            return false;
        };
    }
}

module.exports = mod;