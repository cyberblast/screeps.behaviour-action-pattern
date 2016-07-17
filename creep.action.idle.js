var action = new MODULES.creep.Action();

action.name = 'idle';

action.isAddableAction = function(creep){
    return true;
};

action.isAddableTarget = function(target){ 
    return true;
}; 

action.newTarget = function(creep){
    var flags = _.sortBy(creep.room.find(FIND_FLAGS, {
            filter: function(flag){ 
                return flag.color == FLAG_COLOR.idle;
            }
        }), 
        function(o) { 
            return (o.creeps ? o.creeps.length : 0); 
        }
    );
    return flags ? flags[0] : null; //Game.flags['IdlePole'];
};
action.step = function(creep) {
    if(CHATTY) creep.say(this.name);
    creep.memory.target = null;
    creep.memory.action = null;
    if(creep.target && creep.pos != creep.target.pos) {
        creep.moveTo(creep.target);
    } 
};

module.exports = action;