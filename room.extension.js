const mod = {};
module.exports = mod;
mod.analyzeRoom = function(room, needMemoryResync) {
    if (needMemoryResync) {
        room.saveExtensions();
    }
};
mod.extend = function() {
    Room.prototype.saveExtensions = function() {
        const extensions = this.find(FIND_MY_STRUCTURES, {
            filter: s => s instanceof StructureExtension
        }).map(s => s.id);
        if (extensions.length > 0) this.memory.extensions = extensions;
        else delete this.memory.extensions;
    };
};