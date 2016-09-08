var mod = {
    CHATTY: false, // creeps like talking 
    HONK: true, // HONK when stored path is blocked by other creeps
    SAY_PUBLIC: true, // creeps talk public
    DEBUG: true, // gimme some more details
    DROPMINING: false,  
    SPAWN_INTERVAL: 10, // loops between regular spawn probe
    LIMIT_STORAGE_ENERGY: 200000,// stop storing energy when reached
    MAX_REPAIR_LIMIT: { // Limits how high structures get repaired, regarding RCL
        1: 10000,
        2: 10000,
        3: 10000,
        4: 20000,
        5: 50000,
        6: 80000,
        7: 120000,
        8: Infinity
    }, 
    LIMIT_URGENT_REPAIRING: 1000, // urgent repair when hits below
    GAP_REPAIR_DECAYABLE: 800, // decayables (e.g. roads) only get repaired when that much hits are missing
    MEMORY_RESYNC_INTERVAL: 100, // interval to reload spawns & towers present in a room
    TIME_REPORT: 12500, // ticks between room reports
    REPORT_MAX_LENGTH: 500,
    REPORTS_PER_LOOP: 18, 
    ROUTE_PLANNER_INTERVAL: 500, 
    ROUTEPLANNER_MIN_DEVIATION: 1.2, 
    TIME_ZONE: 1, // zone offset in hours (-12 through +12) from UTC
    USE_SUMMERTIME: true // Please define isSummerTime in global.js to suit to your local summertime rules
}
module.exports = mod;
