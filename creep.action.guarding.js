var action = new MODULES.creep.Action();

action.name = 'guarding';
action.reusePath = 10;
action.ignoreCreeps = true;
action.maxTargetLease = 12;

action.newTarget = function(creep){ 
    var flags = _.sortBy(_.filter(Game.flags, function(f){ return f.color == FLAG_COLOR.defense; }), 
        function(o) { 
            var occupation = ( o.creeps && o.creeps[creep.memory.setup] ? o.creeps[creep.memory.setup].length : 0);
            var distance = creep.pos.getRangeTo(o);
            return (occupation + (distance == Infinity ? 0.9 : distance/100));
        }
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