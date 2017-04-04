class CollapseWorker extends Creep.Behaviour.Worker {
    constructor(name = 'collapseWorker') {
        super(name);
        this.defaultStrategy.canWithdrawEnergy = function(creep, target) {
            return function(amount) {
                return amount > 0;
            };
        };
    }
    inflowActions(creep) {
        let priority = [
            Creep.action.picking,
            Creep.action.withdrawing,
            Creep.action.uncharging,
            Creep.action.harvesting,
            Creep.action.dismantling,
            Creep.action.reallocating,
        ];
        if (creep.sum > creep.carry.energy) {
            priority.unshift(Creep.action.storing);
        }
        return priority;
    }
    outflowActions(creep) {
        let priority;
        if( creep.room.situation.invasion && creep.room.controller && creep.room.controller.level > 2 ) {
            priority = [
                Creep.action.feeding,
                Creep.action.fueling,
                Creep.action.repairing
            ];
        } else {
            priority = [
                Creep.action.feeding,
                Creep.action.fueling,
                Creep.action.charging,
                Creep.action.repairing,
                Creep.action.building,
                Creep.action.fortifying,
                Creep.action.upgrading,
                Creep.action.storing,
                Creep.action.picking
            ];
        }
        if( creep.room.controller && creep.room.controller.ticksToDowngrade < 500 ) { // urgent upgrading
            priority.unshift(Creep.action.upgrading);
        }
    }
    nextAction(creep) {
        if( creep.pos.roomName !== creep.data.homeRoom ) {
            if( DEBUG && TRACE ) trace('Behaviour', {actionName:'travelling', behaviourName:this.name, creepName:creep.name, assigned: true, Behaviour:'nextAction', Action:'assign'});
            Creep.action.travelling.assignRoom(creep, creep.data.homeRoom);
            return true;
        }

        if( !creep.room.collapsed ) {
            return Creep.action.recycling.assign(creep);
        }
        return super.nextAction(creep);
    }
}
module.exports = CollapseWorker;
