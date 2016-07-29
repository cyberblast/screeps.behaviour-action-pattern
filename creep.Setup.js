var Setup = function(typeName){
    this.type = typeName;
    this.fixedBody = []; 
    this.multiBody = []; 
    this.minAbsEnergyAvailable = 0; 
    this.maxMulti = 6;
    this.minControllerLevel = 0;
    this.globalMeasurement = false;
    this.multiplicationPartwise = true;
    this.bodyCosts = function(body){
        var costs = 0;
        if( body ){
            body.forEach(function(part){
                costs += PART_COSTS[part];
            });
        }
        return costs;
    };
    this.multi = function(spawn){ 
        var fixedCosts = this.bodyCosts(this.fixedBody);
        var multiCosts = this.bodyCosts(this.multiBody);
        return _.min([Math.floor( (spawn.room.energyAvailable-fixedCosts) / multiCosts), this.maxMulti]);
    }; 
    this.setParamParts = function(spawn){
        var parts = [];
        var multi = this.multi(spawn);
        if( this.multiplicationPartwise ) {
            for( var iPart = 0; iPart < this.multiBody.length; iPart ++ ){
                for( var iMulti = 0; iMulti < multi; iMulti++){
                    parts[parts.length] = this.multiBody[iPart];
                }
            }
            for( var iPart = 0; iPart < this.fixedBody.length; iPart ++ ){
                parts[parts.length] = this.fixedBody[iPart];
            }
        } else {
            for (var iMulti = 0; iMulti < multi; iMulti++) {
                parts = parts.concat(this.multiBody);
            }
            for( var iPart = 0; iPart < this.fixedBody.length; iPart ++ ){
                parts[parts.length] = this.fixedBody[iPart];
            }
        }
        return parts;
    };
    this.buildParams = function(spawn){
        var memory = {
            setup: null,
            id: null, 
            parts: [], 
            cost: 0, 
            mother: null, 
            home: null, 
            spawning: 1
        };
        
        memory.setup = this.type;
        memory.parts = this.setParamParts(spawn);
        memory.cost = this.bodyCosts(memory.parts);  
        memory.mother = spawn.name; 
        memory.home = spawn.room.name;
        for( var son = 1; memory.id == null || Game.creeps[memory.id]; son++ ) {
            memory.id = this.type + '-' + memory.cost + '-' + son;
        }
        return memory;
    }; 
    this.minEnergyAvailable = function(spawn){ return 1; }; // 1 = full
    this.maxCount = function(spawn){ return 0; }; 
    this.maxWeight = function(spawn){ return 0; };
    this.isValidSetup = function(spawn){

        if( spawn.room.energyAvailable < this.minAbsEnergyAvailable || spawn.room.relativeEnergyAvailable < this.minEnergyAvailable(spawn) ) 
            return false;

        var maxCount = this.maxCount(spawn);
        var maxWeight = this.maxWeight(spawn);            
        if( maxCount == 0 || maxWeight == 0 || spawn.room.controller.level < this.minControllerLevel) 
            return false;

        var population = this.globalMeasurement ? Game.population[this.type] : spawn.room.population[this.type];
        if( !population ) 
            return true;

        if( maxCount == null ) 
            maxCount = Infinity;
        if( maxWeight == null ) 
            maxWeight = Infinity;
            
        return (population.count < maxCount && population.weight < maxWeight);
    };
}

module.exports = Setup;