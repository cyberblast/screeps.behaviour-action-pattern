var mod = {
    getCreep: function(creepName) {
        if(_.isUndefined(Memory.population)) {
            Memory.population = {};
        }
        return Memory.population[creepName];
    },
    setCreep: function(val) {
        if(_.isUndefined(Memory.population)) {
            Memory.population = {};
        }
        Memory.population[val.creepName] = val;
        return Memory.population[val.creepName];
    },
    registerCreep: function(creepName, creepType, creepCost, room, spawnName, body){
        var entry = this.setCreep({
            creepName: creepName, 
            creepType: creepType, 
            weight: creepCost, 
            roomName: room.name, 
            homeRoom: room.name, 
            motherSpawn: spawnName, 
            actionName: null, 
            targetId: null,
            spawningTime: 0, 
            flagName: null,
            body: _.countBy(body)
        });
        this.countCreep(room, entry);
    }, 
    unregisterCreep: function(creepName){
        delete Memory.population[creepName];
        delete Memory.creeps[creepName];
    }, 
    registerAction: function(creep, action, target, entry) {
        if( entry === undefined ) entry = this.getCreep(creep.name);
        entry.carryCapacityLeft = creep.carryCapacity - _.sum(creep.carry);
        let room = creep.room;
        if( room.population === undefined ) {
            room.population = {
                typeCount: {}, 
                typeWeight: {}, 
                actionCount: {},
                actionWeight: {}
            };
        }
        if( creep.action ){
            // unregister action
            if( room.population.actionCount[creep.action.name] === undefined )
                room.population.actionCount[creep.action.name] = 0;
            else room.population.actionCount[creep.action.name]--;
            if( room.population.actionWeight[creep.action.name] === undefined )
                room.population.actionWeight[creep.action.name] = 0;
            else room.population.actionWeight[creep.action.name] -= entry.weight;
            if( this.actionCount[creep.action.name] === undefined )
                this.actionCount[creep.action.name] = 0;
            else this.actionCount[creep.action.name]--;
            if( this.actionWeight[creep.action.name] === undefined )
                this.actionWeight[creep.action.name] = 0;
            else this.actionWeight[creep.action.name] -= entry.weight;
        }
        // register action
        entry.actionName = action.name;
        if( room.population.actionCount[action.name] === undefined )
            room.population.actionCount[action.name] = 1;
        else room.population.actionCount[action.name]++;
        if( room.population.actionWeight[action.name] === undefined )
            room.population.actionWeight[action.name] = entry.weight;
        else room.population.actionWeight[action.name] += entry.weight;
        if( this.actionCount[action.name] === undefined )
            this.actionCount[action.name] = 1;
        else this.actionCount[action.name]++;
        if( this.actionWeight[action.name] === undefined )
            this.actionWeight[action.name] = entry.weight;
        else this.actionWeight[action.name] += entry.weight;
        
        let targetId = target.id || target.name;
        if( entry.targetId ) {
            // unregister target
            let oldTarget = entry.targetId ? Game.getObjectById(entry.targetId) || Game.spawns[entry.targetId] || Game.flags[entry.targetId] : null;
            if( oldTarget && oldTarget.targetOf ){
                let byName = elem => elem.creepName === creep.name;
                let index = oldTarget.targetOf.findIndex(byName);
                if( index > -1 ) oldTarget.targetOf.splice(index, 1);
            }                
        }
        // register target
        entry.targetId = targetId;
        if( target ) {
            if( target.targetOf === undefined )
                target.targetOf = [entry];
            else target.targetOf.push(entry);
        }
        creep.action = action;
        creep.target = target;
    }, 
    registerCreepFlag: function(creep, flag) {
        if( flag && creep.data && creep.data.flagName && creep.data.flagName == flag.name && creep.flag.name == flag.name )
            return;
        if( creep.data && creep.data.flagName ){
            // unregister flag
            let oldFlag = Game.flags[creep.data.flagName];
            if( oldFlag && oldFlag.targetOf ){
                let byName = elem => elem.creepName === creep.name;
                let index = oldFlag.targetOf.findIndex(byName);
                if( index > -1 ) oldFlag.targetOf.splice(index, 1);
            }
        }
        if( !flag ) 
            delete creep.data.flagName;
        else {
            if( flag.targetOf === undefined ) flag.targetOf = [creep.data];
            else flag.targetOf.push(creep.data);
            creep.flag = flag;
            creep.data.flagName = flag.name;
        }
    },
    countCreep: function(room, entry){
        entry.roomName = room.name;
        if( room.population === undefined ) {
            room.population = {
                typeCount: {}, 
                typeWeight: {}, 
                actionCount: {},
                actionWeight: {}
            };
        }

        if( room.population.typeCount[entry.creepType] === undefined )
            room.population.typeCount[entry.creepType] = 1;
        else room.population.typeCount[entry.creepType]++;
        if( room.population.typeWeight[entry.creepType] === undefined )
            room.population.typeWeight[entry.creepType] = entry.weight;
        else room.population.typeWeight[entry.creepType] += entry.weight;
        if( this.typeCount[entry.creepType] === undefined )
            this.typeCount[entry.creepType] = 1;
        else this.typeCount[entry.creepType]++;
        if( this.typeWeight[entry.creepType] === undefined )
            this.typeWeight[entry.creepType] = entry.weight;
        else this.typeWeight[entry.creepType] += entry.weight;
    },
    loop: function(){
        if(_.isUndefined(Memory.population)) {
            Memory.population = {};
        }        
        this.typeCount = {};
        this.typeWeight = {};
        this.actionCount = {};
        this.actionWeight = {};
        let spawnsToProbe = [];
        let register = entry => {
            let creep = Game.creeps[entry.creepName];
            if ( !creep ) {
                if(DEBUG) console.log(dye(CRAYON.system, entry.homeRoom + ' &gt; ') + dye(CRAYON.death, 'Good night ' + entry.creepName + '!') );
                this.unregisterCreep(entry.creepName);
            } 
            else {                
                creep.data = entry;
                delete creep.action;
                delete creep.target;
                delete creep.flag;
                if( creep.spawning ) { // count spawning time
                    entry.spawningTime++;
                }
                else if( creep.ticksToLive == 1499 ){ // spawning complete
                    spawnsToProbe.push(entry.motherSpawn);
                }
                else if(creep.ticksToLive == entry.spawningTime) { // will die in ticks equal to spawning time
                    if(DEBUG) console.log(dye(CRAYON.system, entry.creepName + ' &gt; ') + dye(CRAYON.death, 'Good night!') );
                    if( Game.time % SPAWN_INTERVAL != 0 && !spawnsToProbe.includes(entry.motherSpawn) && entry.motherSpawn != 'unknown' ) { 
                        spawnsToProbe.push(entry.motherSpawn);
                    }
                }

                if( entry.creepType && 
                    ( creep.ticksToLive === undefined || 
                    creep.ticksToLive > entry.spawningTime )) {
                        this.countCreep(creep.room, entry);
                }
                
                if( entry.flagName ){
                    var flag = Game.flags[entry.flagName];
                    if( !flag ) 
                        delete entry.flagName;
                    else {
                        if( flag.targetOf === undefined ) flag.targetOf = [entry];
                        else flag.targetOf.push(entry);
                        creep.flag = flag;
                    }
                }

                let action = ( entry.actionName && Creep.action[entry.actionName] ) ? Creep.action[entry.actionName] : null;
                let target = action && entry.targetId ? Game.getObjectById(entry.targetId) || Game.spawns[entry.targetId] || Game.flags[entry.targetId] : null;
                if( action && target ) this.registerAction( creep, action, target, entry );
                else {
                    entry.actionName = null;
                    entry.targetId = null;
                    creep.action = null;
                    creep.target = null;
                }

                creep.data = entry;
            }
        };
        _.forEach(Memory.population, register);

        let validateAssignment = entry => {
            let creep = Game.creeps[entry.creepName];
            if( creep.action && creep.target) {
                let oldId = creep.target.id || creep.target.name; 
                let target = creep.action.validateActionTarget(creep, creep.target);
                if( !target ) {
                    entry.actionName = null;
                    entry.targetId = null;
                    creep.action = null;
                    creep.target = null;
                } else if( oldId != target.id || target.name ) {
                    this.registerAction( creep, creep.action, target, entry );
                }
            }
        }
        _.forEach(Memory.population, validateAssignment);
    }
}
module.exports = mod;