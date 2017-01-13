/* https://github.com/ScreepsOCS/screeps.behaviour-action-pattern */

module.exports.loop = function () {
    // ensure required memory namespaces
    if (Memory.modules === undefined) 
        Memory.modules = {};
    if (Memory.modules.viral === undefined) 
        Memory.modules.viral = {};
    if (Memory.modules.internalViral === undefined) 
        Memory.modules.internalViral = {};
    // check if a path is valid
    global.validatePath = path => {
        let mod;
        try {
            mod = require(path);
        }
        catch (e) {
            if (global.DEBUG !== false && !(e.message && e.message.startsWith('Unknown module'))) {
                console.log('<font style="color:FireBrick">Error loading ' + path
                    + ' caused by ' + e.toString() + '</font>');
            }
            mod = null;
        }
        return mod != null;
    };
    // evaluate existing module overrides and store them to memory. 
    // return current module path to use for require
    global.getPath = (modName, reevaluate = false) => {
        if( reevaluate || !Memory.modules[modName] ){
            // find base file
            let path = './custom.' + modName;
            if(!validatePath(path)) {
                path = './internal.' + modName;
                if(!validatePath(path)) 
                    path = './' + modName;
            }
            Memory.modules[modName] = path;
            // find viral file
            path = './internalViral.' + modName;
            if(validatePath(path))
                Memory.modules.internalViral[modName] = true;
            else if( Memory.modules.internalViral[modName] )
                delete Memory.modules.internalViral[modName];
            path = './viral.' + modName;
            if(validatePath(path))
                Memory.modules.viral[modName] = true;
            else if( Memory.modules.viral[modName] )
                delete Memory.modules.viral[modName];
        }
        return Memory.modules[modName];
    };
    // try to require a module. Log errors.
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
    // partially override a module using a registered viral file
    global.infect = (mod, namespace, modName) => {
        if( Memory.modules[namespace][modName] ) {
            // get module from stored viral override path
            let viralOverride = tryRequire(`./${namespace}.${modName}`);
            // override
            if( viralOverride ) {
                let keys = _.keys(viralOverride);
                for (const key of keys) {
                    if (typeof viralOverride[key] === "function") {
                        let original = mod[key];
                        // will result in callstack exceed :/
                        // if( !mod[key].original ) mod[key].original = original;
                        if( !mod.baseOf ) mod.baseOf = {};
                        // namespace will allow to extend multiple times.
                        if( !mod.baseOf[namespace] ) mod.baseOf[namespace] = {};
                        if( !mod.baseOf[namespace][key] ) mod.baseOf[namespace][key] = original;
                        
                        mod[key] = viralOverride[key].bind(mod);
                    } else {
                        mod[key] = viralOverride[key]
                    }
                }
            }
            // cleanup
            else delete Memory.modules[namespace][modName];
        }
        return mod;
    };
    // loads (require) a module. use this function anywhere you want to load a module.
    // respects custom and viral overrides
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
    // use a viral.global.js module to implement your own custom function
    if( glob.custom ) glob.custom();

    // Register setup / behaviour / action hooks.
    Creep.register();
    // Register task hooks
    Task.register();

    // Analyze environment
    Population.loop();
    FlagDir.loop();
    Room.loop();

    // Execution
    Creep.loop();
    Spawn.loop();

    // Evaluation
    if( !Memory.statistics || ( Memory.statistics.tick && Memory.statistics.tick + TIME_REPORT <= Game.time ))
        load("statistics").loop();
    processReports();
    Game.cacheTime = Game.time;
};
