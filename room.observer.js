const mod = {};
module.exports = mod;
mod.analyzeRoom = function(room, needMemoryResync) {
    if (needMemoryResync) {
        room.saveObserver();
        // to re-evaluate rooms, in case parameters are changed
        if (room.structures.observer) room.initObserverRooms();
    }
};
mod.executeRoom = function(roomName) {
    const p = Util.startProfiling('Room.observers.executeRoom', {enabled:PROFILING.ROOMS});
    const room = Game.rooms[roomName];
    if (room) {
        if (room.structures.observer) room.controlObserver();
        p.checkCPU(roomName + '.controlObserver', 0.5);
    }
};
mod.extend = function() {
    // Related Room variables go here

    // Room prototype extensions go here
    Room.prototype.controlObserver = function() {
        const OBSERVER = this.structures.observer;
        if (!OBSERVER) return;
        if (!this.memory.observer.rooms) this.initObserverRooms();
        let nextRoom;
        if (observerRequests.length > 0) { // support for requesting rooms
            for (const request of observerRequests) {
                if (Game.map.getRoomLinearDistance(this.name, request.roomName) <= 10 && !Memory.observerSchedule.includes(request.roomName)) {
                    const room = request.room || Game.rooms[request.roomName];
                    if (room && room.creeps && room.creeps.length && room.creeps.length > 0) continue; // highly likely to have vision next tick as well
                    Memory.observerSchedule.push(request.roomName);
                    nextRoom = request.roomName;
                    break;
                }
            }
        }
        let i = 0;
        const ROOMS = this.memory.observer.rooms;
        if (!nextRoom) {
            let lastLookedIndex = Number.isInteger(this.memory.observer.lastLookedIndex) ? this.memory.observer.lastLookedIndex : ROOMS.length;
            do { // look ma! my first ever do-while loop!
                if (lastLookedIndex >= ROOMS.length) {
                    nextRoom = ROOMS[0];
                } else {
                    nextRoom = ROOMS[lastLookedIndex + 1];
                }
                lastLookedIndex = ROOMS.indexOf(nextRoom);
                if (++i >= ROOMS.length) { // safety check - prevents an infinite loop
                    break;
                }
            } while (Memory.observerSchedule.includes(nextRoom) || nextRoom in Game.rooms);
            this.memory.observer.lastLookedIndex = lastLookedIndex;
            Memory.observerSchedule.push(nextRoom);
        }
        const r = OBSERVER.observeRoom(nextRoom); // now we get to observe a room
        if (r === ERR_INVALID_ARGS && i < ROOMS.length) { // room has not yet been created / off the map (backup)
            Memory.observerSchedule.splice(Memory.observerSchedule.indexOf(nextRoom), 1); // remove invalid room from list
            this.controlObserver(); // should look at the next room (latest call will override previous calls on the same tick)
        }
    };

    Room.prototype.initObserverRooms = function() {
        const OBSERVER_RANGE = OBSERVER_OBSERVE_RANGE > 10 ? 10 : OBSERVER_OBSERVE_RANGE; // can't be > 10
        const [x, y] = Room.calcGlobalCoordinates(this.name, (x,y) => [x,y]); // hacky get x,y
        const [HORIZONTAL, VERTICAL] = Room.calcCardinalDirection(this.name);
        this.memory.observer.rooms = [];

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
                if (OBSERVER_OBSERVE_HIGHWAYS_ONLY && !Room.isHighwayRoom(room)) continue; // we only want highway rooms
                if (room in Game.rooms && Game.rooms[room].my) continue; // don't bother adding the room to the array if it's owned by us
                if (!Game.map.isRoomAvailable(room)) continue; // not an available room
                this.memory.observer.rooms.push(room);
            }
        }
    };

    Room.prototype.saveObserver = function() {
        this.memory.observer = {};
        [this.memory.observer.id] = this.find(FIND_MY_STRUCTURES, {
            filter: s => s instanceof StructureObserver
        }).map(s => s.id);
        if (_.isUndefined(this.memory.observer.id)) delete this.memory.observer;
    };
    // New Room methods go here
};
mod.flush = function() {
    Memory.observerSchedule = [];
};