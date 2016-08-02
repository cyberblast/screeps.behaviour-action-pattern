var mod = {
    loop: function(){
        var init = room => room.init();
        _.forEach(Game.rooms, init);
    }
}

module.exports = mod;