let mod = {};
module.exports = mod;
mod.storedStatisticsTime = (Memory.statistics && Memory.statistics.time ? Memory.statistics.time : 0 );
mod.process = function(){
    if( _.isUndefined(Memory.statistics) ) {
        Memory.statistics = {
            reports: []
        };
    }
    let message;
    if( SEND_STATISTIC_REPORTS && this.storedStatisticsTime > 0 ) {
        message = '<div><h3><b>Status report </b></h3>'
            + '<h4>at ' + toDateTimeString(toLocalDate()) + ',<br/>'
            + 'comparison to state before: ' + this.toTimeSpanString(new Date(), new Date(this.storedStatisticsTime)) + ' (' + (Game.time - Memory.statistics.tick) + ' loops)</h4>';

        if( Game.cpu.bucket ){
            bucketDif = Game.cpu.bucket - Memory.statistics.bucket;
            message += 'CPU Bucket: ' + Game.cpu.bucket + ' ('  + (bucketDif >= 0 ? '+' : '' ) + bucketDif + ')';
        }
        message += '</div>';
        Memory.statistics.reports.push(message);
    }

    let invaderReport = invader => {
        let snip = '<li>' + invader.owner + ': ' + invader.body.replace(/"/g,'');
        if( invader.leave === undefined ) snip += " since " + toTimeString(toLocalDate(new Date(invader.time))) + '</li>';
        else snip += " for " + (invader.leave - invader.enter) + ' loops at ' + toTimeString(toLocalDate(new Date(invader.time))) + '</li>';
        if( (message.length + snip.length) > REPORT_MAX_LENGTH ){
            Memory.statistics.reports.push(message + "</ul></li></ul>");
            message = '<ul><li style="list-style-type:none"><ul>' + snip;
        } else message += snip;
    };

    let processRoom = room => {
        if( room.controller ) {
            if( SEND_STATISTIC_REPORTS && this.storedStatisticsTime > 0 ) { // send Report
                if( room.controller.my ){
                    // controller
                    message = '<ul><li><b>Room ' + room.name + '</b><br/><u>Controller</u><ul>';
                    let isUpgraded = room.controller.progress < room.memory.statistics.controllerProgress;
                    let filledPercent = (100*room.controller.progress/room.controller.progressTotal).toFixed(0);
                    let totalDif = isUpgraded ? (room.memory.statistics.controllerProgressTotal - room.memory.statistics.controllerProgress) + room.controller.progress : (room.controller.progress - room.memory.statistics.controllerProgress);
                    let percDif = (100*totalDif/room.controller.progressTotal).toFixed(1);
                    let step = (totalDif / (Game.time - Memory.statistics.tick)).toFixed(2);
                    message += '<li>Level ' + room.controller.level + ', ' + filledPercent + '% of ' + room.controller.progressTotal + '<br/>( +' + totalDif + ' | +' + percDif + '% | +' + step + '/loop )' + (isUpgraded ? ' <b><i>Upgraded!</i></b></li></ul>' : '</li></ul>');

                    // storage
                    if( room.storage && room.memory.statistics.store ){
                        let memoryStoreRecord = room.memory.statistics.store;
                        let currentRecord = room.storage.store;
                        message += '<u>Storage</u><ul>';
                        for( let type in memoryStoreRecord ){ // changed & depleted
                            let dif = (currentRecord[type] ? currentRecord[type] - memoryStoreRecord[type] : memoryStoreRecord[type] * -1);
                            message += '<li>' + type + ': ' + (currentRecord[type] || 0) + ' (' + (dif > -1 ? '+' : '' ) + dif + ')</li>';
                        }
                        // new
                        for( let type in currentRecord ){
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
            let present = invader => invader.leave === undefined;
            let invaders = room.memory.statistics ? _.filter(room.memory.statistics.invader, present) : [];
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
};
mod.toTimeSpanString = function(dateA, dateB){
    let spanTicks = dateA.getTime() - dateB.getTime();
    if( spanTicks < 0 ) spanTicks *= -1;
    let span = new Date(spanTicks);
    let h = Math.floor(spanTicks / 3600000);
    let m = span.getMinutes();
    let s = span.getSeconds();

    let text;
    if( h > 0 ) text = h + 'h ' + m + 'm ' + s + 's';
    else if ( m > 0 ) text = m + 'm ' + s + 's';
    else if( s > 0 ) text = s + 's';
    else text = "0";
    return text;
};
