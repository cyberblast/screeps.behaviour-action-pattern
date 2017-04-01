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
action.invasionAdjacentScore = 42;
action.invasionScoreMultiplier = 1 / Math.log(1.1);
action.normalAdjacentScore = 50;
action.normalScoreMultiplier = 1 / Math.log(1.2);
/*
 container - pile or structure
 */
action.resourceRobValue = function(type) {
    if (type === RESOURCE_ENERGY) return 0.2;
    if (type === RESOURCE_POWER) return 500;
    return type.length;
};
const resourcesDescending = _.memoize(function(action) {
    return _.chain(global).pick(function(v,k) {
        return k.startsWith('RESOURCE_');
    }).sortBy(action.resourceRobValue).values().value();
});
action.newTarget = function(creep){
    // TODO RESOURCE_ priority
    // LATER after scoring iterate thru top candidates and do pathfinding to find an accessible target!
    const targetPool = creep.room.structures.all;

    if (targetPool.length) {
        const targets = _.chain(targetPool)
            .map(this.targetScore(creep))
            .filter('score')
            .sortBy('score').reverse()
            .value();

        const target = _.get(targets, [0, 'target'], null);

        // console.log(creep.name, targets.length, target);

        return target;
    }
    return false;
};
action.work = function(creep){
    return this.targetCall(creep, (target) => {
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
const identitySafe = function(count) {
    return count || 0;
};
action.targetScore = function(creep) {
    return this.targetCall(creep, (target) => {
        const range = creep.pos.getRangeTo(target);
        const logBase = creep.room.situation.invasion ? this.invasionScoreMultiplier : this.normalScoreMultiplier;
        const adjacentValue = creep.room.situation.invasion ? this.invasionAdjacentScore : this.normalAdjacentScore;
        return (type, amount, capacity) => {
            if (amount) {
                const multiplier = this.resourceRobValue(type);

                return {amount, score: multiplier * amount * (adjacentValue - Math.log1p(range) * logBase)};
            }
            return {amount, score: 0};
        };
    });
};
action.targetCall = function(creep, targetHandler) {
    return target => {
        const valueCallback = targetHandler(target);

        let score = 0;
        if (target.store) {
            score = this.storeCall(creep, target, target.store, identitySafe, valueCallback, resourcesDescending(this));
        } else if (target.structureType === STRUCTURE_LAB) {
            score = this.storeCall(creep, target,
                {[RESOURCE_ENERGY]: target.energy, [target.mineralType]: target.mineralAmount}, identitySafe, valueCallback);
        } else {
            score = this.storeCall(creep, target, {[RESOURCE_ENERGY]: target.energy}, identitySafe, valueCallback);
            // TODO dropped resources are a combination of all drops under that point, their decay function relates to the number of separate resources
            /* instead of identitySafe:
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
