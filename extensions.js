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
                if(_.isUndefined(this._towers) || this._towersSet != Game.time) {
                    this._towersSet = Game.time;
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
        Object.defineProperty(Source.prototype, 'container', {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._container) ) {
                    if( this.memory.container ) {
                        this._container = Game.getObjectById(this.memory.container);
                        if( !this._container ) delete this.memory.container;
                    } else this._container = null;
                }
                return this._container;
            }
        });        
         Object.defineProperty(Mineral.prototype,'memory', {
            configurable: true,
            get: function() {
                if(_.isUndefined(Memory.minerals)) {
                    Memory.minerals = {};
                }
                if(!_.isObject(Memory.minerals)) {
                    return undefined;
                }
                return Memory.minerals[this.id] = Memory.minerals[this.id] || {};
            },
            set: function(value) {
                if(_.isUndefined(Memory.minerals)) {
                    Memory.minerals = {};
                }
                if(!_.isObject(Memory.minerals)) {
                    throw new Error('Could not set memory extension for minerals');
                }
                Memory.minerals[this.id] = value;
            }
        });

        Object.defineProperty(Mineral.prototype, 'accessibleFields', {
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
        Object.defineProperty(Mineral.prototype, 'container', {
            configurable: true,
            get: function() {
                let that = this;
                if( _.isUndefined(this.memory.container)) {
                    let c = this.room.structures.all.filter(c => c.structureType == STRUCTURE_CONTAINER && c.pos.getRangeTo(that.pos) <= 2);
                    if (c.length > 0) this.memory.container = c[0].id;
                };

                if( _.isUndefined(this._container) ) {
                    if( this.memory.container ) {
                        this._container = Game.getObjectById(this.memory.container);
                        if( !this._container ) delete this.memory.container;
                    } else this._container = null;
                }
                return this._container;
            }
        });
        Object.defineProperty(Source.prototype, 'link', {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._link) ) {
                    if( this.memory.link ) {
                        this._link = Game.getObjectById(this.memory.link);
                        if( !this._link ) delete this.memory.link;
                    } else this._link = null;
                }
                return this._link;
            }
        });
        Object.defineProperty(StructureStorage.prototype, 'sum', {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._sum) || this._sumSet != Game.time ) {
                    this._sumSet = Game.time;
                    this._sum = _.sum(this.store);
                }
                return this._sum;
            }
        });
        Object.defineProperty(StructureTerminal.prototype, 'sum', {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._sum) || this._sumSet != Game.time ) {
                    this._sumSet = Game.time;
                    this._sum = _.sum(this.store);
                }
                return this._sum;
            }
        });
        Object.defineProperty(StructureContainer.prototype, 'sum', {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._sum) || this._sumSet != Game.time ) {
                    this._sumSet = Game.time;
                    this._sum = _.sum(this.store);
                }
                return this._sum;
            }
        });
    }
}
module.exports = mod;
