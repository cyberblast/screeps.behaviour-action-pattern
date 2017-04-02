// base class for behaviours
const Behaviour = function(name) {
    this.name = name;
    this.actions = (creep) => []; // priority list of non resource based actions
    this.inflowActions = (creep) => []; // priority list of actions for getting resources
    this.outflowActions = (creep) => []; // priority list of actions for using resources
    this.assignAction = function(creep, action) {
        const valid = action.isValidAction(creep);
        if( DEBUG && TRACE ) trace('Action', {actionName:action.name, behaviourName:this.name, creepName:creep.name, valid, Action:'isValidAction'});
        if( !valid ) return false;

        const addable = action.isAddableAction(creep);
        if( DEBUG && TRACE ) trace('Action', {actionName:action.name, behaviourName:this.name, creepName:creep.name, addable, Action:'isAddableAction'});
        if( !addable ) return false;

        const assigned = action.assign(creep);
        if( assigned ) {
            if( DEBUG && TRACE ) trace(assigned ? 'Behaviour' : 'Action', {actionName:action.name, behaviourName:this.name, reepName:creep.name, assigned, Behaviour:'nextAction', Action:'assign'});
            creep.data.lastAction = action.name;
            creep.data.lastTarget = creep.target.id;
            return true;
        }
        return false;
    };
    this.selectInflowAction = function(creep) {
        const actionChecked = {};
        for (const action of this.inflowActions(creep)) {
            if (!actionChecked[action.name]) {
                actionChecked[action.name] = true;
                if (!action.debounce || action.debounce(creep, this.outflowActions(creep))) {
                    if (this.assignAction(creep, action)) return;
                }
            }
        }
        return Creep.action.idle.assign(creep);
    };
    this.selectAction = function(creep, actions) {
        const actionChecked = {};
        for (const action of actions) {
            if (!actionChecked[action.name]) {
                actionChecked[action.name] = true;
                if (this.assignAction(creep, action)) return;
            }
        }
        return Creep.action.idle.assign(creep);
    };
    this.nextAction = function(creep) {
        return this.selectAction(creep, this.actions(creep));
    };
    this.run = function(creep) {
        // Assign next Action
        if (creep.action === null || creep.action.name === 'idle') {
            if (creep.data.destiny && creep.data.destiny.task && Task[creep.data.destiny.task] && Task[creep.data.destiny.task].nextAction) {
                Task[creep.data.destiny.task].nextAction(creep);
            }
            else {
                this.nextAction(creep);
            }
        }
        
        // Do some work
        if (creep.action && creep.target) {
            creep.action.step(creep);
        } else {
            logError('Creep without action/activity!\nCreep: ' + creep.name + '\ndata: ' + JSON.stringify(creep.data));
        }
    };
};
module.exports = Behaviour;