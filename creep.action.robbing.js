const action = class extends Creep.Action {
    
    constructor(...args) {
        super(...args);
        
        this.maxPerTarget = 2;
        this.maxPerAction = 10;
        
        this.minimumTTL = 500;
        this.scoreMultiplier = 1 / Math.log(1.2);
        
        this.defaultStrategy.moveOptions = function(opts) {
            return opts;
        };
        this.defaultStrategy.resourceValue = function(creep) {
            let energyOnly = creep.ticksToLive < action.minimumTTL;
            if (!energyOnly && creep.data.homeRoom) {
                const room = Game.rooms[creep.data.homeRoom];
                energyOnly = room && !room.storage;
            }
            
            if (energyOnly) {
                return function(type) { // no storage, only rob energy
                    return type === RESOURCE_ENERGY ? 1 : 0;
                };
            }
            
            return function(type) {
                if (type === RESOURCE_ENERGY) return 0.2;
                if (type === RESOURCE_POWER) return 500;
                return type.length;
            };
        };
        this.defaultStrategy.resourceScore = function(creep, target, resourceValue) {
            const range = creep.pos.getRangeTo(target);
            const logBase = this.scoreMultiplier;
            const adjacentValue = 50;
            return function(type, amount, capacity) {
                if (amount === 0) return {amount, score: 0};
                
                const multiplier = resourceValue(type);
                
                return {amount, score: multiplier * amount * (adjacentValue - Math.log1p(range) * logBase)};
            };
        };
    }
    
    isValidAction(creep) {
        return creep.sum < (creep.carryCapacity * 0.95) && !creep.room.my;
    }
    
    isValidTarget(target) {
        if (_.some(target.pos.lookFor(LOOK_STRUCTURES), {structureType: STRUCTURE_RAMPART, isPublic: false, my: false})) {
            return false;
        }
        
        return !!(target.store || target.energy || target.mineralAmount);
    }
    
    newTarget(creep) {
        const targetPool = creep.room.structures.all;
        
        if (targetPool.length) {
            const targets = _(targetPool)
                .filter(this.isValidTarget)
                .map(this.targetScore(creep))
                .filter('score')
                .sortBy('score')
                .reverse()
                .value();
    
            // after scoring iterate through top condidates and do pathfinding to find an accessible target!
            return _.get(targets, [0, 'target']);
        }
        return;
    }
    
    work(creep) {
        const resourceRobValue = creep.getStrategyHandler([this.name], 'resourceValue', creep);
        const resourcesDescending = _(Util.resources())
            .filter(resourceRobValue)
            .sortBy(resourceRobValue)
            .values()
            .value();
        
        return this.targetCall(creep, resourcesDescending, target => {
            return (type, amount, capacity) => {
                const score = amount ? creep.withdraw(target, type, amount) : 0;
                if (score) return {amount: capacity, score};
                return {amount, score};
            };
        })(creep.target);
    }
    
    targetScore(creep) {
        const resourceRobValue = creep.getStrategyHandler([this.name], 'resourceValue', creep);
        const resourcesDescending = _(Util.resources())
            .filter(resourceRobValue)
            .sortBy(resourceRobValue)
            .values()
            .value();
        
        return this.targetCall(creep, resourcesDescending, target => {
            return creep.getStrategyHandler([this.name], 'resourceScore', creep, target, resourceRobValue);
        });
    }
    
    targetCall(creep, resourcesDescending, targetHandler) {
        return target => {
            const valueCallback = targetHandler(target);
            
            let score = 0;
            if (target.store) {
                score = this.storeCall(creep, target, target.store, Util.valueOrZero, valueCallback, resourcesDescending);
            } else {
                let store = {[RESOURCE_ENERGY]: target.energy};
                if (target instanceof StructureLab) _.assign(store, {[target.mineralType]: target.mineralAmount});
                score = this.storeCall(creep, target, store, Util.valueOrZero, valueCallback);
                // TODO: dropped resources are a combination of all drops under that point, their decay function relates to the number of separate resources
            }
            return {target, score};
        }
    }
    
    storeCall(creep, target, store, valueTransform, valueCallback, keys) {
        let capacity = creep.carryCapacity - creep.sum;
        let value = 0;
        if (!keys) keys = _.keys(store);
        for (let i = keys.length - 1; i >= 0; i--) {
            if (!capacity) break;
            
            const type = keys[i];
            const count = Math.min(valueTransform(store[type]), capacity);
            const {amount, score} = valueCallback(type, Util.valueOrZero(count), capacity);
            capacity -= amount;
            value += score;
        }
        return value;
    }
    
};
module.exports = new action('robbing');