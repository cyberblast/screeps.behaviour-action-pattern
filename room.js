var mod = {
    loop: function(){
        _.forEach(Game.rooms, function(room, name){
            room.init();
        });
    }
}

module.exports = mod;