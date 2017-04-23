const mod = {};
module.exports = mod;
mod.analyzeRoom = function(room, needMemoryResync) {
    if (needMemoryResync) {
        room.saveLinks();
    }
    if (room.structures.links.all.length > 0) room.linkDispatcher();
};
mod.extend = function() {
    // Links constructor
    Room.Links = function(room){
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
                        _.forEach(this.room.memory.links, add);
                    }
                    return this._all;
                }
            },
            'controller': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._controller) ){
                        let byType = c => c.controller === true;
                        this._controller = this.all.filter(byType);
                    }
                    return this._controller;
                }
            },
            'storage': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._storage) ) {
                        let byType = l => l.storage == true;
                        this._storage = this.all.filter(byType);
                    }
                    return this._storage;
                }
            },
            'in': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._in) ) {
                        let byType = l => l.storage == false && l.controller == false;
                        this._in = _.filter(this.all, byType);
                    }
                    return this._in;
                }
            },
            'privateers': {
                configurable: true,
                get: function() {
                    if( _.isUndefined(this._privateers) ) {
                        let byType = l => l.storage == false && l.controller == false && l.source == false && l.energy < l.energyCapacity * 0.85;
                        this._privateers = _.filter(this.all, byType);
                    }
                    return this._privateers;
                }
            }
        });
    };
    // Link related Room variables go here
    Room.prototype.saveLinks = function() {
        let links = this.find(FIND_MY_STRUCTURES, {
            filter: (structure) => ( structure.structureType == STRUCTURE_LINK )
        });
        if (links.length > 0) {
            this.memory.links = [];
            let storageLinks = this.storage ? this.storage.pos.findInRange(links, 2).map(l => l.id) : [];

            // for each memory entry, keep if existing
            /*
            let kept = [];
            let keep = (entry) => {
                if( links.find( (c) => c.id == entry.id )){
                    entry.storage = storageLinks.includes(entry.id);
                    kept.push(entry);
                }
            };
            this.memory.links.forEach(keep);
            this.memory.links = kept;
            */
            this.memory.links = [];

            // for each link add to memory ( if not contained )
            let add = (link) => {
                // TODO consolidate managed container code
                if( !this.memory.links.find( (l) => l.id == link.id ) ) {
                    let isControllerLink = ( link.pos.getRangeTo(this.controller) <= 4 );
                    let isSource = false;
                    if( !isControllerLink ) {
                        let source = link.pos.findInRange(this.sources, 2);
                        let assign = s => s.memory.link = link.id;
                        source.forEach(assign);
                        isSource = source.length > 0;
                    }
                    this.memory.links.push({
                        id: link.id,
                        storage: storageLinks.includes(link.id),
                        controller: isControllerLink,
                        source: isSource
                    });
                }
            };
            links.forEach(add);
        } else delete this.memory.links;
    };

    Room.prototype.linkDispatcher = function() {
        let filled = l => l.cooldown == 0 && l.energy >= (l.energyCapacity * (l.source ? 0.85 : 0.5));
        let empty = l =>  l.energy < l.energyCapacity * 0.15;
        let filledIn = this.structures.links.in.filter(filled);
        let emptyController = this.structures.links.controller.filter(empty);

        if( filledIn.length > 0  ){
            let emptyStorage = this.structures.links.storage.filter(empty);

            let handleFilledIn = f => { // first fill controller, then storage
                if( emptyController.length > 0 ){
                    f.transferEnergy(emptyController[0]);
                    emptyController.shift();
                } else if( emptyStorage.length > 0 ){
                    f.transferEnergy(emptyStorage[0]);
                    emptyStorage.shift();
                }
            };
            filledIn.forEach(handleFilledIn);
        }

        if( emptyController.length > 0 ){ // controller still empty, send from storage
            let filledStorage = this.structures.links.storage.filter(filled);
            let handleFilledStorage = f => {
                if( emptyController.length > 0 ){
                    f.transferEnergy(emptyController[0]);
                    emptyController.shift();
                }
            };
            filledStorage.forEach(handleFilledStorage);
        }
    };
    // Room prototype extensions go here

    // New room methods go here
};