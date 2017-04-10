const action = new Creep.Action('boosting');
module.exports = action;
action.maxPerAction = 1;
action.targetRange = 1;

action.isValidMineralType = function(mineralType) {
    for (const category in BOOSTS) {
        for (const compound in BOOSTS[category]) {
            if (mineralType === compound) return true;
        }
    }
    return false;
}

action.getBoostPartType = function(mineralType) {
    for (const category in BOOSTS) {
        for (const compound in BOOSTS[category]) {
            if (mineralType === compound) return category;
        }
    }
}

action.canBoostType = function(creep, type) {
    return !_(creep.body).filter({type}).every(part => part.boost);
}

action.isValidAction = function(creep) {
    return !_.every(creep.body, part => part.boost);
}

action.isValidTarget = function(target, creep) {
    return target instanceof StructureLab && target.energy >= LAB_BOOST_ENERGY && target.mineralAmount >= LAB_BOOST_MINERAL && this.isAddableTarget(target, creep);
}

action.superIsAddableTarget = function(target, creep) {
    return (!target.targetOf || this.maxPerTarget === Infinity || _.filter(target.targetOf, {'actionName': this.name}).length < this.maxPerTarget);
}

action.isAddableTarget = function(target, creep) {
    const boostPartType = this.getBoostPartType(target.mineralType);
    
    return this.superIsAddableTarget(target, creep) && this.isValidMineralType(target.mineralType) && creep.hasActiveBodyparts(boostPartType) && this.canBoostType(creep, boostPartType);
}

action.newTarget = function(creep) {
    return _(creep.room.structures.labs.all)
        .filter(lab => this.isValidTarget(lab, creep))
        .min(lab => creep.pos.getRangeTo(lab));
}

action.work = function(creep) {
    return creep.target.boostCreep(creep);
}

action.onAssignment = function(creep) {
    if (SAY_ASSIGNMENT) creep.say(ACTION_SAY.BOOSTING, SAY_PUBLIC);
}