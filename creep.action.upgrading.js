var mod = {

    getTargetId: function(target){ 
        return target.id;
    },

    getTargetById: function(id){
        return Game.getObjectById(creep.memory.target);
    },

    isValidTarget: function(target){
        return target && target.progress;
    }, 

    newTarget: function(creep, state){
        return creep.room.controller
    }, 

    step: function(creep, target){       
        if(creep.upgradeController(target) == ERR_NOT_IN_RANGE) {
            creep.moveTo(target);
        }
    }, 

    error: {
        noTarget: function(creep, state){
            if(state.debug) console.log( creep.name + ' > "There\'s nothing to build."');
        }
    }
}

var mod = {
    run: function(creep, state){
        creep.memory.action = 'upgrading';
        // var ramparts = creep.room.find();
        // Todo: first upgrade ramparts to same level of controller
        if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
            creep.moveTo(creep.room.controller);
        }
        return true;
    }
}

module.exports = mod;