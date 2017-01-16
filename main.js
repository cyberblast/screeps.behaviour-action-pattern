/* https://github.com/ScreepsOCS/screeps.behaviour-action-pattern */

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

// Initialize global & parameters
let params = load("parameter");
let glob = load("global");
glob.init(params);

// Load modules
_.assign(global, {
    Extensions: load("extensions"),
    Population: load("population"),
    FlagDir: load("flagDir"),
    Task: load("task"),
    Tower: load("tower"),
    Events: load('events')
});
_.assign(global.Task, {
    guard: load("task.guard"),
    defense: load("task.defense"),
    mining: load("task.mining"),
    claim: load("task.claim"),
    reserve: load("task.reserve"),
    pioneer: load("task.pioneer"),
    attackController: load("task.attackController")
});
_.assign(Creep, {
    Action: load("creep.Action"),
    Setup: load("creep.Setup"),
    action: {
        building: load("creep.action.building"), 
        charging: load("creep.action.charging"),
        claiming: load("creep.action.claiming"),
        defending: load("creep.action.defending"),
        dismantling: load("creep.action.dismantling"),
        feeding: load("creep.action.feeding"), 
        fortifying: load("creep.action.fortifying"), 
        fueling: load("creep.action.fueling"), 
        guarding: load("creep.action.guarding"), 
        harvesting: load("creep.action.harvesting"),
        healing: load("creep.action.healing"),
        idle: load("creep.action.idle"),
        invading: load("creep.action.invading"),
        picking: load("creep.action.picking"), 
        repairing: load("creep.action.repairing"), 
        reserving: load("creep.action.reserving"),
        travelling: load("creep.action.travelling"), 
        storing: load("creep.action.storing"), 
        uncharging: load("creep.action.uncharging"),
        upgrading: load("creep.action.upgrading"), 
        withdrawing: load("creep.action.withdrawing"),
        robbing:load("creep.action.robbing"),
        reallocating:load("creep.action.reallocating"),
        recycling:load("creep.action.recycling"),
        attackController:load("creep.action.attackController")
    },
    behaviour: {
        claimer: load("creep.behaviour.claimer"),
        hauler: load("creep.behaviour.hauler"),
        healer: load("creep.behaviour.healer"),
        melee: load("creep.behaviour.melee"),
        miner: load("creep.behaviour.miner"),
        mineralMiner: load("creep.behaviour.mineralMiner"),
        remoteMiner: load("creep.behaviour.remoteMiner"),
        remoteHauler: load("creep.behaviour.remoteHauler"),
        remoteWorker: load("creep.behaviour.remoteWorker"),
        pioneer: load("creep.behaviour.pioneer"),
        privateer: load("creep.behaviour.privateer"),
        ranger: load("creep.behaviour.ranger"),
        upgrader: load("creep.behaviour.upgrader"),
        worker: load("creep.behaviour.worker")
    },
    setup: {
        hauler: load("creep.setup.hauler"),
        healer: load("creep.setup.healer"),
        miner: load("creep.setup.miner"),
        mineralMiner: load("creep.setup.mineralMiner"),
        privateer: load("creep.setup.privateer"),
        upgrader: load("creep.setup.upgrader"),
        worker: load("creep.setup.worker")
    },
    extend: load("creep").extend
});
Room.extend = load("room").extend;
Spawn.extend = load("spawn").extend;
// custom load injection
if( glob.load ) glob.load();

// Extend server objects
Extensions.extend();
Creep.extend();
Room.extend();
Spawn.extend();
FlagDir.extend();
// custom extend injection
if( glob.extend ) glob.extend();

module.exports.loop = function () {
    // ensure up to date parameters
    _.assign(global, load("parameter"));

    // Flush & create cache
    Events.flush();
    Population.flush();
    FlagDir.flush();
    // custom flush injection
    if( glob.flush ) glob.flush();

    // analyze environment
    Population.analyze();
    FlagDir.analyze();
    Room.loop();
    // custom analyze injection
    if( glob.analyze ) glob.analyze();

    // Register event hooks
    Creep.register();
    Task.register();
    // custom register injection
    if( glob.register ) glob.register();

    // Execution
    Population.execute();
    FlagDir.execute();
    Room.loop();
    Creep.loop();
    Spawn.loop();
    // custom execute injection
    if( glob.execute ) glob.execute();

    // Postprocessing
    if( !Memory.statistics || ( Memory.statistics.tick && Memory.statistics.tick + TIME_REPORT <= Game.time ))
        load("statistics").loop();
    processReports();
    Population.cleanup();
    FlagDir.cleanup();
    // custom cleanup injection
    if( glob.cleanup ) glob.cleanup();

    // deprecated
    if( glob.custom ) glob.custom();

    Game.cacheTime = Game.time;
};
