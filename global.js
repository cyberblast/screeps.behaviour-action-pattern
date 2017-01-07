var mod = {
    custom: function(){
        //console.log('base');
    },
    init: function(params){
        // Load extension functions
        Creep.extend = load("creep").extend;
        Room.extend = load("room").extend;
        Spawn.extend = load("spawn").extend;
        // make params available globally
        _.assign(global, params);
        // Add more stuff to global
        _.assign(global, {
            // base class for events
            LiteEvent: function() {
                // registered subscribers
                this.handlers = [];
                // register a new subscriber
                this.on = function(handler) {
                    this.handlers.push(handler);
                }
                // remove a registered subscriber
                this.off = function(handler) {
                    this.handlers = this.handlers.filter(h => h !== handler);
                }
                // call all registered subscribers
                this.trigger = function(data) {
                    this.handlers.slice(0).forEach(h => h(data)); 
                }
            },
            // load modules
            Extensions: load("extensions"),
            Population: load("population"),
            FlagDir: load("flagDir"),
            Task: load("task"),
            Tower: load("tower"),
            // Flag colors, used throughout the code
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
            // used to log something meaningful instead of numbers
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
            // manipulate log output
            // simply put a color as "style"
            // or an object, containing any css 
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
            // predefined log colors
            CRAYON: {
                death: { color: 'black', 'font-weight': 'bold' },
                birth: '#e6de99',
                error: 'FireBrick',
                system: { color: '#999', 'font-size': '10px' }
            },
            // log an error for a creeps action, given an error code
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
            // log some text as error
            logError: function(message) {
                console.log( dye(CRAYON.error, message) );
            },
            // log some text as "system message" showing a "referrer" as label
            logSystem: function(roomName, message) {
                let text = dye(CRAYON.system, roomName);
                console.log( dye(CRAYON.system, `<a href="/a/#!/room/${roomName}">${text}</a> &gt; `) + message );
            },
            isObj: function(val){
                if (val === null) { return false;}
                return ( (typeof val === 'function') || (typeof val === 'object') );
            },
            // for notify mails: transform server time to local
            toLocalDate: function(date){
                if( !date ) date = new Date();
                var offset = TIME_ZONE;
                if( USE_SUMMERTIME && isSummerTime(date) ) offset++;
                return new Date(date.getTime() + (3600000 * offset));
            },
            // for notify mails: format dateTime (as date & time)
            toDateTimeString: function(date){
                return (len(date.getDate()) + "." + len(date.getMonth()+1) + "." + len(date.getFullYear()) + " " + len(date.getHours()) + ":" + len(date.getMinutes()) + ":" + len(date.getSeconds()));
            },
            // for notify mails: format dateTime (as time only)
            toTimeString: function(date){
                return (len(date.getHours()) + ":" + len(date.getMinutes()) + ":" + len(date.getSeconds()));
            },
            // prefix 1 digit numbers with an 0
            len: function(number){
                return ("00" + number).slice(-2);
            },
            // determine if a given dateTime is within daylight saving time (DST)
            // you may need to adjust that to your local summer time rules
            // default: Central European Summer Time (CEST)
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
            // add a game object, obtained from its id, to an array
            addById: function(array, id){
                if(array == null) array = [];
                var obj = Game.getObjectById(id);
                if( obj ) array.push(obj);
                return array;
            },
            // send up to REPORTS_PER_LOOP notify mails, which are cached in memory
            processReports: function(){
                // if there are some in memory
                if( !_.isUndefined(Memory.statistics) && !_.isUndefined(Memory.statistics.reports) && Memory.statistics.reports.length > 0 ){
                    let mails;
                    // below max ?
                    if( Memory.statistics.reports.length <= REPORTS_PER_LOOP ){
                        // send all
                        mails = Memory.statistics.reports;
                        Memory.statistics.reports = [];
                    }
                    else {
                        // send first chunk
                        let chunks = _.chunk(Memory.statistics.reports, REPORTS_PER_LOOP);
                        mails = chunks[0];
                        Memory.statistics.reports = _(chunks).tail().concat();
                    }
                    let send = mail => Game.notify(mail);
                    _.forEach(mails, send);
                }
            },
            // get movement range between rooms
            // respecting environmental walls
            // uses memory to cache for ever
            routeRange: function(fromRoom, toRoom){
                if( fromRoom === toRoom ) return 0;
                if( _.isUndefined(Memory.routeRange) ){
                    Memory.routeRange = {};
                }
                if( _.isUndefined(Memory.routeRange[fromRoom]) ){
                    Memory.routeRange[fromRoom] = {};
                }
                if( _.isUndefined(Memory.routeRange[fromRoom][toRoom]) ){
                    // ensure start room object
                    let room = null;
                    if( fromRoom instanceof Room ) room = fromRoom;
                    else room = Game.rooms[fromRoom];
                    if( _.isUndefined(room) ) return Room.roomDistance(fromRoom, toRoom, false);
                    // get valid route to room (respecting environmental walls)
                    let route = room.findRoute(toRoom, false, false);
                    if( _.isUndefined(route) ) return Room.roomDistance(fromRoom, toRoom, false);
                    // store path length for ever
                    Memory.routeRange[fromRoom][toRoom] = route == ERR_NO_PATH ? Infinity : route.length;
                }
                return Memory.routeRange[fromRoom][toRoom];
            },
            // turn brown flags into wall construction sites
            // save positions in memory (to ignore them for repairing)
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
            // TODO: remove a pavement
            unpave: function(roomname){

            },
            guid: function(){
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
            }
        });
    }
}
module.exports = _.bindAll(mod);
