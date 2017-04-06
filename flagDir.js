let mod = {};
module.exports = mod;
mod.findName = function(flagColor, pos, local, mod, modArgs){
    let that = this;
    if( flagColor == null || this.list.length == 0)
        return null;
    let filter;
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
        filter = _.clone(flagColor.filter);
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
mod.find = function(flagColor, pos, local, mod, modArgs){
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
mod.count = function(flagColor, pos, local){
    let that = this;
    if( flagColor == null || this.list.length == 0)
        return 0;

    let filter = _.clone(flagColor.filter);
    if( local && pos && pos.roomName )
        _.assign(filter, {roomName: pos.roomName});
    return _.countBy(this.list, filter).true || 0;
};
mod.filter = function(flagColor, pos, local){
    if( flagColor == null || this.list.length == 0)
        return [];
    let filter;
    if( Array.isArray(flagColor) ) {
        filter = entry => {
            if( local && pos && pos.roomName && entry.roomName != pos.roomName )
                return false;
            for( let i = 0; i < flagColor.length; i++ ){
                if( flagColor[i].color == entry.color && flagColor[i].secondaryColor == entry.secondaryColor )
                    return true;
            }
            return false;
        };
    } else {
        filter = _.clone(flagColor.filter);
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
        flag.creeps = {};
        if( flag.cloaking && flag.cloaking > 0 ) flag.cloaking--;
        this.list.push({
            name: flag.name,
            color: flag.color,
            secondaryColor: flag.secondaryColor,
            roomName: flag.pos.roomName,
            x: flag.pos.x,
            y: flag.pos.y,
            cloaking: flag.cloaking
        });
    };
    _.forEach(Game.flags, register);
    
    let findStaleFlags = (entry, flagName) => {
        if(!Game.flags[flagName]) {
            this.stale.push(flagName);
        }
    };
    _.forEach(Memory.flags, findStaleFlags);
};
mod.execute = function() {
    let triggerFound = entry => {
        if( !entry.cloaking || entry.cloaking == 0)
        Flag.found.trigger(Game.flags[entry.name]);
    }
    this.list.forEach(triggerFound);

    let triggerRemoved = flagName => Flag.FlagRemoved.trigger(flagName);
    this.stale.forEach(triggerRemoved);
};
mod.cleanup = function(){
    let clearMemory = flagName => delete Memory.flags[flagName];
    this.stale.forEach(clearMemory);
};
mod.flagType = function(flag) {
    if (mod.isSpecialFlag(flag)) return 'specialFlag';
    for (const primary in FLAG_COLOR) {
        const obj = FLAG_COLOR[primary];
        if (flag.color === obj.color) {
            if (flag.secondaryColor === obj.secondaryColor) {
                return primary + '.' + primary;
            } else {
                for (const secondary in obj) {
                    if (flag.secondaryColor === obj[secondary].secondaryColor) {
                        return primary + '.' + secondary;
                    }
                }
            }
        }
    }
    logError('Unknown flag type for flag ' + flag ? flag.name : 'undefined flag');
    return 'undefined';
};
