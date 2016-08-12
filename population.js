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
                if( !target.creeps[setup].includes(creep.name) ) { 
                    target.creeps[setup].push(creep.name);
                    if( !target.creeps.sum )
                        target.creeps.sum = 1;
                    else target.creeps.sum++;
                }
                // TODO: also register weight
                
                creep.target = target;
            }
        }
    },
    registerCreepFlag: function(creep, setup){
        if( creep.memory.flag ){
            var flag = Game.flags[creep.memory.flag];
            if( !flag ) 
                delete creep.memory.flag;
            else {
                if( flag.creeps === undefined ) flag.creeps = {};
                if( flag.creeps[setup] === undefined){
                    flag.creeps[setup] = [];
                }
                if( !flag.creeps[setup].includes(creep.name) ) { 
                    flag.creeps[setup].push(creep.name);
                    if( !flag.creeps.sum )
                        flag.creeps.sum = 1;
                    else flag.creeps.sum++;
                }
                // TODO: also register weight
                
                creep.flag = flag;
            }
        }
    },
    loop: function(){    
        if( Game.population === undefined ){
            Game.population = {};
        }

        var spawnsToProbe = [];
        for(var creepName in Memory.creeps){
            var creep = Game.creeps[creepName];

            // Clean memory
            if ( !creep ) {
                if(DEBUG) console.log(DYE(CRAYON.system, Memory.creeps[creepName].mother + ' &gt; ') + DYE(CRAYON.death, 'Good night ' + creepName + '!') );
                delete Memory.creeps[creepName];
            } 
            else {
                // count spawning time
                if( creep.spawning ) {
                    creep.breeding++;
                }
                else if( creep.ticksToLive == 1499 ){ // spawning complete
                    spawnsToProbe.push(creep.mother);
                }

                var room = creep.room;
                var spawning = creep.breeding;
                var cost = creep.cost;
                var setup = creep.type;
                var action = creep.memory.action || 'idle';
                var targetId = creep.memory.target;
                var creepName = creep.name;

                this.registerCreepFlag(creep, setup);
                // register creep
                if( creep.ticksToLive === undefined || creep.ticksToLive > spawning ) {
                    this.registerCreepSetup(room, setup, cost);
                } else if(creep.ticksToLive == spawning) { // will die in ticks equal to spawning time
                    if(DEBUG) console.log(DYE(CRAYON.system, creepName + ' &gt; ') + DYE(CRAYON.death, 'Good night!') );
                    if( Game.time % SPAWN_INTERVAL != 0 && !spawnsToProbe.includes(creep.mother)) { // no regular spawnprobe
                        spawnsToProbe.push(creep.mother);
                    }
                }
                this.registerCreepActivity(room, creep, setup, action, targetId);
            }
        }    
        var probe = spawnName => Game.spawns[spawnName].loop();
        _.forEach(spawnsToProbe, probe);        
    }
}

module.exports = mod;
