const action = class extends Creep.Action {
    
    constructor(...args) {
        super(...args);
        
        this.targetRange = 3;
        
        this.defaultStrategy.targetFilter = function(creep) {
            return function(target) {
                return target.my;
            };
        };
    }
    
    isAddableTarget(target, creep) {
        const filter = creep.getStrategyHandler([this.name], 'targetFilter', creep);
        
        return filter && filter(target);
    }
    
    isValidTarget(target, creep) {
        return super.isValidTarget(target) && target.hits && target.hits < target.hits && target.my && target.pos.roomName === creep.data.healRoom && this.isAddableTarget(target, creep);
    }
    
    newTarget(creep) {
        if (creep.room.casualties.length > 0) {
            const target = _.find(creep.room.casualties, t => t.name !== creep.name);
            if (target) creep.data.healRoom = target.pos.roomName;
            return target;
        }
        delete creep.data.healRoom;
    }
    
    work(creep) {
        if (creep.target.hits < creep.target.hitsMax) {
            if (creep.pos.isNearTo(creep.target)) {
                return creep.heal(creep.target);
            }
            if (creep.pos.inRangeTo(creep.target, 3)) {
                return creep.rangedHeal(creep.target);
            }
            return OK;
        }
    }

};
module.exports = new action('healing');