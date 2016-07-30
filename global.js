var mod = {
    init: function(){
        global.CHATTY = false; // creeps like talking 
        global.SAY_PUBLIC = true; // creeps talk public
        global.DEBUG = true; // gimme some more details
        global.LIMIT_CREEP_REPAIRING = 1000; // urgent repair when hits below
        global.LIMIT_STORAGE_ENERGY = 500000; // stop storing energy when reached
        global.TIME_REPORT = 8000; // ticks between room reports
        global.INTRUDER_REPORT_DELAY = 360; // minutes between intruder reports
        global.HIVE_ENERGY_URGENT = 0.3; // prefer withdraw & add more feeding below this relative amount of available energy
        global.TOWER_REPAIR_LIMITS = { // Limits how high structures get repaired by towers, regarding RCL
            2: 10000,
            3: 10000,
            4: 20000,
            5: 50000,
            6: 80000,
            7: 120000,
            8: Infinity
        };
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
        global.ERROR_LOG = function(creep, code) {
            if(creep) creep.say(ERROR_CODE(code));
            var message = ERROR_CODE(code) + '\ncreep: '  + creep.name + '\naction: ' + creep.memory.action + '\ntarget: ' + creep.memory.target ;
            console.log( message );
            Game.notify( message, 120 );
        };
        global.MODULES = {};    
        global.MODULES.extensions = require('extensions');
        global.MODULES.population = require('population');
        global.MODULES.room = require('room');
        global.MODULES.spawn = require('spawn'); 
        global.MODULES.tower = require('tower');
    }
}

module.exports = mod;