const mod = {};
module.exports = mod;
mod.analyzeRoom = function(room, needMemoryResync) {
    if (needMemoryResync) {
        room.savePowerSpawn();
    }
    if (room.structures.powerSpawn) room.processPower();
};
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

    Room.PowerSpawn = function(room){
        this.room = room;
        Object.defineProperties(this, {
            'all': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._all) ){
                        this._all = [];
                        let add = entry => {
                            let o = Game.getObjectById(entry.id);
                            if( o ) {
                                _.assign(o, entry);
                                this._all.push(o);
                            }
                        };
                        _.forEach(this.room.memory.powerSpawns, add);
                    }
                    return this._all;
                }
            },
        });
    };

    Room.prototype.savePowerSpawn = function() {
        let powerSpawns = this.find(FIND_MY_STRUCTURES, {
            filter: (structure) => ( structure.structureType == STRUCTURE_POWER_SPAWN )
        });
        if (powerSpawns.length > 0) {
            this.memory.powerSpawns = [];

            // for each entry add to memory ( if not contained )
            let add = (powerSpawn) => {
                let powerSpawnData = this.memory.powerSpawns.find( (l) => l.id == powerSpawn.id );
                if( !powerSpawnData ) {
                    this.memory.powerSpawns.push({
                        id: powerSpawn.id,
                    });
                }
            };
            powerSpawns.forEach(add);
        } else delete this.memory.powerSpawns;
    };

    Room.prototype.processPower = function() {
        // run lab reactions WOO!
        let powerSpawns = this.find(FIND_MY_STRUCTURES, { filter: (s) => { return s.structureType == STRUCTURE_POWER_SPAWN; } } );
        for (var i=0;i<powerSpawns.length;i++) {
            // see if the reaction is possible
            let powerSpawn = powerSpawns[i];
            if (powerSpawn.energy >= POWER_SPAWN_ENERGY_RATIO && powerSpawn.power >= 1) {
                if (global.DEBUG && global.TRACE) trace('Room', { roomName: this.name, actionName: 'processPower' });
                powerSpawn.processPower();
            }
        }
    };
};
mod.flushRoom = function(room) {
    if (!room._powerBank) {
        delete room.memory.powerBank;
    }
};