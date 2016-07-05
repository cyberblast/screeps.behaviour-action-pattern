var modules = {
    status: require('status'),
    creeps: require('creep'),
    spawns: require('spawn'),
    towers: require('tower')
}

module.exports.loop = function () {
    var state = modules.status.load();
    modules.creeps.loop(state);
    modules.spawns.loop(state);
    modules.towers.loop(state);
};