var mod = {
    extend: function(){
        Spawn.prototype.priority = [
                Creep.setup.miner, 
                Creep.setup.mineralMiner,
                Creep.setup.worker, 
                Creep.setup.hauler,
                Creep.setup.upgrader,
                Creep.setup.warrior,
                Creep.setup.melee,
                Creep.setup.ranger,
                Creep.setup.healer,
                Creep.setup.pioneer, 
                Creep.setup.privateer,
                Creep.setup.claimer];
        Spawn.prototype.loop = function(){
            if( this.spawning ) return;
            let room = this.room;
            let busy = this.createCreepByQueue(room.spawnQueueHigh);
            if( !busy ) busy = this.createCreepByQueue(room.spawnQueueLow);
            if( !busy && Game.time % SPAWN_INTERVAL == 0 ) {
                let that = this;
                let probe = setup => {
                    return setup.isValidSetup(room) && that.createCreepBySetup(setup);
                }
                _.find(this.priority, probe);
            }
        };
        Spawn.prototype.createCreepBySetup = function(setup){
            var params = setup.buildParams(this);
            if( this.create(params.parts, params.name, params.setup, params.cost) ) 
                return params;
            return null;
        };
        Spawn.prototype.createCreepByQueue = function(queue){
            if( !queue || queue.length == 0 ) return null;
            let params = queue.shift();
            return this.create(params.parts, params.name, params.setup, params.cost, params.destiny);
        };
        Spawn.prototype.create = function(body, name, type, cost, destiny){
            if( body.length == 0 ) return false;
            var newName = this.createCreep(body, name, null);
            if( name == newName || translateErrorCode(newName) === undefined ){
                Population.registerCreep(
                    newName, 
                    type, 
                    cost, 
                    this.room, 
                    this.name, 
                    body, 
                    destiny);
                if(CENSUS_ANNOUNCEMENTS) console.log( dye(CRAYON.system, this.pos.roomName  + ' &gt; ') + dye(CRAYON.birth, 'Good morning ' + newName + '!') );
                return true;
            }
            if( DEBUG ) console.log( dye(CRAYON.system, this.pos.roomName + ' &gt; ') + dye(CRAYON.error, 'Offspring failed: ' + translateErrorCode(newName) ) );
            return false;
        };
        Spawn.loop = function(){      
            var loop = spawn => spawn.loop();
            _.forEach(Game.spawns, loop);
        }
    }
};

module.exports = mod;
