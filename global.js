var params = require('parameter');

var mod = {
    init: function(){
        var register = key => { global[key] = params[key]; };
        _.forEach(Object.keys(params), register);

        Creep.extend = require('creep').extend;
        Room.extend = require('room').extend;
        Spawn.extend = require('spawn').extend;
        
        global.Extensions = require('extensions');
        global.Population = require('population');
        global.Statistics = require('statistics');
        global.MOD = {};    
        global.Tower = require('tower');
        
        global.FLAG_COLOR = {
            invade: { // destroy everything enemy in the room
                color: COLOR_RED, 
                secondaryColor: COLOR_RED,
                filter: {'color': COLOR_RED, 'secondaryColor': COLOR_RED },                 
                exploit: { // send privateers to exploit sources
                    color: COLOR_RED, 
                    secondaryColor: COLOR_GREEN,
                    filter: {'color': COLOR_RED, 'secondaryColor': COLOR_GREEN }
                },  
            },
            //COLOR_PURPLE,
            //COLOR_BLUE,
            //COLOR_CYAN,
            idle: { // creeps go here to have a nice time (getting out of the way)
                color: COLOR_GREEN, 
                secondaryColor: COLOR_GREEN,
                filter: {'color': COLOR_GREEN, 'secondaryColor': COLOR_GREEN }
            },
            defense: { // point to gather troops
                color: COLOR_YELLOW, 
                secondaryColor: COLOR_YELLOW,
                filter: {'color': COLOR_YELLOW, 'secondaryColor': COLOR_YELLOW }
            },
            destroy: { // destroy whats standing here
                color: COLOR_ORANGE, 
                secondaryColor: COLOR_ORANGE,
                filter: {'color': COLOR_ORANGE, 'secondaryColor': COLOR_ORANGE }
            },
            //COLOR_BROWN,
            // COLOR_GREY,
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
                }
            }
        };
        global.PART_COSTS = {
            work: 100,
            carry: 50,
            move: 50, 
            attack: 80, 
            ranged_attack: 150, 
            heal: 250, 
            claim: 600, 
            tough: 10
        };
        global.ERROR_CODE = function(code){
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
        };
        global.DYE = function(style, text){
            if( isObj(style) ) {
                var css = "";
                var format = key => css += key + ":" + style[key] + ";";
                _.forEach(Object.keys(style), format);
                return('<font style="' + css + '">' + text + '</font>');
            }
            if( style )
                return('<font style="color:' + style + '">' + text + '</font>');
            else return text;
        };
        global.CRAYON = {
            death: { color: 'black', 'font-weight': 'bold' }, 
            birth: '#e6de99', 
            error: 'FireBrick', 
            system: { color: '#999', 'font-size': '10px' }
        };
        global.ERROR_LOG = function(creep, code) {
            if( code ) {
                var error = ERROR_CODE(code);
                if(creep) {
                    if( error ) creep.say(error);
                    else creep.say(code);
                }
                var message = error + '\ncreep: '  + creep.name + '\naction: ' + creep.memory.action + '\ntarget: ' + creep.memory.target ;
                console.log( DYE(CRAYON.error, message) );
                Game.notify( message, 120 );
            } else console.log( DYE(CRAYON.error, 'unknown error code!') );
        };
        global.isObj = function(val){
            if (val === null) { return false;}
            return ( (typeof val === 'function') || (typeof val === 'object') );
        }
        global.LocalDate = function(date){
            if( !date ) date = new Date(); 
            var offset = TIME_ZONE;
            if( USE_SUMMERTIME && IS_SUMMERTIME(date) ) offset++;
            return new Date(date.getTime() + (3600000 * offset));
        }
        global.IS_SUMMERTIME = function(date){
            var year = date.getFullYear();
            // last sunday of march
            var temp = new Date(year, 2, 31);
            var begin = new Date(year, 2, temp.getDate() - temp.getDay(), 2, 0, 0);
            // last sunday of october
            temp = new Date(year, 9, 31);
            var end = new Date(year, 9, temp.getDate() - temp.getDay(), 3, 0, 0);

            return ( begin < date && date < end );
        };
        global.AddById = function(array, id){
            if(array == null) array = [];
            var obj = Game.getObjectById(id);
            if( !_.isUndefined(obj) ){
                array.push(obj);
            }
            return array;
        };
    }
}

module.exports = mod;