const action = new Creep.Action('boosting');
module.exports = action;
// constructor
action.maxPerAction = 1;
/**
 * Check to see if the mineralType has a boost
 */
function isValidMineralType(mineralType) {
    for (const category in BOOSTS) {
        for (const compound in BOOSTS[category]) {
            if (mineralType === compound) return true;
        }
    }
    return false;
}
action.isValidMineralType = isValidMineralType;

/**
 * Gets the part type matching the compound's boost
 */
function getBoostPartType(mineralType) {
    for (const category in BOOSTS) {
        for (const compound in BOOSTS[category]) {
            if (mineralType === compound) return category;
        }
    }
}
action.getBoostPartType = getBoostPartType;

function canBoostType(creep, type) {
    return !_(creep.body).filter({type}).every(part => part.boost);
}
action.canBoostType = canBoostType;

function isValidAction(creep) {
    // only valid if not every part is boosted
    return !_.every(creep.body, part => part.boost);
}
action.isValidAction = isValidAction;

function isValidTarget(target, creep) {
    // target is lab
    return target instanceof StructureLab &&
        // target must be active
        target.isActive() &&
        // target has the minimum energy and mineral
        target.energy >= LAB_BOOST_ENERGY && target.mineralAmount >= LAB_BOOST_MINERAL;
}
action.isValidTarget = isValidTarget;

const super_isAddableTarget = action.isAddableTarget;
function isAddableTarget(target, creep) {
    const boostPartType = this.getBoostPartType(target.mineralType);
    // mineralType is a boosting compound
    return super_isAddableTarget.apply(this, [target, creep]) && this.isValidMineralType(target.mineralType) &&
        // creep has active body parts matching the mineralType's boost
        creep.hasActiveBodyparts(boostPartType) &&
        // can further boost parts of the mineralType's boost
        this.canBoostType(creep, boostPartType);
}
action.isAddableTarget = isAddableTarget;

function newTarget(creep) {
    return _(creep.room.structures.all)
        .filter(this.isValidTarget)
        .min(lab => creep.pos.getRangeTo(lab));
}
action.newTarget = newTarget;

function work(creep) {
    return creep.target.boostCreep(creep);
}
action.work = work;

function onAssignment(creep) {
    if (SAY_ASSIGNMENT) creep.say(ACTION_SAY.BOOSTING, global.SAY_PUBLIC);
}
action.onAssignment = onAssignment;
