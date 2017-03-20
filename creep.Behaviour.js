// base class for behaviours
let Behaviour = function(name) {
	this.name = name;
	this.inflowActions = [];
	this.outflowActions = [];
	this.assignAction = function(creep, action) {
		if (action.isValidAction(creep) &&
			action.isAddableAction(creep) &&
			action.assign(creep)) {
			creep.data.lastAction = action.name;
			creep.data.lastTarget = creep.target.id;
			return true;
		}
		return false;
	};
	this.selectInflowAction = function(creep, inflowActions, outflowActions) {
		for (const action in inflowActions) {
			if (!action.debounce || action.debounce(outflowActions)) {
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