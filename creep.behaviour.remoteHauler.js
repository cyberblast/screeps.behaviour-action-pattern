let mod = {};
module.exports = mod;
mod.name = 'remoteHauler';
mod.run = function(creep) {
    // Assign next Action
    let oldTargetId = creep.data.targetId;
    if( creep.action == null || creep.action.name == 'idle' ) {
        this.nextAction(creep);
    }
    
    // Do some work
    if( creep.action && creep.target ) {
        creep.action.step(creep);
    } else {
        logError('Creep without action/activity!\nCreep: ' + creep.name + '\ndata: ' + JSON.stringify(creep.data));
    }
};
mod.nextAction = function(creep){
    // at home
    if( creep.pos.roomName == creep.data.homeRoom ){
        // carrier filled
        if( creep.sum > 0 ){
            let deposit = []; // deposit energy in...
            // links?
            if( creep.carry.energy == creep.sum ) deposit = creep.room.structures.links.privateers;
            // storage?
            if( creep.room.storage ) deposit.push(creep.room.storage);
            // containers?
            if( creep.room.structures.container ) deposit = deposit.concat( creep.room.structures.container.privateers );
            // Choose the closest
            if( deposit.length > 0 ){
                let target = creep.pos.findClosestByRange(deposit);
                if( target.structureType == STRUCTURE_STORAGE && this.assign(creep, Creep.action.storing) ) return;
                else if( this.assign(creep, Creep.action.charging, target) ) return;
            }
            if( this.assign(creep, Creep.action.charging) ) return;
            // no deposit :/ 
            // try spawn & extensions
            if( this.assign(creep, Creep.action.feeding) ) return;
            // TODO: hauler shouldn't work. drop at spawn instead of calling worker behaviour
            Creep.behaviour.worker.nextAction(creep);
            return;
        }
        // empty
        // travelling
        this.gotoTargetRoom(creep);
        return;
    }
    // at target room
    else if( creep.data.destiny.room == creep.pos.roomName ){
        // if it's not full
        if( creep.sum < (creep.carryCapacity*0.8) ) {
            // get some energy
            if( this.assign(creep, Creep.action.picking) ) return;
            if( this.assign(creep, Creep.action.uncharging) ) return;
        }
        // carrier full or everything picked
        this.goHome(creep);
        return;
    }
    // somewhere
    else {
        if( creep.sum > 0 )
            this.goHome(creep);
        else
            this.gotoTargetRoom(creep);
        return;
    }
    // fallback
    // recycle self
    let mother = Game.spawns[creep.data.motherSpawn];
    if( mother ) {
        this.assign(creep, Creep.action.recycling, mother);
    }
};
mod.assign = function(creep, action, target){        
    return (action.isValidAction(creep) && action.isAddableAction(creep) && action.assign(creep, target));
};
mod.gotoTargetRoom = function(creep){
    return Creep.action.travelling.assign(creep, Game.flags[creep.data.destiny.targetName]);
};
mod.goHome = function(creep){
    return Creep.action.travelling.assign(creep, Game.rooms[creep.data.homeRoom].controller);
};
