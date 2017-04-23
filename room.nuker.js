const mod = {};
module.exports = mod;
mod.analyzeRoom = function(room, needMemoryResync) {
    if (needMemoryResync) {
        room.saveNuker();
    }
};
mod.extend = function() {
    Room.Nuker = function(room){
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
                        _.forEach(this.room.memory.nukers, add);
                    }
                    return this._all;
                }
            },
        });
    };
    Room.prototype.saveNuker = function() {
        let nukers = this.find(FIND_MY_STRUCTURES, {
            filter: (structure) => ( structure.structureType == STRUCTURE_NUKER )
        });
        if (nukers.length > 0) {
            this.memory.nukers = [];

            // for each entry add to memory ( if not contained )
            let add = (nuker) => {
                let nukerData = this.memory.nukers.find( (l) => l.id == nuker.id );
                if( !nukerData ) {
                    this.memory.nukers.push({
                        id: nuker.id,
                    });
                }
            };
            nukers.forEach(add);
        } else delete this.memory.nukers;
    };
};