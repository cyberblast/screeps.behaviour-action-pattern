var mod = {
    CHATTY: false, // creeps like talking 
    SAY_PUBLIC: true, // creeps talk public
    DEBUG: true, // gimme some more details
    LIMIT_CREEP_REPAIRING: 1000, // urgent repair when hits below
    LIMIT_STORAGE_ENERGY: 100000,// stop storing energy when reached
    TIME_REPORT: 8000, // ticks between room reports
    INTRUDER_REPORT_DELAY: 360, // minutes between intruder reports
    HIVE_ENERGY_URGENT: 0.3, // prefer withdraw & add more feeding below this relative amount of available energy
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
    USE_SUMMERTIME: TRUE, // Please define SUMMERTIME_BEGIN & SUMMERTIME_END to suit to your zones summertime rules 
    IS_SUMMERTIME: function(date){
        var year = date.getFullYear();
        // last sunday of march
        var temp = new Date(year, 2, 31);
        var begin = new Date(year, 2, temp.getDate() - temp.getDay(), 2, 0, 0);
        // last sunday of october
        temp = new Date(year, 9, 31);
        var end = new Date(year, 9, temp.getDate() - temp.getDay(), 3, 0, 0);

        return ( begin < date && date < end );
    }
}

module.exports = mod;