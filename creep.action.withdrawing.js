var action = _.cloneDeep(require('creep.action'));

action.name = 'withdrawing';

action.isValidAction = function(creep){
    return ( creep.carry.energy < creep.carryCapacity && 
    (creep.room.energyAvailable < creep.room.energyCapacityAvailable || 
    creep.room.towerFreeCapacity > 500 ));
};
action.isValidTarget = function(target){
    return ( (target != null) && (target.store != null) && (target.store.energy > 0) );
};  
action.maxPerTarget = 2;
action.newTarget = function(creep){
    return creep.room.storage;
};
action.work = function(creep){
    return creep.withdraw(creep.target, RESOURCE_ENERGY);
};

module.exports = action;

var mod = {

    newTarget: function(creep){ 
        return creep.room.storage;
    }, 

    step: function(creep){   
        var moveResult = creep.moveTo(creep.target);
        var workResult = creep.withdraw(creep.target, RESOURCE_ENERGY);
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
    }
}


module.exports = mod;