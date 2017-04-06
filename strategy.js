"use strict";

const mod = {};
module.exports = mod;

mod.decorateAgent = function(prototype, ...definitions) {
    if (!prototype.customStrategy) prototype.customStrategy = function(ids) {};
    if (!prototype.staticCustomStrategy) prototype.staticCustomStrategy = function(ids) {};
    prototype.getStrategyHandler = function(ids, method, ...args) {
        const currentStrategy = this.currentStrategy || this.strategy(ids);
        const returnValOrMethod = currentStrategy[method];
        const strategyKey = currentStrategy.key;
        const strategyName = currentStrategy.name;
        if (DEBUG && TRACE) trace('Strategy', {agent:this.name, strategyKey, strategyName, method});
        if (returnValOrMethod === undefined) {
            logError('strategy handler returned undefined', {agent: this.name || this.id, strategyKey, strategyName, method, stack: new Error().stack});
            return;
        }
        if (args.length === 0) {
            return returnValOrMethod;
        }
        const returnVal = returnValOrMethod.apply(this.currentStrategy, args);
        if (returnVal !== undefined) {
            return returnVal;
        }
        logError('handler returned undefined for args', {agent: this.name || this.id, strategyKey, strategyName, method, args:args.toString(), stack: new Error().stack});
    };
    prototype._strategyCache = {};
    prototype.strategyKey = function(ids) {
        const key = [];
        for (let i = definitions.length - 1; i >= 0; i--) {
            if( ids[i]) key[i] = ids[i];
            else key[i] = definitions[i].default(this);
        }
        return key;
    };
    prototype.strategy = function(ids) {
        const key = this.strategyKey(ids);

        let strategy = mod.getCachedStrategy(this, key);
        if (strategy) {
            return mod.customizeStrategy(this, key, strategy);
        }

        strategy = mod.buildStrategy(key,
            mod.strategyChainUtils,
            definitions,
            this.staticCustomStrategy.apply(this, key)
        );

        if (!strategy) {
            logError('no strategy', {agent: this.name || this.id, key});
            return {};
        }
        mod.putCachedStrategy(this, key, strategy);
        return mod.customizeStrategy(this, key, strategy);
    };
};

// agent will prefer this strategy until it is free'd
mod.allocateStrategy = function(agent, ...definitions) {
    agent.currentStrategy = agent.strategy.apply(agent, definitions);
};

mod.freeStrategy = function(agent) {
    mod.freeStrategyChain(agent.currentStrategy);
    delete agent.currentStrategy;
};

mod.buildStrategy = function(key, utils, definitions, custom) {
    const currentStrategy = {key,name:[]};
    mod.appendStrategies(currentStrategy, undefined, [utils]);

    let head;
    for (let i = 0; i < definitions.length; i++) {
        const id = key[i];
        const selector = id && definitions[i].selector(id);
        const strategies = selector && selector.selectStrategies && selector.selectStrategies.apply(selector, key);
        head = mod.appendStrategies(currentStrategy, head, strategies);
    }
    if (custom) {
        head = mod.appendStrategies(currentStrategy, head, [custom]);
    }
    if (head) {
        return currentStrategy;
    }
};

mod.appendStrategies = function(currentStrategy, head, strategies) {
    if (!strategies) return head;
    for (let i = 0; i < strategies.length; i++) {
        const strategy = strategies[i];
        if (strategy) {
            head = strategy;
            _.assign(currentStrategy, strategy, function(objectValue, sourceValue, key) {
                if (key === 'name') {
                    objectValue.push(sourceValue);
                    return objectValue;
                } else {
                    return sourceValue;
                }
            });
        }
    }
    return head;
};

mod.freeStrategyChain = function(chain) {
    // used to clean prototype changes (feature in performance testing)
};

mod.customizeStrategy = function(agent, key, cachedStrategy) {
    const customStrategy = agent.customStrategy.apply(agent, key);
    if (!customStrategy) return cachedStrategy;

    return _.assign({}, cachedStrategy, customStrategy, function(objectValue, sourceValue, key) {
        if (key === 'name') {
            if (Array.isArray(sourceValue)) {
                return sourceValue.slice(0);
            } else {
                objectValue.push(sourceValue);
                return objectValue;
            }
        } else {
            return sourceValue;
        }
    });
};

mod.strategyChainUtils = {
    toString: function() {
        const returnVal = this.name.toString();
        mod.freeStrategy(this);
        return returnVal;
    },
    [Symbol.toPrimitive]: function() {
        return this.toString();
    },
};

// TODO NEED cache invalidation
mod.getCachedStrategy = function(agent, key) {
    return _.get(agent._strategyCache, key);
};

mod.putCachedStrategy = function(agent, key, strategy) {
    Object.freeze(strategy);
    _.set(agent._strategyCache, key, strategy);
};
