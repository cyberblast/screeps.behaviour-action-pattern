var mod = {
    extend: function(){
        /*
        Object.defineProperty(Structure.prototype, 'memory', {
            configurable: true,
            get: function() {
                if(_.isUndefined(Memory.structures)) {
                    Memory.structures = {};
                }
                if(!_.isObject(Memory.structures)) {
                    return undefined;
                }
                return Memory.structures[this.id] = Memory.structures[this.id] || {};
            },
            set: function(value) {
                if(_.isUndefined(Memory.structures)) {
                    Memory.structures = {};
                }
                if(!_.isObject(Memory.structures)) {
                    throw new Error('Could not set memory extension for structures');
                }
                Memory.structures[this.id] = value;
            }
        });
        */
        Object.defineProperty(Structure.prototype, 'towers', {
            configurable: true,
            get: function() {
                if(_.isUndefined(this._towers)) {
                    this._towers = [];
                }
                return this._towers;
            },
            set: function(value) {
                this._towers = value;
            }
        });
        Object.defineProperty(Source.prototype, 'memory', {
            configurable: true,
            get: function() {
                if(_.isUndefined(Memory.sources)) {
                    Memory.sources = {};
                }
                if(!_.isObject(Memory.sources)) {
                    return undefined;
                }
                return Memory.sources[this.id] = Memory.sources[this.id] || {};
            },
            set: function(value) {
                if(_.isUndefined(Memory.sources)) {
                    Memory.sources = {};
                }
                if(!_.isObject(Memory.sources)) {
                    throw new Error('Could not set memory extension for sources');
                }
                Memory.sources[this.id] = value;
            }
        });
        Object.defineProperty(Source.prototype, 'accessibleFields', {
            configurable: true,
            get: function() {
                if( _.isUndefined(this.memory.accessibleFields) ) {
                    var fields = this.room.lookForAtArea(LOOK_TERRAIN, this.pos.y-1, this.pos.x-1, this.pos.y+1, this.pos.x+1, true);
                    let walls = _.countBy( fields , "terrain" ).wall;
                    this.memory.accessibleFields = walls === undefined ? 9 : 9-walls;
                }
                return this.memory.accessibleFields;
            }
        });
        Object.defineProperty(StructureStorage.prototype, 'sum', {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._sum) ) {
                    this._sum = _.sum(this.store);
                }
                return this._sum;
            }
        });
    }
}
module.exports = mod;
