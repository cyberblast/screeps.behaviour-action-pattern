var mod = {
    extend: function(){
        Object.defineProperty(Flag.prototype, 'cloaking', {
            configurable: true,
            get: function() {
                return this.memory.cloaking || '0';
            },
            set: function(value) {
                this.memory.cloaking = value;
            }
        });        
    },
    list:[],
    findName: function(flagColor, pos, local, mod, modArgs){
        let that = this;
        if( flagColor == null || this.list.length == 0)
            return null;
        let filter;
        if (typeof flagColor === 'function' ) {
            filter = flagEntry => ( flagColor(flagEntry) && flagEntry.cloaking == 0 &&
                (!local || !pos || !pos.roomName || flagEntry.roomName != pos.roomName));
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
            var range = flag => {
                var r = 0;
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
    },
    find: function(flagColor, pos, local, mod, modArgs){
        let id = this.findName(flagColor, pos, local, mod, modArgs);
        if( id === null )
            return null;
        return Game.flags[id];
    },
    removeFromDir: function(name){
        let index = this.list.indexOf(f => f.name === name );
        if( index > -1 )
            this.list = this.list.splice(index, 1);
    },
    loop: function(){
        this.list = [];
        delete this._hasInvasionFlag;
        var register = flag => {
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
            Flag.found.trigger(flag);
        };
        _.forEach(Game.flags, register);
        var clearStaleFlags = (flag,flagName) => {
            if(!Game.flags[flagName]) {
                Flag.FlagRemoved.trigger(flagName);
                delete(Memory.flags[flagName]);
            }
        }
        _.forEach(Memory.flags, clearStaleFlags);
    },
    count: function(flagColor, pos, local){
        let that = this;
        if( flagColor == null || this.list.length == 0)
            return 0;

        let filter = _.clone(flagColor.filter);
        if( local && pos && pos.roomName )
            _.assign(filter, {roomName: pos.roomName});
        return _.countBy(this.list, filter).true || 0;
    },
    filter: function(flagColor, pos, local){
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
    },
    filterCustom: function(filter){
        if( filter == null || this.list.length == 0)
            return [];
        return _.filter(this.list, filter);
    },
    rangeMod: function(range, flagItem, args){
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
    },
    claimMod: function(range, flagItem, creepName){
        if( range > 200 ) return Infinity;
        var flag = Game.flags[flagItem.name];
        if( flag.targetOf && _.some(flag.targetOf, {'creepType': 'claimer'}) ) return Infinity;
        if( range > 100 ) range = range * 3;
        return range;
    },
    reserveMod: function(range, flagItem, creepName){
        if( range > 200 ) return Infinity;
        if( range > 100 ) range = range * 3;
        var flag = Game.flags[flagItem.name];

        let assigned = flag.targetOf ? _.sum( flag.targetOf.map( t => t.creepType != 'claimer' || t.creepName == creepName ? 0 : t.weight )) : 0;
        if( assigned > 3500 ) return Infinity;
        if( assigned > 2000 ) assigned += 1000;

        if (flag.room && flag.room.controller) var accessibleFields = flag.room.controller.accessibleFields; 
        if (accessibleFields && _.countBy(flag.targetOf, 'creepType')['claimer'] >= accessibleFields) return Infinity;

        let reservation = 0;
        if( flag.room && flag.room.controller && flag.room.controller.reservation ) {
            reservation = flag.room.controller.reservation.ticksToEnd;
        }

        return assigned + reservation + (range*10);
    },
    exploitMod: function(range, flagItem, creepName){
        if( range > 100 ) return Infinity;
        var flag = Game.flags[flagItem.name];
        if( flag.room ) {
            let assigned = flag.targetOf ? _.sum( flag.targetOf.map( t => t.creepType != 'privateer' || t.creepName == creepName ? 0 : t.carryCapacityLeft)) : 0;
            if( flag.room.sourceEnergyAvailable <= assigned ) return Infinity;
            return (range*range) / (flag.room.sourceEnergyAvailable - assigned);
        }
        return range;
    },
    hasInvasionFlag: function(){
        if( _.isUndefined(this._hasInvasionFlag) ) {
            this._hasInvasionFlag = (this.findName(FLAG_COLOR.invade) != null) || (this.findName(FLAG_COLOR.destroy) != null);
        }
        return this._hasInvasionFlag;
    }
}

module.exports = mod;