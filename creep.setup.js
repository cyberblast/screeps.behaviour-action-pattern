var setup = {
    type: null,
    body: [], 
    defaultBodyCosts: 0, 
    maxMulti: 6,
    bodyCosts: function(body){
        var costs = 0;
        body.forEach(function(part){
            costs += PART_COSTS[part];
        });
        return costs;
    },
    multi: function(spawn){ 
        return _.min([Math.floor(spawn.room.energyAvailable / this.defaultBodyCosts), this.maxMulti]) 
    }, 
    multiplicationPartwise: true,
    setParamParts: function(spawn){
        var parts = [];
        var multi = this.multi(spawn);
        if( this.multiplicationPartwise ) {
            for( var iPart = 0; iPart < this.body.length; iPart ++ ){
                for( var iMulti = 0; iMulti < multi; iMulti++){
                    parts[parts.length] = this.body[iPart];
                }
            }
        } else {
            for (var iMulti = 0; iMulti < multi; iMulti++) {
                parts = parts.concat(this.body);
            }
        }
        return parts;
    },
    buildParams: function(spawn){
        var memory = {
            id: null, 
            parts: []
        };
        
        memory.setup = this.type;
        memory.parts = this.setParamParts(spawn);
        memory.cost = this.bodyCosts(memory.parts);  
        memory.mother = spawn.name;
        for( var son = 1; memory.id == null || Game.creeps[memory.id]; son++ ) {
            memory.id = this.type + '-' + memory.cost + '-' + son;
        }
        return memory;
    }, 
    minEnergyCapacityAvailable: function(spawn){ return 1; }, // 1 = full
    maxCount: function(spawn){ return 0; }, 
    maxWeight: function(spawn){ return 0; },
    isValidSetup: function(spawn){
        var room = spawn.room;
        var population = room.population[this.type];
        
        return (room.energyAvailable >= (room.energyCapacityAvailable * this.minEnergyCapacityAvailable(spawn)) && (
            !population || (
            population.count < this.maxCount(spawn)  && 
            population.weight < this.maxWeight(spawn))));
    }
}

module.exports = setup;