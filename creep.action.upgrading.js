var mod = {

    getTargetId: function(target){ 
        return target.id;
    },

    getTargetById: function(id){
        return Game.getObjectById(id);
    },

    isValidTarget: function(target){
        return target && target.progress;
    }, 

    newTarget: function(creep, state){
        return creep.room.controller;
    }, 

    step: function(creep, target){       
        if(creep.upgradeController(target) == ERR_NOT_IN_RANGE) {
            creep.moveTo(target);
            return "moveTo";
        } return "upgradeController";
    }, 

    error: {
        noTarget: function(creep, state){
            if(state.debug) console.log( creep.name + ' > "There is nothing to build."');
        }
    }
}

module.exports = mod;