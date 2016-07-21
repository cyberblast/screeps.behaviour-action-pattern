var mod = {
    registerCreepSetup: function(room, setup, cost) {
        if(room.population === undefined) room.population = {};
        if(room.population[setup] === undefined){
            room.population[setup] = {
                weight: cost, 
                count : 1
            };
        }
        else {
            room.population[setup].count++;
            room.population[setup].weight += cost;
        }
        if(Game.population[setup] === undefined){
            Game.population[setup] = {
                weight: cost, 
                count : 1
            };
        }
        else {
            Game.population[setup].count++;
            Game.population[setup].weight += cost;
        }
    },
    registerCreepActivity: function(room, creep, setup, action, targetId){
        if( room.activities === undefined ) room.activities = {};
        if(room.activities[action] === undefined )
            room.activities[action] = 1;
        else room.activities[action]++;
        
        if( targetId ){
            var target = Game.getObjectById(targetId) || Game.spawns[targetId] || Game.flags[targetId];
            if( target ){
                if( target.creeps === undefined ) target.creeps = {};
                if( target.creeps[setup] === undefined){
                    target.creeps[setup] = [];
                }
                if( !target.creeps[setup].includes(creep.name) ) 
                    target.creeps[setup].push(creep.name);
                // TODO: also register weight
                
                creep.target = target;
            }
        }
    },
    loop: function(){    
        if( Game.population === undefined ){
            Game.population = {};
        }

        for(var creepName in Memory.creeps){
            var creep = Game.creeps[creepName];

            // Clean memory
            if ( !creep ) {
                console.log(Memory.creeps[creepName].mother + ' > Good night ' + creepName + '!');
                delete Memory.creeps[creepName];
            } 
            else {
                // count spawning time
                if( creep.spawning ) {
                    if( creep.memory.spawning === undefined )
                        creep.memory.spawning = 1;
                    else creep.memory.spawning++;
                }

                var room = creep.room;
                var spawning = creep.memory.spawning;
                var cost = creep.memory.cost;
                var setup = creep.memory.setup || 'unknown';
                var action = creep.memory.action || 'idle';
                var targetId = creep.memory.target;
                var creepName = creep.name;

                // register creep
                if( creep.ticksToLive > spawning ) {
                    this.registerCreepSetup(room, setup, cost);
                }
                this.registerCreepActivity(room, creep, setup, action, targetId);
            }
        }            
    }
}

module.exports = mod;