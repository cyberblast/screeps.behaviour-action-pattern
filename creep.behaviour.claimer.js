var behaviour = new Creep.Behaviour('claimer');

behaviour.run = function(creep) {
    var flag;    
    if( creep.flag )
        flag = creep.flag;
    else {
        var flags = _.sortBy(_.filter(Game.flags, FLAG_COLOR.claim.filter), 
            function(f) { 
                var occupation = ( f.creeps ? f.creeps.sum : 0 );
                var distance = creep.pos.getRangeTo(f);
                return (occupation + (distance == Infinity ? 0.9 : distance/100));
            }
        );
        if( flags && flags.length > 0 ) { 
            flag = flags[0];
            creep.flag = flags[0];
            creep.memory.flag = flags[0].name;
        }
    }

    // TODO: Add Settling
     
    if( !flag || !this.assignAction(creep, MODULES.creep.action.claiming) )
        this.assignAction(creep, MODULES.creep.action.idle);

    if( creep.action ) creep.action.step(creep);
    return;
};


module.exports = behaviour;