let Setup = function(typeName){
    this.none = {
        fixedBody: [],
        multiBody: [],
        minAbsEnergyAvailable: Infinity,
        minEnergyAvailable: 1,
        maxMulti: 0,
        maxCount: 0,
        maxWeight: 0
    };
    this.RCL = {
        1: this.none,
        2: this.none,
        3: this.none,
        4: this.none,
        5: this.none,
        6: this.none,
        7: this.none,
        8: this.none
    };

    this.type = typeName;
    this.minControllerLevel = 0;
    this.globalMeasurement = false;
    this.measureByHome = false;
    this.sortedParts = true;
    this.mixMoveParts = false;

    this.rclProperty = Setup.rclProperty;
    this.SelfOrCall = function(obj, param) {
        if( obj == null ) return null;
        if (typeof obj === 'function' )
            return obj.apply(this, [param]);
        else return obj;
    };
    this._fixedBody = this.rclProperty('fixedBody');
    this._multiBody = this.rclProperty('multiBody');
    this._minAbsEnergyAvailable = this.rclProperty('minAbsEnergyAvailable');
    this._minEnergyAvailable = this.rclProperty('minEnergyAvailable'); // 1 = full
    this._minMulti = this.rclProperty('minMulti');
    this._maxMulti = this.rclProperty('maxMulti');
    this._maxCount = this.rclProperty('maxCount');
    this._maxWeight = this.rclProperty('maxWeight');

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
        if( room.controller.level < this.minControllerLevel ) {
            if (global.DEBUG && global.TRACE) trace('Setup', {setupType:this.type, room:room.name, rcl: room.controller.level, Setup:'isValidSetup'}, 'low RCL');
            return false;
        }

        let minAbsEnergyAvailable = this.SelfOrCall(this._minAbsEnergyAvailable, room);
        let minEnergyAvailable = this.SelfOrCall(this._minEnergyAvailable, room);
        const absEnergy = room.remainingEnergyAvailable;
        const energy = room.relativeRemainingEnergyAvailable;
        if( absEnergy < minAbsEnergyAvailable ||
            energy < minEnergyAvailable ) {
            if (global.DEBUG && global.TRACE) trace('Setup', {setupType:this.type, room:room.name, absEnergy, energy, Setup:'isValidSetup'}, 'not enough energy');
            return false;
        }

        let maxCount = this.SelfOrCall(this._maxCount, room);
        let maxWeight = this.SelfOrCall(this._maxWeight, room);
        if( maxCount === 0 || maxWeight === 0 ) {
            if (global.DEBUG && global.TRACE) trace('Setup', {setupType:this.type, room:room.name, maxCount, maxWeight, Setup:'isValidSetup'}, 'too many creeps');
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
        if (global.DEBUG && global.TRACE) trace('Setup', {setupType:this.type, room:room.name, returnVal, Setup:'isValidSetup'}, 'count:', existingCount, '<', maxCount, 'weight:', existingWeight, '<', maxWeight);
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
        let fixedBody = this.SelfOrCall(this._fixedBody, room);
        let multiBody = this.SelfOrCall(this._multiBody, room);
        let min = this.SelfOrCall(this._minMulti, room);
        let maxMulti = this.SelfOrCall(this._maxMulti, room);
        let maxWeight = this.SelfOrCall(this._maxWeight, room);
        let maxMultiWeight;
        if( maxWeight ){
            let existingWeight = this.existingWeight(room);
            maxMultiWeight = maxWeight - existingWeight;
        }
        return Creep.compileBody(room, {
            fixedBody, multiBody,
            maxWeight: maxMultiWeight,
            minMulti: min,
            maxMulti: maxMulti,
            currentEnergy: true,
            sort: this.sortedParts,
        });
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
        return (Creep.bodyCosts( c.SelfOrCall(this._multiBody, room) ) * c.SelfOrCall(this._maxMulti, room)) + (Creep.bodyCosts(c.SelfOrCall(this._fixedBody, room)));
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
Setup.rclProperty = function(property) {
    return function(room) {
        const creepSetup = this;
        let rcl;
        if (typeof creepSetup.RCL === 'function') {
            rcl = function(room) {
                return creepSetup.RCL(room.controller.level);
            };
        } else {
            rcl = function(room) {
                return creepSetup.RCL[room.controller.level];
            };
        }

        if (property === undefined) {
            return rcl;
        }

        return creepSetup.SelfOrCall(rcl(room)[property], room);
    };
};
