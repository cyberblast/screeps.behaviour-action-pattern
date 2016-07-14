var mod = {

    name: 'idle',
    
    getTargetId: function(target){ 
        return target.id;
    },

    getTargetById: function(id){
        return Game.getObjectById(id);
    },

    isValidAction: function(creep){
        return true;
    },

    isValidTarget: function(target){
        return true;
    }, 

    newTarget: function(creep){
        return Game.flags['IdlePole']; // TODO: by color to define more than one (for each room)
    }, 

    isAddableAction: function(creep){
        return true;
    },

    isAddableTarget: function(target){ 
        return true;
    }, 

    step: function(creep){       
        //if(DEBUG) console.log(creep.name + ' is idle!');
        creep.memory.target = null;
        creep.memory.action = null;
        if(creep.target && creep.pos != creep.target.pos) {
            creep.moveTo(creep.target);
        } 
    }
}

module.exports = mod;