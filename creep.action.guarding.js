var action = new MODULES.creep.ability();

action.name = 'guarding';

action.newTarget = function(creep){ 
    var flags = _.sortBy(creep.room.find(FIND_FLAGS, {
            filter: function(flag){ 
                return flag.color == COLOR_BLUE;
            }
        }), 
        function(o) { 
            return (o.creeps ? o.creeps.length : 0); 
        }
    );
    /*flags.forEach(function(f){
        console.log(f.name + ': ' + JSON.stringify(f.creeps));
    });*/
    if( flags ) return flags[0];
    return null;
};
action.isAddableAction = function(){ return true; };
action.isAddableTarget = function(){ return true; };

action.step = function(creep){     
    if(CHATTY) creep.say(this.name);
    if(creep.target && creep.pos != creep.target.pos) {
        var moveResult = creep.moveTo(creep.target);
        if( moveResult == OK )
            return;
        
        if( moveResult == ERR_NO_PATH && Game.flags['IdlePole']){// get out of the way
            creep.moveTo(Game.flags['IdlePole']);
            return;
        } 
        if( !( [ERR_TIRED, ERR_NO_PATH].indexOf(moveResult) > -1 ) ) {
            if( DEBUG ) logError(creep, moveResult);
            creep.memory.action = null;
            creep.memory.target = null;
        }
    }
};

module.exports = action;