let action = new Creep.Action('dropping');
module.exports = action;
action.targetRange = 1;
action.isValidAction = function(creep) {
    return creep.carry.energy > 0;
};
action.work = function(creep) {
    let ret = OK;
    for(let resourceType in creep.carry) {
        ret = creep.drop(resourceType);
    }
    return ret;
};
action.onAssignment = function(creep, target) {
    if( SAY_ASSIGNMENT ) creep.say(String.fromCharCode(8681), SAY_PUBLIC);
};
