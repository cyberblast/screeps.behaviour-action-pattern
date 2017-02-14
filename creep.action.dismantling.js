let action = new Creep.Action('dismantling');
module.exports = action;
action.maxPerAction = 3;
action.maxPerTarget = 3;
action.renewTarget = false;
action.isValidAction = function(creep){
    return creep.sum < creep.carryCapacity;
};
action.isValidTarget = function(target){
    return target != null;
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
                let oldName = flag.name;
                FlagDir.removeFromDir(flag.name);
                flag.remove();

                let otherFlagMod = (range, flagItem, args) => {
                    if(flagItem.name == args) return Infinity;
                    return range;
                };
                flag = FlagDir.find(FLAG_COLOR.destroy.dismantle, creep.pos, true, otherFlagMod, oldName);
                if( oldName == flag.name ) logError('Removed flag found again in dismantling.newTarget!');
                if( flag ){
                    if( flag.room !== undefined ){ // room is visible
                        var targets = flag.room.lookForAt(LOOK_STRUCTURES, flag.pos.x, flag.pos.y);
                        if( targets && targets.length > 0)
                            return targets[0];
                        else { // remove flag. try next flag
                            FlagDir.removeFromDir(flag.name);
                            flag.remove();
                        }
                    }
                    else target = flag; // target in other room
                }
            }
        }
        else target = flag; // target in other room
    }
    return target;
};
action.work = function(creep){
    return creep.dismantle(creep.target);
};
action.onAssignment = function(creep, target) {
    if( SAY_ASSIGNMENT ) creep.say(String.fromCharCode(9850), SAY_PUBLIC);
};
