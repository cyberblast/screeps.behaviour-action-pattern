class Melee extends Creep.Behaviour {
    constructor(name = 'melee') {
        super(name);
    }
    run(creep) {
        creep.flee = creep.flee || !creep.hasActiveBodyparts([ATTACK, RANGED_ATTACK]);
        creep.attacking = false;
        creep.attackingRanged = false;
        // Assign next Action
        let oldTargetId = creep.data.targetId;
        if (!creep.action || creep.action.name === 'idle' ||
            (creep.action.name === 'guarding' &&
                (!creep.flag || creep.flag.pos.roomName === creep.pos.roomName || creep.leaveBorder())
            )
        ) {
            if( creep.data.destiny && creep.data.destiny.task && Task[creep.data.destiny.task] && Task[creep.data.destiny.task].nextAction ) 
                Task[creep.data.destiny.task].nextAction(creep);
            else this.nextAction(creep);
        }
        
        // Do some work
        if( creep.action && creep.target ) {
            creep.action.step(creep);
        } else {
            logError('Creep without action/activity!\nCreep: ' + creep.name + '\ndata: ' + JSON.stringify(creep.data));
        }

        this.heal(creep);
    }
    heal(creep){
        if( !creep.attacking && creep.data.body.heal !== undefined && creep.hits < creep.hitsMax ){
            creep.heal(creep);
        }
    }
    actions(creep) {
        return [
            Creep.action.defending,
            Creep.action.invading,
            Creep.action.guarding
        ];
    }
}
module.exports = Melee;
