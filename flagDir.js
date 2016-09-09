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
    findName: function(flagColor, pos, local, mod, arg3, arg4){
        let that = this;
        if( flagColor == null || this.list.length == 0) 
            return null;

        let filter = flagColor.filter;
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
                let roomDist = that.roomDistance(flag.roomName, pos.roomName);
                if( roomDist == 0 )
                    r = _.max([Math.abs(flag.x-pos.x), Math.abs(flag.y-pos.y)]);
                else r = roomDist * 50;
                if( mod ){
                    r = mod(r, flag, arg3, arg4);
                }
                return r;
            };
            return _.sortBy(flags, range)[0].name;
        } else return flags[0];
    }, 
    find: function(flagColor, pos, local, mod, arg3, arg4){
        let id = this.findName(flagColor, pos, local, mod, arg3, arg4);
        if( id === null ) 
            return null;
        return Game.flags[id];
    },
    loop: function(){
        this.list = [];
        delete this._hasInvasionFlag;
        delete this._privateerMaxWeight;
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

        let filter = flagColor.filter;
        if( local && pos && pos.roomName )
            _.assign(filter, {roomName: pos.roomName});
        return _.countBy(this.list, filter).true || 0;
    },
    filter: function(flagColor, pos, local){
        if( flagColor == null || this.list.length == 0) 
            return 0;

        let filter = flagColor.filter;
        if( local && pos && pos.roomName )
            _.assign(filter, {roomName: pos.roomName});
        return _.filter(this.list, filter);
    },
    filterCustom: function(filter){
        if( filter == null || this.list.length == 0) 
            return 0;
        return _.filter(this.list, filter);
    },
    roomDistance: function(roomName1, roomName2, diagonal){
        if( roomName1 == roomName2 ) return 0;
        let posA = roomName1.split(/([N,E,S,W])/);
        let posB = roomName2.split(/([N,E,S,W])/);
        let xDif = posA[1] == posB[1] ? Math.abs(posA[2]-posB[2]) : posA[2]+posB[2]+1;
        let yDif = posA[3] == posB[3] ? Math.abs(posA[4]-posB[4]) : posA[4]+posB[4]+1;
        if( diagonal ) return Math.max(xDif, yDif); // count diagonal as 1 
        return xDif + yDif; // count diagonal as 2        
    }, 
    rangeMod: function(range, flagItem, rangeModPerCrowd, rangeModByType){
        var flag = Game.flags[flagItem.name];
        let crowd;
        if( flag.targetOf ){ // flag is targetted
            if( rangeModByType ) { // count defined creep type only
                let count = _.countBy(flag.targetOf, 'creepType')[rangeModByType];
                crowd = count || 0; 
            } else // count all creeps
                crowd = flag.targetOf.length;
        } else crowd = 0; // not targetted
        return range + ( crowd * (rangeModPerCrowd || 20) );
    }, 
    claimMod: function(range, flagItem){
        var flag = Game.flags[flagItem.name];
        // add reservation amount to range (to prefer those with least reservation)
        range += flag.room && flag.room.controller && flag.room.controller.reservation ? flag.room.controller.reservation.ticksToEnd : 0;
        // add when already assigned
        let crowd = flag.targetOf ? flag.targetOf.length : 0;
        return range + ( crowd * 300 );
    },
    exploitMod: function(range, flagItem){
        var flag = Game.flags[flagItem.name];
        let reserved = flag.targetOf ? _.sum( flag.targetOf.map( t => t.carryCapacityLeft)) : 0;
        if( flag.room ) 
            range /= ((flag.room.sourceEnergyAvailable-reserved)/1500);
        return range;
    },
    hasInvasionFlag: function(){
        if( _.isUndefined(this._hasInvasionFlag) ) {
            this._hasInvasionFlag = (this.findName(FLAG_COLOR.invade) != null) || (this.findName(FLAG_COLOR.destroy) != null);
        }
        return this._hasInvasionFlag;
    }, 
    privateerMaxWeight: function(spawn){
        if( _.isUndefined(this._privateerMaxWeight) ) {
            let flagEntries = FlagDir.filter(FLAG_COLOR.invade.exploit);
            this._privateerMaxWeight = 0;
            let base = 2800;
            let flagWeight = flagEntry => {
                var flag = Game.flags[flagEntry.name];
                let room;
                if( flag && (room = flag.room) ) {
                    this._privateerMaxWeight += base * room.sources.length * (
                        (room.controller && (room.controller.my || 
                        (room.controller.reservation && room.controller.reservation.username == spawn.owner.username))) 
                        ? 2 : 1);
                }
            };
            _.forEach(flagEntries, flagWeight);
        }
        return this._privateerMaxWeight;
        //return FlagDir.count(FLAG_COLOR.invade.exploit) * 3000;
    }
}
module.exports = mod;