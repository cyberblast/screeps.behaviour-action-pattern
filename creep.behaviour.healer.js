class Healer extends Creep.Behaviour {
    constructor(name = 'healer') {
        super(name);
    }
    run(creep) {
        // Assign next Action
        let oldTargetId = creep.data.targetId;
        if( creep.action === null || ['guarding','idle'].includes(creep.action.name)) {
            this.nextAction(creep);
        }
        
        // Do some work
        if( creep.action && creep.target ) {
            creep.action.step(creep);
        } else {
            logError('Creep without action/activity!\nCreep: ' + creep.name + '\ndata: ' + JSON.stringify(creep.data));
        }
    }
    actions(creep) {
        return [
            Creep.action.healing,
            Creep.action.guarding
        ];
    }
}
module.exports = Healer;
