const mod = {};
module.exports = mod;
mod.extend = function() {
    Object.defineProperties(Room.prototype, {
        'powerBank': {
            configurable: true,
            get: function() {
                if (_.isUndefined(this.memory.powerBank)) {
                    [this._powerBank] = this.find(FIND_STRUCTURES, {
                        filter: s => s instanceof StructurePowerBank
                    });
                    if (this._powerBank) {
                        this.memory.powerBank = this._powerBank.id;
                    }
                }
                if (_.isUndefined(this._powerBank)) {
                    this._powerBank = Game.getObjectById(this.memory.powerBank);
                }
                return this._powerBank;
            },
        },
    });
    Room.prototype.checkPowerBank = function() {
    if (!this.powerBank) return; // no power bank in room
        //power > 2500, and ticksToDecay > 4500
        const currentFlags = FlagDir.count(FLAG_COLOR.invade.powerMining, this.powerBank.pos, false);
        const flagged = FlagDir.find(FLAG_COLOR.invade.powerMining, this.powerBank.pos, true);
        if(!flagged && currentFlags < MAX_AUTO_POWER_MINING_FLAGS){
            if(this.powerBank.power > 2500 && this.powerBank.ticksToDecay > 4500){
                // Place a flag
                this.createFlag(this.powerBank.pos, null, FLAG_COLOR.invade.powerMining.color, FLAG_COLOR.invade.powerMining.secondaryColor);
            }
        }
    };
};
mod.analyze = function(room) {

};
mod.flush = function(room) {
    if (!room._powerBank) {
        delete room.memory.powerBank;
    }
};