module.exports = {
    name: 'mobileStorage',
    actionPriority: [
        Creep.action.delivering,
        Creep.action.storage,
        Creep.action.idle,
    ],
    run(creep) {
        if (!creep.action || creep.action.name === 'idle' ||
            (creep.action.name === 'storage' && (!creep.flag || creep.flag.pos.roomName === creep.pos.roomName || creep.leaveBorder()))) {
            this.nextAction(creep);
        }
        
        if (creep.action && creep.target) {
            creep.action.step(creep);
        } else {
            logError(`Creep without action/activity!\nCreep: ${creep.name}\ndata: ${JSON.stringify(creep.data)}`);
        }
    },
    nextAction(creep) {
        for (let action of this.actionPriority) {
            if (action.isValidAction(creep) &&
                action.isAddableAction(creep) &&
                action.assign(creep)) {
                return;
            }
        }
    },
    
};