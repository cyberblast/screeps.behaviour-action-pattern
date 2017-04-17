const TowerAction = class extends Action {
    
    constructor(...args) {
        super(...args);
        
        this.targetRange = 40;
    }

    step(tower) {
        // TODO: Move base tower logic here
        const workResult = this.work(tower);
        if (workResult !== OK) {
            delete tower.action;
            delete tower.target;
        }
    }
    
    registerAction(tower, target) {
        Tower.registerAction(tower, target, this);
        this.onAssignment(tower, target);
    }
    
    onAssignment(tower, target) {
        if (target instanceof RoomObject && VISUALS.ACTION_ASSIGNMENT) {
            Visuals.drawArrow(tower, target);
        }
    }

};
module.exports = TowerAction;