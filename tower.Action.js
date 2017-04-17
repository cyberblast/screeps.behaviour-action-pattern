const TowerAction = class extends Action {
    
    constructor(...args) {
        super(...args);
        
        this.targetRange = 40;
    }

    step(tower) {
        // TODO: Move base tower logic here
    }

};
module.exports = TowerAction;