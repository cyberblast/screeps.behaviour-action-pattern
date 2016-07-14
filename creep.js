var mod = {
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