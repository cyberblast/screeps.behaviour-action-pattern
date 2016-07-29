var action = new MODULES.creep.Action();

action.name = 'settling';
action.reusePath = 15;

action.isValidTarget = function(target){ return target != null; }; 
action.isAddableAction = function(){ return true; };
action.isAddableTarget = function(){ return true; };
action.newTarget = function(creep){ return null; }

action.step = function(creep){
    if(CHATTY) creep.say(this.name);
    
    // reached
    if( creep.target.pos.roomName == creep.pos.roomName ){
        // unregister & clear memory
        creep.unregisterTarget();
        creep.room.activities[creep.memory.action]--;
        creep.memory.action = null;
        creep.action = null;
    }

    if( creep.target ){
        creep.moveTo(creep.target, {reusePath: this.reusePath});
        return;
    }
}

module.exports = action;