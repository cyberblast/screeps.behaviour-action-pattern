const mod = {};
module.exports = mod;
mod.extend = function() {
    Object.defineProperties(Room.prototype, {
        'hostiles': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._hostiles) ){
                    this._hostiles = this.find(FIND_HOSTILE_CREEPS, { filter : Task.reputation.hostileOwner });
                }
                return this._hostiles;
            }
        },
        'hostileIds': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._hostileIds) ){
                    this._hostileIds = _.map(this.hostiles, 'id');
                }
                return this._hostileIds;
            }
        },
        'combatCreeps': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._combatCreeps) ){
                    this._combatCreeps = this.creeps.filter( c => ['melee','ranger','healer', 'warrior'].includes(c.data.creepType) );
                }
                return this._combatCreeps;
            }
        },
        'casualties': {
            configurable: true,
            get: function() {
                if( _.isUndefined(this._casualties) ){
                    var isInjured = creep => creep.hits < creep.hitsMax &&
                        (creep.towers === undefined || creep.towers.length === 0);
                    this._casualties = _.sortBy(_.filter(this.creeps, isInjured), 'hits');
                }
                return this._casualties;
            }
        },
        'hostileThreatLevel': {
            configurable: true,
            get: function () {
                if (_.isUndefined(this._hostileThreatLevel) ) {
                    // TODO: add towers when in foreign room
                    this._hostileThreatLevel = 0;
                    let evaluateBody = creep => {
                        this._hostileThreatLevel += creep.threat;
                    };
                    this.hostiles.forEach(evaluateBody);
                }
                return this._hostileThreatLevel;
            }
        },
        'defenseLevel': {
            configurable: true,
            get: function () {
                if (_.isUndefined(this._defenseLevel) ) {
                    this._defenseLevel = {
                        towers: 0,
                        creeps: 0,
                        sum: 0
                    };
                    let evaluate = creep => {
                        this._defenseLevel.creeps += creep.threat;
                    };
                    this.combatCreeps.forEach(evaluate);
                    this._defenseLevel.towers = this.structures.towers.length;
                    this._defenseLevel.sum = this._defenseLevel.creeps + (this._defenseLevel.towers * Creep.partThreat.tower);
                }
                return this._defenseLevel;
            }
        }
    });
    Room.prototype.processInvaders = function(){
        let that = this;
        if( this.memory.hostileIds === undefined )
            this.memory.hostileIds = [];
        if( this.memory.statistics === undefined)
            this.memory.statistics = {};

        let registerHostile = creep => {
            if (Room.isCenterNineRoom(this.name)) return;
            // if invader id unregistered
            if( !that.memory.hostileIds.includes(creep.id) ){
                // handle new invader
                // register
                that.memory.hostileIds.push(creep.id);
                // save to trigger subscribers later
                that.newInvader.push(creep);
                // create statistics
                if( SEND_STATISTIC_REPORTS ) {
                    let bodyCount = JSON.stringify( _.countBy(creep.body, 'type') );
                    if(that.memory.statistics.invaders === undefined)
                        that.memory.statistics.invaders = [];
                    that.memory.statistics.invaders.push({
                        owner: creep.owner.username,
                        id: creep.id,
                        body: bodyCount,
                        enter: Game.time,
                        time: Date.now()
                    });
                }
            }
        };
        _.forEach(this.hostiles, registerHostile);

        let registerHostileLeave = id => {
            const creep = Game.getObjectById(id);
            const stillHostile = !creep || Task.reputation.hostileOwner(creep);
            // for each known invader
            if( !that.hostileIds.includes(id) && !stillHostile ) { // not found anymore or no longer hostile
                // save to trigger subscribers later
                that.goneInvader.push(id);
                // update statistics
                if( SEND_STATISTIC_REPORTS && that.memory.statistics && that.memory.statistics.invaders !== undefined && that.memory.statistics.invaders.length > 0 ){
                    let select = invader => invader.id == id && invader.leave === undefined;
                    let entry = _.find(that.memory.statistics.invaders, select);
                    if( entry != undefined ) entry.leave = Game.time;
                }
            }
        };
        _.forEach(this.memory.hostileIds, registerHostileLeave);

        this.memory.hostileIds = this.hostileIds;
    };
};
mod.analyze = function(room) {
    room.processInvaders();
};
mod.triggerNewInvaders = creep => {
    // create notification
    let bodyCount = JSON.stringify( _.countBy(creep.body, 'type') );
    if( DEBUG || NOTIFICATE_INVADER || (NOTIFICATE_INTRUDER && creep.room.my) || NOTIFICATE_HOSTILES ) logSystem(creep.pos.roomName, `Hostile intruder (${bodyCount}) from "${creep.owner.username}".`);
    if( NOTIFICATE_INVADER || (NOTIFICATE_INTRUDER && creep.owner.username !== 'Invader' && creep.room.my) || (NOTIFICATE_HOSTILES && creep.owner.username !== 'Invader') ){
        Game.notify(`Hostile intruder ${creep.id} (${bodyCount}) from "${creep.owner.username}" in room ${creep.pos.roomName} at ${toDateTimeString(toLocalDate(new Date()))}`);
    }
    // trigger subscribers
    Room.newInvader.trigger(creep);
};
mod.triggerKnownInvaders = id =>  Room.knownInvader.trigger(id);
mod.triggerGoneInvaders = id =>  Room.goneInvader.trigger(id);
mod.execute = function(room) {
    if (room) { // has sight
        room.goneInvader.forEach(mod.triggerGoneInvaders);
        room.hostileIds.forEach(mod.triggerKnownInvaders);
        room.newInvader.forEach(mod.triggerNewInvaders);
        Tower.loop(room);
    }
    else { // no sight
        if( memory.hostileIds ) _.forEach(memory.hostileIds, mod.triggerKnownInvaders);
    }
};
mod.flush = function(room) {
    delete room._casualties;
    delete room._combatCreeps;
    delete room._defenseLevel;
    delete room._hostileIds;
    delete room._hostiles;
    delete room._hostileThreatLevel;
    room.newInvader = [];
    room.goneInvader = [];
};