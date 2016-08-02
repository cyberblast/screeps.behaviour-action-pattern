var mod = {
    loop: function(){
        if( Game.time % TIME_REPORT == 0 ) {
            this.sendReport();
            this.setStatistics();
        }
    }, 
    setStatistics: function(){
        var setRoomStatistics = room => {  
            room.memory.statistics = {
                tick: Game.time, 
                time: Date.now(),
                store: room.storage ? room.storage.store : null, 
                controllerProgress: room.controller.progress, 
                controllerProgressTotal: room.controller.progressTotal
            };          
        };

        _.forEach(Game.rooms, setRoomStatistics);
        Memory.statistics = {
            tick: Game.time, 
            time: Date.now()
        }
    },
    sendReport: function(){
        var storedStatisticsTime = (Memory.statistics && Memory.statistics.time ? Memory.statistics.time : 0 );
        if( storedStatisticsTime > 0 ) {
            var message = '<h4><b>Status report</b></h4><br/>' 
                + '<h3>at ' + LocalDate().toLocaleString() + '<br/>' 
                + 'comparison to state before: ' + this.toTimeSpanString(new Date(), new Date(storedStatisticsTime)) + '</h3><br/><ul>';
            
            // TODO: Add CPU bucket Statistik

            var roomReport = room => {
                if( room.controller && room.controller.my ){
                    message += '<li><h3>Room ' + room.name + '</h3><br/><u>Controller</u><br/>';
                    var cdif = room.controller.progress < room.memory.report.controllerProgress ? (room.memory.report.controllerProgressTotal - room.memory.report.controllerProgress) + room.controller.progress : (room.controller.progress - room.memory.report.controllerProgress); 
                    message += '   Level ' + room.controller.level + ', ' + room.controller.progress + '/' + room.controller.progressTotal + ' (+' + cdif + ')<br/>';

                    if( room.storage && room.memory.report.store ){
                        var memoryStoreRecord = room.memory.report.store;
                        var currentRecord = room.storage.store;
                        message += '<u>Storage</u><br/>';
                        for( var type in memoryStoreRecord ){ // changed & depleted
                            var dif = (currentRecord[type] ? currentRecord[type] - memoryStoreRecord[type] : memoryStoreRecord[type] * -1);
                            message += '   ' + type + ': ' + (currentRecord[type] || 0) + ' (' + (dif > -1 ? '+' : '' ) + dif + ')<br/>';  
                        }
                        // new
                        for( var type in currentRecord ){
                            if(!memoryStoreRecord[type])
                                message += '   ' + type + ': ' + currentRecord[type] + ' (' + currentRecord[type] + ')<br/>';  
                        }
                    }
                    message += '</li>'; 
                }
            };

            _.forEach(Game.rooms, roomReport);
            message += '</ul>';

            Game.notify(message);
        }
    }, 
    toTimeSpanString: function(dateA, dateB){
        var spanTicks = dateA.getTime() - dateB.getTime();
        if( spanTicks < 0 ) spanTicks *= -1;
        var span = new date(spanTicks);    
        var h = Math.floor(spanTicks / 3600000);
        var m = span.getMinutes();
        var s = span.getSeconds();

        var text;
        if( h > 0 ) text = h + 'h ' + m + 'm ' + s + 's';
        else if ( m > 0 ) text = m + 'm ' + s + 's';
        else if( s > 0 ) text = s + 's';
        else text = "0";
        return text;
    }
};

module.exports = mod;