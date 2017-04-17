const CreepAction = class extends Action {
    
    constructor(...args) {
        super(...args);
        
        this.statement = ACTION_SAY[this.name.toUpperCase()];
        
        this.defaultStrategy = {
            name: `default-${this.name}`,
            moveOptions: function(opts) {
                return opts || {};
            }
        }
    }
    
    getTargetByID(id) {
        return super.getTargetByID(id) || Game.spawns[id] || Game.flags[id];
    };
    
    isAddableAction(creep) {
        return super.isAddableAction(creep) || !creep.room.population || !creep.room.population.actionCount[this.name] || creep.room.population.actionCount[this.name] < this.maxPerAction;
    };
    
    step(creep) {
        if (CHATTY) creep.say(this.name, SAY_PUBLIC);
        let range = creep.pos.getRangeTo(creep.target);
        if (range <= this.targetRange) {
            const workResult = this.work(creep);
            if (workResult !== OK) {
                const action = creep.action;
                const target = creep.target;
                creep.action = null;
                creep.target = null;
                creep.handleError({errorCode: workResult, action, target, range, creep});
                return;
            }
            range = creep.pos.getRangeTo(creep.target); // target may have changed (e.g. hauler feed+move/tick)
        }
        if (creep.target && creep.hasActiveBodyparts(MOVE)) {
            if (range > this.targetRange) {
                creep.travelTo(creep.target, {range: this.targetRange});
            } else if (range > this.reachedRange) {
                const direction = creep.pos.getDirectionTo(creep.target);
                const targetPos = Traveler.positionAtDirection(creep.pos, direction);
                if (creep.room.isWalkable(targetPos.x, targetPos.y)) {
                    creep.move(direction);
                } else {
                    creep.travelTo(creep.target, {range: this.reachedRange});
                }
            }
        }
    };
    
    registerAction(creep, target) {
        Population.registerAction(creep, this, target);
        this.onAssignment(creep, target);
    };
    
    selectStrategies() {
        return [this.defaultStrategy];
    }
    
    getStrategy(strategyName, creep, args) {
        if (_.isUndefined(args)) {
            return creep.getStrategyHandler([this.name], strategyName);
        } else {
            return creep.getStrategyHandler([this.name], strategyName, args);
        }
    }
    
    onAssignment(creep, target) {
        if (SAY_ASSIGNMENT && this.statement) creep.say(this.statement, SAY_PUBLIC);
        if (target instanceof RoomObject || target instanceof RoomPosition && VISUALS.ACTION_ASSIGNMENT) {
            Visuals.drawArrow(creep, target);
        }
    };
    
};
module.exports = CreepAction;
