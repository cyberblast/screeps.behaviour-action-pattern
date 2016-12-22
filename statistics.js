var mod = {
    storedStatisticsTime: (Memory.statistics && Memory.statistics.time ? Memory.statistics.time : 0 ),
    loop: function(){
        if( _.isUndefined(Memory.statistics.reports) )
            Memory.statistics.reports = [];

        var message;
        if( SEND_STATISTIC_REPORTS && this.storedStatisticsTime > 0 ) {
            message = '<h3><b>Status report </b></h3>'
                + '<h4>at ' + toDateTimeString(toLocalDate()) + ',<br/>'
                + 'comparison to state before: ' + this.toTimeSpanString(new Date(), new Date(this.storedStatisticsTime)) + ' (' + (Game.time - Memory.statistics.tick) + ' loops)</h4>';

            if( Game.cpu.bucket ){
                bucketDif = Game.cpu.bucket - Memory.statistics.bucket;
                message += 'CPU Bucket: ' + Game.cpu.bucket + ' ('  + (bucketDif >= 0 ? '+' : '' ) + bucketDif + ')';
            }
            Memory.statistics.reports.push(message);
        }

        var invaderReport = invader => {
            let snip = '<li>' + invader.owner + ': ' + invader.body.replace(/"/g,'');
            if( invader.leave === undefined ) snip += " since " + toTimeString(toLocalDate(new Date(invader.time))) + '</li>';
            else snip += " for " + (invader.leave - invader.enter) + ' loops at ' + toTimeString(toLocalDate(new Date(invader.time))) + '</li>';
            if( (message.length + snip.length) > REPORT_MAX_LENGTH ){
                Memory.statistics.reports.push(message + "</ul></li></ul>");
                message = '<ul><li style="list-style-type:none"><ul>' + snip;
            } else message += snip;
        };

        var processRoom = room => {
            if( room.controller ) {
                if( SEND_STATISTIC_REPORTS && this.storedStatisticsTime > 0 ) { // send Report
                    if( room.controller.my ){
                        // controller
                        message = '<ul><li><b>Room ' + room.name + '</b><br/><u>Controller</u><ul>';
                        var isUpgraded = room.controller.progress < room.memory.statistics.controllerProgress;
                        var filledPercent = (100*room.controller.progress/room.controller.progressTotal).toFixed(0);
                        var totalDif = isUpgraded ? (room.memory.statistics.controllerProgressTotal - room.memory.statistics.controllerProgress) + room.controller.progress : (room.controller.progress - room.memory.statistics.controllerProgress);
                        var percDif = (100*totalDif/room.controller.progressTotal).toFixed(1);
                        var step = (totalDif / (Game.time - Memory.statistics.tick)).toFixed(2);
                        message += '<li>Level ' + room.controller.level + ', ' + filledPercent + '% of ' + room.controller.progressTotal + '<br/>( +' + totalDif + ' | +' + percDif + '% | +' + step + '/loop )' + (isUpgraded ? ' <b><i>Upgraded!</i></b></li></ul>' : '</li></ul>');

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
                                    message += '<li>' + type + ': ' + currentRecord[type] + ' (+' + currentRecord[type] + ')</li>';
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
                        Memory.statistics.reports.push(message);
                    }
                    else if( !room.controller.my && room.controller.reservation ){
                        // controller
                        message = '<ul><li><b>Room ' + room.name + '</b><br/><u>Controller</u><ul><li>Reservation: ' +
                            room.controller.reservation.ticksToEnd + ' for ' +
                            room.controller.reservation.username + '</li></ul></li></ul>';
                        Memory.statistics.reports.push(message);
                    }
                }

                // set statistics
                var present = invader => invader.leave === undefined;
                var invaders = _.filter(room.memory.statistics.invader, present);
                room.memory.statistics = {
                    tick: Game.time,
                    time: Date.now(),
                    store: room.storage ? room.storage.store : null,
                    controllerProgress: room.controller.progress,
                    controllerProgressTotal: room.controller.progressTotal,
                    invaders: invaders
                };
            }
        }

        _.forEach(Game.rooms, processRoom);

        Memory.statistics.tick = Game.time;
        Memory.statistics.time = Date.now();
        Memory.statistics.bucket = Game.cpu.bucket;
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