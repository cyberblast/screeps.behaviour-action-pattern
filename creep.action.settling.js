var action = new MODULES.creep.Action();

action.name = 'settling';
action.reusePath = 15;

action.isValidTarget = function(target){ return true; }; 
action.isAddableAction = function(){ return true; };
action.isAddableTarget = function(){ return true; };

action.newTarget = function(creep){
    var flag = _.find(Game.flags, {'color': FLAG_COLOR.claim });    
    if( !flag ){
        return null;
    }
 
    if( !flag.room || flag.room.name != creep.room.name)
        return flag;    
}

action.step = function(creep){
    if(CHATTY) creep.say(this.name);
    
    if( creep.target.color ){
        // creep.say('Approaching');
        creep.moveTo(creep.target);
        return;
    }
    
    var moveResult = creep.moveTo(creep.target, {reusePath: this.reusePath});
}

module.exports = action;