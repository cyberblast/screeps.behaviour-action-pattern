var Setup = function(typeName){
    this.type = typeName;
    this.fixedBody = []; 
    this.multiBody = []; 
    this.minAbsEnergyAvailable = 0; 
    this.maxMulti = 6;
    this.minControllerLevel = 0;
    this.globalMeasurement = false;
    this.sortedParts = true;
    this.bodyCosts = function(body){
        let costs = 0;
        if( body ){
            body.forEach(function(part){
                costs += PART_COSTS[part];
            });
        }
        return costs;
    };
    this.multi = function(spawn){ 
        let fixedCosts = this.bodyCosts(this.fixedBody);
        let multiCosts = this.bodyCosts(this.multiBody);
        return _.min([Math.floor( (spawn.room.energyAvailable-fixedCosts) / multiCosts), this.maxMulti]);
    }; 
    this.setParamParts = function(spawn){
        var parts = [];
        let multi = this.multi(spawn);
        for (let iMulti = 0; iMulti < multi; iMulti++) {
            parts = parts.concat(this.multiBody);
        }
        for( let iPart = 0; iPart < this.fixedBody.length; iPart ++ ){
            parts[parts.length] = this.fixedBody[iPart];
        }
        if( this.sortedParts ) 
            parts.sort(this.partsComparator);
        return parts;
    };
    this.partsComparator = function (a, b) {
        let partsOrder = [TOUGH, MOVE, WORK, CARRY, CLAIM, HEAL, ATTACK, RANGED_ATTACK];
        let indexOfA = partsOrder.indexOf(a);
        let indexOfB = partsOrder.indexOf(b);
  
        if (indexOfA < indexOfB) {
            return -1;
        } else if (indexOfA > indexOfB) {
            return 1;
        } else {
            return 0;
        }
    };
    this.buildParams = function(spawn){
        var memory = {
            setup: null,
            name: null, 
            parts: [], 
            cost: 0, 
            mother: null, 
            home: null, 
            breeding: 1
        };        
        memory.setup = this.type;
        memory.parts = this.setParamParts(spawn);
        memory.cost = this.bodyCosts(memory.parts);  
        memory.mother = spawn.name; 
        memory.home = spawn.room.name;
        for( var son = 1; memory.name == null || Game.creeps[memory.name]; son++ ) {
            memory.name = this.type + '-' + memory.cost + '-' + son;
        }
        return memory;
    }; 
    this.minEnergyAvailable = function(spawn){ return 1; }; // 1 = full
    this.maxCount = function(spawn){ return null; }; 
    this.maxWeight = function(spawn){ return null; };
    this.isValidSetup = function(spawn){
        if( spawn.room.energyAvailable < this.minAbsEnergyAvailable || spawn.room.relativeEnergyAvailable < this.minEnergyAvailable(spawn) ) 
            return false;
        let maxCount = this.maxCount(spawn);
        let maxWeight = this.maxWeight(spawn);            
        if( maxCount == 0 || maxWeight == 0 || spawn.room.controller.level < this.minControllerLevel) 
            return false;
        let population = this.globalMeasurement ? Population : spawn.room.population;
        if( !population || !population.typeCount[this.type] )
            return true;
        if( maxCount == null ) 
            maxCount = Infinity;
        if( maxWeight == null ) 
            maxWeight = Infinity;
        return population.typeCount[this.type] < maxCount && population.typeWeight[this.type] < maxWeight;
    };
}
module.exports = Setup;
