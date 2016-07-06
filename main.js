var modules = {
    status: require('status'),
    creeps: require('creep'),
    spawns: require('spawn'),
    towers: require('tower')
}

module.exports.loop = function () {
    var state = modules.status.load();
    //console.log('Req. storing: ' + state.rooms.sim.creepActionRequirement.storing + ' building: ' + state.rooms.sim.creepActionRequirement.building + ' upgrading: ' + state.rooms.sim.creepActionRequirement.upgrading);
    modules.creeps.loop(state);
    modules.spawns.loop(state);
    modules.towers.loop(state);
};