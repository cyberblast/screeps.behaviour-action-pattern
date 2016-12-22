var mod = {
    init: function(params){
        Creep.extend = load("creep").extend;
        Room.extend = load("room").extend;
        Spawn.extend = load("spawn").extend;
        _.assign(global, params);
        _.assign(global, {
            LiteEvent: function() {
                this.handlers = [];
                this.on = function(handler) {
                    this.handlers.push(handler);
                }
                this.off = function(handler) {
                    this.handlers = this.handlers.filter(h => h !== handler);
                }
                this.trigger = function(data) {
                    this.handlers.slice(0).forEach(h => h(data)); 
                }
            },
            Extensions: load("extensions"),
            Population: load("population"),
            FlagDir: load("flagDir"),
            Task: load("task"),
            Tower: load("tower"),
            FLAG_COLOR: {
                invade: { // destroy everything enemy in the room
                    color: COLOR_RED,
                    secondaryColor: COLOR_RED,
                    filter: {'color': COLOR_RED, 'secondaryColor': COLOR_RED },
                    exploit: { // send privateers to exploit sources
                        color: COLOR_RED,
                        secondaryColor: COLOR_GREEN,
                        filter: {'color': COLOR_RED, 'secondaryColor': COLOR_GREEN }
                    },
                    robbing: { // take energy from foreign structures
                        color: COLOR_RED,
                        secondaryColor: COLOR_YELLOW,
                        filter: {'color': COLOR_RED, 'secondaryColor': COLOR_YELLOW }
                    },
                    hopper: { // the room where tower is
                        color: COLOR_RED,
                        secondaryColor: COLOR_PURPLE,
                        filter: {'color': COLOR_RED, 'secondaryColor': COLOR_PURPLE }
                    },
                    hopperHome: { // room to heal in
                        color: COLOR_RED,
                        secondaryColor: COLOR_BLUE,
                        filter: {'color': COLOR_RED, 'secondaryColor': COLOR_BLUE }
                    }
                },
                //COLOR_PURPLE,
                //COLOR_BLUE,
                //COLOR_CYAN,
                // COLOR_GREEN
                defense: { // point to gather troops
                    color: COLOR_YELLOW,
                    secondaryColor: COLOR_YELLOW,
                    filter: {'color': COLOR_YELLOW, 'secondaryColor': COLOR_YELLOW }
                },
                destroy: { // destroy whats standing here
                    color: COLOR_ORANGE,
                    secondaryColor: COLOR_ORANGE,
                    filter: {'color': COLOR_ORANGE, 'secondaryColor': COLOR_ORANGE },
                    dismantle: {
                        color: COLOR_ORANGE,
                        secondaryColor: COLOR_YELLOW,
                        filter: {'color': COLOR_ORANGE, 'secondaryColor': COLOR_YELLOW }
                    },
                },
                pavementArt: {
                    color: COLOR_BROWN,
                    secondaryColor: COLOR_BROWN,
                    filter: {'color': COLOR_BROWN, 'secondaryColor': COLOR_BROWN },
                },
                // COLOR_GREY
                claim: { // claim this room
                    color: COLOR_WHITE,
                    secondaryColor: COLOR_WHITE,
                    filter: {'color': COLOR_WHITE, 'secondaryColor': COLOR_WHITE },
                    spawn: { // send pioneers & build spawn here
                        color: COLOR_WHITE,
                        secondaryColor: COLOR_GREEN,
                        filter: {'color': COLOR_WHITE, 'secondaryColor': COLOR_GREEN }
                    },
                    pioneer: { // send additional pioneers
                        color: COLOR_WHITE,
                        secondaryColor: COLOR_RED,
                        filter: {'color': COLOR_WHITE, 'secondaryColor': COLOR_RED }
                    },
                    reserve: { // reserve this room
                        color: COLOR_WHITE,
                        secondaryColor: COLOR_GREY,
                        filter: {'color': COLOR_WHITE, 'secondaryColor': COLOR_GREY },
                    }
                }
            },
            DECAY_AMOUNT: {
                'rampart': RAMPART_DECAY_AMOUNT, // 300
                'road': ROAD_DECAY_AMOUNT, // 100
                'container': CONTAINER_DECAY, // 5000
            },
            DECAYABLES: [
                STRUCTURE_ROAD,
                STRUCTURE_CONTAINER,
                STRUCTURE_RAMPART],
            translateErrorCode: function(code){
                var codes = {
                    0: 'OK',
                    1: 'ERR_NOT_OWNER',
                    2: 'ERR_NO_PATH',
                    3: 'ERR_NAME_EXISTS',
                    4: 'ERR_BUSY',
                    5: 'ERR_NOT_FOUND',
                    6: 'ERR_NOT_ENOUGH_RESOURCES',
                    7: 'ERR_INVALID_TARGET',
                    8: 'ERR_FULL',
                    9: 'ERR_NOT_IN_RANGE',
                    10: 'ERR_INVALID_ARGS',
                    11: 'ERR_TIRED',
                    12: 'ERR_NO_BODYPART',
                    14: 'ERR_RCL_NOT_ENOUGH',
                    15: 'ERR_GCL_NOT_ENOUGH'};
                return codes[code*-1];
            },
            dye: function(style, text){
                if( isObj(style) ) {
                    var css = "";
                    var format = key => css += key + ":" + style[key] + ";";
                    _.forEach(Object.keys(style), format);
                    return('<font style="' + css + '">' + text + '</font>');
                }
                if( style )
                    return('<font style="color:' + style + '">' + text + '</font>');
                else return text;
            },
            CRAYON: {
                death: { color: 'black', 'font-weight': 'bold' },
                birth: '#e6de99',
                error: 'FireBrick',
                system: { color: '#999', 'font-size': '10px' }
            },
            logErrorCode: function(creep, code) {
                if( code ) {
                    var error = translateErrorCode(code);
                    if(creep) {
                        if( error ) creep.say(error);
                        else creep.say(code);
                    }
                    var message = error + '\nroom: ' + creep.pos.roomName + '\ncreep: '  + creep.name + '\naction: ' + creep.data.actionName + '\ntarget: ' + creep.data.targetId ;
                    console.log( dye(CRAYON.error, message) );
                    Game.notify( message, 120 );
                } else {
                    var message = 'unknown error code\nroom: ' + creep.pos.roomName + '\ncreep: '  + creep.name + '\naction: ' + creep.data.actionName + '\ntarget: ' + creep.data.targetId ;
                    console.log( dye(CRAYON.error, message) );
                }
            },
            logError: function(message) {
                console.log( dye(CRAYON.error, message) );
            },
            logSystem: function(systemMessage, message) {
                console.log( dye(CRAYON.system, systemMessage  + ' &gt; ') + message );
            },
            isObj: function(val){
                if (val === null) { return false;}
                return ( (typeof val === 'function') || (typeof val === 'object') );
            },
            toLocalDate: function(date){
                if( !date ) date = new Date();
                var offset = TIME_ZONE;
                if( USE_SUMMERTIME && isSummerTime(date) ) offset++;
                return new Date(date.getTime() + (3600000 * offset));
            },
            toDateTimeString: function(date){
                return (len(date.getDate()) + "." + len(date.getMonth()+1) + "." + len(date.getFullYear()) + " " + len(date.getHours()) + ":" + len(date.getMinutes()) + ":" + len(date.getSeconds()));
            },
            toTimeString: function(date){
                return (len(date.getHours()) + ":" + len(date.getMinutes()) + ":" + len(date.getSeconds()));
            },
            len: function(number){
                return ("00" + number).slice(-2);
            },
            isSummerTime: function(date){
                var year = date.getFullYear();
                // last sunday of march
                var temp = new Date(year, 2, 31);
                var begin = new Date(year, 2, temp.getDate() - temp.getDay(), 2, 0, 0);
                // last sunday of october
                temp = new Date(year, 9, 31);
                var end = new Date(year, 9, temp.getDate() - temp.getDay(), 3, 0, 0);

                return ( begin < date && date < end );
            },
            addById: function(array, id){
                if(array == null) array = [];
                var obj = Game.getObjectById(id);
                if( obj ) array.push(obj);
                return array;
            },
            processReports: function(){
                if( !_.isUndefined(Memory.statistics) && !_.isUndefined(Memory.statistics.reports) && Memory.statistics.reports.length > 0 ){
                    let mails;
                    if( Memory.statistics.reports.length <= REPORTS_PER_LOOP ){
                        mails = Memory.statistics.reports;
                        Memory.statistics.reports = [];
                    }
                    else {
                        let chunks = _.chunk(Memory.statistics.reports, REPORTS_PER_LOOP);
                        mails = chunks[0];
                        Memory.statistics.reports = _(chunks).tail().concat();
                    }
                    let send = mail => Game.notify(mail);
                    _.forEach(mails, send);
                }
            },
            routeRange: function(fromRoom, toRoom){
                if( _.isUndefined(Memory.routeRange) ){
                    Memory.routeRange = {};
                }
                if( _.isUndefined(Memory.routeRange[fromRoom]) ){
                    Memory.routeRange[fromRoom] = {};
                }
                if( _.isUndefined(Memory.routeRange[fromRoom][toRoom]) ){
                    let room = null;
                    if( fromRoom instanceof Room ) room = fromRoom;
                    else room = Game.rooms[fromRoom];
                    if( _.isUndefined(room) ) return Room.roomDistance(fromRoom, toRoom, false);
                    let route = room.findRoute(toRoom, false, false);
                    if( _.isUndefined(route) ) return Room.roomDistance(fromRoom, toRoom, false);
                    Memory.routeRange[fromRoom][toRoom] = route == ERR_NO_PATH ? Infinity : route.length;
                }
                return Memory.routeRange[fromRoom][toRoom];
            },
            pave: function(roomName){
                let flags = _.values(Game.flags).filter(flag => flag.pos.roomName == roomName && flag.color == COLOR_BROWN);
                let val = Memory.pavementArt[roomName] === undefined ? '' : Memory.pavementArt[roomName];
                let posMap = flag => 'x'+flag.pos.x+'y'+flag.pos.y;
                Memory.pavementArt[roomName] = val + flags.map(posMap).join('')+'x';
                let setSite = flag => flag.room.createConstructionSite(flag, STRUCTURE_WALL);
                flags.forEach(setSite);
                let remove = flag => flag.remove();
                flags.forEach(remove);
            },
            unpave: function(roomname){

            }
        });
    }
}
module.exports = mod;
