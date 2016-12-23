/* https://github.com/cyberblast/screeps.ocs.internal */

module.exports.loop = function () {
    global.getPath = (modName, reevaluate = false) => {
        if (Memory.modules === undefined) 
            Memory.modules = {};
        if (Memory.modules.viral === undefined) 
            Memory.modules.viral = {};
        if( reevaluate || !Memory.modules[modName] ){
            // find base file
            let path = './custom.' + modName;
            try {
                let a = require(path);
            }
            catch (e) {
                path = './internal.' + modName;
                try {
                    let a = require(path);
                }
                catch (e) {
                    path = './' + modName
                }
            }
            finally {
                Memory.modules[modName] = path;
            }
            // find viral file
            let viralOverride = null;
            path = './internalViral.' + modName;
            try {
                viralOverride = require(path);
                if( viralOverride ) Memory.modules.internalViral[modName] = true;
            }
            catch (e) { } // expected
            if( !viralOverride && Memory.modules.internalViral && Memory.modules.internalViral[modName] ) 
                delete Memory.modules.internalViral[modName];
            viralOverride = null
            path = './viral.' + modName;
            try {
                viralOverride = require(path);
                if( viralOverride ) Memory.modules.viral[modName] = true;
            }
            catch (e) { } // expected
            if( !viralOverride && Memory.modules.internalViral && Memory.modules.internalViral[modName] ) 
                delete Memory.modules.internalViral[modName];
        }
        return Memory.modules[modName];
    };
    global.tryRequire = (path, silent = false) => {
        let mod;
        try{
            mod = require(path);
        } catch(e) {
            if( e.message && e.message.indexOf('Unknown module') > -1 ){
                if(!silent) console.log(`Module "${path}" not found!`);
            } else if(mod == null) {
                console.log(`Error loading module "${path}"!<br/>${e.toString()}`);
            }
            mod = null;
        }
        return mod;
    };
    global.infect = (mod, namespace, modName) => {
        if( Memory.modules[namespace] && Memory.modules[namespace][modName] ) {
            // get module from stored viral override path
            let viralOverride = tryRequire(`./${namespace}.${modName}`);
            // override
            if( viralOverride ) _.assign(mod, viralOverride);
            // cleanup
            else delete Memory.modules[namespace][modName];
        }
        return mod;
    }
    global.load = (modName) => {
        // read stored module path
        let path = getPath(modName);
        // try to load module
        let mod = tryRequire(path, true);
        if( !mod ) {
            // re-evaluate path
            path = getPath(modName, true);
            // try to load module. Log error to console.
            mod = tryRequire(path);
        }
        if( mod ) {
            // load viral overrides 
            mod = infect(mod, 'internalViral', modName);
            mod = infect(mod, 'viral', modName);
        }
        return mod;
    };

    // initialize global & parameters
    let params = load("parameter");
    let glob = load("global");
    glob.init(params);

    // Extend Server Objects
    Extensions.extend();
    Creep.extend();
    Room.extend();
    Spawn.extend();
    FlagDir.extend();
    if( glob.extend ) glob.extend();

    // Register task hooks
    Task.register();

    // Analyze environment
    Population.loop();
    FlagDir.loop();
    let roomLoop = room => {
        room.loop();
        Tower.loop(room);
    };
    _.forEach(Game.rooms, roomLoop);

    // Execution
    Creep.loop();
    Spawn.loop();

    // Evaluation
    if( Memory.statistics && Memory.statistics.tick && Memory.statistics.tick + TIME_REPORT <= Game.time )
        load("statistics").loop();
    processReports();
};