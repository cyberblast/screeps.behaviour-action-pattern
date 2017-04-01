let action = new Creep.Action('robbing');
module.exports = action;
action.maxPerTarget = 2;
action.maxPerAction = 10;
action.isValidAction = function(creep){ 
    return ( creep.sum < ( creep.carryCapacity * 0.95 ) && !creep.room.my);
};
action.isValidTarget = function(target){
    if (_.some(target.pos.lookFor(LOOK_STRUCTURES), {structureType: STRUCTURE_RAMPART, isPublic: false, my: false})) {
        return false;
    }
    
    if (target.store && _.sum(target.store) > 20) return true;
    if (target.energy && target.energy > 20) return true;
    if (target.mineralAmount && target.mineralAmount > 20) return true;

    return false;
};
action.newTarget = function(creep){
    const targetPool = creep.room.structures.all;

    if (targetPool.length) {
        const targets = _.chain(targetPool)
            .map(this.targetScore(creep)) // resource fill priority
            .filter('score')
            .sortBy('score').reverse()
            .value();

        const target = _.get(targets, [0, 'target'], null);

        // after scoring iterate thru top candidates and do pathfinding to find an accessible target!


        // console.log(creep.name, targets.length, target);

        return target;
    }
    return false;
};
action.work = function(creep){
    const resourceRobValue = creep.getStrategyHandler([action.name], 'resourceValue', creep);
    const resourcesDescending = _.chain(Util.resources()).sortBy(resourceRobValue).values().value();
    return this.targetCall(creep, resourcesDescending, (target) => {
        return (type, amount, capacity) => {
            // console.log(creep.name, target);
            const score = amount ? creep.withdraw(target, type, amount) : 0;
            if (score) {
                return {amount: capacity, score};
            }
            return {amount, score};
        };
    })(creep.target);
};
action.targetScore = function(creep) {
    const resourceRobValue = creep.getStrategyHandler([action.name], 'resourceValue', creep);
    const resourcesDescending = _.chain(Util.resources()).sortBy(resourceRobValue).values().value();
    return this.targetCall(creep, resourcesDescending, (target) => {
        return creep.getStrategyHandler([action.name], 'resourceScore', creep, target, resourceRobValue);
    });
};
action.targetCall = function(creep, resourcesDescending, targetHandler) {
    return target => {
        const valueCallback = targetHandler(target);

        let score = 0;
        if (target.store) {
            score = this.storeCall(creep, target, target.store, Util.valueOrZero, valueCallback, resourcesDescending);
        } else if (target.structureType === STRUCTURE_LAB) {
            score = this.storeCall(creep, target,
                {[RESOURCE_ENERGY]: target.energy, [target.mineralType]: target.mineralAmount}, Util.valueOrZero, valueCallback);
        } else {
            score = this.storeCall(creep, target, {[RESOURCE_ENERGY]: target.energy}, Util.valueOrZero, valueCallback);
            // TODO dropped resources are a combination of all drops under that point, their decay function relates to the number of separate resources
            /* instead of valueOrZero:
             const valueTransform = function(count) {
             return decayFunction(count || 0, range);
             };
             */
        }
        return {target, score};
    };
};
action.storeCall = function(creep, target, store, valueTransform, valueCallback, keys) {
    let capacity = creep.carryCapacity - creep.sum;
    let value = 0;
    if (!keys) keys = _.keys(store);
    for (let i = keys.length - 1; i >= 0; i--) {
        if (capacity === 0) break;

        const type = keys[i];
        const count = Math.min(valueTransform(store[type]), capacity);
        const {amount, score} = valueCallback(type, count < 1 ? 0 : count, capacity);
        capacity = capacity - amount;
        value = value + score;
    }
    return value;
};
action.onAssignment = function(creep, target) {
    if( SAY_ASSIGNMENT ) creep.say(String.fromCharCode(9760), SAY_PUBLIC);
};
action.defaultStrategy.moveOptions = function(options) {
    // // allow routing in and through hostile rooms
    // if (_.isUndefined(options.allowHostile)) options.allowHostile = true;
    return options;
};
action.defaultStrategy.resourceValue = function(creep) {
    if (creep.data.homeRoom) {
        const room = Game.rooms[creep.data.homeRoom];
        if (room && !room.storage) {
            // console.log(creep.name, 'only selecting energy');
            return function(type) { // no storage, only rob energy
                return type === RESOURCE_ENERGY ? 1 : 0;
            };
        }
    }
    return function(type) {
        if (type === RESOURCE_ENERGY) return 0.2;
        if (type === RESOURCE_POWER) return 500;
        return type.length;
    };
};
action.invasionAdjacentScore = 42;
action.invasionScoreMultiplier = 1 / Math.log(1.1);
action.normalAdjacentScore = 50;
action.normalScoreMultiplier = 1 / Math.log(1.2);
action.defaultStrategy.resourceScore = function(creep, target, resourceValue) {
    const range = creep.pos.getRangeTo(target);
    const logBase = creep.room.situation.invasion ? action.invasionScoreMultiplier : action.normalScoreMultiplier;
    const adjacentValue = creep.room.situation.invasion ? action.invasionAdjacentScore : action.normalAdjacentScore;
    return function(type, amount, capacity) {
        if (amount === 0) return {amount: 0, score: 0};

        const multiplier = resourceValue(type);

        // console.log(creep.name, 'resourceScore', type, amount, multiplier, range, logBase, adjacentValue);

        return {amount, score: multiplier * amount * (adjacentValue - Math.log1p(range) * logBase)};
    }
};
