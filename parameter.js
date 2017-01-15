var mod = {
    CHATTY: false, // creeps say their current action
    HONK: true, // HONK when stored path is blocked by other creeps
    OOPS: true, // Creeps say Oops when dropping energy during dropmining
    SAY_ASSIGNMENT: true, // say a symbol representing the assiged action
    SAY_PUBLIC: true, // creeps talk public
    DEBUG: true, // gimme some more details, use false not undefined to unset
    CENSUS_ANNOUNCEMENTS: true, // log birth and death
    SELL_NOTIFICATION: true, // send mail when selling minerals
    SPAWN_INTERVAL: 5, // loops between regular spawn probe
    MAX_STORAGE_ENERGY: { // get rid of energy when reached
        1: 2000,
        2: 2000,
        3: 2000,
        4: 5000,
        5: 10000,
        6: 25000,
        7: 50000,
        8: 300000
    },
    MIN_STORAGE_ENERGY: { // prefer storing energy until reached
        1: 1000,
        2: 1000,
        3: 1000,
        4: 1000,
        5: 5000,
        6: 10000,
        7: 25000,
        8: 50000
    },
    MAX_STORAGE_MINERAL:200000, // keep a max of each type of minerals in store
    MIN_MINERAL_SELL_AMOUNT:20000,
    ENERGY_VALUE_CREDITS: 0.15, // assumed energy exchange rate (in credits) to determine best mineral sell offer
    //MAX_SELL_RANGE: 60,
    TERMINAL_ENERGY: 100000,
    MIN_SELL_RATIO: {
        'H': 0.2,
        'O': 0.2,
        'U': 0.3,
        'L': 0.3,
        'K': 0.3,
        'Z': 0.3,
        'X': 0.4
    },
    MAX_REPAIR_LIMIT: { // Limits how high structures get repaired by towers, regarding RCL
        1: 1000,
        2: 1000,
        3: 2000,
        4: 4000,
        5: 8000,
        6: 15000,
        7: 20000,
        8: 40000
    },
    MAX_FORTIFY_LIMIT: { // Limits how high structures get repaired by creeps, regarding RCL
        1: 1000,
        2: 1000,
        3: 2000,
        4: 50000,
        5: 100000,
        6: 300000,
        7: 750000,
        8: Infinity
    },
    MAX_FORTIFY_CONTAINER: 50000,
    LIMIT_URGENT_REPAIRING: 750, // urgent repair when hits below
    GAP_REPAIR_DECAYABLE: 800, // decayables (e.g. roads) only get repaired when that much hits are missing
    MEMORY_RESYNC_INTERVAL: 500, // interval to reload spawns & towers present in a room
    TIME_REPORT: 28000, // ticks between room reports
    REPORT_MAX_LENGTH: 500,
    REPORTS_PER_LOOP: 18,
    SEND_STATISTIC_REPORTS: true, // Set to true to receive room statistics per mail, otherwise set to false.
    ROAD_CONSTRUCTION_ENABLE: false, // Set to False to disable automatic road construction, or to a number to enable for owned rooms reaching that RC Level
    ROAD_CONSTRUCTION_INTERVAL: 500,
    ROAD_CONSTRUCTION_MIN_DEVIATION: 1.2,
    ROAD_CONSTRUCTION_ABS_MIN: 3,
    TIME_ZONE: 1, // zone offset in hours (-12 through +12) from UTC
    USE_SUMMERTIME: true, // Please define isSummerTime in global.js to suit to your local summertime rules
    SPAWN_DEFENSE_ON_ATTACK: true, // This will attempt to store enough to have a defense and spawn troops when invaded.
    MANAGED_CONTAINER_TRIGGER: 0.25, // managed containers get filled below this relative energy amount and emptied when above 1-this value
    ROUTE_PRECALCULATION: false, // (experimental) required to use ROUTE_ROOM_COST with creep travel
    ROUTE_ROOM_COST: {}, // custom room routing cost: e.g. `{ 'W4N4': 11 }`. Affects bestSpawnRoomFor, Creep.Setup calculations, and travel cost predictions. Please call 'delete Memory.routeRange;' whenever you change this property.
    NOTIFICATE_INVADER: false, // Also log common 'Invader' hostiles
    COMBAT_CREEPS_RESPECT_RAMPARTS: false, // causes own creeps not to leave through ramparts
    COST_MATRIX_VALIDITY: 1000,
    CONTROLLER_SIGN: false,
    CONTROLLER_SIGN_MESSAGE: "Territory of the Open Collaboration Society! (https://github.com/ScreepsOCS)",
    REMOTE_HAULER_MULTIPLIER: 1, // Number of haulers spawned per source in a remote mining room.
    REMOTE_WORKER_MULTIPLIER: 1, // Number of workers spawned per remote mining room.
    PLAYER_WHITELIST: ['cyberblast','SirLovi','Asku','Kazume','Noxeth','MrDave','Telemac','Xephael','Zoiah','fsck-u','FaceWound','forkmantis','Migaaresno','xAix1999','silentpoots','arguinyano','OokieCookie','OverlordQ','Nibinhilion','Crowsbane','Yew','BogdanBiv','s1akr','Pandabear41','Logmadr','Patrik','novice','Conquest','ofirl','GeorgeBerkeley','TTR','tynstar','K-C','Hoekynl','Sunri5e','AgOrange','distantcam'],
    // Don't attack. Must be a member of OCS for permanent whitelisting in git repository. But you can change your own copy... Please ask if you are interested in joining OCS :)
    DEFENSE_BLACKLIST: [], // Don't defend those rooms (add room names). Blocks spawning via defense task (will not prevent offensive actions at all)
}
module.exports = mod;
