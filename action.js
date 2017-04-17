const Action = class {
    constructor(name) {
        this.name = name;
        this.maxPerTarget = Infinity;
        this.maxPerAction = Infinity;
        this.targetRange = 1;
        this.renewTarget = true;
    }
    
    getTargetID(target) {
        return target.id || target.name;
    };
    
    getTargetByID(id) {
        return Game.getObjectById(id) || Game.creeps[id];
    };
    
    isValidAction(object) {
        return true;
    };
    
    isValidTarget(target, object) {
        return !!target;
    };
    
    isAddableAction(object) {
        return this.maxPerAction === Infinity;
    };
    
    isAddableTarget(targt, object) {
        return this.maxPerTarget === Infinity || !target.targetOf || _.filter(target.targetOf, {actionName: this.name}).length < this.maxPerTarget;
    };
    
    newTarget(object) {
        return undefined;
    };
    
    step(object) {
        return undefined;
    };
    
    work(object) {
        return ERR_INVALID_ARGS;
    };
    
    validateActionTarget(object, target) {
        if (this.isValidAction(object)) {
            if (!this.isValidTarget(object, target)) {
                if (this.renewTarget) {
                    return this.newTarget(object);
                }
            } else {
                return target;
            }
        }
        return undefined;
    };
    
    assign(object, target) {
        if (!target) target = this.newTarget(object);
        if (target && this.isAddableTarget(object, target)) {
            if (!object.action || object.action.name !== this.name || !object.target || object.target.id !== target.id || object.target.name !== target.name) {
                this.registerAction(object, target);
            }
            return true;
        }
        return false;
    };
    
    registerAction(object, target) {
        return ERR_INVALID_ARGS;
    };
};
module.exports = Action;

Action.assignAction = function(action, object, target) {
    return action.assign(object, target);
};
