var mod = {
    list:[], 
    findName: function(flagColor, pos, local, rangeMod){
        let self = this;
        if( flagColor == null || this.list.length == 0) 
            return null;

        let filter = flagColor.filter;
        if( local && pos && pos.roomName )
            _.assign(filter, {roomName: pos.roomName});
        let flags = _.filter(this.list, filter);

        if( flags.length == 0 ) 
            return null;
        if( flags.length == 1 ) 
            return flags[0].name;
        
        // some flags found - find nearest by roughly estimated range
        if( pos && pos.roomName ){
            var range = flag => {
                var r = 0;
                let roomDist = self.roomDistance(flag.roomName, pos.roomName);
                if( roomDist == 0 )
                    r = _.max(Math.abs(flag.x-pos.x), Math.abs(flag.y-pos.y));
                else r = roomDist * 100;
                if( rangeMod ){
                    r = rangeMod(r, flag);
                }
                return r;
            };
            return _.sortBy(flags, range)[0].name;
        } else return flags[0];
    }, 
    find: function(flagColor, pos, local){
        let id = this.findName(flagColor, pos, local);
        if( id === null ) 
            return null;
        return Game.flags[id];
    },
    loop: function(){
        this.list = [];
        var register = flag => {
            flag.creeps = {};
            this.list.push({
            name: flag.name, 
            color: flag.color, 
            secondaryColor: flag.secondaryColor, 
            roomName: flag.pos.roomName,
            x: flag.pos.x,
            y: flag.pos.y
        })};
        _.forEach(Game.flags, register);
    }, 
    count: function(flagColor, pos, local){
        let self = this;
        if( flagColor == null || this.list.length == 0) 
            return 0;

        let filter = flagColor.filter;
        if( local && pos && pos.roomName )
            _.assign(filter, {roomName: pos.roomName});
        return _.countBy(this.list, filter).true;
    },
    roomDistance: function(a, b){
        if( a == b ) return 0;
        let posA = a.split(/([N,E,S,W])/);
        let posB = b.split(/([N,E,S,W])/);
        let xDif = posA[3] == posB[3] ? Math.abs(posA[4]-posB[4]) : posA[4]+posB[4]+1;
        let yDif = posA[3] == posB[3] ? Math.abs(posA[4]-posB[4]) : posA[4]+posB[4]+1;
        return xDif + yDif; 
    }, 
    rangeModPrivateer: function(range, flagItem){
        var flag = Game.flags[flagItem.name];
        return range + ((flag.creeps.sum || 0) * 10);
    }
}
module.exports = mod;