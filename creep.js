var mod = {
    Action: function(){
        this.name = null;
        this.reusePath = 5;
        this.ignoreCreeps = false;
        this.maxPerTarget = 1;
        this.maxPerTargetType = 'worker';
        this.maxTargetLease = null; // ticks until target refind
        
        this.defaultTarget = function(creep){
            var flags = _.sortBy(creep.room.find(FIND_FLAGS, {
                    filter: function(flag){ 
                        return flag.color == FLAG_COLOR.idle;
                    }
                }), 
                function(o) { 
                    return (o.creeps ? o.creeps.length : 0); 
                }
            );
            if( flags ) return flags[0];

            if( creep.memory.home && creep.room.name != creep.memory.home){
                // go to home room
                var exitDir = creep.room.findExitTo(creep.memory.home);
                var exit = creep.pos.findClosestByRange(exitDir);
                return exit;
            }

            return creep.room.controller;
        };
        this.defaultAction = function(creep){
            creep.moveTo(this.defaultTarget(creep), {reusePath: this.reusePath, ignoreCreeps: this.ignoreCreeps});
        };

        this.getTargetId = function(target){ 
            return target.id || target.name;
        };

        this.getTargetById = function(id){
            return Game.getObjectById(id) || Game.spawns[id] || Game.flags[id];
        };

        this.isValidAction = function(creep){
            return true;
        };

        this.isValidTarget = function(target){
            return (target != null);
        };

        this.newTarget = function(creep){
            return null;
        };
        this.isAddableAction = function(creep){
            return (!creep.room.activities[this.name] || creep.room.activities[this.name] < creep.room.maxPerJob);
        };
        this.isAddableTarget = function(target){ // target is valid to be given to an additional creep
            return (this.maxPerTarget > 0 && (!target.creeps || !target.creeps[this.maxPerTargetType] || target.creeps[this.maxPerTargetType].length < this.maxPerTarget));
        };

        this.step = function(creep){     
            if(CHATTY) creep.say(this.name, SAY_PUBLIC);
            var moveResult = creep.moveTo(creep.target, {reusePath: this.reusePath, ignoreCreeps: this.ignoreCreeps});
            var workResult = this.work(creep);
            if(workResult == OK || moveResult == OK)
                return;
            
            if( moveResult == ERR_NO_PATH ){// get out of the way
                this.defaultAction(creep);
                return;
            } 
            if( !( [ERR_TIRED, ERR_NO_PATH].indexOf(moveResult) > -1 ) ) {
                if( DEBUG ) ERROR_LOG(creep, moveResult);
                creep.memory.action = null;
                creep.memory.target = null;
            }
        };
        
        this.work = function(creep){
            return ERR_INVALID_ARGS;
        };
    },    
    Setup: function(){
        this.type = null;
        this.fixedBody = []; 
        this.multiBody = []; 
        this.minAbsEnergyAvailable = 0; 
        this.maxMulti = 6;
        this.minControllerLevel = 0;
        this.globalMeasurement = false;
        this.multiplicationPartwise = true;
        this.bodyCosts = function(body){
            var costs = 0;
            if( body ){
                body.forEach(function(part){
                    costs += PART_COSTS[part];
                });
            }
            return costs;
        };
        this.multi = function(spawn){ 
            var fixedCosts = this.bodyCosts(this.fixedBody);
            var multiCosts = this.bodyCosts(this.multiBody);
            return _.min([Math.floor( (spawn.room.energyAvailable-fixedCosts) / multiCosts), this.maxMulti]);
        }; 
        this.setParamParts = function(spawn){
            var parts = [];
            var multi = this.multi(spawn);
            if( this.multiplicationPartwise ) {
                for( var iPart = 0; iPart < this.multiBody.length; iPart ++ ){
                    for( var iMulti = 0; iMulti < multi; iMulti++){
                        parts[parts.length] = this.multiBody[iPart];
                    }
                }
                for( var iPart = 0; iPart < this.fixedBody.length; iPart ++ ){
                    parts[parts.length] = this.fixedBody[iPart];
                }
            } else {
                for (var iMulti = 0; iMulti < multi; iMulti++) {
                    parts = parts.concat(this.multiBody);
                }
                for( var iPart = 0; iPart < this.fixedBody.length; iPart ++ ){
                    parts[parts.length] = this.fixedBody[iPart];
                }
            }
            return parts;
        };
        this.buildParams = function(spawn){
            var memory = {
                setup: null,
                id: null, 
                parts: [], 
                cost: 0, 
                mother: null, 
                home: null, 
                spawning: 1
            };
            
            memory.setup = this.type;
            memory.parts = this.setParamParts(spawn);
            memory.cost = this.bodyCosts(memory.parts);  
            memory.mother = spawn.name; 
            memory.home = spawn.room.name;
            for( var son = 1; memory.id == null || Game.creeps[memory.id]; son++ ) {
                memory.id = this.type + '-' + memory.cost + '-' + son;
            }
            return memory;
        }; 
        this.minEnergyAvailable = function(spawn){ return 1; }; // 1 = full
        this.maxCount = function(spawn){ return 0; }; 
        this.maxWeight = function(spawn){ return 0; };
        this.isValidSetup = function(spawn){
            var room = spawn.room;
            var population = this.globalMeasurement ? Game.population[this.type] : room.population[this.type];
            var maxCount = this.maxCount(spawn);
            var maxWeight = this.maxWeight(spawn);
            
            /*
            if( this.type == "melee"){
                console.log("validating melee spawn");
                console.log("Energy Available: " + (room.energyAvailable >= this.minAbsEnergyAvailable && 
                room.energyAvailable >= (room.energyCapacityAvailable * this.minEnergyAvailable(spawn))));
                console.log("population: " + !(!population) );
                console.log("maxCount: " + maxCount + " population.count: " + population.count + " Count allowance: " + (( maxCount == null || population.count < maxCount) ));
                console.log("maxWeight: " + maxWeight + " population.weight: " + population.weight + " Weight allowance: " + (( maxWeight == null || population.weight < maxWeight)));
                console.log("Absolute allowance: " + ((room.energyAvailable >= this.minAbsEnergyAvailable && 
                room.energyAvailable >= (room.energyCapacityAvailable * this.minEnergyAvailable(spawn))  && (
                (!population || (
                ( maxCount == null || population.count < maxCount) && 
                ( maxWeight == null || population.weight < maxWeight)))))) );
            }*/

            if( maxCount == 0 || maxWeight == 0 || spawn.room.controller.level < this.minControllerLevel) return false;
            return (room.energyAvailable >= this.minAbsEnergyAvailable && 
                room.energyAvailable >= (room.energyCapacityAvailable * this.minEnergyAvailable(spawn))  && (
                (!population || (
                ( maxCount == null || population.count < maxCount) && 
                ( maxWeight == null || population.weight < maxWeight)))));
        };
    },
    Behaviour: function(){
        /*
        this.setAction = function(creep, actionName) {
            if( creep.memory.action != actionName ){
                if( creep.memory.action )
                    creep.room.activities[creep.memory.action]--;
                creep.memory.action = actionName;
            }
            creep.unregisterTarget(creep.Target);
            creep.memory.target = null;
            creep.action = MODULES.creep.action[actionName];
        }; */
        this.validateMemoryAction = function(creep){
            creep.action = MODULES.creep.action[creep.memory.action];

            if( creep.action && creep.action.isValidAction(creep) ){
                // validate target or new
                if( !creep.action.isValidTarget(creep.target) || 
                (creep.action.maxTargetLease && (Game.time-creep.memory.targetAssignmentTime) > creep.action.maxTargetLease )){ 
                    // invalid. try to find a new one...
                    creep.unregisterTarget();
                    var target = creep.action.newTarget(creep);
                    if( target ) {
                        creep.registerTarget(target);
                        return true;
                    }
                } else return true;
            } 
            return false;
        };
        this.registerAction = function(creep, action){
            if( creep.memory.action )
                creep.room.activities[creep.memory.action]--;
            creep.memory.action = action.name;
            
            if(!creep.room.activities[action])
                creep.room.activities[action] = 1;
            else creep.room.activities[action]++;
        };
        this.assignActionWithTarget = function(creep, action){
            creep.action = action;
            var target = action.newTarget(creep);
            
            if( target ) {
                this.registerAction(creep, action);
                creep.registerTarget(target);
                return true;
            } 

            creep.unregisterTarget();
            creep.action = null;
            return false;
        };
    },
    loop: function () {
        for(var creepName in Memory.creeps){
            var creep = Game.creeps[creepName];
            if ( !creep ) {
                console.log(Memory.creeps[creepName].mother + ' > Good night ' + creepName + '!');
                delete Memory.creeps[creepName];
            } 
            else {
                if( creep.spawning ) {
                    if( creep.memory.spawning === undefined )
                        creep.memory.spawning = 1;
                    else creep.memory.spawning++;
                }
                else creep.run();
            }
        }
    }
}

module.exports = mod;