var mod = {
    ability: function(){
        this.name = null;
        
        this.getTargetId = function(target){ 
            return target.id || target.name;
        };

        this.getTargetById = function(id){
            return Game.getObjectById(id) || Game.spawns[id];
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
        this.maxPerTarget = 1,
        this.isAddableTarget = function(target){ // target is valid to be given to an additional creep
            return (!target.creeps || target.creeps.length < this.maxPerTarget);
        };

        this.step = function(creep){     
            if(CHATTY) creep.say(this.name);
            var moveResult = creep.moveTo(creep.target);
            var workResult = this.work(creep);
            if(workResult == OK || moveResult == OK)
                return;
            
            if( moveResult == ERR_NO_PATH && Game.flags['IdlePole']){// get out of the way
                creep.moveTo(Game.flags['IdlePole']);
                return;
            } 
            if( !( [ERR_TIRED, ERR_NO_PATH].indexOf(moveResult) > -1 ) ) {
                if( DEBUG ) logError(creep, moveResult);
                creep.memory.action = null;
                creep.memory.target = null;
            }
        };
        
        this.work = function(creep){
            return ERR_INVALID_ARGS;
        };
    },
  setAction: function(creep, actionName) {
      if( creep.memory.action != actionName ){
          if( creep.memory.action )
              creep.room.activities[creep.memory.action]--;
          creep.memory.action = actionName;
          creep.memory.target = null;
      }
      creep.action = MODULES.creep.action[actionName];
  },   
    validateMemoryAction: function(creep){
        creep.action = MODULES.creep.action[creep.memory.action];

        if( creep.action && creep.action.isValidAction(creep) ){
            // take target from memory
            if( creep.memory.target != null ) {
                creep.target = creep.action.getTargetById(creep.memory.target);
            }
            
            // validate target or new
            if( !creep.action.isValidTarget(creep.target) ){ 
                // invalid. try to find a new one...
                creep.target = creep.action.newTarget(creep);
            }
            
            if( creep.target ){
                // target ok. memorize
                creep.memory.target = creep.action.getTargetId(creep.target);
                return true;
            }
        } 
        return false;
    },
  assignActionWithTarget: function(creep, action){
      creep.action = action;
      creep.target = action.newTarget(creep);
      
      if( creep.target ) {
          if( creep.memory.action )
              creep.room.activities[creep.memory.action]--;
          creep.memory.action = action.name;
          creep.memory.target = action.getTargetId(creep.target);
          
          if(!creep.room.activities[action])
              creep.room.activities[action] = 1;
          else creep.room.activities[action]++;
          
            if( !creep.target.creeps ) 
                creep.target.creeps = [];
            if( !creep.target.creeps.includes(creep.name) ) 
                creep.target.creeps.push(creep.name);
          return true;
      }
      
      creep.action = null;
      creep.target = null;
      return false;
  },
  loop: function () {
    for(var creepName in Memory.creeps){
        var creep = Game.creeps[creepName];
        if ( !creep ) {
            console.log(Memory.creeps[creepName].mother + ' > Good night ' + creepName + '!');
            delete Memory.creeps[creepName];
        } 
        else if( !creep.spawning ) { 
            if( creep.room.situation.noEnergy && creep.memory.setup == 'worker')
                MODULES.creep.behaviour.worker.noEnergy.run(creep);
            else
                MODULES.creep.behaviour[creep.memory.setup].run(creep);
        }
    }
  }
}

module.exports = mod;