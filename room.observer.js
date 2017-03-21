const mod = {};
module.exports = mod;
mod.extend = function(room) {
    Room.prototype.controlObserver = function() {
        const OBSERVER = this.structures.observer;
        if (!OBSERVER) return;
        if (!this.memory.observer.rooms) this.initObserverRooms();
        const ROOMS = this.memory.observer.rooms;
        let lastLookedIndex = Number.isInteger(this.memory.observer.lastLookedIndex) ? this.memory.observer.lastLookedIndex : ROOMS.length;
        let nextRoom;
        let i = 0;
        do { // look ma! my first ever do-while loop!
            if (lastLookedIndex >= ROOMS.length) {
                nextRoom = ROOMS[0];
            }  else {
                nextRoom = ROOMS[lastLookedIndex + 1];
            }
            lastLookedIndex = ROOMS.indexOf(nextRoom);
            if (++i >= ROOMS.length) { // safety check - prevents an infinite loop
                break;
            }
        } while (Memory.observerSchedule.includes(nextRoom) || nextRoom in Game.rooms);
        this.memory.observer.lastLookedIndex = lastLookedIndex;
        Memory.observerSchedule.push(nextRoom);
        const r = OBSERVER.observeRoom(nextRoom); // now we get to observe a room
        if (r === ERR_INVALID_ARGS && i < ROOMS.length) { // room has not yet been created / off the map (backup)
            Memory.observerSchedule.splice(Memory.observerSchedule.indexOf(nextRoom), 1); // remove invalid room from list
            this.controlObserver(); // should look at the next room (latest call will override previous calls on the same tick)
        }
    };
    Room.prototype.initObserverRooms = function() {
        const OBSERVER_RANGE = OBSERVER_OBSERVE_RANGE > 10 ? 10 : OBSERVER_OBSERVE_RANGE; // can't be > 10
        const PRIORITISE_HIGHWAY = OBSERVER_PRIORITISE_HIGHWAY;
        const [x, y] = Room.calcGlobalCoordinates(this.name, (x,y) => [x,y]); // hacky get x,y
        const [HORIZONTAL, VERTICAL] = Room.calcCardinalDirection(this.name);
        let ROOMS = [];

        for (let a = x - OBSERVER_RANGE; a < x + OBSERVER_RANGE; a++) {
            for (let b = y - OBSERVER_RANGE; b < y + OBSERVER_RANGE; b++) {
                let hor = HORIZONTAL;
                let vert = VERTICAL;
                let n = a;
                if (a < 0) { // swap horizontal letter
                    hor = hor === 'W' ? 'E' : 'W';
                    n = Math.abs(a) - 1;
                }
                hor += n;
                n = b;
                if (b < 0) {
                    vert = vert === 'N' ? 'S' : 'N';
                    n = Math.abs(b) - 1;
                }
                vert += n;
                const room = hor + vert;
                if (!Game.map.isRoomAvailable(room)) continue; // not an available room
                if (room in Game.rooms && Game.rooms[room].my) continue; // don't bother adding the room to the array if it's owned by us
                if (OBSERVER_OBSERVE_HIGHWAYS_ONLY && !Room.isHighwayRoom(room)) continue; // we only want highway rooms
                ROOMS.push(room);
            }
        }
        if (PRIORITISE_HIGHWAY) {
            ROOMS = _.sortBy(ROOMS, v => {
                return Room.isHighwayRoom(v) ? 0 : 1; // should work, I hope
            });
        }
        this.memory.observer.rooms = ROOMS;
    };
    Room.prototype.saveObserver = function() {
        this.memory.observer = {};
        [this.memory.observer.id] = this.find(FIND_MY_STRUCTURES, {
            filter: s => s instanceof StructureObserver
        }).map(s => s.id);
    };
};
mod.analyze = function(room) {
    if( Game.time % MEMORY_RESYNC_INTERVAL === 0 || room.name == 'sim' ) room.saveObserver();
};
// if you pass room, it flushes a single room, otherwise it flushes global values
mod.flush = function(room) {
    if (room) {
        if (Game.time % MEMORY_RESYNC_INTERVAL === 0 || room.name == 'sim' && room.structures.observer)
            room.initObserverRooms(); // to re-evaluate rooms, in case parameters are changed
        room.controlObserver();
    } else {
        Memory.observerSchedule = [];
    }
};