var action = new MODULES.creep.Action();

action.name = 'guarding';
action.reusePath = 10;
action.ignoreCreeps = true;

action.newTarget = function(creep){ 
    var flags = _.sortBy(_.filter(Game.flags, function(f){ return f.color == FLAG_COLOR.defense; }), 
        function(o) { 
            return ( o.creeps && o.creeps[creep.memory.setup] ? o.creeps[creep.memory.setup].length : 0); 
        }
        /*, 
        function(o) {
            return creep.pos.getRangeTo(o);
        }]*/
    );
    if( flags && flags.length > 0 ) return flags[0];
    return null;
};
action.isAddableAction = function(){ return true; };
action.isAddableTarget = function(){ return true; };

action.work = function(creep){
    return OK;
};

module.exports = action;