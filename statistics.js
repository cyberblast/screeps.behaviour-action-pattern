var mod = {
    loop: function(){
        if( Game.time % TIME_REPORT == 0 ) {
            this.sendReport();
            this.setStatistics();
        }
    }, 
    setStatistics: function(){
        var setRoomStatistics = room => {  
            var present = invader => infader.leave === undefined;
            var invaders = _.filter(room.memory.statistics.invader, present);
            room.memory.statistics = {
                tick: Game.time, 
                time: Date.now(),
                store: room.storage ? room.storage.store : null, 
                controllerProgress: room.controller.progress, 
                controllerProgressTotal: room.controller.progressTotal, 
                invaders: invaders
            };          
        };

        _.forEach(Game.rooms, setRoomStatistics);
        Memory.statistics = {
            tick: Game.time, 
            time: Date.now(),
            bucket: Game.cpu.bucket
        }
    },
    sendReport: function(){
        var storedStatisticsTime = (Memory.statistics && Memory.statistics.time ? Memory.statistics.time : 0 );
        if( storedStatisticsTime > 0 ) {
            var message = '<h3><b>Status report</b></h3>' 
                + '<h4>at ' + LocalDate().toLocaleString() + ',<br/>' 
                + 'comparison to state before: ' + this.toTimeSpanString(new Date(), new Date(storedStatisticsTime)) + ' (' + (Game.time - Memory.statistics.tick) + ' loops)</h4>';

            if( Game.cpu.bucket ){
                bucketDif = Game.cpu.bucket - Memory.statistics.bucket;
                message += 'CPU Bucket: ' + Game.cpu.bucket + ' ('  + (bucketDif >= 0 ? '+' : '' ) + bucketDif + ')';
                Game.notify(message);
            }

            var invaderReport = invader => {
                message += '<li>' + invader.owner + ': [' + invader.body;
                if( invader.leave === undefined ) message += "] since " + LocalDate(new Date(invader.time)).toLocaleString() + '</li>';
                else message += "] for " + (invader.leave - invader.enter) + ' loops at ' + LocalDate(new Date(invader.time)).toLocaleString() + '</li>';
            };

            var roomReport = room => {
                if( room.controller && room.controller.my ){
                    // controller
                    message = '<ul><li><b>Room ' + room.name + '</b><br/><u>Controller</u><ul>';
                    var isUpgraded = room.controller.progress < room.memory.statistics.controllerProgress;
                    var cdif = isUpgraded ? (room.memory.statistics.controllerProgressTotal - room.memory.statistics.controllerProgress) + room.controller.progress : (room.controller.progress - room.memory.statistics.controllerProgress); 
                    message += '<li>Level ' + room.controller.level + ', ' + room.controller.progress + '/' + room.controller.progressTotal + ' (+' + cdif + ')' + (isUpgraded ? ' <b><i>Upgraded!</i></b></li></ul>' : '</li></ul>');

                    // storage
                    if( room.storage && room.memory.statistics.store ){
                        var memoryStoreRecord = room.memory.statistics.store;
                        var currentRecord = room.storage.store;
                        message += '<u>Storage</u><ul>';
                        for( var type in memoryStoreRecord ){ // changed & depleted
                            var dif = (currentRecord[type] ? currentRecord[type] - memoryStoreRecord[type] : memoryStoreRecord[type] * -1);
                            message += '<li>' + type + ': ' + (currentRecord[type] || 0) + ' (' + (dif > -1 ? '+' : '' ) + dif + ')</li>';  
                        }
                        // new
                        for( var type in currentRecord ){
                            if(!memoryStoreRecord[type])
                                message += '<li>' + type + ': ' + currentRecord[type] + ' (' + currentRecord[type] + ')</li>';  
                        }
                        message += '</ul>';
                    }

                    // invaders
                    if( room.memory.statistics.invaders && room.memory.statistics.invaders.length > 0 ){
                        message += '<u>Invaders</u><ul>';
                        _.forEach(room.memory.statistics.invaders, invaderReport);
                        message += '</ul>';
                    }
                    message += '</li></ul>'; 
                    Game.notify(message);
                }
            };

            _.forEach(Game.rooms, roomReport); 
        }
    }, 
    toTimeSpanString: function(dateA, dateB){
        var spanTicks = dateA.getTime() - dateB.getTime();
        if( spanTicks < 0 ) spanTicks *= -1;
        var span = new Date(spanTicks);    
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