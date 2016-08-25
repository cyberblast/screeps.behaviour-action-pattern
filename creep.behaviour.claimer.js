var behaviour = new Creep.Behaviour('claimer');
behaviour.run = function(creep) {
    var flag;    
    if( creep.flag ) // TODO: validate flag colors
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
            Population.registerCreepFlag(creep, flag);
        }
    }
    // TODO: Add travelling     
    if( !flag || !Creep.action.claiming.assign(creep) )
        Creep.action.idle.assign(creep);
    if( creep.action ) creep.action.step(creep);
    return;
};
module.exports = behaviour;