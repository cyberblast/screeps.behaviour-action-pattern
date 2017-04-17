const action = class extends Creep.Action {
    
    constructor(...args) {
        super(...args);
        
        this.defaultStrategy.moveOptions = function(opts) {
            // allow routing in and through hostile rooms
            if (_.isUndefined(opts.allowHostile)) opts.allowHostile = true;
            return opts;
        }
    }
    
    isValidAction(creep) {
        return FlagDir.hasInvasionFlag();
    }
    
    getFlaggedStructure(flagColour, pos) {
        const flagEntries = FlagDir.filter(flagColour, pos);
        let target = [];
        const checkFlag = flagEntry => {
            let flag = Game.flags[flagEntry.name];
            if (flag && flag.pos.roomName === pos.roomName && flag.room) {
                const targets = flag.pos.lookFor(LOOK_STRUCTURES);
                if (targets && targets.length > 0) {
                    const addTarget = structure => {
                        structure.destroyFlag = flag;
                        target.push(structure);
                    };
                    targets.forEach(addTarget);
                } else {
                    flag.remove();
                }
            }
        };
        flagEntries.forEach(checkFlag);
        if (target && target.length > 0) return pos.findClosestByRange(target);
    }
    
    newTarget(creep) {
        const destroy = this.getFlaggedStructure(FLAG_COLOR.destroy, creep.pos);
        if (destroy) {
            if (destroy.destroying) Population.registerCreepFlag(creep, destroy.destroyFlag);
            return destroy;
        }
        // move to invasion room
        const flag = FlagDir.find(FLAG_COLOR.invade, creep.pos, false);
        if (flag && (!flag.room || flag.pos.roomName !== creep.pos.roomName)) {
            Population.registerCreepFlag(creep, flag);
            return flag; // other room
        }
        if (!flag) {
            creep.action = null;
            delete creep.data.actionName;
            delete creep.data.targetId;
            return;
        }
        
        if (!flag.room.controller || !flag.room.controller.my) {
            // attack healer
            let target = creep.pos.findClosestByRange(creep.room.hostiles, {
                filter: hostile => _.some(hostile.body, {type: HEAL})
            });
            if (target) return target;
            // attack attacker
            target = creep.pos.findClosestByRange(creep.room.hostiles, {
                filter: hostile => _.some(hostile.body, part => part.type === ATTACK || part.type === RANGE_ATTACK)
            });
            if (target) return target;
            // attack tower
            target = creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, {
                filter: s => s instanceof StructureTower
            });
            if (target) return target;
            // attack remaining creeps
            target = creep.pos.findClosestByRange(creep.room.hostiles);
            if (target) return target;
            // attack spawn
            target = creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, {
                filter: structure => s instanceof StructureSpawn
            });
            if (target) return target;
            // attack structures
            target = creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, {
                filter: structure => !(structure instanceof StructureController)
            });
            if (target) return target;
            // attack construction sites
            target = creep.pos.findClosestByPath(FIND_HOSTILE_CONSTRUCTION_SITES);
            if (target) return target;
        }
        // no target found
        flag.remove();
    }
    
    step(creep) {
        this.chatty(creep);
        if (creep.target instanceof Flag && creep.target.pos.roomName === creep.pos.roomName) this.assign(creep);
        this.run[creep.data.creepType](creep);
    }
    
    get run() {
        return {
            melee(creep) {
                if (!creep.flee) {
                    if (creep.target instanceof ConstructionSite) {
                        creep.travelTo(creep.target, {range: 0});
                        return;
                    }
                    creep.travelTo(creep.target);
                    if (creep.target instanceof Flag) return;
                }
                if (!creep.target.my) creep.attacking = creep.attack(creep.target) === OK;
            },
            
            ranger(creep) {
                const range = creep.pos.getRangeTo(creep.target);
                if (!creep.flee) {
                    if (creep.target instanceof ConstructionSite) {
                        creep.travelTo(creep.target, {range: 0});
                        return;
                    }
                    if (range > 3 || creep.target instanceof Flag) creep.travelTo(creep.target);
                    if (creep.target instanceof Flag) return;
                    if (range < 3) creep.move(creep.target.pos.getDirectionTo(creep));
                }
                // attack
                const targets = creep.pos.findInRange(creep.room.hostiles, 3);
                if (targets.length > 2) {
                    // TODO: calc damage dealt
                    this.chatty(creep, 'MassAttack');
                    creep.attackingRanged = creep.rangedMassAttack() === Ok;
                    return;
                }
                if (range < 4) {
                    creep.attackingranged = creep.rangedAttack(creep.target) === OK;
                    return;
                }
                if (targets.length > 0) {
                    creep.attackingRanged = creep.rangedAttack(targets[0]) === OK;
                }
            }
        }
    }
    
};
module.exports = new action('invading');