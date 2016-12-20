/* https://github.com/ScreepsGamers/screeps.behaviour-action-pattern */ 

module.exports.loop = function () {
    global.getPath = (modName, reevaluate = false) => {
        if (Memory.modules === undefined) 
            Memory.modules = {};
        if (Memory.modules.viral === undefined) 
            Memory.modules.viral = {};
        if( reevaluate || !Memory.modules[modName] ){
            let path = './custom.' + modName;
            try {
                let a = require(path);
            }
            catch (e) {
                path = './' + modName
            }
            finally {
                Memory.modules[modName] = path;
            }
            path = './viral.' + modName;
            try {
                let viralOverride = require(path);
                if( viralOverride ) Memory.modules.viral[modName] = true;
            }
            catch (e) {
                delete Memory.modules.viral[modName];
            }
        }
        return Memory.modules[modName];
    };
    global.load = (modName) => {
        let mod;
        let path = getPath(modName);
        try{        
            mod = require(path);
        }catch(e){
            mod = null;
            if( e.message && e.message.indexOf('Unknown module') > -1 ){
                let reevaluate = getPath(modName, true);
                if( path != reevaluate ){
                    try {
                        mod = require(reevaluate);
                    } catch(e2){
                        mod = null;
                        e = e2;
                    }
                }
            }
            if( e.message && e.message.indexOf('Unknown module') > -1 ){
                console.log(`Module "${modName}" not found!`);
            } else if(mod == null) {
                console.log(`Error loading module "${modName}"!<br/>${e.toString()}`);
            }
        }
        if( mod && Memory.modules.viral[modName] ) {
            let viralOverride;
            try {
                viralOverride = require('./viral.' + modName);
            }
            catch (e) {
                viralOverride = null;
                if( e.message && e.message.indexOf('Unknown module') > -1 ){
                    console.log(`Viral override for "${modName}" not found!`);
                } else if(mod == null) {
                    console.log(`Error loading viral override "${modName}"!<br/>${e.toString()}`);
                }
            }
            if( viralOverride ) _.assign(mod, viralOverride);
            else delete Memory.modules.viral[modName];
        }
        return mod;
    };

    // initialize global & parameters
    let params = load('parameter');
    let glob = load('global');
    glob.init(params);

    // Extend Server Objects
    Extensions.extend();  
    Creep.extend();  
    Room.extend();  
    Spawn.extend();
    FlagDir.extend();

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
        load('statistics').loop();
    processReports();
};