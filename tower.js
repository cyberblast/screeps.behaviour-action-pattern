let mod = {};
module.exports = mod;
mod.loop = function(room) {
    _.forEach(room.structures.towers, this.run);
};
mod.run = function(tower) {
    // Assign next Action
    if (!tower.action || tower.action.name === 'idle') {
        this.nextAction(tower);
    }
    
    // Do some work
    if (tower.action && tower.target) {
        tower.action.step(tower);
    } else {
        Util.logError(`Tower without action/activity!\nTower: ${tower.id}\ndata: ${JSON.stringify(tower.data)}`);
    }
};
mod.priorities = [
    Tower.action.heal,
    Tower.action.urgentRepair,
    Tower.action.attack,
    Tower.action.idle,
];
mod.nextAction = function(tower) {
    for (const action of this.priorities) {
        if (action.isValidAction(tower) && action.isAddableAction(tower) && action.assign(tower)) {
            return true;
        }
    }
    return false;
};

mod.registerAction = function(tower, target, action, entry) {
    if (tower === target) throw new Error('attempt to register self-target');
    if (!entry) entry = tower.memory;
    Util.set(entry, 'id', tower.id);
    
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
            if (oldTarget.towers) {
                const byName = elem => elem.id === tower.id;
                const index = oldTarget.towers.findIndex(byName);
                if (index > -1) oldTarget.towers.splice(index, 1);
            }
        }
    }
    // register target
    entry.targetId = targetId;
    if (target && !FlagDir.isSpecialFlag(target)) {
        if (!target.towers) target.towers = [];
        target.towers.push(entry);
    }
    
    tower.action = action;
    tower.target = target;
    tower.data = entry;
};
mod.flush = function() {
    this.typeCount = {};
    this.actionCount = {};
    Util.set(Memory, 'towers', {});
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
    // TODO: unregister tower's upon destruction
};