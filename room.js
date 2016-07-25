var mod = {
    loop: function(){
        _.forEach(Game.rooms, function(room, name){
            //if( room.controller.my )
                room.init();
        });
    }
}

module.exports = mod;