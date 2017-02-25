let mod = {};
module.exports = mod;
mod.priorityHigh = [
        Creep.setup.worker,
        Creep.setup.miner,
        Creep.setup.hauler,
        Creep.setup.upgrader];
mod.priorityLow = [
        Creep.setup.mineralMiner,
        Creep.setup.privateer];
mod.extend = function(){
    Spawn.prototype.execute = function(){
        if( this.spawning ) return;
        let room = this.room;
        // old spawning system 
        let that = this;
        let probe = setup => {
            return setup.isValidSetup(room) && that.createCreepBySetup(setup);
        }

        let busy = this.createCreepByQueue(room.spawnQueueHigh);
        // don't spawn lower if there is one waiting in the higher queue 
        if( !busy && room.spawnQueueHigh.length == 0 && Game.time % SPAWN_INTERVAL == 0 ) {
            busy = _.some(Spawn.priorityHigh, probe);
            if( !busy ) busy = this.createCreepByQueue(room.spawnQueueMedium);
            if( !busy && room.spawnQueueMedium.length == 0 ) {
                busy = _.some(Spawn.priorityLow, probe);
                if( !busy ) busy = this.createCreepByQueue(room.spawnQueueLow);
            }
        }
        return busy;
    };
    Spawn.prototype.createCreepBySetup = function(setup){
        if( DEBUG && TRACE ) trace('Spawn',{setupType:this.type, rcl:this.room.controller.level, energy:this.room.energyAvailable, maxEnergy:this.room.energyCapacityAvailable, Spawn:'createCreepBySetup'}, 'creating creep');
        var params = setup.buildParams(this);
        if( this.create(params.parts, params.name, params.setup) )
            return params;
        return null;
    };
    Spawn.prototype.createCreepByQueue = function(queue){
        if( !queue || queue.length == 0 ) return null;
        let params = queue.shift();
        let cost = 0;
        params.parts.forEach(function(part){
            cost += BODYPART_COST[part];
        });
        // no parts
        if( cost === 0 ) {
            global.logSystem(this.pos.roomName, dye(CRAYON.error, 'Zero parts body creep queued. Removed.' ));
            return false;
        }
        // wait with spawning until enough resources are available
        if (cost > this.room.remainingEnergyAvailable) {
            if (cost > this.room.energyCapacityAvailable || (cost > 300 && !this.room.creeps.length)) {
                global.logSystem(this.pos.roomName, dye(CRAYON.error, 'Queued creep too big for room: ' + JSON.stringify(params) ));
                return false;
            }
            queue.unshift(params);
            return true;
        }
        var completeName;
        var stumb = params.name;
        for (var son = 1; (completeName == null) || Game.creeps[completeName] || Memory.population[completeName]; son++) {
            completeName = params.name + '-' + son;
        }
        params.name = completeName;
        let result = this.create(params.parts, params.name, params.behaviour || params.setup, params.destiny);
        if( !result ){
            params.name = stumb;
            queue.unshift(params);
        }
        return result;
    };
    Spawn.prototype.create = function(body, name, behaviour, destiny){
        if( body.length == 0 ) return false;
        var newName = this.createCreep(body, name, null);
        if( name == newName || translateErrorCode(newName) === undefined ){
            let cost = 0;
            body.forEach(function(part){
                cost += BODYPART_COST[part];
            });
            this.room.reservedSpawnEnergy += cost;
            Population.registerCreep(
                newName,
                behaviour,
                cost,
                this.room,
                this.name,
                body,
                destiny); 
            this.newSpawn = {name: newName};
            Creep.spawningStarted.trigger({spawn: this.name, name: newName, body: body, destiny: destiny, spawnTime: body.length * CREEP_SPAWN_TIME});
            if(CENSUS_ANNOUNCEMENTS) global.logSystem(this.pos.roomName, dye(CRAYON.birth, 'Good morning ' + newName + '!') );
            return true;
        }
        if( DEBUG || CENSUS_ANNOUNCEMENTS ) global.logSystem(this.pos.roomName, dye(CRAYON.error, 'Offspring failed: ' + translateErrorCode(newName) + '<br/> - body: ' + JSON.stringify(_.countBy(body)) + '<br/> - name: ' + name + '<br/> - behaviour: ' + behaviour + '<br/> - destiny: ' + destiny) );
        return false;
    };
};
mod.register = function(){
    Creep.spawningCompleted.on( creep => mod.handleSpawningCompleted(creep) );
};
mod.handleSpawningCompleted = function(creep){
    if( DEBUG && TRACE ) trace('Spawn', {behaviour:creep.data.creepType, creepName:creep.name, Spawn:'Creep.spawningCompleted'});
    if(CENSUS_ANNOUNCEMENTS) global.logSystem(creep.pos.roomName, dye(CRAYON.birth, 'Off to work ' + creep.name + '!') );
};
mod.execute = function(){
    let run = spawn => {
        if(spawn.room.my) spawn.execute();
    }
    _.forEach(Game.spawns, run);
};
