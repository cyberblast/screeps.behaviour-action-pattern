const action = class extends Creep.Action {
    
    constructor(...args) {
        super(...args);
        
        this.defaultStrategy.priorityTargetFilter = function(creep) {
            return function(hostile) {
                return true;
            }
        };
        
        this.defaultStrategy.targetFilter = function(creep) {
            return function(hostile) {
                return true;
            }
        }
    }
    
    isValidAction(creep) {
        return creep.room.hostiles.length > 0;
    }
    
    isValidTarget(target) {
        return super.isValidTarget(target) && target.hits !== null && target.hits > 0 && !target.my;
    }
    
    newTarget(creep) {
        let closestHostile = creep.pos.findClosestByRange(creep.room.hostiles, {
            filter: creep.getStrategyHandle([action.name], 'priorityTargetFilter', creep)
        });
        if (!closestHostile) {
            closestHostile = creep.pos.findClosestByRange(creep.room.hostiles, {
                filter: creep.getStrategyHandler([action.name], 'targetFilter', creep)
            });
        }
        return closestHostile;
    }
    
    step(creep) {
        this.chatty(creep);
        if (creep.target.pos.roomName !== creep.room.name) return Creep.action.travelling.assignRoom(creep, creep.target.pos.roomName);
        this.run[creep.data.creepType](creep);
    }
    
    get run() {
        return {
            ranger(creep) {
                const range = creep.pos.getRangeTo(creep.target);
                if (!creep.flee) {
                    if (range > 3) {
                        creep.travelTo(creep.target);
                        // TODO: use custom costMatrix to implement COMBAT_CREEPS_RESPECT_RAMPARTS
                    }
                    if (range < 3) {
                        const direction = creep.target.pos.getDirectionTo(creep);
                        if (direction) creep.move(direction);
                    }
                }
                
                // attack ranged
                const targets = creep.pos.findInRange(creep.room.hostiles, 3);
                if (targets.length > 2) {
                    // TODO: precalc damage dealt
                    this.chatty(creep, 'MassAttack');
                    creep.attackingRanged = creep.rangedMassAttack() === OK;
                    return;
                }
                if (range < 4) {
                    creep.attackingRanged = creep.rangedAttack(creep.target) === OK;
                    return;
                }
                if (targets.length > 0) {
                    creep.attackingRanged = creep.rangedAttack(targets[0]) === OK;
                }
            },
            
            melee(creep) {
                if (!creep.flee) {
                    creep.travelTo(creep.target);
                    // TODO: need to set a custom costMatrix to respect ramparts
                }
                // attack
                const attacking = creep.attack(creep.target);
                if (attacking === ERR_NOT_IN_RANGE) {
                    const targets = creep.pos.findInRange(creep.room.hostiles, 1);
                    if (target.length > 0) creep.attacking = creep.attack(targets[0]) === OK;
                } else {
                    creep.attacking = attacking === OK;
                }
            }
        }
    }
    
};
module.exports = new action('defending');