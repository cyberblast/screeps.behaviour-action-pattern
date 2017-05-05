let mod = {};
module.exports = mod;
mod.flagFilter = function(flagColour) {
    if (!flagColour) return;
    let filter;
    if (flagColour.filter) {
        filter = _.clone(flagColour.filter);
    } else {
        filter = {color: flagColour.color, secondaryColor: flagColour.secondaryColor};
    }
    return filter;
};
mod.findName = function(flagColor, pos, local=true, mod, modArgs){
    let that = this;
    if( flagColor == null || this.list.length == 0)
        return null;
    let filter;
    if (pos instanceof Room) pos = pos.getPositionAt(25, 25);
    if (typeof flagColor === 'function' ) {
        filter = function(flagEntry) {
            if ( flagColor(flagEntry) && flagEntry.cloaking == 0 ) {
                if ( !local ) return true;
                if ( pos && pos.roomName && flagEntry.roomName == pos.roomName ) return true;
            }
            return false;
        }
    }
    else {
        filter = this.flagFilter(flagColor);
        if( local && pos && pos.roomName )
            _.assign(filter, {roomName: pos.roomName, cloaking: "0"});
        else
            _.assign(filter, {cloaking: "0"});
    }
    let flags = _.filter(that.list, filter);

    if( flags.length == 0 )
        return null;
    if( flags.length == 1 )
        return flags[0].name;

    // some flags found - find nearest
    if( pos && pos.roomName ){
        let range = flag => {
            let r = 0;
            let roomDist = routeRange(pos.roomName, flag.roomName);
            if( roomDist == 0 )
                r = _.max([Math.abs(flag.x-pos.x), Math.abs(flag.y-pos.y)]);
            else r = roomDist * 50;
            if( mod ){
                r = mod(r, flag, modArgs);
            }
            flag.valid = r < Infinity;
            return r;
        };
        let flag = _.min(flags, range); //_.sortBy(flags, range)[0];
        return flag.valid ? flag.name : null;
    } else return flags[0].name;
};
mod.find = function(flagColor, pos, local=true, mod, modArgs){
    if (pos instanceof Room) pos = pos.getPositionAt(25, 25);
    let id = this.findName(flagColor, pos, local, mod, modArgs);
    if( id === null )
        return null;
    return Game.flags[id];
};
mod.removeFromDir = function(name){
    let index = this.list.indexOf(f => f.name === name );
    if( index > -1 )
        this.list = this.list.splice(index, 1);
};
mod.count = function(flagColor, pos, local=true){
    let that = this;
    if( flagColor == null || this.list.length == 0)
        return 0;
    
    if (pos instanceof Room) pos = pos.getPositionAt(25, 25);
    let filter = this.flagFilter(flagColor);
    if( local && pos && pos.roomName )
        _.assign(filter, {roomName: pos.roomName});
    return _.countBy(this.list, filter).true || 0;
};
mod.filter = function(flagColor, pos, local=true){
    if( flagColor == null || this.list.length == 0)
        return [];
    let filter;
    if (pos instanceof Room) pos = pos.getPositionAt(25, 25);
    if( Array.isArray(flagColor) ) {
        filter = entry => {
            if( local && pos && pos.roomName && entry.roomName != pos.roomName )
                return false;
            for( let i = 0; i < flagColor.length; i++ ){
                if (Flag.compare(flagColor[i], entry)) return true;
            }
            return false;
        };
    } else {
        filter = this.flagFilter(flagColor);
        if( local && pos && pos.roomName )
            _.assign(filter, {'roomName': pos.roomName});
    }
    return _.filter(this.list, filter);
};
mod.filterCustom = function(filter){
    if( filter == null || this.list.length == 0)
        return [];
    return _.filter(this.list, filter);
};
mod.rangeMod = function(range, flagItem, args){
    let rangeModPerCrowd = args && args.rangeModPerCrowd ? args.rangeModPerCrowd : 20;
    let rangeModByType = args ? args.rangeModByType : null;
    var flag = Game.flags[flagItem.name];
    let crowd;
    if( flag.targetOf ){ // flag is targetted
        if( rangeModByType ) { // count defined creep type only
            let count = _.countBy(flag.targetOf, 'creepType')[rangeModByType];
            crowd = count || 0;
        } else // count all creeps
            crowd = flag.targetOf.length;
    } else crowd = 0; // not targetted
    return range + ( crowd * rangeModPerCrowd );
};
mod.exploitMod = function(range, flagItem, creepName){
    if( range > 100 ) return Infinity;
    var flag = Game.flags[flagItem.name];
    if( flag.room ) {
        if( flag.room.my ) {
            return Infinity;
        }
        let assigned = flag.targetOf ? _.sum( flag.targetOf.map( t => t.creepType != 'privateer' || t.creepName == creepName ? 0 : t.carryCapacityLeft)) : 0;
        if( flag.room.sourceEnergyAvailable <= assigned ) return Infinity;
        return (range*range) / (flag.room.sourceEnergyAvailable - assigned);
    }
    return range;
};
mod.hasInvasionFlag = function(){
    if( _.isUndefined(this._hasInvasionFlag) ) {
        this._hasInvasionFlag = (this.findName(FLAG_COLOR.invade) != null) || (this.findName(FLAG_COLOR.destroy) != null);
    }
    return this._hasInvasionFlag;
};

