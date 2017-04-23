const mod = {};
module.exports = mod;
mod.analyzeRoom = function(room) {
    if (room.hostiles.length > 0) room.processInvaders();
};
const triggerNewInvaders = creep => {
    // create notification
    const bodyCount = JSON.stringify( _.countBy(creep.body, 'type') );
    if( global.DEBUG || NOTIFICATE_INVADER || (NOTIFICATE_INTRUDER && creep.room.my) || NOTIFICATE_HOSTILES ) logSystem(creep.pos.roomName, `Hostile intruder (${bodyCount}) from "${creep.owner.username}".`);
    if( NOTIFICATE_INVADER || (NOTIFICATE_INTRUDER && creep.owner.username !== 'Invader' && creep.room.my) || (NOTIFICATE_HOSTILES && creep.owner.username !== 'Invader') ){
        Game.notify(`Hostile intruder ${creep.id} (${bodyCount}) from "${creep.owner.username}" in room ${creep.pos.roomName} at ${toDateTimeString(toLocalDate(new Date()))}`);
    }
    // trigger subscribers
    Room.newInvader.trigger(creep);
};
const triggerKnownInvaders = id =>  Room.knownInvader.trigger(id);
const triggerGoneInvaders = id =>  Room.goneInvader.trigger(id);
mod.executeRoom = function(memory, roomName) {
    const p = Util.startProfiling(roomName + '.defense.execute', {enabled:PROFILING.ROOMS});
    const room = Game.rooms[roomName];
    if (room) { // has sight
        room.goneInvader.forEach(triggerGoneInvaders);
        p.checkCPU('goneInvader', 0.5);
        room.hostileIds.forEach(triggerKnownInvaders);
        p.checkCPU('knownInvaders', 0.5);
        room.newInvader.forEach(triggerNewInvaders);
        p.checkCPU('newInvaders', 0.5);
    }
    else { // no sight
        if( memory.hostileIds ) _.forEach(memory.hostileIds, triggerKnownInvaders);
        p.checkCPU('knownInvadersNoSight', 0.5);
    }
};
mod.extend = function() {
    Object.defineProperties(Room.prototype, {
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
                        (creep.towers === undefined || creep.towers.length == 0);
                    this._casualties = _.sortBy(_.filter(this.creeps, isInjured), 'hits');
                }
                return this._casualties;
            }
        },
        'conserveForDefense': {
            configurable: true,
            get: function () {
                return (this.my && this.storage && this.storage.charge < 0);
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
        },
        'hostile': {
            configurable: true,
            get: function() {
                return this.memory.hostile;
            }
        },
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
    });

    Room.prototype.processInvaders = function() {
        let that = this;
        if( this.memory.hostileIds === undefined )
            this.memory.hostileIds = [];
        if (!SEND_STATISTIC_REPORTS) delete this.memory.statistics;
        else if (this.memory.statistics === undefined) {
            this.memory.statistics = {};
        }

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

    Room.prototype.registerIsHostile = function() {
        if (this.controller) {
            if (_.isUndefined(this.hostile) || typeof this.hostile === 'number') { // not overridden by user
                if (this.controller.owner && !this.controller.my && !this.ally) {
                    this.memory.hostile = this.controller.level;
                } else {
                    delete this.memory.hostile;
                }
            }
        }
    };
};
mod.flushRoom = function(room) {
    room.newInvader = [];
    room.goneInvader = [];
};