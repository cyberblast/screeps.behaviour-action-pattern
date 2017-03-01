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

    this.rclProperty = Setup.rclProperty;
    this.SelfOrCall = function(obj, param) {
        if( obj == null ) return null;
        if (typeof obj === 'function' )
            return obj(param);
        else return obj;
    };
    this.fixedBody = this.rclProperty('fixedBody');
    this.multiBody = this.rclProperty('multiBody');
    this.minAbsEnergyAvailable = this.rclProperty('minAbsEnergyAvailable');
    this.minEnergyAvailable = this.rclProperty('minEnergyAvailable'); // 1 = full
    this.minMulti = this.rclProperty('minMulti');
    this.maxMulti = this.rclProperty('maxMulti');
    this.maxCount = this.rclProperty('maxCount');
    this.maxWeight = this.rclProperty('maxWeight');

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
            if (DEBUG && TRACE) trace('Setup', {setupType:this.type, room:room.name, rcl: room.controller.level, Setup:'isValidSetup'}, 'low RCL');
            return false;
        }

        let minAbsEnergyAvailable = this.SelfOrCall(this.minAbsEnergyAvailable, room);
        let minEnergyAvailable = this.SelfOrCall(this.minEnergyAvailable, room);
        const absEnergy = room.remainingEnergyAvailable;
        const energy = room.relativeRemainingEnergyAvailable;
        if( absEnergy < minAbsEnergyAvailable ||
            energy < minEnergyAvailable ) {
            if (DEBUG && TRACE) trace('Setup', {setupType:this.type, room:room.name, absEnergy, energy, Setup:'isValidSetup'}, 'not enough energy');
            return false;
        }

        let maxCount = this.SelfOrCall(this.maxCount, room);
        let maxWeight = this.SelfOrCall(this.maxWeight, room);
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
        let fixedBody = this.SelfOrCall(this.fixedBody, room);
        let multiBody = this.SelfOrCall(this.multiBody, room);
        var parts = [];
        let min = this.SelfOrCall(this.minMulti, room);
        let maxMulti = this.SelfOrCall(this.maxMulti, room);
        let maxWeight = this.SelfOrCall(this.maxWeight, room);
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
        return (Creep.bodyCosts( c.SelfOrCall(this.multiBody, room) ) * c.SelfOrCall(this.maxMulti, room)) + (Creep.bodyCosts(c.SelfOrCall(this.fixedBody, room)));
    };
}
module.exports = Setup;
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
            if( !measureByHome ) {
                max++;
                return;
            }
            flag = Game.flags[flagEntry.name];
            if( !flag.targetOf || flag.targetOf.length == 0 ) {
                max++;
            } else if( _.some(flag.targetOf, 'homeRoom', room.name) ) {
                max++;
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
    }
};
