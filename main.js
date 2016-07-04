var loop = require('loop');
var resetMemory = false;

module.exports.loop = function () {
    loop.run(resetMemory);
    resetMemory = false;
};