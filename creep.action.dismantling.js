var action = new Creep.Action('dismantling');
action.maxPerAction = 4;
action.maxPerTarget = 2;
action.isValidAction = function(creep){
    return ( _.sum(creep.carry) < creep.carryCapacity );
};
action.isValidTarget = function(target){
    return true;
};   
action.newTarget = function(creep){
    let target;
    let flag = FlagDir.find(FLAG_COLOR.destroy.dismantle, creep.pos, true);
    if( flag ){
        if( flag.room !== undefined ){ // room is visible
            var targets = flag.room.lookForAt(LOOK_STRUCTURES, flag.pos.x, flag.pos.y);
            if( targets && targets.length > 0)
                return targets[0]; 
            else { // remove flag. try next flag
                FlagDir.removeFromDir(flag.name);
                flag.remove();
                return this.newTarget(creep);
            }
        }
        else target = flag; // target in other room
    }
    return target;
};
action.work = function(creep){
    return creep.dismantle(creep.target);
};
module.exports = action;