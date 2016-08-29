var action = new Creep.Action('guarding');
action.reusePath = 10;
action.isAddableAction = function(){ return true; };
action.isAddableTarget = function(){ return true; };
action.newTarget = function(creep){     
    var flag = FlagDir.find(FLAG_COLOR.defense, creep.pos, false, 
        FlagDir.rangeMod, 240, creep.data.creepType);
    if( creep.action && creep.action.name == 'guarding' && creep.flag && creep.flag.pos.roomName == creep.pos.roomName )
        return creep.flag;
    if( flag ) Population.registerCreepFlag(creep, flag);
    return flag;
};
action.work = function(creep){
    if( creep.data.flagName )
        return OK;
    else return ERR_INVALID_ARGS;
};
module.exports = action;