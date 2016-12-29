var mod = {
    register: () => {
        Room.newInvader.on( flag => Task.defense.handleNewInvader(invaderCreep) );
        Room.goneInvader.on( flag => Task.defense.handleGoneInvader(invaderId) );
        Creep.died.on( params => Task.defense.handleCreepDied(creepName) );
    },
    handleNewInvader: invaderCreep => {
        // check if it is REALLY a new invader or a known one that changed the room
        // if its not really new one clean up the rooms memory & update task memory, maybe creep instructions
        // if it is new spawn a creep
        // except if its in an owned room => evaluate threat vs tower power
        // if tower power > threat then ignore
    },
    handleGoneInvader: invaderId => {
        // cleanup task memory
    },
    handleCreepDied: creepName => {
        // check if its our creep
        // if it is our creep and the invader is still there spawn another (bigger) creep
    },
    memory: invaderId => {
        // new memory namespace required
    },
    spawn: invaderCreep => {
        // analyze invader threat and create something bigger
        // could also require spawning of multiple creeps
    },
    nextAction: creep => {
        // override behaviours nextAction function
        // this could be a global approach to manipulate creep behaviour
        // change behaviour files

        // if invader gone (task memory deleted) check if there are other invaders nearby = reconfigure tasks
        // if there is NO invader: recycle creep = travelling, then recycling

        // if not at target room go there = travelling
        // if at target room attack invader = defending
    }
};

module.exports = mod; 