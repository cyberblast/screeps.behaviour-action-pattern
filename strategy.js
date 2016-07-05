
var mod = {
    strategy: {
        growth: require('strategy.growth')
    },
    select: function(state){
        return strategy[state.strategy];
    }
};

module.exports = mod;