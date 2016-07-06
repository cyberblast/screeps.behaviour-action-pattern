var mod = {
    run: function(creep, state){
        creep.memory.action = 'building';      
        var target = null;

        if( creep.memory.target != null && (creep.memory.targetType == 'constructionSite' || creep.memory.targetType == 'repairableSite')) 
            target = Game.getObjectById(creep.memory.source);

        if( !target ) { 
            var targetId = this.getConstructionId(creep, state);
            if( targetId != null ){
                target = Game.getObjectById(targetId);
                creep.memory.target = targetId;
                creep.memory.targetType = 'constructionSite';
                // TODO: Update State
            } 
        } 
        
        if( !target ) { 
            var targetId = this.getRepairId(creep, state);
            if( targetId != null ){
                target = Game.getObjectById(targetId);
                creep.memory.target = targetId;
                creep.memory.targetType = 'repairableSite';
                // TODO: Update State
            } 
        }

        if( !target ) {
            creep.memory.action = null;   
            creep.memory.target = null;
            creep.memory.targetType = null;
        } 
        else if( creep.memory.targetType == 'constructionSite'){
            if(creep.build(target) == ERR_NOT_IN_RANGE) {
                creep.moveTo(target);
            }
        } 
        else if( creep.memory.targetType == 'repairableSite'){
            if(creep.repair(target) == ERR_NOT_IN_RANGE) {
                creep.moveTo(target);
            }
        }
        return true;
	},
	getConstructionId: function(creep, state){
        var roomSites = state.rooms[creep.room.name].constructionSites;
        var targetId = null;
        var completion = -1;
        for( var newTargetId in roomSites ) {
            var site = roomSites[newTargetId];
            if( site.creeps.length+1 <= site.maxCreeps && site.completion > completion){
                targetId = site.id;
                completion = site.completion;
            }
        };
        return targetId;
	},
	getRepairId: function(creep, state){
        var roomSites = state.rooms[creep.room.name].repairableSites;
        var targetId = null;
        var damage = -1;
        for( var newTargetId in roomSites ) {
            var site = roomSites[newTargetId];
            if( site.creeps.length+1 <= site.maxCreeps && site.damage > damage){
                targetId = site.id;
                damage = site.damage;
            }
        };
        return targetId;
	}
}

module.exports = mod;