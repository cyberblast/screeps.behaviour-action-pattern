let mod = {};
module.exports = mod;
mod.name = 'mineralMiner';
mod.determineTarget = creep => {
    let notDeterminated = source => {
        let hasThisSource = data => data.determinatedTarget === source.id;
        let existingBranding = _.find(Memory.population, hasThisSource);
        return !existingBranding;
    };
    const source = _.find(creep.room.minerals, notDeterminated);
    if( source ) {
        creep.data.determinatedTarget = source.id;
    }
    if( SAY_ASSIGNMENT ) creep.say(String.fromCharCode(9935), SAY_PUBLIC);
};
mod.run = function(creep) {
    return Creep.behaviour.miner.run(creep, {determineTarget: mod.determineTarget});
};
