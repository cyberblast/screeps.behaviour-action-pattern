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

        let filter = _.clone(flagColor.filter);
        if( local && pos && pos.roomName )
            _.assign(filter, {roomName: pos.roomName, cloaking: "0"});
        else
            _.assign(filter, {cloaking: "0"});
        let flags = _.filter(this.list, filter);

        if( flags.length == 0 ) 
            return null;
        if( flags.length == 1 ) 
            return flags[0].name;
        
        // some flags found - find nearest by roughly estimated range
        if( pos && pos.roomName ){
            var range = flag => {
                var r = 0;
                let roomDist = Room.roomDistance(flag.roomName, pos.roomName);
                if( roomDist == 0 )
                    r = _.max([Math.abs(flag.x-pos.x), Math.abs(flag.y-pos.y)]);
                else r = roomDist * 50;
                if( mod ){
                    r = mod(r, flag, modArgs);
                }
                flag.valid = r < Infinity;
                return r;
            };
            let flag = _.sortBy(flags, range)[0];
            return flag.valid ? flag.name : null;
        } else return flags[0].name;
    }, 
    find: function(flagColor, pos, local, mod, modArgs){
        let id = this.findName(flagColor, pos, local, mod, modArgs);
        if( id === null ) 
            return null;
        let flag = Game.flags[id];
        if( flag ) return flag 
        else _.pullAllBy(this.list, [{ 'name': id }], 'name');
        return this.find(flagColor, pos, local, mod, modArgs);
    },
    loop: function(){
        this.list = [];
        delete this._hasInvasionFlag;
        var register = flag => {
            flag.creeps = {};
            delete flag.targetOf;
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
                _.assign(filter, {roomName: pos.roomName});
        }
        return _.filter(this.list, filter);
    },
    filterCustom: function(filter){
        if( filter == null || this.list.length == 0) 
            return [];
        return _.filter(this.list, filter);
    },
    rangeMod: function(range, flagItem, args){
        let rangeModPerCrowd = args.rangeModPerCrowd || 20;
        let rangeModByType = args.rangeModByType;
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
        if( range > 100 ) range = range * 3;
        var flag = Game.flags[flagItem.name];
        let assigned = flag.targetOf ? _.sum( flag.targetOf.map( t => t.creepName == creepName ? 0 : t.weight )) : 0;
        //console.log('assigned: ' + assigned);
        if( assigned > 2599 ) return Infinity;
        return ((range*range) / (2600 - assigned))*500;
    },
    reserveMod: function(range, flagItem, creepName){
        //console.log('range: ' + range);
        let claimRange = FlagDir.claimMod(range, flagItem, creepName);
        //console.log('claimRange: ' + claimRange);
        if( claimRange == Infinity ) return Infinity;
        var flag = Game.flags[flagItem.name];
        if( flag.room && flag.room.controller && flag.room.controller.reservation ) {
            //console.log('adding reservation: ' + claimRange + flag.room.controller.reservation.ticksToEnd);
            return claimRange + flag.room.controller.reservation.ticksToEnd;
        } 
        return claimRange;
    },
    exploitMod: function(range, flagItem, creepName){
        if( range > 100 ) return Infinity;
        var flag = Game.flags[flagItem.name];
        let assigned = flag.targetOf ? _.sum( flag.targetOf.map( t => t.creepName == creepName ? 0 : t.carryCapacityLeft)) : 0;
        if( flag.room ) {
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