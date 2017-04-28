/* https://github.com/ScreepsOCS/screeps.behaviour-action-pattern */
const cpuAtLoad = Game.cpu.getUsed();

// check if a path is valid
global.validatePath = path => {
    let mod;
    try {
        mod = require(path);
    }
    catch (e) {
        if (global.DEBUG !== false && !(e.message && e.message.startsWith('Unknown module'))) {
            console.log('<font style="color:FireBrick">Error loading ' + path
                + ' caused by ' + (e.stack || e.toString()) + '</font>');
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
            console.log(`Error loading module "${path}"!<br/>${e.stack || e.toString()}`);
        }
        mod = null;
    }
    return mod;
};
// inject members of alien class into base class. specify a namespace to call originals from baseObject.baseOf[namespace]['<functionName>'] later
global.inject = (base, alien, namespace) => {
    let keys = _.keys(alien);
    for (const key of keys) {
        if (typeof alien[key] === "function") {
            if (namespace) {
                let original = base[key];
                if (!base.baseOf) base.baseOf = {};
                if (!base.baseOf[namespace]) base.baseOf[namespace] = {};
                if (!base.baseOf[namespace][key]) base.baseOf[namespace][key] = original;
            }
            base[key] = alien[key].bind(base);
        } else if (alien[key] !== null && typeof base[key] === 'object' && !Array.isArray(base[key]) &&
            typeof alien[key] === 'object' && !Array.isArray(alien[key])) {
            _.merge(base[key], alien[key]);
        } else {
            base[key] = alien[key]
        }
    }
};
// partially override a module using a registered viral file
global.infect = (mod, namespace, modName) => {
    if( Memory.modules[namespace][modName] ) {
        // get module from stored viral override path
        let viralOverride = tryRequire(`./${namespace}.${modName}`);
        // override
        if( viralOverride ) {
            global.inject(mod, viralOverride, namespace);
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
// load code
global.install = () => {
    // ensure required memory namespaces
    if (Memory.modules === undefined)  {
        Memory.modules = {
            valid: Game.time,
            viral: {},
            internalViral: {}
        };
    } else if (_.isUndefined(Memory.modules.valid)) {
        Memory.modules.valid = Game.time;
    }
    // Initialize global & parameters
    //let glob = load("global");
    global.inject(global, load("global"));
    _.assign(global, load("parameter"));
    global.mainInjection = load("mainInjection");

    // Load modules
    _.assign(global, {
        Extensions: load("extensions"),
        Population: load("population"),
        FlagDir: load("flagDir"),
        Task: load("task"),
        Tower: load("tower"),
        Util: load('util'),
        Events: load('events'),
        OCSMemory: load('ocsMemory'),
        Grafana: GRAFANA ? load('grafana') : undefined,
        Visuals: load('visuals'),
    });
    _.assign(global.Util, {
        DiamondIterator: load('util.diamond.iterator'),
        SpiralIterator: load('util.spiral.iterator'),
    });
    _.assign(global.Task, {
        guard: load("task.guard"),
        defense: load("task.defense"),
        mining: load("task.mining"),
        claim: load("task.claim"),
        reserve: load("task.reserve"),
        pioneer: load("task.pioneer"),
        attackController: load("task.attackController"),
        robbing: load("task.robbing"),
        reputation: load("task.reputation"),
        delivery: load("task.delivery"),
        labTech: load("task.labTech"),
    });
    Creep.Action = load("creep.Action");
    Creep.Setup = load("creep.Setup");
    _.assign(Creep, {
        action: {
            attackController: load("creep.action.attackController"),
            avoiding: load("creep.action.avoiding"),
            boosting: load("creep.action.boosting"),
            building: load("creep.action.building"),
            bulldozing: load('creep.action.bulldozing'),
            charging: load("creep.action.charging"),
            claiming: load("creep.action.claiming"),
            defending: load("creep.action.defending"),
            dismantling: load("creep.action.dismantling"),
            dropping: load("creep.action.dropping"),
            feeding: load("creep.action.feeding"), 
            fortifying: load("creep.action.fortifying"), 
            fueling: load("creep.action.fueling"), 
            guarding: load("creep.action.guarding"), 
            harvesting: load("creep.action.harvesting"),
            healing: load("creep.action.healing"),
            idle: load("creep.action.idle"),
            invading: load("creep.action.invading"),
            picking: load("creep.action.picking"),
            reallocating:load("creep.action.reallocating"),
            recycling:load("creep.action.recycling"),
            repairing: load("creep.action.repairing"),
            reserving: load("creep.action.reserving"),
            robbing:load("creep.action.robbing"),
            storing: load("creep.action.storing"),
            travelling: load("creep.action.travelling"),
            uncharging: load("creep.action.uncharging"),
            upgrading: load("creep.action.upgrading"), 
            withdrawing: load("creep.action.withdrawing"),
        },
        behaviour: {
            claimer: load("creep.behaviour.claimer"),
            collapseWorker: load("creep.behaviour.collapseWorker"),
            hauler: load("creep.behaviour.hauler"),
            healer: load("creep.behaviour.healer"),
            labTech: load("creep.behaviour.labTech"),
            melee: load("creep.behaviour.melee"),
            miner: load("creep.behaviour.miner"),
            mineralMiner: load("creep.behaviour.mineralMiner"),
            remoteMiner: load("creep.behaviour.remoteMiner"),
            remoteHauler: load("creep.behaviour.remoteHauler"),
            remoteWorker: load("creep.behaviour.remoteWorker"),
            pioneer: load("creep.behaviour.pioneer"),
            privateer: load("creep.behaviour.privateer"),
            recycler: load("creep.behaviour.recycler"),
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
        }
    });
    global.inject(Creep, load("creep"));
    global.inject(Room, load("room"));
    _.assign(Room, {
        _ext: {
            construction: load("room.construction"),
            containers: load("room.container"),
            defense: load("room.defense"),
            extensions: load("room.extension"),
            labs: load("room.lab"),
            links: load("room.link"),
            nuker: load("room.nuker"),
            observers: load("room.observer"),
            orders: load("room.orders"),
            power: load("room.power"),
            resources: load("room.resources"),
            spawns: load("room.spawn"),
            towers: load("room.tower"),
        },
    });
    global.inject(Spawn, load("spawn"));

    // Extend server objects
    //global.extend();
    Extensions.extend();
    Creep.extend();
    Room.extend();
    Spawn.extend();
    FlagDir.extend();
    Task.populate();
    // custom extend
    if( global.mainInjection.extend ) global.mainInjection.extend();
    OCSMemory.activateSegment(MEM_SEGMENTS.COSTMATRIX_CACHE, true);

    global.modulesValid = Memory.modules.valid;
    if (global.DEBUG) logSystem('Global.install', 'Code reloaded.');
};
global.install();
load('traveler')({exportTraveler: false, installTraveler: true, installPrototype: true, defaultStuckValue: TRAVELER_STUCK_TICKS, reportThreshold: TRAVELER_THRESHOLD});

let cpuAtFirstLoop;
module.exports.loop = function () {
    const cpuAtLoop = Game.cpu.getUsed();
    if (Memory.pause) return;
    
    try {
        const totalUsage = Util.startProfiling('main', {startCPU: cpuAtLoop});
        const p = Util.startProfiling('main', {enabled: PROFILING.MAIN, startCPU: cpuAtLoop});
        p.checkCPU('deserialize memory', 5); // the profiler makes an access to memory on startup
        // let the cpu recover a bit above the threshold before disengaging to prevent thrashing
        Memory.CPU_CRITICAL = Memory.CPU_CRITICAL ? Game.cpu.bucket < CRITICAL_BUCKET_LEVEL + CRITICAL_BUCKET_OVERFILL : Game.cpu.bucket < CRITICAL_BUCKET_LEVEL;
        if (!cpuAtFirstLoop) cpuAtFirstLoop = cpuAtLoop;
        // ensure required memory namespaces
        if (_.isUndefined(Memory.modules) || _.isUndefined(global.modulesValid) || global.modulesValid !== Memory.modules.valid)  {
            global.install();
        }
        if (Memory.debugTrace === undefined) {
            Memory.debugTrace = {error:true, no:{}};
        }
        if (Memory.cloaked === undefined) {
            Memory.cloaked = {};
        }
        
        Util.set(Memory, 'parameters', {});
        _.assign(global, {parameters: Memory.parameters}); // allow for shorthand access in console
        // ensure up to date parameters, override in memory
        _.assign(global, load("parameter"));
        _.merge(global, parameters);        
        
      // process loaded memory segments
        OCSMemory.processSegments();
        p.checkCPU('processSegments', PROFILING.ANALYZE_LIMIT);
    
        // Flush cache
        Events.flush();
        FlagDir.flush();
        Population.flush();
        Room.flush();
        Task.flush();
        // custom flush
        if( global.mainInjection.flush ) global.mainInjection.flush();
        p.checkCPU('flush', PROFILING.FLUSH_LIMIT);
    
        // Room event hooks must be registered before analyze for costMatrixInvalid
        Room.register();
    
        // analyze environment, wait a tick if critical failure
        if (!FlagDir.analyze()) {
            logError('FlagDir.analyze failed, waiting one tick to sync flags');
            return;
        }
        p.checkCPU('FlagDir.analyze', PROFILING.ANALYZE_LIMIT);
        Room.analyze();
        p.checkCPU('Room.analyze', PROFILING.ANALYZE_LIMIT);
        Population.analyze();
        p.checkCPU('Population.analyze', PROFILING.ANALYZE_LIMIT);
        // custom analyze
        if( global.mainInjection.analyze ) global.mainInjection.analyze();


        // Register event hooks
        Creep.register();
        Spawn.register();
        Task.register();
        // custom register
        if( global.mainInjection.register ) global.mainInjection.register();
        p.checkCPU('register', PROFILING.REGISTER_LIMIT);

        // Execution
        Population.execute();
        p.checkCPU('population.execute', PROFILING.EXECUTE_LIMIT);
        FlagDir.execute();
        p.checkCPU('flagDir.execute', PROFILING.EXECUTE_LIMIT);
        Room.execute();
        p.checkCPU('room.execute', PROFILING.EXECUTE_LIMIT);
        Creep.execute();
        p.checkCPU('creep.execute', PROFILING.EXECUTE_LIMIT);
        Spawn.execute();
        p.checkCPU('spawn.execute', PROFILING.EXECUTE_LIMIT);
        // custom execute
        if( global.mainInjection.execute ) global.mainInjection.execute();

        // Postprocessing
        if (SEND_STATISTIC_REPORTS) {
            if( !Memory.statistics || ( Memory.statistics.tick && Memory.statistics.tick + TIME_REPORT <= Game.time ))
                load("statistics").process();
            processReports();
        p.checkCPU('processReports', PROFILING.FLUSH_LIMIT);
        }
        FlagDir.cleanup();
        p.checkCPU('FlagDir.cleanup', PROFILING.FLUSH_LIMIT);
        Population.cleanup();
        p.checkCPU('Population.cleanup', PROFILING.FLUSH_LIMIT);
        Room.cleanup(); 
        p.checkCPU('Room.cleanup', PROFILING.FLUSH_LIMIT);
        // custom cleanup
        if( global.mainInjection.cleanup ) global.mainInjection.cleanup();

        OCSMemory.cleanup(); // must come last
        p.checkCPU('OCSMemory.cleanup', PROFILING.ANALYZE_LIMIT);
        if (ROOM_VISUALS && !Memory.CPU_CRITICAL) Visuals.run(); // At end to correctly display used CPU.
        p.checkCPU('visuals', PROFILING.EXECUTE_LIMIT);

        if ( GRAFANA && Game.time % GRAFANA_INTERVAL === 0 ) Grafana.run();
        p.checkCPU('grafana', PROFILING.EXECUTE_LIMIT);

        Game.cacheTime = Game.time;
    
        if( global.DEBUG && global.TRACE ) trace('main', {cpuAtLoad, cpuAtFirstLoop, cpuAtLoop, cpuTick: Game.cpu.getUsed(), isNewServer: global.isNewServer, lastServerSwitch: Game.lastServerSwitch, main:'cpu'});
        totalUsage.totalCPU();
    }
    catch (e) {
        Util.logError(e.stack || e.message);
    }
};
