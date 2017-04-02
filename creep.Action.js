// base class for every action
const Action = class {
    constructor(...args) {
        Action.prototype.constructor.apply(this, args);
    }
};
module.exports = Action;

Action.extend = function() {
    // INSTANCE
    Object.defineProperties(Action.prototype, {
        // max allowed creeps per target
        maxPerTarget: {
            value: Infinity,
            configurable: true,
        },
        // max allowed creeps per action (and room)
        maxPerAction: {
            value: Infinity,
            configurable: true,
        },
        // range within which the action can be executed (e.g. upgrade controller = 3)
        targetRange: {
            value: 1,
            configurable: true,
        },
        // range until which the target has been reached (e.g. can be less than targetRange)
        reachedRange: {
            value: 1,
            configurable: true,
        },
        // if true, will try to find new target if a target has become invalid
        // if false, an invalid target will invalidate the action as well (causing to get a new action)
        renewTarget: {
            value: true,
            configurable: true,
        },
    });
    // class constructor
    Action.prototype.constructor = function(actionName) {
        this.name = actionName;
    };
    // get unique identifier of any object (id or name)
    Action.prototype.getTargetId = function (target) {
        return target.id || target.name;
    };
    // get an object by its unique identifier (id or name)
    Action.prototype.getTargetById = function (id) {
        return Game.getObjectById(id) || Game.spawns[id] || Game.flags[id];
    };
    // determines, if an action is (still) valid. Gets validated each tick.
    // check possible override in derived action
    Action.prototype.isValidAction = function (creep) {
        return true;
    };
    // determines, if a target is (still) valid. Gets validated each tick.
    // check possible override in derived action
    Action.prototype.isValidTarget = function (target, creep) {
        return (target != null);
    };
    // determines, if an action is valid. Gets validated only once upon assignment.
    // check possible override in derived action
    Action.prototype.isAddableAction = function (creep) {
        return (this.maxPerAction === Infinity || !creep.room.population || !creep.room.population.actionCount[this.name] || creep.room.population.actionCount[this.name] < this.maxPerAction);
    };
    // determines, if a target is valid. Gets validated only once upon assignment.
    // check possible override in derived action
    Action.prototype.isAddableTarget = function (target, creep) { // target is valid to be given to an additional creep
        return (!target.targetOf || this.maxPerTarget === Infinity || _.filter(target.targetOf, {'actionName': this.name}).length < this.maxPerTarget);
    };
    // find a new target for that action
    // needs implementation in derived action
    Action.prototype.newTarget = function (creep) {
        return null;
    };
    // order for the creep to execute each tick, when assigned to that action
    Action.prototype.step = function (creep) {
        if (CHATTY) creep.say(this.name, SAY_PUBLIC);
        let range = creep.pos.getRangeTo(creep.target);
        if (range <= this.targetRange) {
            var workResult = this.work(creep);
            if (workResult != OK) {
                const tryAction = creep.action;
                const tryTarget = creep.target;
                creep.action = null;
                creep.target = null;
                creep.handleError({errorCode: workResult, action: this, target: creep.target, range, creep});
                return;
            }
            range = creep.pos.getRangeTo(creep.target); // target may have changed (eg. hauler feed+move/tick)
        }
        if (creep.target) {
            if (range > this.targetRange) creep.travelTo(creep.target, {range: this.targetRange});
            // low CPU pathfinding for last few steps.
            else if (range > this.reachedRange) {
                const direction = creep.pos.getDirectionTo(creep.target);
                const targetPos = Traveler.positionAtDirection(creep.pos, direction);
                if (creep.room.isWalkable(targetPos.x, targetPos.y)) { // low cost last steps if possible
                    creep.move(direction);
                } else {
                    creep.travelTo(creep.target, {range: this.reachedRange});
                }
            }
        }
    };
    // order for the creep to execute when at target
    Action.prototype.work = function (creep) {
        return ERR_INVALID_ARGS;
    };
    // validate, if this action is still valid for a certain creep and target
    // returns the target (could be a ne one) if valid or null
    Action.prototype.validateActionTarget = function (creep, target) {
        if (this.isValidAction(creep)) { // validate target or new
            if (!this.isValidTarget(target, creep)) {
                if (this.renewTarget) { // invalid. try to find a new one...
                    delete creep.data.path;
                    return this.newTarget(creep);
                }
            } else return target;
        }
        return null;
    };
    // assign the action to a creep
    // optionally predefine a fixed target
    Action.prototype.assign = function (creep, target) {
        if (target === undefined) target = this.newTarget(creep);
        if (target && this.isAddableTarget(target, creep)) {
            if (DEBUG && TRACE) trace('Action', {
                creepName: creep.name,
                assign: this.name,
                target: !target || target.name || target.id,
                Action: 'assign'
            });
            if (!creep.action || creep.action.name != this.name || !creep.target || creep.target.id !== target.id || creep.target.name != target.name) {
                Population.registerAction(creep, this, target);
                this.onAssignment(creep, target);
            }
            return true;
        }
        return false;
    };
    // assignment postprocessing
    // needs implementation in derived action
    Action.prototype.onAssignment = (creep, target) => {
    };
    // empty default strategy
    Action.prototype.defaultStrategy = {
        name: `default-${actionName}`,
        moveOptions: function (options) {
            return options || {};
        }
    };
    // strategy accessor
    Action.prototype.selectStrategies = function () {
        return [this.defaultStrategy];
    };
};