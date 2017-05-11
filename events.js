let mod = {};
module.exports = mod;
mod.flush = function(){
    // occurs when a flag is found (each tick)
    // param: flag
    Flag.found = new LiteEvent();

    // occurs when a flag memory if found for which no flag exists (before memory removal)
    // param: flagName
    Flag.FlagRemoved = new LiteEvent();

    // ocurrs when a creep starts spawning
    // param: { spawn: spawn.name, name: creep.name, destiny: creep.destiny }
    Creep.spawningStarted = new LiteEvent();

    // ocurrs when a creep completes spawning
    // param: creep
    Creep.spawningCompleted = new LiteEvent();

    // ocurrs when a creep will die in the amount of ticks required to renew it
    // param: creep
    Creep.predictedRenewal = new LiteEvent();
    
    // ocurrs when a creep dies
    // param: creep name
    Creep.died = new LiteEvent();

    // after a creep error
    // param: {creep, tryAction, tryTarget, workResult}
    Creep.error = new LiteEvent();

    // ocurrs when a new invader has been spotted for the first time
    // param: invader creep
    Room.newInvader = new LiteEvent();
    
    // ocurrs every tick since an invader has been spotted until its not in that room anymore (will also occur when no sight until validated its gone)
    // param: invader creep id
    Room.knownInvader = new LiteEvent();
    
    // ocurrs when an invader is not in the same room anymore (or died). will only occur when (or as soon as) there is sight in the room.
    // param: invader creep id
    Room.goneInvader = new LiteEvent();
    
    // ocurrs when a room is considered to have collapsed. Will occur each tick until solved.
    // param: room
    Room.collapsed = new LiteEvent();

    // occurs when a room needs to rebuild its costMatrix
    Room.costMatrixInvalid = new LiteEvent();
    
    // occurs when a room's level has increased or decreased
    // param: room
    Room.RCLChange = new LiteEvent();
};
