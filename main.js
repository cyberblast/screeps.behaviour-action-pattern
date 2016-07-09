var modules = {
    global: require('global'),
    extensions: require('extensions'),
    creeps: require('creep'),
    spawns: require('spawn'),
    towers: require('tower')
}

module.exports.loop = function () {
    modules.global.init();
    modules.extensions.init();
    
    modules.creeps.loop();
    modules.spawns.loop();
    modules.towers.loop();
};