module.exports = {
    name: 'remoteHauler',
    run: function(creep) {
        // Assign next Action
        let oldTargetId = creep.data.targetId;
        if( creep.action == null || creep.action.name == 'idle' ) {
            this.nextAction(creep);
        }
        if( creep.data.targetId != oldTargetId ) {
            delete creep.data.path;
        }
        // Do some work
        if( creep.action && creep.target ) {
            creep.action.step(creep);
        } else {
            logError('Creep without action/activity!\nCreep: ' + creep.name + '\ndata: ' + JSON.stringify(creep.data));
        }
    },
    nextAction: function(creep){
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
            // get any containers less than 2 away from the creep.
            let closeContainers = creep.pos.findInRange(FIND_STRUCTURES, 2, { filter: { structureType: STRUCTURE_CONTAINER }});
            // if it's not full
            if( creep.sum < (creep.carryCapacity*0.8) ) {
                // if creep has already picked energy off ground pull from close container instead of traveling to other source.
                if( closeContainers.length > 0 && this.assign(creep, Creep.action.uncharging, closeContainers[0])) return;
                // get some energy
                if( this.assign(creep, Creep.action.picking) ) return;
                if( this.assign(creep, Creep.action.uncharging) ) return;
            } else if ( creep.sum < (creep.carryCapacity*0.95) ) {
                // reason why creep.carryCapacity*0.95 is due to creep repairing roads and containers that are low
                // why go home if close to container? 
                if( closeContainers.length > 0 && this.assign(creep, Creep.action.uncharging, closeContainers[0])) return;
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
    },
    assign: function(creep, action, target){        
        return (action.isValidAction(creep) && action.isAddableAction(creep) && action.assign(creep, target));
    },
    gotoTargetRoom: function(creep){
        // TODO: remove  || creep.data.destiny.flagName (temporary backward compatibility)
        return Creep.action.travelling.assign(creep, Game.flags[creep.data.destiny.targetName || creep.data.destiny.flagName]);
    },
    goHome: function(creep){
        return Creep.action.travelling.assign(creep, Game.rooms[creep.data.homeRoom].controller);
    }
}