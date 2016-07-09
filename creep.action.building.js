var mod = {
    
    name: 'building',

    getTargetId: function(target){ 
        return target.id;
    },

    getTargetById: function(id){
        return Game.getObjectById(id);
    },

    isValidTarget: function(target){
        return target && target.progress && target.id in target.room.constructionSites && (!target.creeps || target.creeps.length < 3);
    }, 

    newTarget: function(creep){
        var room = creep.room;
        var site = null;
        room.constructionSites.order.every(id => {
            if( room.constructionSites[id].creeps.length < 3 ){
                site = room.constructionSites[id];
                return false;
            }
            return true;
        });
        return site;
    }, 

    step: function(creep){       
        if(creep.build(creep.target) == ERR_NOT_IN_RANGE) {
            creep.moveTo(creep.target);
            return "moveTo";
        } return "build";
    }, 

    error: {
        noTarget: function(creep){
            if(DEBUG) console.log( creep.name + ' > "There is nothing to build."');
        }
    }
}

module.exports = mod;