mod.extend = function(){
    Object.defineProperty(Flag.prototype, 'cloaking', {
        configurable: true,
        get: function() {
            return this.memory.cloaking || '0';
        },
        set: function(value) {
            this.memory.cloaking = value;
        }
    });
    
    Object.defineProperty(Flag, 'compare', {
        configurable: true,
        value: function(flagA, flagB) {
            return flagA.color === flagB.color && flagA.secondaryColor === flagB.secondaryColor;
        }
    });
    
    Object.defineProperty(Flag.prototype, 'compareTo', {
        configurable: true,
        // FLAG_COLOR flag
        value: function(flag) {
            return Flag.compare(this, flag);
        },
    });
    
    Object.defineProperty(RoomPosition.prototype, 'newFlag', {
        configurable: true,
        /**
         * Create a new flag at this position
         * @param {Object|string} flagColour - An object with color and secondaryColor properties, or a string path for a FLAG_COLOR
         * @param {string} [name] - Optional name for the flag
         * @returns {string|Number} The name of the flag or an error code.
         */
        value: function(flagColour, name) {
            if (!flagColour) flagColour = _.get(FLAG_COLOR, flagColour); // allows you to pass through a string (e.g. 'invade.robbing')
            if (!flagColour) return;
            return this.createFlag(name, flagColour.color, flagColour.secondaryColor);
        },
    });
    
    Object.defineProperty(Room.prototype, 'newFlag', {
        configurable: true,
        /**
         * Create a new flag
         * @param {Object|string} flagColour - An object with color and secondaryColor properties, or a string path for a FLAG_COLOR
         * @param {RoomPosition} [pos] - The position to place the flag. Will assume (25, 25) if left undefined
         * @param {string} [name] - Optional name for the flag
         * @returns {string|Number} The name of the flag or an error code.
         */
        value: function(flagColour, pos, name) {
            if (!pos) pos = this.getPositionAt(25, 25);
            return pos.newFlag(flagColour, name);
        },
    });
    
    if (!Room.prototype._createFlag) {
        Room.prototype._createFlag = Room.prototype.createFlag;
        Room.prototype.createFlag = function(...args) {
            let pos;
            if (_.isUndefined(args[0]) || !_.isNumber(args[1])) {
                if (!_.isObject(args[0])) return this._createFlag.apply(this, args);
                
                if (args[0] instanceof RoomPosition) {
                    pos = args[0];
                }
                if (args[0].pos && args[0].pos instanceof RoomPosition) {
                    pos = args[0].pos;
                }
                args.splice(0, 1);
            } else {
                pos = this.getPositionAt(args[0], args[1]);
                args.splice(0, 2);
            }
            let name = args[0];
            let color = args[1];
            let secondaryColor = args[2];
            const oColor = color;
            const oSecondaryColor = secondaryColor;
            if (name && typeof name === 'string') {
                if (name.includes('COLOR_')) {
                    const re = /(COLOR_\w+)/g;
                    const match = name.match(re);
                    if (match) {
                        if (match.length === 1) {
                            secondaryColor = COLOURS[match[0]] || global.VIRTUAL_FLAGS[match[0]] || match[0];
                        } else {
                            color = COLORS_ALL[match[0]] || global.VIRTUAL_FLAGS[match[0]] || match[0];
                            secondaryColor = COLOURS[match[1]] || global.VIRTUAL_FLAGS[match[1]] || match[1];
                        }
                    }
                    do {
                        name.replace(re, ''); // remove colours in the flag name
                    } while (re.test(name));
                }
                if (name.length === 0) {
                    let cnt = 1;
                    do {
                        name = 'Flag' + cnt;
                        cnt++;
                    } while(_.any(Game.flags, {name}));
                }
            }
            if (!color) color = COLOR_WHITE;
            if (!secondaryColor) secondaryColor = color;
            _.set(Memory, ['virtualFlags', name], {
                color, secondaryColor,
            });
            return this._createFlag.call(this, pos, name, color in COLOURS ? color : oColor, secondaryColor in COLOURS ? secondaryColor : oSecondaryColor);
        };
    }
};
mod.flush = function(){        
    let clear = flag => delete flag.targetOf;
    _.forEach(Game.flags, clear);
    this.list = [];
    this.stale = [];
    delete this._hasInvasionFlag;
};
mod.analyze = function(){
    let register = flag => {
        try {
            flag.creeps = {};
            if( flag.cloaking && flag.cloaking > 0 ) flag.cloaking--;
            const entry = {
                name: flag.name,
                color: flag.color,
                secondaryColor: flag.secondaryColor,
                roomName: flag.pos.roomName,
                x: flag.pos.x,
                y: flag.pos.y,
                cloaking: flag.cloaking
            };
            const virtual = _.get(Memory, ['virtualFlags', flag.name], false);
            if (virtual) {
                _.merge(entry, virtual);
            }
            this.list.push(entry);
        } catch(e) {
            Util.logError(e.stack || e.message);
        }
    };
    _.forEach(Game.flags, register);
    
    let findStaleFlags = (entry, flagName) => {
        try {
            if(!Game.flags[flagName]) {
                this.stale.push(flagName);
            }
        } catch(e) {
            Util.logError(e.stack || e.message);
        }
    };
    _.forEach(Memory.flags, findStaleFlags);
    const specialFlag = mod.specialFlag(true);
    return !!specialFlag;
};
mod.execute = function() {
    let triggerFound = entry => {
        try {
            if( !entry.cloaking || entry.cloaking == 0) {
                const p = Util.startProfiling('Flag.execute', {enabled:PROFILING.FLAGS});
                const flag = Game.flags[entry.name];
                Flag.found.trigger(flag);
                p.checkCPU(entry.name, PROFILING.EXECUTE_LIMIT, mod.flagType(flag));
            }
        } catch(e) {
            Util.logError(e.stack || e.message);
        }
    };
    this.list.forEach(triggerFound);

    let triggerRemoved = flagName => Flag.FlagRemoved.trigger(flagName);
    this.stale.forEach(triggerRemoved);
};
mod.cleanup = function(){
    const clearMemory = flagName => {
        delete Memory.flags[flagName];
        if (_.get(Memory, ['virtualFlags', flagName], false)) {
            delete Memory.virtualFlags[flagName];
        }
    };
    this.stale.forEach(clearMemory);
};
mod.flagType = function(flag) {
    if (mod.isSpecialFlag(flag)) return '_OCS';
    for (const primary in FLAG_COLOR) {
        const type = FLAG_COLOR[primary];
        if (Flag.compare(flag, type)) {
            return primary;
        }
        for (const secondary in type) {
            const subType = type[secondary];
            if (Flag.compare(flag, subType)) return `${primary}.${secondary}`;
        }
    }
    logError(`Unknown flag type for flag: ${flag ? flag.name : 'undefined flag'}.`);
    return 'undefined';
};
mod.specialFlag = function(create) {
    const name = '_OCS';
    const flag = Game.flags[name];
    if (create) {
        if (!flag) {
            return _(Game.rooms).values().some(function (room) {
                room.getPositionAt(49, 49).newFlag({color: COLOR_WHITE, secondaryColor: COLOR_PURPLE}, name);
                return true;
            });
        } else if (flag.pos.roomName !== 'W0N0') {
            flag.setPosition(new RoomPosition(49, 49, 'W0N0'));
        }
    }
    return flag;
};
mod.isSpecialFlag = function(object) {
    return object.name === '_OCS';
};
