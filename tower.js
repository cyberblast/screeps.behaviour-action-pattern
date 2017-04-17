let mod = {};
module.exports = mod;
mod.loop = function(room) {
    _.forEach(room.structures.towers, this.run);
};
mod.run = function(tower) {
    if(tower) {
        const p = Util.startProfiling(tower.room.name + ':tower:' + tower.id, {enabled:PROFILING.ROOMS});
        // TODO: convert to action pattern
        if( tower.room.casualties.length > 0) {
            // Heal
            var target = tower.room.casualties[0];
            if(target.hitsMax - target.hits >= 400 || !tower.room.situation.invasion) {
                tower.heal(target);
                if( target.towers === undefined )
                    target.towers = [];
                target.towers.push(tower.id);
                return;
            }
        }
        p.checkCPU('casualties', 0.5);
        if( tower.room.structures.urgentRepairable.length > 0 ) {
            // urgent Repair
            var target = tower.room.structures.urgentRepairable[0];
            tower.repair(target);
            if( target.towers === undefined )
                target.towers = [];
            target.towers.push(tower.id);
            return;
        }
        p.checkCPU('urgentRepairable', 0.5);

        var closestHostile = tower.pos.findClosestByRange(tower.room.hostiles);
        if(closestHostile) {
            // Attack
            tower.attack(closestHostile);
        }
        p.checkCPU('closestHostile', 0.5);
        /*
        else if( (tower.room.structures.repairable.length > 0) && (tower.energy > (tower.energyCapacity * 0.8)) ) {
            // Repair
            var isAddable = target => (target.towers === undefined || target.towers.length == 0);
            var target = _.find(tower.room.structures.repairable, isAddable);
            if( !_.isUndefined(target) ){
                tower.repair(target);
                if( target.towers === undefined )
                    target.towers = [];
                target.towers.push(tower.id);
            }
        }
        */
    }
};
mod.registerAction = function(tower, target, action, entry) {
    if (tower === target) throw new Error('attempt to register self-target');
    if (!entry) entry = tower.memory;
    
    const room = tower.room;
    if (!room.towers) {
        room.towers = {
            typeCount: {},
            actionCount: {},
        };
    }
    const t = room.towers;
    
    if (tower.action) {
        // unregister action
        const actionName = tower.action.name;
        t.actionCount[actionName] = (t.actionCount[actionName] || 1) - 1;
        this.actionCount[actionName] = (this.actionCount[actionName] || 1) - 1;
    }
    // register action
    entry.actionName = action.name;
    t.actionCount[action.name] = (t.actionCount[action.name] || 0) + 1;
    this.actionCount[action.name] = (this.actionCount[action.name] || 0) + 1;
    
    const targetId = target.id || target.name;
    let oldTargetId;
    if (entry.targetId) {
        // unregister target
        const oldTarget = entry.targetId ? Game.getObjectById(entry.targetId) || Game.spawns[entry.targetId] || Game.flags[entry.targetId] : null;
        if (oldTarget) {
            oldTargetId = oldTarget.id || oldTarget.name;
            if (oldTarget.targetOf) {
                const byName = elem => elem.creepName === tower.id;
                const index = oldTarget.targetOf.findIndex(byName);
                if (index > -1) oldTarget.targetOf.splice(index, 1);
            }
        }
    }
    // register target
    entry.targetId = targetId;
    if (target && !FlagDir.isSpecialFlag(target)) {
        if (!target.targetOf) target.targetOf = [];
        target.targetOf.push(entry);
    }
    
    tower.action = action;
    tower.target = target;
    tower.data = entry;
};
mod.flush = function() {
    this.typeCount = {};
    this.actionCount = {};
};
mod.analyze = function() {
    const register = entry => {
        const tower = Game.structures[entry.towerId];
        if (!tower) {
            // TODO: Tower destroyed
            return;
        }
        tower.data = entry;
        delete tower.action;
        delete tower.target;
        delete tower.flag;
        
        const action = entry.actionName && Tower.action[entry.actionName] ? Tower.action[entry.actionName] : null;
        let target = action && entry.targetId ? Game.getObjectById(entry.targetId) || Game.spawns[entry.targetId] || Game.flags[entry.targetId] : null;
        if (target && target.id === tower.id) {
            target = FlagDir.specialFlag();
        }
        if (action && target) {
            this.registerAction(tower, target, action, entry);
        } else {
            delete entry.actionName;
            delete entry.targetId;
            delete tower.action;
            delete tower.target;
        }
        
        tower.data = entry;
    };
    
    _.forEach(Memory.towers, register);
    
    const validateAssignment = entry => {
        const tower = Game.structures[entry.towerId];
        if (tower && tower.action && tower.target) {
            const oldId = tower.target.id || tower.target.name;
            const target = tower.action.validateActionTarget(tower, tower.target);
            if (!target) {
                delete entry.actionName;
                delete entry.targetId;
                delete creep.action;
                delete creep.target;
            } else if (oldId !== target.id || target.name) {
                this.registerAction(tower, target, tower.action, entry);
            }
        }
    };
    _.forEach(Memory.towers, validateAssignment);
};
mod.execute = function() {

};
mod.cleanup = function() {
    // TODO: unregister towers upon destruction
};