var mod = {
    CHATTY: false, // creeps say their current action 
    HONK: true, // HONK when stored path is blocked by other creeps
    OOPS: true, // Creeps say Oops when dropping energy during dropmining
    SAY_ASSIGNMENT: true,
    SAY_PUBLIC: true, // creeps talk public
    DEBUG: true, // gimme some more details
    CENSUS_ANNOUNCEMENTS: false, // log birth and death
    SPAWN_INTERVAL: 10, // loops between regular spawn probe
    MAX_STORAGE_ENERGY: 200000,// stop storing energy when reached
    MIN_STORAGE_ENERGY: 40000,// prefer storing energy until reached
    MAX_STORAGE_MINERAL:300000, // keep a max of each type of minerals in store, stop mining if above this limit
    MAX_REPAIR_LIMIT: { // Limits how high structures get repaired, regarding RCL
        1: 10000,
        2: 10000,
        3: 10000,
        4: 20000,
        5: 50000,
        6: 80000,
        7: 120000,
        8: 3000000
    }, 
    LIMIT_URGENT_REPAIRING: 1000, // urgent repair when hits below
    GAP_REPAIR_DECAYABLE: 800, // decayables (e.g. roads) only get repaired when that much hits are missing
    MEMORY_RESYNC_INTERVAL: 100, // interval to reload spawns & towers present in a room
    TIME_REPORT: 28000, // ticks between room reports
    REPORT_MAX_LENGTH: 500,
    REPORTS_PER_LOOP: 18, 
    ROAD_CONSTRUCTION_ENABLE: false, 
    ROAD_CONSTRUCTION_INTERVAL: 500, 
    ROAD_CONSTRUCTION_MIN_DEVIATION: 1.2, 
    ROAD_CONSTRUCTION_ABS_MIN: 3, 
    TIME_ZONE: 1, // zone offset in hours (-12 through +12) from UTC
    USE_SUMMERTIME: true, // Please define isSummerTime in global.js to suit to your local summertime rules
    SPAWN_DEFENSE_ON_ATTACK: true, // This will attempt to store enough to have a defense and spawn troops when invaded.  
    MANAGED_CONTAINER_TRIGGER: 0.25, // managed containers get filled below this relative energy amount and emptied when above 1-this value
    ROUTE_PRECALCULATION: false, 
    NOTIFICATE_INVADER: false, // Also log common 'Invader' hostiles
    COMBAT_CREEPS_RESPECT_RAMPARTS: false, // causes own creeps not to leave through ramparts
    PLAYER_WHITELIST: ['cyberblast','SirLovi','Asku'] // Don't attack. Must be a member of OCS for permanent whitelisting in git repository. But you can change your own copy... Please ask if you are interested :)
}
module.exports = mod;
