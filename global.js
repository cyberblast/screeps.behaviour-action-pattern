var mod = {
    init: function(){
        global.MODULES = {
            creep: _.assign(require('creep'), {
                action: _.assign(require('creep.action'), {
                    building: require('creep.action.building'), 
                    defending: {
                        ranged: require('creep.action.defending.ranged')
                    }, 
                    feeding: require('creep.action.feeding'), 
                    fueling: require('creep.action.fueling'), 
                    guarding: require('creep.action.guarding'), 
                    harvesting: require('creep.action.harvesting'),
                    idle: require('creep.action.idle'), 
                    picking: require('creep.action.picking'), 
                    repairing: require('creep.action.repairing'), 
                    storing: require('creep.action.storing'), 
                    upgrading: require('creep.action.upgrading'), 
                    withdrawing: require('creep.action.withdrawing')
                }),
                behaviour: {
                    claimer: require('creep.behaviour.claimer'),
                    conqueror: require('creep.behaviour.conqueror'),
                    defender: require('creep.behaviour.defender'),
                    worker: _assign(require('creep.behaviour.worker'), {
                        noEnergy: require('creep.behaviour.worker.noEnergy')
                    })
                }, 
                setup: _assign(require('creep.setup'), {
                    claimer: require('creep.setup.claimer'),
                    conqueror: require('creep.setup.conqueror'),
                    defender: require('creep.setup.defender'),
                    worker: require('creep.setup.worker'),
                })
            }), 
            extensions: require('extensions'),
            room: {},
            spawn: require('spawn'), 
            tower: require('tower')
        };

        global.STRATEGY = 'defensive';
        global.DEBUG = true;
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
        global.LIMIT_CREEP_REPAIRING = 1000;
        global.errorCode = function(code){
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
        global.logError = function(creep, code) {
            if(creep) creep.say(errorCode(code));
            var message = errorCode(code) + '\ncreep: '  + creep.name + '\naction: ' + creep.memory.action + '\ntarget: ' + creep.memory.target ;
            console.log( message );
            Game.notify( message, 120 );
        };
    }
}

module.exports = mod;