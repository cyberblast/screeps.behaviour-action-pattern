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

const mod = {
    name: 'reputation',
    myName: () => ME,
    isNPC: username => NPC[username] === true,
    npcOwner: creep => creep.owner && mod.isNPC(creep.owner.username),
    isAlly: username => mod.score(username) >= CONST.ALLY,
    notAlly: username => !mod.isAlly(username),
    allyOwner: creep => creep.owner && mod.isAlly(creep.owner.username),
    isHostile: username => mod.score(username) < CONST.NEUTRAL,
    notHostile: username => !mod.isHostile(username),
    hostileOwner: creep => creep.owner && mod.isHostile(creep.owner.username),
    whitelist: () => mod.cache('whitelist'),
    score: username => {
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
    },
    setScore: (username, score) => {
        const name = username && username.toLowerCase();
        mod.score()[name] = score;
        mod.playerMemory(name).score = score;
    },

    flush: () => {
        mod._loadWhitelist();
        mod._loadScore();
    },
    cache: table => Task.cache(mod.name, table),
    killScoreCache: () => {
        Task.clearCache(mod.name, 'score');
        return mod.score();
    },
    killWhitelistCache: () => {
        Task.clearCache(mod.name, 'score');
        Task.clearCache(mod.name, 'whitelist');
        return mod.whitelist();
    },
    memory: table => Task.memory(mod.name, table),
    playerMemory: username => {
        const playerMemory = mod.memory('players');
        const name = username && username.toLowerCase();
        if( playerMemory[name] ) {
            return playerMemory[name];
        } else {
            return playerMemory[name] = {};
        }
    },

    _loadScore: () => {
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
    },
    _loadWhitelist: () => {
        let whitelist = mod.whitelist();
        if( _.keys(whitelist).length !== PLAYER_WHITELIST.length ) {
            whitelist = mod.killWhitelistCache();

            _.forEach(PLAYER_WHITELIST, function(playerName) {
                whitelist[playerName.toLowerCase()] = true;
            });
        }
    },
};
module.exports = mod;
