// base class for behaviours
let Behaviour = function(name) {
	this.name = name;
	this.inflowActions = [];
	this.outflowActions = [];
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
		for (const action in this.inflowActions) {
			if (!action.debounce || action.debounce(creep, this.outflowActions)) {
				if (this.assignAction(creep, action)) return;
			}
		}
		return Creep.action.idle.assign(creep);
	};
	this.selectAction = function(creep, actions) {
		for (const action in actions) {
			if (this.assignAction(creep, action)) return;
		}
	    return Creep.action.idle.assign(creep);
	};
};
module.exports = Behaviour;