const action = class extends Creep.Action {
    
    constructor(...args) {
        super(...args);
        
        this.maxPerAction = 3;
        this.maxperTarget = 3;
        this.renewTarget = false;
        this.statement = ACTION_SAY.DISMANTLING;
    }
    
    isValidAction(creep) {
        return creep.sum < creep.carryCapacity;
    }
    
    newTarget(creep) {
        let target;
        let flag = FlagDir.find(FLAG_COLOR.destroy.dismantle, creep.pos);
        if (flag) {
            if (flag.room) {
                // room is visible
                let targets = flag.pos.lookFor(LOOK_STRUCTURES);
                if (targets && targets.length > 0) {
                    return targets[0];
                } else {
                    // remove flag. try next flag
                    let oldName = flag.name;
                    FlagDir.removeFromDir(flag.name);
                    flag.remove();
                    
                    const otherFlagMod = (range, flagItem, args) => {
                        if (flagItem.name === args) return Infinity;
                        return range;
                    };
                    flag = FlagDir.find(FLAG_COLOR.destroy.dismantle, creep.pos, true, otherFlagMod, oldName);
                    if (oldName === flag.name) logError('Removed flag found again in dismantling.newTarget!');
                    if (flag) {
                        if (flag.room) {
                            // room is visible
                            const targets = flag.pos.lookFor(LOOK_STRUCTURES);
                            if (targets && targets.length > 0) {
                                return targets[0];
                            } else {
                                // remove flag. try next flag
                                Room.costMatrixInvalid.trigger(flag.room);
                                Flag.removeFromDir(flag.name);
                                flag.remove();
                            }
                        } else {
                            target = flag;
                        }
                    }
                }
            } else {
                target = flag;
            }
        }
        return target;
    }
    
    work(creep) {
        return creep.dismantle(creep.target);
    }
    
};
module.exports = new action('dismantling');