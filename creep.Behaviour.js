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
        for (const action of this.inflowActions(creep)) {
            if (!action.debounce || action.debounce(creep, this.outflowActions(creep))) {
                if (this.assignAction(creep, action)) return;
            }
        }
        return Creep.action.idle.assign(creep);
    };
    this.selectAction = function(creep, actions) {
        for (const action of actions) {
            if (this.assignAction(creep, action)) return;
        }
        return Creep.action.idle.assign(creep);
    };
    this.nextAction = function(creep) {
        return this.selectAction(creep, this.actions(creep));
    };
};
module.exports = Behaviour;