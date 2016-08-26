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
                if(!behaviour && this.data && this.data.creepType) {
                    behaviour = Creep.behaviour[this.data.creepType];
                }
                if( behaviour ) behaviour.run(this);
                else if(!this.data){
                    console.log( DYE(CRAYON.error, 'Corrupt creep without population entry: ' + this.name ));
                }
            }
        };
    }
}

module.exports = mod;