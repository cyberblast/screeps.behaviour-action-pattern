var mod = {
    CHATTY: false, // creeps like talking 
    HONK: true, // HONK when stored path is blocked by other creeps
    OOPS: false, // Creeps say Oops when dropping energy during dropmining
    SAY_PUBLIC: true, // creeps talk public
    DEBUG: true, // gimme some more details
    SPAWN_INTERVAL: 10, // loops between regular spawn probe
    MAX_STORAGE_ENERGY: 200000,// stop storing energy when reached
    MIN_STORAGE_ENERGY: 10000,// prefer storing energy until reached
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
    ROAD_CONSTRUCTION_ENABLE: false, 
    ROAD_CONSTRUCTION_INTERVAL: 500, 
    ROAD_CONSTRUCTION_MIN_DEVIATION: 1.2, 
    ROAD_CONSTRUCTION_ABS_MIN: 3, 
    TIME_ZONE: 1, // zone offset in hours (-12 through +12) from UTC
    USE_SUMMERTIME: true, // Please define isSummerTime in global.js to suit to your local summertime rules
    SPAWN_DEFENSE_ON_ATTACK: true, // This will attempt to store enough to have a defense and spawn troops when invaded.  
    MANAGED_CONTAINER_TRIGGER: 0.2, // managed containers get filled below this relative energy amount and emptied when above 1-this value
    ROUTE_PRECALCULATION: true, 
    NOTIFICATE_INVADER: true // Also log common 'Invader' hostiles

}
module.exports = mod;
