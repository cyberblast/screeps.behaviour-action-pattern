const action = class extends Creep.Action {
    
    constructor(...args) {
        super(...args);
        
        this.reachedRange = 0;
    }
    
    newTarget(creep) {
        let flag;
        if (creep.data.destiny) flag = Game.flags[creep.data.destiny.flagName];
        if (!flag) flag = FlagDir.find(FLAG_COLOR.defense, creep.pos, false, FlagDir.rangeMod, {
            rangeModPerCrowd: 400,
        });
        if (creep.action && creep.action.name === this.name && creep.flag) return flag;
        if (flag) Population.registerCreepFlag(creep, flag);
        return flag;
    }
    
    work(creep) {
        return creep.data.flagName ? OK : super.work(creep);
    }
};
module.exports = new action('guarding');