const action = new Creep.Action('mining');
module.exports = action;
action.renewTarget = true;
action.isValidTarget = function(target, creep) {
    return target && (target instanceof Source || (target instanceof Mineral && !target.ticksToRegeneration));
};
action.isAddableAction = function(creep) {
    const room = creep.room;
    return (room.my || room.myReservation || (!room.owner && !room.reservation));
};
action.isAddableTarget = function(target, creep) {
    const occupied = entry => {
        const predictedRenewal = entry.predictedRenewal ? entry.predictedRenewal : entry.spawningTime;
        return entry.creepType === creep.data.creepType && entry.ttl > predictedRenewal;
    };
    return !target.targetOf || !_.some(target.targetOf, occupied);
};
action.newTarget = function(creep) {
    const target = creep.getStrategyHandler([action.name], 'newTarget', creep);
    if (target) {
        this.determineSpot(creep, target);
    }
    return target;
};
action.determineSpot = function(creep, source) {
    const invalid = [];
    const findInvalid = entry => {
        if (entry.name === creep.name) return;
        const predictedRenewal = entry.predictedRenewal ? entry.predictedRenewal : entry.spawningTime;
        if (entry.roomName === creep.pos.roomName && ['miner', 'upgrader'].includes(entry.creepType) && entry.determinatedSpot
            && entry.ttl > predictedRenewal)
            invalid.push(entry.determinatedSpot);
    };
    _.forEach(Memory.population, findInvalid);
    const containerSpot = (source.container && source.container.pos.isNearTo(source)
        && !_.some(invalid,{x:source.container.pos.x, y:source.container.pos.y})) ? source.container.pos : null;
    let spots = [];
    let args;
    if (!containerSpot) {
        args = {
            spots: [{
                pos: source.pos,
                range: 1
            }],
            checkWalkable: true,
            where: pos => !_.some(invalid, {x:pos.x,y:pos.y}),
            roomName: creep.pos.roomName
        };
        if (source.container) {
            args.spots.push({
                pos: source.container.pos,
                range: 1
            });
        }
        if (!creep.remote && source.link)
            args.spots.push({
                pos: source.link.pos,
                range: 1
            });
        spots = Room.fieldsInRange(args);
    }
    if (containerSpot || spots.length > 0) {
        let spot = containerSpot;
        if (!spot) {
            spot = creep.pos.findClosestByPath(spots, {filter: pos => {
                return !_.some(
                    creep.room.lookForAt(LOOK_STRUCTURES, pos),
                    {'structureType': STRUCTURE_ROAD }
                );
            }});
        }
        if (!spot) spot = creep.pos.findClosestByPath(spots) || spots[0];
        if (spot) {
            creep.data.determinatedSpot = {
                x: spot.x,
                y: spot.y,
            };
            if (!creep.remote) {
                const spawn = Game.spawns[creep.data.motherSpawn];
                if (spawn) {
                    const path = spot.findPathTo(spawn, {ignoreCreeps: true});
                    if (path) creep.data.predictedRenewal = creep.data.spawningTime + path.length; // road assumed
                }
            }
            if (MINERS_AUTO_BUILD && !source.container) {
                const sites = _.filter(source.pos.findInRange(FIND_CONSTRUCTION_SITES, 2), s => s.structureType === STRUCTURE_CONTAINER);
                if (!sites.length && source.room) {
                    source.room.createConstructionSite(spot, STRUCTURE_CONTAINER);
                }
            }
        }
    }
    if( !creep.data.determinatedSpot ) {
        logError('Unable to determine working location for miner in room ' + creep.pos.roomName);
    }
};
action.work = function(creep) {
    if (creep.target.energy === 0 || creep.target.cooldown > 0) {
        this.maintain(creep);
    } else if (creep.target instanceof Mineral && creep.target.ticksToRegeneration > 0) {
        this.resetChecks(creep);
        this.unassign(creep);
    } else {
        this.resetChecks(creep);
        const minCarry = creep.carryCapacity - (creep.data.body && creep.data.body.work ? creep.data.body.work * 2 : creep.carryCapacity / 2);
        if (creep.sum > minCarry) {
            if (creep.target.link && creep.target.link.energy < creep.target.link.energyCapacity) {
                creep.transfer(creep.target.link, RESOURCE_ENERGY);
            } else if (creep.target.container && creep.target.container.sum < creep.target.container.storeCapacity) {
                const transfer = r => {
                    if (creep.carry[r] > 0) creep.transfer(creep.target.container, r);
                };
                _.forEach(Object.keys(creep.carry), transfer);
            } else {
                if (global.CHATTY) creep.say('dropmining', global.SAY_PUBLIC);
                if (global.OOPS) creep.say(String.fromCharCode(8681), global.SAY_PUBLIC);
                const drop = r => {
                    if (creep.carry[r] > 0) creep.drop(r);
                };
                _.forEach(Object.keys(creep.carry), drop);
            }
        }
        return creep.harvest(creep.target);
    }
};
action.resetChecks = function(creep) {
    delete creep.data.repairChecked;
    delete creep.data.repairTarget;
    delete creep.data.buildChecked;
    delete creep.data.buildTarget;
    delete creep.data.energyChecked;
};
action.step = function(creep) {
    if (_.isUndefined(creep.data.determinatedSpot)) {
        this.determineSpot(creep, creep.target);
    } else  {
        const targetRoom = creep.data.destiny ? creep.data.destiny.room : creep.data.homeRoom;
        const targetPos = new RoomPosition(creep.data.determinatedSpot.x, creep.data.determinatedSpot.y, targetRoom);
        const range = creep.pos.getRangeTo(targetPos);
        if (range > 1) {
            creep.travelTo(targetPos, {range: 1});
        } else if (range === 1) {
            const occupied = targetPos.lookFor(LOOK_CREEPS).length > 0;
            if (!occupied) {
                creep.move(creep.pos.getDirectionTo(targetPos));
            }
        } else {
            this.work(creep);
        }
    }
};
action.getEnergy = function(creep) {
    const dropped = creep.pos.findInRange(FIND_DROPPED_RESOURCES, 1, {
        filter: r => r.resourceType === RESOURCE_ENERGY
    })[0];
    if (dropped) {
        if (global.DEBUG && global.TRACE) trace('Action', {actionName:this.name, method: 'getEnergy', creepName:creep.name, pos:creep.pos, pickup: dropped.id});
        creep.pickup(dropped);
        return true;
    }

    const container = creep.pos.findInRange(FIND_STRUCTURES, 1, {
        filter: s => s.structureType === STRUCTURE_CONTAINER
    })[0];
    if (container && container.sum > 0) {
        if (global.DEBUG && global.TRACE) trace('Action', {actionName:this.name, method: 'getEnergy', creepName:creep.name, pos:creep.pos, withdrawCon: container.id});
        creep.withdraw(container, RESOURCE_ENERGY);
        return true;
    }

    const link = creep.pos.findInRange(FIND_STRUCTURES, 1, {
        filter: s => s.my && s.structureType === STRUCTURE_LINK
    })[0];
    if (link && link.energy > 0) {
        if (global.DEBUG && global.TRACE) trace('Action', {actionName:this.name, method: 'getEnergy', creepName:creep.name, pos:creep.pos, withdrawLink: link.id});
        creep.withdraw(link, RESOURCE_ENERGY);
        return true;
    }
    if (global.DEBUG && global.TRACE) trace('Action', {actionName:this.name, method: 'getEnergy', creepName:creep.name, pos:creep.pos, result:'no energy'});
    creep.data.energyChecked = Game.time;
    return false;
};
action.maintain = function(creep) {
    const minCarry = (creep.data.body && creep.data.body.work ? (creep.data.body.work * 5) : (creep.carryCapacity / 2));
    if (global.DEBUG && global.TRACE) trace('Action', {actionName:this.name, method: 'maintain', creepName:creep.name, pos:creep.pos, energy: creep.carryenergy, minCarry});
    if (creep.carry.energy <= minCarry) {
        if (!creep.data.energyChecked || Game.time - creep.data.energyChecked > MINER_WORK_THRESHOLD) {
            this.getEnergy(creep);
        }
    }
    if (creep.carry.energy > 0) {
        if (!creep.data.repairChecked || Game.time - creep.data.repairChecked > MINER_WORK_THRESHOLD) {
            let repairTarget = Game.getObjectById(creep.data.repairTarget);
            if (!repairTarget || repairTarget.hits === repairTarget.hitsMax) {
                repairTarget = creep.pos.findInRange(FIND_STRUCTURES, 3, {
                    filter: s => (s.structureType === STRUCTURE_CONTAINER || s.structureType === STRUCTURE_ROAD) && s.hits < s.hitsMax
                })[0];
            }
            if (repairTarget) {
                creep.data.repairTarget = repairTarget.id;
                if (global.DEBUG && global.TRACE) trace('Action', {actionName:this.name, method: 'maintain', creepName:creep.name, pos:creep.pos, repairTarget:repairTarget.id, progress:repairTarget.hits / repairTarget.hitsMax});
                return creep.repair(repairTarget);
            }  else {
                delete creep.data.repairTarget;
                creep.data.repairChecked = Game.time;
            }
        }
        if (!creep.data.buildChecked || Game.time - creep.data.buildChecked > MINER_WORK_THRESHOLD) {
            let buildTarget = Game.getObjectById(creep.data.buildTarget);
            if (!buildTarget || buildTarget.progress === buildTarget.progressMax) {
                buildTarget = creep.pos.findInRange(creep.room.myConstructionSites, 3, {
                    filter: s => (s.structureType === STRUCTURE_CONTAINER || s.structureType === STRUCTURE_ROAD) && s.progress < s.progressMax
                })[0];
            }
            if (buildTarget) {
                creep.data.buildTarget = buildTarget.id;
                if (global.DEBUG && global.TRACE) trace('Action', {actionName:this.name, method: 'maintain', creepName:creep.name, pos:creep.pos, buildTarget: buildTarget.id, progress: buildTarget.progress/buildTarget.progressMax});
                return creep.build(buildTarget);
            } else {
                delete creep.data.buildTarget;
                creep.data.buildChecked = Game.time;
            }
        }
    }
    return false; // idle
};
action.defaultStrategy.newTarget = function(creep) {
    const addable = s => Creep.action.mining.isValidTarget(s, creep) && Creep.action.mining.isAddableTarget(s, creep);
    return _(creep.room.sources).sortBy(s => creep.pos.getRangeTo(s)).find(addable) || null;
};
