var mod = {
    loop: function(){
        // temporary cleanup: 
        var init = room => {
            room.init();
            if( room.memory.report !== undefined ){
                room.memory.statistics = room.memory.report;
                Memory.statistics = {
                    tick: room.memory.report.tick, 
                    time: room.memory.report.time
                }
                delete room.memory.report;
            }
        };

        //var init = room => room.init();
        _.forEach(Game.rooms, init);
    }
}

module.exports = mod;