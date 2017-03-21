let mod = {};
module.exports = mod;
mod.constructor = function(room){
    this.room = room;
    Object.defineProperties(this, {
        'all': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this.room.memory.nukers)) {
                    this.room.saveNukers();
                }
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
mod.extend = function() {
    Room.prototype.saveNukers = function() {
        let nukers = this.find(FIND_MY_STRUCTURES, {
            filter: (structure) => ( structure.structureType == STRUCTURE_NUKER )
        });
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
    };
};
mod.analyze = function(room) {
    if( Game.time % MEMORY_RESYNC_INTERVAL == 0 || room.name == 'sim' ) room.saveNukers();
};
mod.flush = function(room) {

};