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
        if( range > 100 ) return Infinity;
        var flag = Game.flags[flagItem.name];
        let reserved = flag.targetOf ? _.sum( flag.targetOf.map( t => t.carryCapacityLeft)) : 0;
        if( flag.room ) {
            if( flag.room.sourceEnergyAvailable <= reserved ) return Infinity;
            return range*range/(flag.room.sourceEnergyAvailable - reserved);
        } 
        return range;
    },
    hasInvasionFlag: function(){
        if( _.isUndefined(this._hasInvasionFlag) ) {
            this._hasInvasionFlag = (this.findName(FLAG_COLOR.invade) != null) || (this.findName(FLAG_COLOR.destroy) != null);
        }
        return this._hasInvasionFlag;
    }, 
    adjacentRooms: function(roomName){
        let parts = roomName.split(/([N,E,S,W])/);
        let dirs = ['N','E','S','W'];
        let toggle = q => dirs[ (dirs.indexOf(q)+2) % 4 ];
        let names = [];
        for( x = parseInt(parts[2])-1; x < parseInt(parts[2])+2; x++ ){
            for( y = parseInt(parts[4])-1; y < parseInt(parts[4])+2; y++ ){
                names.push( ( x < 0 ? toggle(parts[1]) + '0' : parts[1] + x ) + ( y < 0 ? toggle(parts[3]) + '0' : parts[3] + y ) );
            }
        }
        return names;
    },
    privateerMaxWeight: function(spawn){
        let base = 2800;
        let maxCalcRange = 2;
        let max = 0;

        let flagEntries = FlagDir.filter(FLAG_COLOR.invade.exploit);
        let flagWeight = flagEntry => {
            let distance = this.roomDistance(spawn.pos.roomName, flagEntry.roomName);
            if( distance > maxCalcRange ) return;
            let adjacent = this.adjacentRooms(flagEntry.roomName);
            let neighbors = 1;
            let checkRoom = roomName => {
                if( roomName == spawn.pos.roomName ) return;
                let room = Game.rooms[roomName];
                if( room && room.controller && room.controller.my )
                    neighbors++;
            };
            adjacent.forEach(checkRoom);
            max += (base / neighbors);
        };
        _.forEach(flagEntries, flagWeight);
        return max;
    }
}
module.exports = mod;