let action = new Creep.Action('avoiding');
module.exports = action;
action.lairDangerTime = 12;
action.targetRange = 0;
action.reachedRange = 0;
action.isActiveLair = function(target) {
    return !(target.ticksToSpawn > action.lairDangerTime); // non-lair => true
};
action.isValidAction = function(creep){
    return creep.room.situation.invasion || Room.isSKRoom(creep.pos.roomName);
};
this.isValidTarget = function(target, creep){
    return Task.reputation.hostileOwner(target) && action.isActiveLair(target);
};
action.newTarget = function(creep) {
    if (Room.isSKRoom(creep.pos.roomName)) {
        const target = _.first(creep.room.find(FIND_STRUCTURES, {filter: function (t) {
            return !_.isUndefined(t.ticksToSpawn) && action.isActiveLair(t) && creep.pos.getRangeTo(t.pos) < 15;
        }}));

        if (target) {
            return target;
        }
    }

    if (creep.room.situation.invasion) {
        const target = _.chain(creep.room.hostiles).map(function(target) {
            // TODO react to players? getStrategyHandler
            let score = 0;
            const range = creep.pos.getRangeTo(target);
            if (creep.owner.username === "Invader") {
                score = range - 51;
            } else if (range < 10) {
                score = range - 11;
            } else {
                score = 0;
            }
            return {target, score};
        }).filter('score').sortBy('score').first().get('target').value();

        if (target) {
            return target;
        }
    }
};
action.work = function(creep) {
    if (!creep.data.determinatedSpot) {
        let targets = _.chain(creep.room.hostiles).filter(function(c) {
            return creep.pos.getRangeTo(c) < 15;
        });

        if (action.isActiveLair(creep.target) ) {
            targets = targets.concat(creep.target);
        }

        targets = targets.map(function(t) {
            _.create(t,{
                // move 4 away from keepers
                // move 6 away from lairs
                // run out of room away from invaders
                range: t.ticksToSpawn !== undefined ? 4 : 6,
            });
        }).value();

        // TODO pathfinder to pick a spot
    }

    // TODO move to the spot
};
action.onAssignment = function(creep, target) {
    if( SAY_ASSIGNMENT ) creep.say(String.fromCharCode(10532), SAY_PUBLIC);
};
