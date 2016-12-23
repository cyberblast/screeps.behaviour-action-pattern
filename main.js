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
            path = './internalViral.' + modName;
            try {
                let viralOverride = require(path);
                if( viralOverride ) Memory.modules.internalViral[modName] = true;
                else delete Memory.modules.internalViral[modName];
            }
            catch (e) {
                delete Memory.modules.internalViral[modName];
            }
            path = './viral.' + modName;
            try {
                let viralOverride = require(path);
                if( viralOverride ) Memory.modules.viral[modName] = true;
                else delete Memory.modules.viral[modName];
            }
            catch (e) {
                delete Memory.modules.viral[modName];
            }
        }
        return Memory.modules[modName];
    };
    global.tryGetModule = (p, silent = false) => {
        let m;
        try{        
            m = require(p);
        } catch(e) {
            if( e.message && e.message.indexOf('Unknown module') > -1 ){
                if(!silent) console.log(`Module "${modName}" not found!`);
            } else if(m == null) {
                console.log(`Error loading module "${modName}"!<br/>${e.toString()}`);
            }
            m = null;
        }
        return m;
    };        
    global.load = (modName) => {
        // read stored module path
        let path = getPath(modName);
        // try to load module
        let mod = tryGetModule(path, true);
        if( !mod ) {
            // re-evaluate path
            path = getPath(modName, true);
            // try to load module. Log error to console.
            mod = tryGetModule(path);
        }
        if( mod ) {
            if( Memory.modules.internalViral[modName] ) {
                // read stored viral override path
                let viralOverride = tryGetModule('./internalViral.' + modName);
                // override
                if( viralOverride ) _.assign(mod, viralOverride);
                // cleanup
                else delete Memory.modules.internalViral[modName];
            }
            if( Memory.modules.viral[modName] ) {
                // read stored viral override path
                let viralOverride = tryGetModule('./viral.' + modName);
                // override
                if( viralOverride ) _.assign(mod, viralOverride);
                // cleanup
                else delete Memory.modules.viral[modName];
            }
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