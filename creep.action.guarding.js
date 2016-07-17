var action = new MODULES.creep.Action();

action.name = 'guarding';

action.newTarget = function(creep){ 
    var flags = _.sortBy(_.filter(Game.flags, function(f){ return f.color == FLAG_COLOR.defense; }), 
        function(o) { 
            return (o.creeps ? o.creeps.length : 0); 
        }
    );
    if( flags && flags.length > 0 ) return flags[0];
    return null;
};
action.isAddableAction = function(){ return true; };
action.isAddableTarget = function(){ return true; };

action.step = function(creep){     
    if(CHATTY) creep.say(this.name);
    if(!creep.target){
        creep.moveTo(Game.flags['IdlePole']);
        return;
    }
    if(creep.target && creep.pos != creep.target.pos) {
        var moveResult = creep.moveTo(creep.target, {reusePath:15});
        
        if( moveResult == OK )
            return;
        
        if( moveResult == ERR_NO_PATH && Game.flags['IdlePole']){// get out of the way
            creep.moveTo(Game.flags['IdlePole']);
            return;
        } 
        if( !( [ERR_TIRED, ERR_NO_PATH].indexOf(moveResult) > -1 ) ) {
            if( DEBUG ) ERROR_LOG(creep, moveResult);
            creep.memory.action = null;
            creep.memory.target = null;
        }
    }
};

module.exports = action;