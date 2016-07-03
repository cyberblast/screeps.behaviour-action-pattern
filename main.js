var loop = require('loop');
var force = false;

module.exports.loop = function () {
    loop.run(force);
    force = false;
};