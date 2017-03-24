const action = new Creep.Action('bulldozing');
module.exports = action;
action.maxPerAction = 2;
action.maxPerTarget = 1;
action.isValidTarget = function(target) {
    return target instanceof ConstructionSite && Task.reputation.notAlly(target.owner.username);
};
action.newTarget = function(creep) {
    const target = _(creep.room.constructionSites)
        .filter(action.isValidTarget)
        .max(target => {
            let rating;
            if (target.structureType === STRUCTURE_SPAWN) {
                rating = 20000;
            } else {
                rating = 10000;
            }
            rating += target.progress / target.progressTotal * 10000;
            rating -= creep.pos.getRangeTo(target);
            return rating;
        });
    if (target instanceof ConstructionSite) return target;
};
action.work = function(creep) {
    return creep.move(creep.pos.getDirectionTo(creep.target));
};
action.onAssignment = function(creep) {
    if (SAY_ASSIGNMENT) creep.say(String.fromCodePoint(0x1F4CC), SAY_PUBLIC);
};