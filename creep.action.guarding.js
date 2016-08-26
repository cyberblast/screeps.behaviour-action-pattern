var action = new Creep.Action('guarding');
action.reusePath = 10;
action.ignoreCreeps = true;
action.maxTargetLease = 12;
action.isAddableAction = function(){ return true; };
action.isAddableTarget = function(){ return true; };
action.newTarget = function(creep){ 
    var flags = _.sortBy(_.filter(Game.flags, FLAG_COLOR.defense.filter), 
        function(o) { 
            var occupation = ( o.targetOf ? o.targetOf.length : 0);
            var distance = creep.pos.getRangeTo(o);
            return (occupation + (distance == Infinity ? 0.9 : distance/100));
        }
    );
    if( flags && flags.length > 0 ){
        Population.registerCreepFlag(creep, flags[0]);
        return flags[0];
    } 
    return null;
};
action.work = function(creep){
    if( creep.data.flagName )
        return OK;
    else return ERR_INVALID_ARGS;
};
module.exports = action;