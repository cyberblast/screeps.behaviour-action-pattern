let mod = {};
module.exports = mod;
mod.name = 'remoteMiner';
mod.run = function(creep) {
    const flag = creep.data.destiny && Game.flags[creep.data.destiny.targetName];
    if (!flag && (!creep.action || creep.action.name !== 'recycling')) {
        return Creep.action.recycling.assign(creep);
    }

    if (Creep.action.avoiding.run(creep)) {
        return;
    }

    if (!creep.action || creep.action.name === 'idle') {
        // assign Action
        if( creep.room.name === creep.data.destiny.room || creep.data.determinatedTarget ){
            // if we're there (or have been), be a miner.
            this.mine(creep);
            return;
        } else {
            // else go there
            this.gotoTargetRoom(creep);
        }
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
        const targetRange = targetPos.lookFor(LOOK_CREEPS).length ? 1 : 0;
        creep.travelTo( targetPos, {range:targetRange} );
        if( range <= 2 && !creep.data.predictedRenewal ) {
            creep.data.predictedRenewal = _.min([500, 1500 - creep.ticksToLive + creep.data.spawningTime]);
        }
    }
    return range;
};
mod.gotoTargetRoom = function(creep){
    const targetFlag = creep.data.destiny ? Game.flags[creep.data.destiny.targetName] : null;
    if (targetFlag) return Creep.action.travelling.assignRoom(creep, targetFlag.pos.roomName);
};
mod.strategies = {
    defaultStrategy: {
        name: `default-${mod.name}`,
    },
};
