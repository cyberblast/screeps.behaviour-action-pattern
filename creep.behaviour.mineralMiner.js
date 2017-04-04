class MineralMiner extends Creep.Behaviour.Miner {
    constructor(name = 'mineralMiner') {
        super(name);
    }
    determineTarget(creep) {
        let notDeterminated = source => {
            let hasThisSource = data => data.determinatedTarget === source.id;
            let existingBranding = _.find(Memory.population, hasThisSource);
            return !existingBranding;
        };
        source = _.find(creep.room.minerals, notDeterminated);
        if( source ) {
            creep.data.determinatedTarget = source.id;
        }
        if( SAY_ASSIGNMENT ) creep.say(String.fromCharCode(9935), SAY_PUBLIC);
    }
}
module.exports = MineralMiner;
