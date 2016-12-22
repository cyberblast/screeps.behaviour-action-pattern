var Setup = function(typeName){
    this.none = {
        fixedBody: [],
        multiBody: [],
        minAbsEnergyAvailable: Infinity,
        minEnergyAvailable: 1,
        maxMulti: 0,
        maxCount: 0,
        maxWeight: 0
    },
    this.RCL = {
        1: this.none,
        2: this.none,
        3: this.none,
        4: this.none,
        5: this.none,
        6: this.none,
        7: this.none,
        8: this.none
    }

    this.type = typeName;
    this.minControllerLevel = 0;
    this.globalMeasurement = false;
    this.measureByHome = false;
    this.sortedParts = true;
    this.mixMoveParts = false;

    this.SelfOrCall = function(obj, param) {
        if( obj == null ) return null;
        if (typeof obj === 'function' )
            return obj(param);
        else return obj;
    };
    this.fixedBody = function(room){ return this.SelfOrCall(this.RCL[room.controller.level].fixedBody, room); };
    this.multiBody = function(room){ return this.SelfOrCall(this.RCL[room.controller.level].multiBody, room); };
    this.minAbsEnergyAvailable = function(room){ return this.SelfOrCall(this.RCL[room.controller.level].minAbsEnergyAvailable, room); };
    this.minEnergyAvailable = function(room){ return this.SelfOrCall(this.RCL[room.controller.level].minEnergyAvailable, room); }; // 1 = full
    this.maxMulti = function(room){ return this.SelfOrCall(this.RCL[room.controller.level].maxMulti, room); };
    this.maxCount = function(room){ return this.SelfOrCall(this.RCL[room.controller.level].maxCount, room); };
    this.maxWeight = function(room){ return this.SelfOrCall(this.RCL[room.controller.level].maxWeight, room); };

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
        memory.parts = this.parts(spawn.room);
        memory.cost = Creep.Setup.bodyCosts(memory.parts);
        memory.mother = spawn.name;
        memory.home = spawn.pos.roomName;
        for( var son = 1; memory.name == null || Game.creeps[memory.name]; son++ ) {
            memory.name = this.type + '-' + memory.cost + '-' + son;
        }
        return memory;
    };
    this.isValidSetup = function(room){
        if( room.controller.level < this.minControllerLevel )
            return false;

        let rcl = this.RCL[room.controller.level];
        let minAbsEnergyAvailable = this.SelfOrCall(rcl.minAbsEnergyAvailable, room);
        let minEnergyAvailable = this.SelfOrCall(rcl.minEnergyAvailable, room);
        if( room.remainingEnergyAvailable < minAbsEnergyAvailable ||
            room.relativeRemainingEnergyAvailable < minEnergyAvailable )
            return false;

        let maxCount = this.SelfOrCall(rcl.maxCount, room);
        let maxWeight = this.SelfOrCall(rcl.maxWeight, room);
        if( maxCount == 0 || maxWeight == 0 )
            return false;
        if( maxCount == null )
            maxCount = Infinity;
        if( maxWeight == null )
            maxWeight = Infinity;

        let existingCount = 0;
        let existingWeight = 0;
        if( this.measureByHome ){
            let home = room.name;
            let count = entry => {
                if( entry.creepType == this.type && entry.homeRoom == home ){
                    existingCount++;
                    existingWeight += entry.weight;
                }
            };
            _.forEach(Memory.population, count);
        } else {
            let population = this.globalMeasurement ? Population : room.population;
            if( !population || !population.typeCount[this.type] )
                return true;
            existingCount = population.typeCount[this.type] || 0;
            existingWeight = population.typeWeight[this.type] || 0;
        }
        return existingCount < maxCount && existingWeight < maxWeight;
    };
    this.existingWeight = function(room){
        let existingWeight = 0;
        if( this.measureByHome ){
            let home = room.name;
            let count = entry => {
                if( entry.creepType == this.type && entry.homeRoom == home ){
                    existingWeight += entry.weight;
                }
            };
            _.forEach(Memory.population, count);
        } else {
            let population = this.globalMeasurement ? Population : room.population;
            existingWeight = population ? (population.typeWeight[this.type] || 0) : 0;
        }
        return existingWeight;
    };

    this.multi = function(room){
        let rcl = this.RCL[room.controller.level];
        let fixedCosts = Creep.Setup.bodyCosts(this.SelfOrCall(rcl.fixedBody, room));
        let multiCosts = Creep.Setup.bodyCosts(this.SelfOrCall(rcl.multiBody, room));
        let max = this.SelfOrCall(rcl.maxMulti, room);
        if( max == 0 || multiCosts == 0 ) return 0;
        let maxWeight = this.SelfOrCall(rcl.maxWeight, room);
        if( maxWeight == null)
            return _.min([Math.floor( (room.remainingEnergyAvailable-fixedCosts) / multiCosts), max]);
        let existingWeight = this.existingWeight(room);
        return Math.floor(_.min([((room.remainingEnergyAvailable-fixedCosts) / multiCosts), max,((maxWeight - existingWeight - fixedCosts) / multiCosts)]));
    };
    this.parts = function(room){
        let rcl = this.RCL[room.controller.level];
        let fixedBody = this.SelfOrCall(rcl.fixedBody, room);
        let multiBody = this.SelfOrCall(rcl.multiBody, room);
        var parts = [];
        let min = this.SelfOrCall(rcl.minMulti, room);
        let multi = this.multi(room);
        if( multi < (min ? min : 0) ) return parts;
        for (let iMulti = 0; iMulti < multi; iMulti++) {
            parts = parts.concat(multiBody);
        }
        for( let iPart = 0; iPart < fixedBody.length; iPart ++ ){
            parts[parts.length] = fixedBody[iPart];
        }
        if( this.sortedParts ) {
            parts.sort(Creep.Setup.partsComparator);
            if( this.mixMoveParts )
                parts = this.mixParts(parts);
            else if( parts.includes(HEAL) ) {
                let index = parts.indexOf(HEAL);
                parts.splice(index, 1);
                parts.push(HEAL);
            }
        }
        return parts;
    };
    this.mixParts = function(parts){
        let sum = _.countBy(parts);
        let nonMove = parts.filter( part => part != MOVE );
        let mix = [];
        for( let iNonMove = nonMove.length-1; iNonMove >= 0; iNonMove-- ){
            if( sum[MOVE]-- > 0 ){
                mix.unshift(MOVE);
            }
            mix.unshift(nonMove[iNonMove]);
        }
        while(sum[MOVE] > 0){
            mix.unshift(MOVE);
            sum[MOVE]--;
        }
        return mix;
    };
    this.maxCost = function(room){
        let c = this;
        let rcl = c.RCL[room.controller.level];
        return (Creep.Setup.bodyCosts( c.SelfOrCall(rcl.multiBody, room) ) * c.SelfOrCall(rcl.maxMulti, room)) + (Creep.Setup.bodyCosts(c.SelfOrCall(rcl.fixedBody, room)));
    };
}
Setup.bodyCosts = function(body){
    let costs = 0;
    if( body ){
        body.forEach(function(part){
            costs += BODYPART_COST[part];
        });
    }
    return costs;
};
Setup.multi = function (room, fixedBody, multiBody) {
    let fixedCosts = Creep.Setup.bodyCosts(fixedBody);
    let multiCosts = Creep.Setup.bodyCosts(multiBody);
    let maxParts = Math.floor((50 - fixedBody.length) / multiBody.length);
    let maxAffordable = Math.floor((room.energyCapacityAvailable - fixedCosts) / multiCosts);
    return _.min([maxParts, maxAffordable]);
};
Setup.partsComparator = function (a, b) {
    let partsOrder = [TOUGH, CLAIM, WORK, CARRY, ATTACK, RANGED_ATTACK, HEAL, MOVE];
    let indexOfA = partsOrder.indexOf(a);
    let indexOfB = partsOrder.indexOf(b);
    return indexOfA - indexOfB;
};
Setup.compileBody = function (room, fixedBody, multiBody, sort = false) {
        var parts = [];
        let multi = Creep.Setup.multi(room, fixedBody, multiBody);
        for (let iMulti = 0; iMulti < multi; iMulti++) {
            parts = parts.concat(multiBody);
        }
        for (let iPart = 0; iPart < fixedBody.length; iPart++) {
            parts[parts.length] = fixedBody[iPart];
        }
        if( sort ) parts.sort(Creep.Setup.partsComparator);            
        if( parts.includes(HEAL) ) {
            let index = parts.indexOf(HEAL);
            parts.splice(index, 1);
            parts.push(HEAL);
        }
        return parts;
    },
module.exports = Setup;
