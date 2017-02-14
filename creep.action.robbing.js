let action = new Creep.Action('robbing');
module.exports = action;
action.maxPerTarget = 2;
action.maxPerAction = 10;
action.isValidAction = function(creep){ 
    return ( creep.sum < ( creep.carryCapacity * 0.95 ) && !creep.room.my);
};
action.isValidTarget = function(target){
    return !_.some(target.pos.lookFor(LOOK_STRUCTURES), {'structureType':STRUCTURE_RAMPART }) && ( ( target.store && _.sum(target.store) > 20 ) || ( target.energy && target.energy > 20 ) || ( target.mineralAmount && target.mineralAmount > 20 ) );
};
action.newTarget = function(creep){
    let that = this;
    let target = creep.pos.findClosestByRange(creep.room.structures.all, {
        filter: (structure) => that.isValidTarget(structure)
    });
    return target;
};
action.work = function(creep){
    let ret = OK;
    // has rampart? dismantle
    // disable ramparts for now since creeps have only one work part.
    /*let ramparts = _.filter(creep.room.lookForAt(LOOK_STRUCTURES, creep.target.pos), {'structureType': STRUCTURE_RAMPART });
    if( ramparts.length > 0 ){
        ret = creep.dismantle(ramparts[0]);
    */
    if( creep.target.store ) {
        for( var type in creep.target.store ){
            if( creep.target.store[type] > 0  )
                ret = creep.withdraw(creep.target, type);
        }
    } else if ( creep.target.structureType == STRUCTURE_LAB && creep.target.mineralAmount > 0) {
        ret = creep.withdraw(creep.target, creep.target.mineralType);
    } else if ( creep.target.energy ) {
        ret = creep.withdraw(creep.target, 'energy');
    }
    return ret;
};
action.onAssignment = function(creep, target) {
    if( SAY_ASSIGNMENT ) creep.say(String.fromCharCode(9760), SAY_PUBLIC);
};
