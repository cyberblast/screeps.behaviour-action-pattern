const mod = new Creep.Behaviour('pioneer');
module.exports = mod;
mod.inflowActions = (creep) => Creep.behaviour.worker.inflowActions.call(this, creep);
mod.outflowActions = (creep) => {
    let priority;
    if (creep.room.controller && creep.room.controller.level < 2) {
        priority = [
            Creep.action.feeding,
            Creep.action.upgrading,
            Creep.action.building,
            Creep.action.repairing,
            Creep.action.fueling,
            Creep.action.fortifying,
            Creep.action.charging,
            Creep.action.storing,
            Creep.action.picking
        ];
    } else {
        priority = [
            Creep.action.feeding,
            Creep.action.building,
            Creep.action.repairing,
            Creep.action.fueling,
            Creep.action.fortifying,
            Creep.action.charging,
            Creep.action.upgrading,
            Creep.action.storing,
            Creep.action.picking
        ];
    }
    if (creep.room.controller && creep.room.controller.ticksToDowngrade < 2000) { // urgent upgrading
        priority.unshift(Creep.action.upgrading);
    }
    if (creep.sum > creep.carry.energy) {
        priority.unshift(Creep.action.storing);
    }
    return priority;
};
mod.nextAction = function(creep) {
    var flag;
    if( creep.data.destiny ) flag = Game.flags[creep.data.destiny.flagName];
    
    if( flag ) {
        // not at target room
        if( !flag.room || flag.pos.roomName != creep.pos.roomName ){
            // travel to target room
            if( Creep.action.travelling.assignRoom(creep, flag.pos.roomName)) {
                Population.registerCreepFlag(creep, flag);
                return true;
            }
        }
        // if target room claimed      
        if( flag.room && flag.room.my ) {       
            let spawnFlag = FlagDir.find(FLAG_COLOR.claim.spawn, creep.pos, true) ;
            // and has spawn flag
            if( spawnFlag ) {
                // but spawn is complete
                if( spawnFlag.room.structures.spawns && spawnFlag.room.structures.spawns.length > 0 ){
                    // remove spawn flag
                    spawnFlag.remove();
                    // also remove exploit flags
                    let remove = f => Game.flags[f.name].remove();
                    _.forEach(FlagDir.filter(FLAG_COLOR.invade.exploit, spawnFlag.pos, true), remove);
                }
                else { // no spawn => build it
                    let spawnSite = flag.room.myConstructionSites.some(s => s.structureType === STRUCTURE_SPAWN);
                    if( !spawnSite ) // no spawn construction site yet
                        flag.room.createConstructionSite(spawnFlag, STRUCTURE_SPAWN); // create spawn construction site
                }
            }
        }
    }    
    return this.nextEnergyAction(creep);
};
