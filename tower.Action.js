const TowerAction = class extends Action {
    
    constructor(...args) {
        super(...args);
        
        this.targetRange = 40;
    }
    
    isAddableAction(tower) {
        return super.isAddableAction(tower) || !tower.room.towers || !tower.room.towers.actionCount[this.name] || !tower.room.towers.actionCount[this.id] < this.maxPerAction;
    }
    
    isAddableTarget(targt, object) {
        return this.maxPerTarget === Infinity || !target.towers || _.filter(target.towers, {actionName: this.name}).length < this.maxPerTarget;
    }

    step(tower) {
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