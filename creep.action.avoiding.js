const action = class extends Creep.Action {
    
    constructor(name) {
        super(name);
        this.lairDangerTime = 24;
        this.targetRange = 0;
        this.reachedRange = 0;
    }
    
    isActiveLair(target) {
        return !(target.ticksToSpawn > this.lairDangerTime);
    }
    
    isValidAction(creep) {
        return creep.data.destiny && creep.data.destiny.room === creep.room.name &&
            (Room.isSKRoom(creep.room.name) || creep.room.situation.invasion);
    }
    
    isAddableAction(creep) {
        return true;
    }
    
    isValidTarget(target, creep) {
        if (Task.reputation.npcOwner(target)) {
            return this.isActiveLair(target);
        }
        if (Task.reputation.hostileOwner(target)) {
            return Util.callIfExists(target.hasActiveBodyparts, [ATTACK, RANGED_ATTACK]);
        }
        return false;
    }
    
    newTarget(creep) {
        if (Room.isSKRoom(creep.room.name)) {
            const target = _(creep.room.structures.all).filter(s => {
                return !_.isUndefined(s.ticksToSpawn) && this.isActiveLair(s) && creep.pos.getRangeTo(s.pos) < 15;
            }).first();
            
            if (target) return target;
        }
        
        if (creep.room.situation.invasion) {
            const target = _(creep.room.hostiles).filter(this.isValidTarget)
                .map(target => {
                    let score = 0;
                    const range = creep.pos.getRangeTo(target);
                    if (creep.owner.username === 'Invader') {
                        score = range - 51;
                    } else if (range < 10) {
                        score = range - 11;
                    }
                    return {target, score};
                }).filter('score').filter('target')
                .sortBy('score').first().target;
            
            if (target) return target;
        }
    }
    
    work(creep) {
        if (!(creep.data.safeSpot && creep.data.safeSpot.roomName)) {
            const flag = creep.data.destiny && Game.flags[creep.data.destiny.targetName];
            if (flag) {
                creep.data.safeSpot = flag.pos;
            } else {
                const exit = _(creep.room.findRoute(creep.data.homeRoom)).filter('exit').first().exit;
                if (exit) {
                    creep.data.safeSpot = creep.pos.findClosestByRange(exit);
                    creep.data.safeSpot.roomName = creep.pos.roomName;
                }
            }
        }
        
        if (creep.data.safeSpot) {
            if (creep.pos.getRangeTo(creep.target) < 10) {
                creep.travelTo(creep.data.safeSpot);
            } else {
                creep.idleMove();
            }
        }
    }
    
    run(creep) {
        if (this.isValidAction(creep)) {
            if (creep.action === this && this.isValidTarget(creep.target, creep) ||
            this.isAddableAction(creep) && this.assign(creep)) {
                this.work(creep);
                return true;
            }
        }
    }
    
    onAssignment(creep) {
        delete creep.data.safeSpot;
        if (SAY_ASSIGNMENT) creep.say(ACTION_SAY.AVOIDING, SAY_PUBLIC);
    }
    
};
module.exports = new action('avoiding');