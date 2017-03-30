const mod = new Task('reputation');
module.exports = mod;

mod.name = 'reputation';
mod.myName = () => _.chain(Game.rooms).map('controller').flatten().filter('my').map('owner.username').first().value();
mod.isNPC = username => NPC[username] === true;
mod.npcOwner = creep => creep.owner && mod.isNPC(creep.owner.username);
mod.isAlly = username => mod.score(username) >= CONST.ALLY;
mod.notAlly = username => !mod.isAlly(username);
mod.allyOwner = creep => creep.owner && mod.isAlly(creep.owner.username);
mod.isHostile = username => mod.score(username) < CONST.NEUTRAL;
mod.notHostile = username => !mod.isHostile(username);
mod.hostileOwner = creep => creep.owner && mod.isHostile(creep.owner.username);
mod.whitelist = () => mod.cache('whitelist');
mod.score = username => {
    const reps = mod.cache('score');
    if( username === undefined ) {
        return reps;
    }
    const name = username && username.toLowerCase();
    if( reps[name] ) {
        return reps[name];
    } else {
        return reps[name] = 0;
    }
};
mod.setScore = (username, score) => {
    const name = username && username.toLowerCase();
    mod.score()[name] = score;
    mod.playerMemory(name).score = score;
};

mod.flush = () => {
    mod._loadWhitelist();
    mod._loadScore();
};
mod.cache = table => Task.cache(mod.name, table);
mod.killScoreCache = () => {
    Task.clearCache(mod.name, 'score');
    return mod.score();
};
mod.killWhitelistCache = () => {
    Task.clearCache(mod.name, 'score');
    Task.clearCache(mod.name, 'whitelist');
    return mod.whitelist();
};
mod.memory = table => Task.memory(mod.name, table);
mod.playerMemory = username => {
    const playerMemory = mod.memory('players');
    const name = username && username.toLowerCase();
    if( playerMemory[name] ) {
        return playerMemory[name];
    } else {
        return playerMemory[name] = {};
    }
};

mod._loadScore = () => {
    const etc = mod.cache('etc');
    const playerMemory = mod.memory('players');
    const whitelist = mod.whitelist();
    let score = mod.score();
    if( _.keys(playerMemory).length + _.keys(whitelist).length
            !== _.keys(score).length + etc.whitelistRepUnion) {
        score = mod.killScoreCache();
        for( const n in NPC ) {
            score[n] = CONST.NPC_SCORE;
        }
        _.keys(whitelist).forEach(function(player) {
            score[player] = CONST.WHITELIST_SCORE;
        });

        etc.whitelistRepUnion = 0;
        _.reduce(playerMemory, function(list, player, name) {
            if( typeof player.score === "number" ) {
                if( whitelist[name] ) {
                    etc.whitelistRepUnion++;
                }
                list[name] = player.score;
            }
            return list;
        }, score);

        mod.setScore(mod.myName(), CONST.MY_SCORE);
    }
};
mod._loadWhitelist = () => {
    let whitelist = mod.whitelist();
    if( _.keys(whitelist).length !== PLAYER_WHITELIST.length ) {
        whitelist = mod.killWhitelistCache();

        _.forEach(PLAYER_WHITELIST, function(playerName) {
            whitelist[playerName.toLowerCase()] = true;
        });
    }
};

const NPC = {
    ["Source Keeper"]: true,
    ["Invader"]: true,
};
const CONST = {
    MY_SCORE: 1000,
    WHITELIST_SCORE: 200,
    ALLY: 100,
    NEUTRAL: 1,
    NPC_SCORE: -200,
};