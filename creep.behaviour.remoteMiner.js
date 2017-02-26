let mod = {};
module.exports = mod;
mod.name = 'remoteMiner';
mod.run = function(creep) {
    if (Creep.action.avoiding.run(creep)) {
        return;
    }

    let oldTargetId = creep.data.targetId;
    // assign Action
    if( creep.room.name == creep.data.destiny.room ){
        // if we're there, be a miner.
        this.mine(creep);
        return;
    } else {
        // else go there
        Creep.action.travelling.assign(creep, Game.flags[creep.data.destiny.targetName]);
    }
    
    // Do some work
    if( creep.action && creep.target ) {
        creep.action.step(creep);
    } else {
        logError('Creep without action/activity!\nCreep: ' + creep.name + '\ndata: ' + JSON.stringify(creep.data));
    }
};
mod.mine = function(creep) {
    return Creep.behaviour.miner.run(creep, {remote:true, approach:mod.approach});
};
mod.approach = function(creep){
    let targetPos = new RoomPosition(creep.data.determinatedSpot.x, creep.data.determinatedSpot.y, creep.data.destiny.room);
    let range = creep.pos.getRangeTo(targetPos);
    if( range > 0 ) {
        creep.drive( targetPos, 0, 0, range );
        if( range <= 2 && !creep.data.predictedRenewal ) {
            creep.data.predictedRenewal = _.min([500, 1500 - creep.ticksToLive + creep.data.spawningTime]);
        }
    }
    return range;
};
