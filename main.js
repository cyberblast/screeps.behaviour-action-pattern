var modules = {
    status: require('status'),
    creeps: require('creep'),
    spawns: require('spawn'),
    towers: require('tower')
}

module.exports.loop = function () {
    var state = modules.status.load();
    creeps.loop(state);
    spawns.loop(state);
    towers.loop(state);
};