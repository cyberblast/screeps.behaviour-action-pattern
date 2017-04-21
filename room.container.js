const mod = {};
module.exports = mod;
mod.analyzeRoom = function(room, needMemoryResync) {
    if (needMemoryResync) {
        room.saveContainers();
    }
};
mod.extend = function() {
    // Containers constructor
    Room.Containers = function(room){
        this.room = room;
        Object.defineProperties(this, {
            'all': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._container) ){
                        this._container = [];
                        let add = entry => {
                            let cont = Game.getObjectById(entry.id);
                            if( cont ) {
                                _.assign(cont, entry);
                                this._container.push(cont);
                            }
                        };
                        _.forEach(this.room.memory.container, add);
                    }
                    return this._container;
                }
            },
            'controller': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._controller) ){
                        if( this.room.my && this.room.controller.memory.storage ){
                            this._controller = [Game.getObjectById(this.room.controller.memory.storage)];
                            if( !this._controller[0] ) delete this.room.controller.memory.storage;
                        } else {
                            let byType = c => c.controller == true;
                            this._controller = _.filter(this.all, byType);
                        }
                    }
                    return this._controller;
                }
            },
            'in': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._in) ){
                        let byType = c => c.controller == false;
                        this._in = _.filter(this.all, byType);
                        // add managed
                        let isFull = c => c.sum >= (c.storeCapacity * (1-MANAGED_CONTAINER_TRIGGER));
                        this._in = this._in.concat(this.managed.filter(isFull));
                    }
                    return this._in;
                }
            },
            'out': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._out) ){
                        let byType = c => c.controller == true;
                        this._out = _.filter(this.all, byType);
                        // add managed
                        let isEmpty = c => c.sum <= (c.storeCapacity * MANAGED_CONTAINER_TRIGGER);
                        this._out = this._out.concat(this.managed.filter(isEmpty));
                    }
                    return this._out;
                }
            },
            'privateers': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._privateers) ){
                        let byType = c => (c.source === false && !c.mineral && c.sum < c.storeCapacity);
                        this._privateers = _.filter(this.all, byType);
                    }
                    return this._privateers;
                }
            },
            'managed': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._managed) ){
                        let byType = c => c.source === true && c.controller == true;
                        this._managed = _.filter(this.all, byType);
                    }
                    return this._managed;
                }
            }
        });
    };
    // Container related Room variables go here

    // Room prototype extensions go here
    Room.prototype.saveContainers = function(){
        let containers = this.structures.all.filter(
            structure => structure.structureType == STRUCTURE_CONTAINER
        );
        if (containers.length > 0) {
            this.memory.container = [];
            let add = (cont) => {
                // TODO consolidate managed container code
                let minerals = this.find(FIND_MINERALS);
                let source = cont.pos.findInRange(this.sources, 2);
                let mineral = cont.pos.findInRange(minerals, 2);
                let isControllerContainer = !!(this.my && cont.pos.getRangeTo(this.controller) <= 4);
                this.memory.container.push({
                    id: cont.id,
                    source: (source.length > 0),
                    controller: isControllerContainer,
                    mineral: (mineral.length > 0),
                });
                let assignContainer = s => s.memory.container = cont.id;
                source.forEach(assignContainer);
                mineral.forEach(assignContainer);
            };
            containers.forEach(add);
        } else delete this.memory.container;

        if( this.terminal ) {
            // terminal in range <= 2 is too simplistic for certain room placements near sources. See #681
            // This solution finds all walkable source fields in a room, then compares adjacency with the terminal
            // The first room position adjacent to the terminal is remapped back to it's adjacent source for mapping to terminal
            let minerSpots = [];
            let findValidFields = s => { minerSpots = _(minerSpots).concat(Room.validFields(this.name, s.pos.x-1, s.pos.x+1, s.pos.y-1, s.pos.y+1, true)); };
            _.forEach(this.sources, findValidFields);
            let sourceField = this.terminal.pos.findClosestByRange(minerSpots, 1);
            let source = [];
            if(sourceField){
                if(this.sources.length == 1){
                    source = this.sources;
                } else {
                    source.push( sourceField.isNearTo(this.sources[0]) ? this.sources[0] : this.sources[1] );
                }
            }

            let mineral = this.terminal.pos.findInRange(this.minerals, 2);
            let assignTerminal = s => s.memory.terminal = this.terminal.id;
            source.forEach(assignTerminal);
            mineral.forEach(assignTerminal);
        }
        if( this.storage ) {
            let source = this.storage.pos.findInRange(this.sources, 2);
            let mineral = this.storage.pos.findInRange(this.minerals, 2);
            let assignStorage = s => s.memory.storage = this.storage.id;
            source.forEach(assignStorage);
            mineral.forEach(assignStorage);

            if( this.storage.pos.getRangeTo(this.controller) < 4 )
                this.controller.memory.storage = this.storage.id;
        }
    };

    Room.prototype.findContainerWith = function(resourceType, amountMin) {
        if (!amountMin) amountMin = 1;
        //if (!RESOURCES_ALL.find((r)=>{r==resourceType;})) return null;

        let data = this.memory;
        if (data && data.container && data.container.length > 0) {
            for (let i=0;i<data.container.length;i++) {
                let d = data.container[i];
                let container = Game.getObjectById(d.id);
                if (container) {
                    let amt = -container.getNeeds(resourceType);
                    if (!(this.structures.container.out.includes(container) && resourceType === RESOURCE_ENERGY) && amt > 0) {
                        let amount = amt;
                        if (amount >= amountMin) return { structure: container, amount: amount };
                    }
                }
            }
        }

        return null;
    };
    // New Room methods go here
};