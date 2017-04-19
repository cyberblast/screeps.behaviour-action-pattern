global._ME = _(Game.rooms).map('controller').filter('my').map('owner.username').first();
let mod = {
    ME: _ME,
    CHATTY: false, // creeps say their current action
    HONK: true, // HONK when stored path is blocked by other creeps
    OOPS: true, // Creeps say Oops when dropping energy during dropmining
    SAY_ASSIGNMENT: true, // say a symbol representing the assiged action
    SAY_PUBLIC: true, // creeps talk public
    DEBUG: true, // gimme some more details, use false not undefined to unset
    DEBUG_STACKS: false, // add stack frame to EVERY console.log message (spammy!)
    TRACE: false, // use Memory.debugTrace for low-level information
    PROFILE: false, // enable CPU profiling
    PROFILING: {
        ANALYZE_LIMIT: 2, // profile warning levels
        AVERAGE_USAGE: false, // display average creep & flag usage
        BASIC_ONLY: true, // only display basic profiling information, disables all other profiling
        CREEPS: false, // display creep profiling information
        CREEP_TYPE: '', // define a specific creep to profile, requires CREEPS=true
        EXECUTE_LIMIT: 5, // profile warning levels
        FLAGS: false, // display flag profiling information
        FLUSH_LIMIT: 5, // profile warning levels
        MAIN: true, // profile main loop
        MIN_THRESHOLD: 0.5, // set the bar for checks that involve very low usage (warning, chatty!)
        REGISTER_LIMIT: 2, // profile warning levels
        ROOMS: false, // display room and structure profiling information
        VISUALS: false, // profile visuals
        VISUALS_LIMIT: 0.2, // CPU usage in each part of visuals above this limit will be displayed
    },
    TRAVELER_STUCK_TICKS: 2, // Number of ticks not moving to be considered stuck by the Traveler API
    TRAVELER_THRESHOLD: 5, // Average creep CPU usage/tick before warning about pathing cost, starts after 25 ticks
    USE_UNBUILT_ROADS: true, // enabling this will set the pathing cost of road construction sites to that of roads
    GRAFANA: false, // track for Grafana data
    GRAFANA_INTERVAL: 3, // loops between Grafana tracking - No lower than 3.
    CENSUS_ANNOUNCEMENTS: true, // log birth and death
    SELL_NOTIFICATION: true, // send mail when selling minerals
    SPAWN_INTERVAL: 5, // loops between regular spawn probe
    ROOM_VISUALS: false, // display basic room statistics with RoomVisuals
    ROOM_VISUALS_ALL: false, // displays visuals in all rooms you have vision in. Only your rooms when false.
    VISUALS: { // if ROOM_VISUALS is enabled, you can select what you want to display - All is a bit much for some people.
        VISIBLE_ONLY: false, // depends on userscript: https://github.com/Esryok/screeps-browser-ext/blob/master/visible-room-tracker.user.js
        ROOM: true, // displays basic info relative to the room
        ROOM_GLOBAL: true, // displays basic info relative to your account - requires ROOM: true
        INFO_PIE_CHART: false, // replaces the info bars with pie charts
        CPU: true, // display a graph containing CPU used, CPU limit, and bucket
        ROOM_ORDERS: true, // display orders the room creates
        ROOM_OFFERS: true, // display what a room will offer another
        SPAWN: true, // displays creep name and spawn progress percentage when spawning
        CONTROLLER: true, // displays level, progress, and ticks to downgrade if active
        STORAGE: true, // displays storage contents
        TERMINAL: true, // displays terminal contents
        TOWER: true, // displays tower contents
        TRANSACTIONS: true, // displays 2 most recent transactions over room terminal
        LABS: true, // displays lab energy, mineral, or cooldown
        MINERAL: true, // displays mineral amount, or ticks to regen
        SOURCE: true, // displays energy amount, or ticks to regen
        CREEP: true, // draws creep paths
        WALL: false, // highlight weakest wall and display hits
        RAMPART: false, // highlight weakest rampart and display hits
        ROAD: false, // highlight weakest road and display hits
        HEATMAP: false, // collects creep positioning to display a heatmap. WARNING: HIGH MEMORY USAGE
        HEATMAP_INTERVAL: 2, // intervals between collections
        ACTION_ASSIGNMENT: true, // draws a line from a creep and it's new assignment
    },
    // function parameters: room. expected result: boolean
    SEMI_AUTOMATIC_CONSTRUCTION: true, // enables semi-automatic construction. Will construct based on flags.
    // function parameters: room, structure type. expected result: boolean
    REMOVE_CONSTRUCTION_FLAG: true, // if false, flag will remain. This is good if a structure decays, it can rebuild
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
    ROOM_TRADING: true, // set this true to enable haulers within your colony to request resources from other rooms in your colony
    FILL_POWERSPAWN: true,
    MIN_MINERAL_SELL_AMOUNT: 20000,
    ENERGY_VALUE_CREDITS: 0.05, // assumed energy exchange rate (in credits) to determine best mineral sell offer
    //MAX_SELL_RANGE: 60,
    TERMINAL_ENERGY: 100000,
    MIN_SELL_RATIO: {
        'H': 0.02,
        'O': 0.02,
        'U': 0.2,
        'L': 0.2,
        'K': 0.2,
        'Z': 0.2,
        'X': 0.2
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
        8: 300000000
    },
    MAX_FORTIFY_CONTAINER: 50000,
    LIMIT_URGENT_REPAIRING: 750, // urgent repair when hits below
    GAP_REPAIR_DECAYABLE: 800, // decayables (e.g. roads) only get repaired when that much hits are missing
    MEMORY_RESYNC_INTERVAL: 500, // interval to reload spawns & towers present in a room
    PROCESS_ORDERS_INTERVAL: 500, // interval to process room orders and run terminalBroker
    TIME_REPORT: 28000, // ticks between room reports
    REPORT_MAX_LENGTH: 500,
    REPORTS_PER_LOOP: 18,
    SEND_STATISTIC_REPORTS: true, // Set to true to receive room statistics per mail, otherwise set to false.
    ROAD_CONSTRUCTION_ENABLE: false, // Set to False to disable automatic road construction, or to a number to enable for owned rooms reaching that RC Level. WARNING: HIGH MEMORY USAGE
    ROAD_CONSTRUCTION_INTERVAL: 500,
    ROAD_CONSTRUCTION_MIN_DEVIATION: 1.2,
    ROAD_CONSTRUCTION_ABS_MIN: 3,
    TIME_ZONE: 1, // zone offset in hours (-12 through +12) from UTC
    USE_SUMMERTIME: true, // Please define isSummerTime in global.js to suit to your local summertime rules
    SPAWN_DEFENSE_ON_ATTACK: true, // This will attempt to store enough to have a defense and spawn troops when invaded.
    MANAGED_CONTAINER_TRIGGER: 0.25, // managed containers get filled below this relative energy amount and emptied when above 1-this value
    ROUTE_ROOM_COST: {}, // custom room routing cost: e.g. `{ 'W4N4': 11 }`. Affects bestSpawnRoomFor, Creep.Setup calculations, and travel cost predictions. Please call 'delete Memory.routeRange;' whenever you change this property.
    TRAVELLING_BORDER_RANGE: 22, // room arrival distance for travelling and routes
    NOTIFICATE_INVADER: false, // Also log common 'Invader' hostiles
    NOTIFICATE_INTRUDER: true, // Log any hostiles in your rooms
    NOTIFICATE_HOSTILES: true, // Log any hostiles - Ignores NOTIFICATE_INTRUDER and NOTIFICATE_INVADER
    COMBAT_CREEPS_RESPECT_RAMPARTS: false, // causes own creeps not to leave through ramparts
    COST_MATRIX_VALIDITY: 1000,
    // function parameters: room. expected result: array
    CONSTRUCTION_PRIORITY: [STRUCTURE_SPAWN,STRUCTURE_EXTENSION,STRUCTURE_LINK,STRUCTURE_TERMINAL,STRUCTURE_STORAGE,STRUCTURE_TOWER,STRUCTURE_POWER_SPAWN,STRUCTURE_NUKER,STRUCTURE_OBSERVER,STRUCTURE_ROAD,STRUCTURE_CONTAINER,STRUCTURE_EXTRACTOR,STRUCTURE_LAB,STRUCTURE_WALL,STRUCTURE_RAMPART],
    CONTROLLER_SIGN: true,
    // function parameters: room. expected result: string
    CONTROLLER_SIGN_MESSAGE: `Territory of ${_ME}, an Open Collaboration Society user! (https://github.com/ScreepsOCS)`,
    CONTROLLER_SIGN_UPDATE: false, // Update sign message if user changes CONTROLLER_SIGN_MESSAGE
    MINERS_AUTO_BUILD: false, // miners and remoteMiners will build their own containers if they are missing.
    MINER_WORK_THRESHOLD: 50, // how long to wait before a miner checks for repairs/construction sites nearby again
    REMOTE_HAULER: {
        ALLOW_OVER_CAPACITY: 2450, // Hauler capacity rounds up by MIN_WEIGHT, or this number value.
        DRIVE_BY_BUILD_ALL: false, // If REMOTE_HAULER.DRIVE_BY_BUILDING is enabled then this option will allow remote haulers will drive-by-build any of your structures.
        DRIVE_BY_BUILD_RANGE: 1, // A creep's max build distance is 3 but cpu can be saved by dropping the search distance to 1.
        DRIVE_BY_BUILDING: true, // Allows remote haulers to build roads and containers. Consider setting REMOTE_WORKER_MULTIPLIER to 0.
        DRIVE_BY_REPAIR_RANGE: 0, // range that remote haulers should search when trying to repair and move
        MIN_LOAD: 0.75, // Haulers will return home as long as their ratio of carrying/capacity is above this amount.
        MIN_WEIGHT: 800, // Small haulers are a CPU drain.
        MULTIPLIER: 4, // Max number of haulers spawned per source in a remote mining room.
        REHOME: true, // May haulers choose closer storage for delivery?
    },
    TASK_CREEP_CHECK_INTERVAL: 250, // Maximum number of ticks before a task checks to see if it needs to spawn new creeps
    REMOTE_RESERVE_HAUL_CAPACITY: 0.1, // Percent of allocated haul capacity before sending reservers.
    PIONEER_UNOWNED: false, // True: pioneers may attempt to work in unowned rooms.
    DRIVE_BY_REPAIR_RANGE: 2, // range that creeps should search when trying to repair and move
    REMOTE_WORKER_MULTIPLIER: 1, // Number of workers spawned per remote mining room.
    PLAYER_WHITELIST: ['cyberblast','SirLovi','Asku','Kazume','Noxeth','MrDave','Telemac','Xephael','Zoiah','fsck-u','FaceWound','forkmantis','Migaaresno','xAix1999','silentpoots','arguinyano','OokieCookie','OverlordQ','Nibinhilion','Crowsbane','Yew','BogdanBiv','s1akr','Pandabear41','Logmadr','Patrik','novice','Conquest','ofirl','GeorgeBerkeley','TTR','tynstar','K-C','Hoekynl','Sunri5e','AgOrange','distantcam','Lisp','bbdMinimbl','Twill','Logxen','miR','Spedwards','Krazyfuq','Icesory','chobobobo','deft-code','mmmd','DKPlugins','pavelnieks','buckley310','almaravarion','SSH','Perrytheplatypus','Jnesselr','ryagas','xXtheguy52Xx','SEATURTLEKING','DasBrain','C00k1e_93','Currency','Vykook','shedletsky','Aranatha','Montblanc','emb3r','Mudla'],
    // Don't attack. Must be a member of OCS for permanent whitelisting in git repository. But you can change your own copy... Please ask if you are interested in joining OCS :)
    DEFENSE_BLACKLIST: [], // Don't defend those rooms (add room names). Blocks spawning via defense task (will not prevent offensive actions at all)
    CRITICAL_BUCKET_LEVEL: 1000, // take action when the bucket drops below this value to prevent the bucket from actually running out
    CRITICAL_BUCKET_OVERFILL: 200, // Overfill the bucket by this amount before disabling CPU throttle, this can reduce thrashing because all creeps try to act at once
    CRITICAL_ROLES: [ 'worker', 'collapseWorker', 'melee', 'ranger', 'healer', 'miner', 'hauler', 'upgrader' ], // when the bucket drops below the critical bucket level only these creep roles will be executed
    ROBBER_REHOME: false, // May robbers choose closer storage for delivery?
    OBSERVER_OBSERVE_RANGE: 3, // the range for observers to look at
    OBSERVER_OBSERVE_HIGHWAYS_ONLY: true, // the observers will only look at highways - changing this will require you to clear cached rooms
    ACTION_SAY: { // what gets said on creep.action.*.onAssignment
        ATTACK_CONTROLLER: String.fromCodePoint(0x1F5E1) + String.fromCodePoint(0x26F3), // 🗡⛳
        AVOIDING: String.fromCodePoint(0x21A9), // ↩
        BOOSTING: String.fromCodePoint(0x1F4AA), // 💪🏼
        BUILDING: String.fromCodePoint(0x2692), // ⚒
        BULLDOZING: String.fromCodePoint(0x1F69C), // 🚜
        CHARGING: String.fromCodePoint(0x1F50C), // 🔌
        CLAIMING: String.fromCodePoint(0x26F3), // ⛳
        DEFENDING: String.fromCodePoint(0x2694), // ⚔
        DISMANTLING: String.fromCodePoint(0x1F527), // 🔧
        DROPPING: String.fromCodePoint(0x1F4A9), // 💩
        FEEDING: String.fromCodePoint(0x1F355), // 🍕
        FORTIFYING: String.fromCodePoint(0x1F528), // 🔨
        FUELING: String.fromCodePoint(0x26FD), // ⛽
        GUARDING: String.fromCodePoint(0x1F46E) + String.fromCodePoint(0x1F3FC), // 👮🏼
        HARVESTING: String.fromCodePoint(0x26CF), // ⛏
        HEALING: String.fromCodePoint(0x26E8), // ⛨
        IDLE: String.fromCodePoint(0x1F3B5), // 🎵
        INVADING: String.fromCodePoint(0x1F52B), // 🔫
        PICKING: String.fromCodePoint(0x23EC), // ⏬
        REALLOCATING: String.fromCodePoint(0x2194), // ↔
        RECYCLING: String.fromCodePoint(0x267B), // ♻
        REPAIRING: String.fromCodePoint(0x1F528), // 🔨
        RESERVING: String.fromCodePoint(0x26F3), // ⛳
        ROBBING: String.fromCodePoint(0x1F480), // 💀
        STORING: String.fromCodePoint(0x1F4E5) + String.fromCodePoint(0xFE0E), // 📥
        TRAVELLING: String.fromCodePoint(0x1F3C3), // 🏃
        UNCHARGING: String.fromCodePoint(0x1F50B), // 🔋
        UPGRADING: String.fromCodePoint(0x1F5FD), // 🗽
        WITHDRAWING: String.fromCodePoint(0x1F4E4) + String.fromCodePoint(0xFE0E), // 📤
    }
};
module.exports = mod;
