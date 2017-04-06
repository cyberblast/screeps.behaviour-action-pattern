let Setup = function(typeName){
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
        memory.cost = Creep.bodyCosts(memory.parts);
        memory.mother = spawn.name;
        memory.home = spawn.pos.roomName;
        for( var son = 1; memory.name == null || Game.creeps[memory.name]; son++ ) {
            memory.name = this.type + '-' + memory.cost + '-' + son;
        }
        return memory;
    };
    this.isValidSetup = function(room){
        let rcl = room.controller.level;
        if( rcl < this.minControllerLevel ) {
            if (DEBUG && TRACE) trace('Setup', {setupType:this.type, room:room.name, rcl, Setup:'isValidSetup'}, 'low RCL');
            return false;
        }

        rcl = this.RCL[room.controller.level];
        let minAbsEnergyAvailable = this.SelfOrCall(rcl.minAbsEnergyAvailable, room);
        let minEnergyAvailable = this.SelfOrCall(rcl.minEnergyAvailable, room);
        const absEnergy = room.remainingEnergyAvailable;
        const energy = room.relativeRemainingEnergyAvailable;
        if( absEnergy < minAbsEnergyAvailable ||
            energy < minEnergyAvailable ) {
            if (DEBUG && TRACE) trace('Setup', {setupType:this.type, room:room.name, absEnergy, energy, Setup:'isValidSetup'}, 'not enough energy');
            return false;
        }

        let maxCount = this.SelfOrCall(rcl.maxCount, room);
        let maxWeight = this.SelfOrCall(rcl.maxWeight, room);
        if( maxCount == 0 || maxWeight == 0 ) {
            if (DEBUG && TRACE) trace('Setup', {setupType:this.type, room:room.name, maxCount, maxWeight, Setup:'isValidSetup'}, 'too many creeps');
            return false;
        }
        if( maxCount == null )
            maxCount = Infinity;
        if( maxWeight == null )
            maxWeight = Infinity;

        let existingCount = 0;
        let existingWeight = 0;
        if( this.measureByHome ){
            let home = room.name;
            let count = entry => {
                if( entry.creepType == this.type && entry.homeRoom == home && Setup.isWorkingAge(entry) ){
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
        const returnVal = existingCount < maxCount && existingWeight < maxWeight;
        if (DEBUG && TRACE) trace('Setup', {setupType:this.type, room:room.name, returnVal, Setup:'isValidSetup'}, 'count:', existingCount, '<', maxCount, 'weight:', existingWeight, '<', maxWeight);
        return returnVal;
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
    this.parts = function(room){
        let rcl = this.RCL[room.controller.level];
        let fixedBody = this.SelfOrCall(rcl.fixedBody, room);
        let multiBody = this.SelfOrCall(rcl.multiBody, room);
        var parts = [];
        let min = this.SelfOrCall(rcl.minMulti, room);
        let maxMulti = this.SelfOrCall(rcl.maxMulti, room);
        let maxWeight = this.SelfOrCall(rcl.maxWeight, room);
        let maxMultiWeight;
        if( maxWeight ){
            let existingWeight = this.existingWeight(room);
            maxMultiWeight = maxWeight - existingWeight;
        }
        let multi = Creep.multi(room, {
            fixedBody, multiBody,
            maxWeight: maxMultiWeight,
            maxMulti: maxMulti, 
            currentEnergy: true
        });

        if( multi < (min ? min : 0) ) return parts;
        for (let iMulti = 0; iMulti < multi; iMulti++) {
            parts = parts.concat(multiBody);
        }
        for( let iPart = 0; iPart < fixedBody.length; iPart ++ ){
            parts[parts.length] = fixedBody[iPart];
        }
        if( this.sortedParts ) {
            parts.sort(Creep.partsComparator);
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
        return (Creep.bodyCosts( c.SelfOrCall(rcl.multiBody, room) ) * c.SelfOrCall(rcl.maxMulti, room)) + (Creep.bodyCosts(c.SelfOrCall(rcl.fixedBody, room)));
    };
};
module.exports = Setup;
Setup.isWorkingAge = function(creepData) {
    const c = Game.creeps[creepData.creepName];
    return !c || (creepData.predictedRenewal || creepData.spawningTime || CREEP_LIFE_TIME ) <= (c.ticksToLive || CREEP_LIFE_TIME);
};
Setup.maxPerFlag = function(flagFilter, maxRoomRange, measureByHome) {
    if( !flagFilter ) {
        throw new Error("undefined flagFilter");
    }
    return function(room){
        let max = 0;
        let distance, flag;
        let calcMax = flagEntry => {
            distance = routeRange(room.name, flagEntry.roomName);
            if( distance > maxRoomRange ) {
                return;
            }
            // for each flag in range
            flag = Game.flags[flagEntry.name];
            // if someone is dying then allow 2 per flag
            if (_.chain(flag.targetOf).filter(function (c) {
                return !measureByHome || c.homeRoom === room.name;
            }).every(Setup.isWorkingAge).value()) {
                max++;
            } else {
                max = max + 2;
            }
        };
        let flagEntries = FlagDir.filter(flagFilter);
        flagEntries.forEach(calcMax);
        return max;
    };
};
