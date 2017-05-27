const mod = new Creep.Behaviour('remoteHauler');
module.exports = mod;
mod.nextAction = function(creep) {
    const flag = creep.data.destiny && Game.flags[creep.data.destiny.targetName];
    if (!flag) {
        //TODO: in the future look for a nearby room we can support
        return Creep.action.recycling.assign(creep);
    }
    
    // at home
    if (creep.pos.roomName == creep.data.homeRoom){
        // carrier filled
        if (creep.sum > 0){
            let deposit = []; // deposit energy in...
            // links?
            if (creep.carry.energy == creep.sum) deposit = creep.room.structures.links.privateers;
            // storage?
            if (creep.room.storage) deposit.push(creep.room.storage);
            // containers?
            if (creep.room.structures.container) deposit = deposit.concat(creep.room.structures.container.privateers);
            // Choose the closest
            if (deposit.length > 0) {
                let target = creep.pos.findClosestByRange(deposit);
                if (target.structureType == STRUCTURE_STORAGE && this.assignAction(creep, 'storing', target)) return;
                else if (this.assignAction(creep, 'charging', target)) return;
                else if (this.assignAction(creep, 'storing')) return; // prefer storage
            }
            if (this.assignAction(creep, 'charging')) return;
            // no deposit :/ 
            // try spawn & extensions
            if (this.assignAction(creep, 'feeding')) return;
            if (this.assignAction(creep, 'dropping')) return;
            else {
                const drop = r => { if(creep.carry[r] > 0) creep.drop(r); };
                _.forEach(Object.keys(creep.carry), drop);
                return this.assignAction(creep, 'idle');
            }
        }
        // empty
        // travelling
        if (this.gotoTargetRoom(creep)) {
            return;
        }
    }
    // at target room
    else if (creep.data.destiny.room == creep.pos.roomName) {
        // TODO: This should perhaps check which distance is greater and make this decision based on that plus its load size
        if (creep.sum / creep.carryCapacity > REMOTE_HAULER.MIN_LOAD) {
            this.goHome(creep);
            return;
        }
        // picking last until we have strategies that can compare cost vs benefit otherwise remoteHaulers bounce between piles of dropped energy
        if (this.assignAction(creep, 'uncharging')) return;
        // if (this.assignAction(creep, Creep.action.robbing)) return;
        if (this.assignAction(creep, 'picking')) return;
        // wait
        if (creep.sum === 0) {
            let source = creep.pos.findClosestByRange(creep.room.sources);
            if (creep.room && source && creep.pos.getRangeTo(source) > 3) {
                creep.data.travelRange = 3;
                return this.assignAction(creep, 'travelling', source);
            }
        }
        return this.assignAction(creep, 'idle');
    }
    // somewhere
    else {
        let ret = false;
        // TODO: This should perhaps check which distance is greater and make this decision based on that plus its load size
        if (creep.sum / creep.carryCapacity > REMOTE_HAULER.MIN_LOAD)
            ret = this.goHome(creep);
        else
            ret = this.gotoTargetRoom(creep);
        if (ret) {
            return;
        }
    }
    // fallback
    // recycle self
    let mother = Game.spawns[creep.data.motherSpawn];
    if (mother) {
        this.assignAction(creep, Creep.action.recycling, mother);
    }
};
mod.gotoTargetRoom = function(creep){
    const targetFlag = creep.data.destiny ? Game.flags[creep.data.destiny.targetName] : null;
    if (targetFlag) return Creep.action.travelling.assignRoom(creep, targetFlag.pos.roomName);
};
mod.goHome = function(creep){
    return Creep.action.travelling.assignRoom(creep, creep.data.homeRoom);
};
mod.strategies.picking = {
    name: `picking-${mod.name}`,
    energyOnly: false
};
