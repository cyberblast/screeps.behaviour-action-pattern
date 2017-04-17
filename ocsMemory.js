let mod = {};
module.exports = mod;
mod.numSaved = 0;
mod.toActivate = {};
mod.activateSegment = (id, reset = false) => {
    if (id.start && id.end) {
        for (let i = id.start; i >= id.end; i--) {
            mod.activateSegment(i, reset);
        }
        return;
    }
    if (id < 0 || id > 99) return logError('RawMemory', 'cannot activate invalid segment ' + id);
    const numActive = _.size(RawMemory.segments);
    if (mod.numSaved >= 10) return logError('RawMemory', '10 segments saved, cannot activate segment ' + id);
    if (!reset) {
        if (numActive >= 10) return logError('RawMemory', '10 segments loaded, cannot activate segment ' + id);
        if (numActive + mod.numSaved >= 10) return logError('RawMemory', 'combined loaded and saved exceeds limit(10), cannot activate segment ' + id);
    }
    mod.toActivate[id] = true;
};
mod.deactivateSegment = (id) => {
    if (id < 0 || id > 99) return logError('RawMemory', 'cannot deactivate invalid segment ' + id);
    if (_.size(mod.toActivate) === 0) Object.keys(RawMemory.segments).forEach(id => mod.toActivate[id] = true);
    delete mod.toActivate[id];
};
mod.cacheValid = (id) => {
    return global.cacheValid[id] === Memory.cacheValid[id];
};
mod.processSegment = (id, process) => {
    if (_.isUndefined(Memory.cacheValid[id])) Memory.cacheValid[id] = false;
    const segment = RawMemory.segments[id];
    if (!mod.cacheValid(id)) {
        try {
            let data = segment ? JSON.parse(segment) : {};
            process(data);
            global.cacheValid[id] = Memory.cacheValid[id];
        } catch (e) {
            console.log('<font style="color:FireBrick">Error loading segment' + id + ' caused by ' + (e.stack || e.toString()) + '</font>');
            RawMemory.segments[id] = '';
            delete global.cacheValid[id];
            delete Memory.cacheValid[id];
        }
    } else {
        process(); // notify the listener that the cache is valid
    }
};
mod.processSegments = () => {
    if (_.isUndefined(global.cacheValid)) global.cacheValid = {};
    if (_.isUndefined(Memory.cacheValid)) Memory.cacheValid = {};

    for (let id = MEM_SEGMENTS.COSTMATRIX_CACHE.start; id >= MEM_SEGMENTS.COSTMATRIX_CACHE.end; id--) {
        mod.processSegment(id, Room.loadCostMatrixCache);
    }
    for (let id = MEM_SEGMENTS.PATH_CACHE.start; id >= MEM_SEGMENTS.PATH_CACHE.end; id--) {
        mod.processSegment(id, Room.loadPathCache);
    }
};
mod.saveSegment = (range, inputData) => {
    const numActive = _.size(RawMemory.segments);
    const keys = Object.keys(inputData);
    let keyNum = 0;
    let encodedData;
    for (let id = range.start; id >= range.end; id--) {
        if ((keys && keyNum < keys.length) || (encodedData && encodedData.length > 1)) { // more data to save
            if (!_.isUndefined(RawMemory.segments[id]) || numActive + mod.numSaved < 10) {
                let temp;
                let full = false;
                while (keyNum < keys.length) {
                    const key = keys[keyNum];
                    keyNum++;
                    const stringified = JSON.stringify(inputData[key]);
                    temp = `"${key}":${stringified}`;
                    full = (_.get(encodedData, 'length', 0) + _.get(temp, 'length', 0) + 2) / 1024 > 100;
                    if (full) break;
                    encodedData = encodedData ? encodedData + ',' + temp : '{' + temp;
                }
                if (!encodedData && temp && temp.length > 0) {
                    const size = _.round((temp.length + 2) / 1024, 2);
                    return logError('RawMemory', `Cannot save data at key ${keyNum}, exceeds 100kb limit ${size}kb`);
                }
                if (DEBUG) logSystem('OCSMemory.saveSegment', 'Saving ' + _.round(encodedData.length / 1024, 2) + 'kb of data to segment ' + id);
                RawMemory.segments[id] = encodedData + '}';
                Memory.cacheValid[id] = Game.time;
                encodedData = full && temp ? '{' + temp : '{';
                if (_.isUndefined(RawMemory.segments[id])) mod.numSaved++;
            } else if (numActive > 10) {
                // TODO: also defer? (This should be impossible)
                return logError('RawMemory', 'cannot save segment ' + id + ' too many active segments.');
            } else if (numActive + mod.numSaved > 10) {
                // TODO: defer one tick?
                return logError('RawMemory', 'cannot save segment ' + id + ' loaded + saved exceeds limit(10).');
            } else {
                logError('RawMemory', 'should not be here.');
            }
        } else if (Memory.cacheValid[id]) { // no more data, clear this segment
            if (DEBUG) logSystem('OCSMemory.saveSegment', 'clearing unused segment ' + id);
            RawMemory.segments[id] = '';
            delete Memory.cacheValid[id];
        }
    }
};
mod.cleanup = () => {
    if (_.size(mod.toActivate) > 0) {
        RawMemory.setActiveSegments(Object.keys(mod.toActivate));
    }
    mod.toActivate = {};
    mod.numSaved = 0;
};
