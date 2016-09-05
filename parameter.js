var mod = {
    CHATTY: false, // creeps like talking 
    HONK: true, // HONK when stored path is blocked by other creeps
    SAY_PUBLIC: true, // creeps talk public
    DEBUG: true, // gimme some more details
    LIMIT_URGENT_REPAIRING: 1000, // urgent repair when hits below
    LIMIT_STORAGE_ENERGY: 200000,// stop storing energy when reached
    TIME_REPORT: 12500, // ticks between room reports
    HIVE_ENERGY_URGENT: 0.4, // prefer withdraw & add more feeding below this relative amount of available energy
    TOWER_REPAIR_LIMITS: { // Limits how high structures get repaired by towers, regarding RCL
        2: 10000,
        3: 10000,
        4: 20000,
        5: 50000,
        6: 80000,
        7: 120000,
        8: Infinity
    }, 
    TIME_ZONE: 1, // zone offset in hours (-12 through +12) from UTC
    USE_SUMMERTIME: true, // Please define isSummerTime in global.js to suit to your local summertime rules 
    SPAWN_INTERVAL: 10, // loops between regular spawn probe
    MEMORY_RESYNC_INTERVAL: 100, // interval to reload spawns & towers present in a room
    GAP_REPAIR_DECAYABLE: 800, // decayables (e.g. roads) only get repaired when that much hits are missing
    REPORT_MAX_LENGTH: 500,
    REPORTS_PER_LOOP: 18, 
    ROUTE_PLANNER_INTERVAL: 500, 
    ROUTEPLANNER_MIN_DEVIATION: 1.3
}
module.exports = mod;