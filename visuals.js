const Visuals = class {};
module.exports = Visuals;

Visuals.extend = function() {
    
    Object.defineProperties(Visuals, {
        barStyle: {
            configurable: true,
            value: {fill: '#2B2B2B', opacity: 0.8, stroke: '#000000',},
        },
        sparklineStyle: {
            configurable: true,
            value: [{
                key: 'limit',
                min: Game.cpu.limit * 0.5,
                max: Game.cpu.limit * 1.5,
                stroke: '#808080',
                opacity: 0.25,
            }, {
                key: 'cpu',
                min: Game.cpu.limit * 0.5,
                max: Game.cpu.limit * 1.5,
                stroke: '#FFFF00',
                opacity: 0.5,
            }, {
                key: 'bucket',
                min: 0,
                max: 10000,
                stroke: '#00FFFF',
                opacity: 0.5,
            }],
        },
        tooltipStyle: {
            configurable: true,
            value: {align: 'left', font: 0.4,},
        },
        weakestStyle: {
            configurable: true,
            value: {radius: 0.4, fill: '#FF0000', opacity: 0.3, strokeWidth: 0,},
        }
    });
    
    Visuals.drawGlobal = function() {
        const vis = new RoomVisual();
        const bufferWidth = 1;
        const sectionWidth = 49 / 5;
        const BAR_STYLE = Visuals.barStyle;
        
        let x = bufferWidth;
        const y = 2;
        if (VISUALS.ROOM) {
            // GCL
            x = bufferWidth * 2 + sectionWidth;
            vis.rect(x, y - 0.75, sectionWidth, 1, BAR_STYLE);
            const GCL_PERCENTAGE = Game.gcl.progress / Game.gcl.progressTotal;
            vis.rect(x, y - 0.75, GCL_PERCENTAGE * sectionWidth, 1, {
                fill: getColourByPercentage(GCL_PERCENTAGE, true),
                opacity: BAR_STYLE.opacity
            });
            vis.text(`GCL: ${Game.gcl.level} (${(GCL_PERCENTAGE * 100).toFixed(2)}%)`, x + sectionWidth / 2, y);
            
            // CPU
            x += sectionWidth + bufferWidth;
            vis.rect(x, y - 0.75, sectionWidth, 1, BAR_STYLE);
            const CPU_PERCENTAGE = Game.cpu.getUsed() / Game.cpu.limit;
            const FUNCTIONAL_CPU_PERCENTAGE = Math.min(1, CPU_PERCENTAGE);
            vis.rect(x, y - 0.75, FUNCTIONAL_CPU_PERCENTAGE * sectionWidth, 1, {
                fill: getColourByPercentage(FUNCTIONAL_CPU_PERCENTAGE),
                opacity: BAR_STYLE.opacity
            });
            vis.text(`CPU: ${(CPU_PERCENTAGE * 100).toFixed(2)}%`, x + sectionWidth / 2, y);
            
            // Bucket
            x += sectionWidth + bufferWidth;
            vis.rect(x, y - 0.75, sectionWidth, 1, BAR_STYLE);
            const BUCKET_PERCENTAGE = Game.cpu.bucket / 10000;
            vis.rect(x, y - 0.75, BUCKET_PERCENTAGE * sectionWidth, 1, {
                fill: getColourByPercentage(BUCKET_PERCENTAGE, true),
                opacity: BAR_STYLE.opacity
            });
            vis.text(`Bucket: ${Game.cpu.bucket}`, x + sectionWidth / 2, y);
            
            // Tick
            x += sectionWidth + bufferWidth;
            vis.text(`Tick: ${Game.time}`, x, y, {align: 'left'});
        }
        if (VISUALS.CPU) {
            Visuals.drawSparkline(undefined, 1.5, 46.5, 20, 2, _.map(Memory.visualStats.cpu, (v, i) => Memory.visualStats.cpu[i]), Visuals.sparklineStyle);
        }
    };
    
    Visuals.drawSparkline = function(room, x, y, w, h, values, options) {
        const vis = room ? new RoomVisual(room) : new RoomVisual();
        _.forEach(options, option => {
            vis.poly(_.map(values, (v, i) => [x + w * (i / (values.length - 1)), y + h * (1 - (v[option.key] - option.min) / (option.max - option.min))]), option);
        });
    };
    
    Visuals.collectSparklineStats = function() {
        Util.set(Memory, 'visualStats.cpu', []);
        Memory.visualStats.cpu.push({
            limit: Game.cpu.limit,
            bucket: Game.cpu.bucket,
            cpu: Game.cpu.getUsed(),
        });
        if (Memory.visualStats.cpu.length >= 100) {
            Memory.visualStats.cpu.shift();
        }
    };
    
    Visuals.drawRoomInfo = function(room) {
        const vis = new RoomVisual(room.name);
        let x;
        let y = 0;
        // Room Name, centered middle
        vis.text(`Room: ${vis.roomName}`, 24.5, ++y);
        // Display bars: RCL, GCL, CPU, Bucket, Tick #
        const bufferWidth = 1;
        const sectionWidth = 49 / 5;
        const BAR_STYLE = Visuals.barStyle;
        
        // RCL
        x = bufferWidth;
        vis.rect(x, ++y - 0.75, sectionWidth, 1, BAR_STYLE);
        let text;
        let RCL_PERCENTAGE;
        if (room.controller.level === 8) {
            RCL_PERCENTAGE = 1;
            text = `RCL: 8`;
        } else if (room.controller.reservation) {
            RCL_PERCENTAGE = 0;
            text = `Reserved: ${room.controller.reservation.ticksToEnd}`;
        } else if (room.controller.owner) {
            RCL_PERCENTAGE = room.controller.progress / room.controller.progressTotal;
            text = `RCL: ${room.controller.level} (${(RCL_PERCENTAGE * 100).toFixed(2)}%)`;
        } else {
            RCL_PERCENTAGE = 0;
            text = `Unowned`;
        }
        RCL_PERCENTAGE = Math.min(1, RCL_PERCENTAGE);
        vis.rect(x, y - 0.75, RCL_PERCENTAGE * sectionWidth, 1, {
            fill: getColourByPercentage(RCL_PERCENTAGE, true),
            opacity: BAR_STYLE.opacity
        });
        vis.text(text, x + sectionWidth / 2, y);
        
        if (VISUALS.ROOM_GLOBAL) {
            // New line
            y += 1.5;
            
            x = bufferWidth;
        } else {
            x += sectionWidth + bufferWidth;
        }
        
        // Display Creep Count, Energy Available
        if (!room.controller.reservation) {
            vis.rect(x, y - 0.75, sectionWidth, 1, BAR_STYLE);
            const ENERGY_PERCENTAGE = room.energyAvailable / room.energyCapacityAvailable || 0;
            vis.rect(x, y - 0.75, Math.min(1, ENERGY_PERCENTAGE) * sectionWidth, 1, {
                fill: getColourByPercentage(ENERGY_PERCENTAGE, true),
                opacity: BAR_STYLE.opacity
            });
            vis.text(`Energy: ${room.energyAvailable}/${room.energyCapacityAvailable} (${(ENERGY_PERCENTAGE * 100).toFixed(2)}%)`, x + sectionWidth / 2, y);
        }
    };
    
    Visuals.drawSpawnInfo = function(spawn) {
        if (!spawn.spawning) return;
        const vis = new RoomVisual(spawn.room.name);
        vis.text(`${spawn.spawning.name} (${((spawn.spawning.needTime - spawn.spawning.remainingTime) / spawn.spawning.needTime * 100).toFixed(1)}%)`, spawn.pos.x + 1, spawn.pos.y - 0.5, Visuals.tooltipStyle);
    };
    
    Visuals.drawMineralInfo = function(mineral) {
        const vis = new RoomVisual(mineral.room.name);
        let x = mineral.pos.x + 1;
        let y = mineral.pos.y - 0.5;
        if (mineral.mineralAmount) {
            vis.text(`Amount: ${Util.formatNumber(mineral.mineralAmount)}`, x, y, Visuals.tooltipStyle);
        } else {
            vis.text(`Regen: ${Util.formatNumber(mineral.ticksToRegeneration)}`, x, y, Visuals.tooltipStyle);
        }
    };
    
    Visuals.drawSourceInfo = function(source) {
        const vis = new RoomVisual(source.room.name);
        let x = source.pos.x + 0.5;
        let y = source.pos.y - 0.5;
        if (source.energy) {
            vis.text(`Amount: ${source.energy}`, x, y, Visuals.tooltipStyle);
        } else {
            vis.text(`Regen: ${source.ticksToRegeneration}`, x, y, Visuals.tooltipStyle);
        }
    };
    
    Visuals.drawControllerInfo = function(controller) {
        const vis = new RoomVisual(controller.room.name);
        const BASE_X = controller.pos.x + 1;
        let y = controller.pos.y - 0.5;
        const style = Visuals.tooltipStyle;
        let line0 = `L: ${controller.level}`;
        let line1 = `P: ${Util.formatNumber(controller.progress)}/${Util.formatNumber(controller.progressTotal)} (${(controller.progress / controller.progressTotal * 100).toFixed(2)}%)`;
        let line2 = `D: ${Util.formatNumber(controller.ticksToDowngrade)}`;
        if (controller.level === 8) {
            line1 = undefined;
        } else if (controller.reservation) {
            line0 = 'L: Reserved';
            line1 = `P: ${controller.reservation.username}`;
            line2 = `D: ${controller.reservation.ticksToEnd}`;
        } else if (!controller.owner) {
            return;
        }
        vis.text(line0, BASE_X, y, style);
        if (line1) {
            vis.text(line1, BASE_X, y += 0.4, style);
        }
        if (controller.ticksToDowngrade < CONTROLLER_DOWNGRADE[controller.level] || controller.reservation) {
            let downgradeStyle = Object.assign({}, style, {color: '#FF0000'});
            vis.text(line2, BASE_X, y += 0.4, downgradeStyle);
        }
    };
    
    Visuals.highlightWeakest = function(room, type) {
        const vis = new RoomVisual(room.name);
        let weakest = _(room.find(FIND_STRUCTURES)).filter(s => s.structureType === type).min(s => s.hits);
        if (weakest && weakest.pos) {
            vis.circle(weakest.pos.x, weakest.pos.y, Visuals.weakestStyle);
            let y = weakest.pos.y - 0.5; // base y pos - consistent with spawns, labs, and controllers
            const look = weakest.pos.lookFor(LOOK_STRUCTURES);
            const towers = _.find(look, o => o instanceof StructureTower);
            if (towers && VISUALS.TOWER) {
                y += 0.4;
            } else {
                const spawns = _.find(look, o => o instanceof StructureSpawn && o.spawning);
                if (spawns && VISUALS.SPAWN) {
                    // if structure shares a position with a spawn (road, rampart), lower to next line
                    // spawn must be spawning, and spawn visuals must be enabled
                    y += 0.4;
                } else {
                    const labs = _.find(look, o => o instanceof StructureLab);
                    if (labs && VISUALS.LABS) {
                        // same as spawns, move the weakest structure text until it's on its own line
                        if (labs.energy) y += 0.4;
                        if (labs.mineralAmount) y += 0.4;
                        if (labs.cooldown) y += 0.4;
                    }
                }
            }
            vis.text(`H: ${Util.formatNumber(weakest.hits)} (${(weakest.hits / weakest.hitsMax * 100).toFixed(2)}%)`, weakest.pos.x + 1, y, Visuals.tooltipStyle);
        }
    };
    
    Visuals.drawRoomOrders = function(room) {
        const vis = new RoomVisual(room.name);
        const x = 43;
        let y = 4.5;
        if (!room.memory.resources || !room.memory.resources.orders) {
            return;
        }
        if (VISUALS.STORAGE && room.storage) {
            y += 2 + _.size(room.storage.store) * 0.6;
        }
        if (VISUALS.TERMINAL && room.terminal) {
            y += 2 + _.size(room.terminal.store) * 0.6;
        }
        vis.text('Room Orders', x, ++y, {align: 'left'});
        for (let order of room.memory.resources.orders) {
            vis.text(`${order.type}: ${Util.formatNumber(order.amount)}`, x, y += 0.6, Object.assign({color: getResourceColour(order.type)}, Visuals.tooltipStyle));
        }
    };
    
    Visuals.drawRoomOffers = function(room) {
        const vis = new RoomVisual(room.name);
        const x = 43;
        let y = 4.5;
        if (!room.memory.resources || !room.memory.resources.offers) {
            return;
        }
        if (VISUALS.STORAGE && room.storage) {
            y += 2 + _.size(room.storage.store) * 0.6;
        }
        if (VISUALS.TERMINAL && room.terminal) {
            y += 2 + _.size(room.terminal.store) * 0.6;
        }
        if (VISUALS.ROOM_ORDERS && room.memory.resources.orders) {
            y += 2 + _.size(room.memory.resources.orders) * 0.6;
        }
        vis.text('Room Offerings', x, ++y, {align: 'left'});
        for (let offer of room.memory.resources.offers) {
            vis.text(`${offer.type}: ${Util.formatNumber(offer.amount)} (to ${offer.room})`, x, y += 0.6, Object.assign({color: getResourceColour(offer.type)}, Visuals.tooltipStyle));
        }
    };
    
    Visuals.storage = function(room) {
        if (room.storage) {
            const vis = new RoomVisual(room.name);
            const x = 43;
            let y = 4.5;
            vis.text('Storage Contents', x, ++y, {align: 'left'});
            storageObject(vis, room.storage.store, x, y);
        }
    };
    
    Visuals.terminal = function(room) {
        if (room.terminal) {
            const vis = new RoomVisual(room.name);
            const x = 43;
            let y = 4.5;
            if (VISUALS.STORAGE && room.storage) {
                y += 2 + _.size(room.storage.store) * 0.6;
            }
            vis.text('Terminal Contents', x, ++y, {align: 'left'});
            storageObject(vis, room.terminal.store, x, y);
        }
    };
    
    Visuals.drawTowerInfo = function(tower) {
        const vis = new RoomVisual(tower.room.name);
        vis.text(`E: ${tower.energy}/${tower.energyCapacity}`, tower.pos.x + 1, tower.pos.y - 0.5, Visuals.tooltipStyle);
    };
    
    Visuals.drawTransactions = function(room) {
        if (room.terminal) {
            const vis = new RoomVisual(room.name);
            const x = room.terminal.pos.x;
            let y = room.terminal.pos.y - 1;
            
            const transactions = _(Game.market.incomingTransactions)
                .concat(Game.market.outgoingTransactions)
                .filter(transaction => transaction.from === room.name || transaction.to === room.name)
                .sortBy('time')
                .reverse()
                .slice(0, 2)
                .value();
            
            if (transactions.length === 0) {
                return;
            }
            
            if (transactions.length === 2) {
                y -= 0.4;
            }
            
            transactions.forEach(transaction => {
                const outgoing = transaction.sender.username === room.controller.owner.username;
                const toSelf = transaction.recipient ? transaction.sender.username === transaction.recipient.username : false;
                const receiving = room.name === transaction.to;
                const colour = outgoing || receiving ? '#00FF00' : '#FF0000';
                const prefix = outgoing ? '+' : '-';
                let text = '';
                if (toSelf || !transaction.order) {
                    const roomName = receiving ? transaction.from : transaction.to;
                    text = `${roomName} : ${transaction.amount} ${transaction.resourceType}`;
                } else {
                    text = `${prefix}${transaction.amount * transaction.order.price}`;
                }
                //const detailedText = `${prefix}${transaction.amount * transaction.order.price} : ${transaction.resourceType} * ${transaction.amount}`;
                vis.text(text, x, y, {font: Visuals.tooltipStyle.font, color: colour,});
                
                y += 0.4;
            });
        }
    };
    
    Visuals.drawLabs = function(room) {
        const vis = new RoomVisual(room.name);
        for (let lab of room.structures.labs.all) {
            if (lab.energy || lab.mineralAmount || lab.cooldown) {
                const x = lab.pos.x + 0.8;
                let y = lab.pos.y - 0.5;
                if (lab.energy) {
                    vis.text(`E: ${Util.formatNumber(lab.energy)}`, x, y, Object.assign({color: getResourceColour(RESOURCE_ENERGY)}, Visuals.tooltipStyle));
                }
                if (lab.mineralAmount) {
                    vis.text(`M: ${lab.mineralType} (${Util.formatNumber(lab.mineralAmount)})`, x, y += 0.4, Object.assign({color: getResourceColour(lab.mineralType)}, Visuals.tooltipStyle));
                }
                if (lab.cooldown) {
                    vis.text(`C: ${lab.cooldown}`, x, y += 0.4, Object.assign({color: '#FF0000'}, Visuals.tooltipStyle));
                }
            }
        }
    };
    
    Visuals.setHeatMapData = function(room) {
        if (room.memory.heatmap === undefined) {
            room.memory.heatmap = {};
            for (let x = 0; x < 50; x++) {
                for (let y = 0; y < 50; y++) {
                    const look = room.lookForAt(LOOK_TERRAIN, x, y);
                    if (look && look[0] === 'wall') continue;
                    const key = `${String.fromCharCode(32 + x)}${String.fromCharCode(32 + y)}_x${x}-y${y}`;
                    room.memory.heatmap[key] = 0;
                }
            }
        }
        room.creeps.filter(creep => !creep.spawning).forEach(creep => {
            const x = creep.pos.x;
            const y = creep.pos.y;
            const key = `${String.fromCharCode(32 + x)}${String.fromCharCode(32 + y)}_x${x}-y${y}`;
            room.memory.heatmap[key]++;
        });
    };
    
    Visuals.drawHeatMapData = function(room) {
        const vis = new RoomVisual(room.name);
        const data = Object.keys(room.memory.heatmap).map(k => {
            return {
                n: room.memory.heatmap[k],
                x: k.charCodeAt(0) - 32,
                y: k.charCodeAt(1) - 32,
            };
        });
        
        const MAP_DATA = _.filter(data, d => d.n > 0);
        
        const PERCENTAGE_MAX = _.sum(MAP_DATA, d => d.n) / MAP_DATA.length * 2;
        MAP_DATA.forEach(d => {
            const PERCENTAGE = d.n / PERCENTAGE_MAX;
            const colour = getColourByPercentage(PERCENTAGE > 1 ? 1 : PERCENTAGE);
            vis.rect(d.x - 0.5, d.y - 0.5, 1, 1, {fill: colour});
        });
    };
    
    Visuals.creepPathStyle = function(creep) {
        function randomColour() {
            let c = '#';
            while (c.length < 7) {
                c += (Math.random()).toString(16).substr(-6).substr(-1);
            }
            return c;
        }
        
        creep.data.pathColour = creep.data.pathColour ? creep.data.pathColour : randomColour(); // set colour in memory. Makes tracking easier, and prevents rainbows.
        return {
            width: 0.15,
            color: creep.data.pathColour,
            lineStyle: 'dashed',
        };
    };
    
    Visuals.drawCreepPath = function(room) {
        const vis = new RoomVisual(room.name);
        room.creeps.forEach(creep => {
            if (creep.action === Creep.action.idle) return; // don't draw idle path
            if (_.chain(creep.pos).pick(['x','y']).eq(creep.data.determinatedSpot).value()) return;

            if (creep.memory && creep.memory._travel && creep.memory._travel.path) {
                const path = creep.memory._travel.path.substr(1);
                const style = Visuals.creepPathStyle(creep);
                let x = creep.pos.x;
                let y = creep.pos.y;
                if (creep.fatigue === 0) {
                    const initDirection = +creep.memory._travel.path[0]; // get initial so we know where to set the start (x, y)
                    if (initDirection === TOP) {
                        --y;
                    } else if (initDirection === TOP_RIGHT) {
                        ++x;
                        --y;
                    } else if (initDirection === RIGHT) {
                        ++x;
                    } else if (initDirection === BOTTOM_RIGHT) {
                        ++x;
                        ++y;
                    } else if (initDirection === BOTTOM) {
                        ++y;
                    } else if (initDirection === BOTTOM_LEFT) {
                        --x;
                        ++y;
                    } else if (initDirection === LEFT) {
                        --x;
                    } else if (initDirection === TOP_LEFT) {
                        --x;
                        --y;
                    } else {
                        // we're not supposed to be here.
                    }
                }
                for (let direction of path) {
                    direction = +direction; // force coerce to number
                    if (direction === TOP) {
                        vis.line(x, y, x, --y, style);
                    } else if (direction === TOP_RIGHT) {
                        vis.line(x, y, ++x, --y, style);
                    } else if (direction === RIGHT) {
                        vis.line(x, y, ++x, y, style);
                    } else if (direction === BOTTOM_RIGHT) {
                        vis.line(x, y, ++x, ++y, style);
                    } else if (direction === BOTTOM) {
                        vis.line(x, y, x, ++y, style);
                    } else if (direction === BOTTOM_LEFT) {
                        vis.line(x, y, --x, ++y, style);
                    } else if (direction === LEFT) {
                        vis.line(x, y, --x, y, style);
                    } else if (direction === TOP_LEFT) {
                        vis.line(x, y, --x, --y, style);
                    } else {
                        // we're not supposed to be here.
                    }
                }
            }
        });
    };
    
};

Visuals.run = function() {
    for (let roomName in Game.rooms) {
        const room = Game.rooms[roomName];
        if (!ROOM_VISUALS_ALL && !room.my) continue;
        if (!room.controller) continue;
        
        Util.set(Memory, 'heatmap', false);
        
        if (VISUALS.HEATMAP) {
            if (Game.time % VISUALS.HEATMAP_INTERVAL === 0) {
                Visuals.setHeatMapData(room);
            }
            
            if (Memory.heatmap) {
                Visuals.drawHeatMapData(room);
                continue;
            }
        }
        
        if (VISUALS.ROOM) {
            Visuals.drawRoomInfo(room, VISUALS.ROOM_GLOBAL);
        }
        if (VISUALS.ROOM_ORDERS) {
            Visuals.drawRoomOrders(room);
        }
        if (VISUALS.ROOM_OFFERS) {
            Visuals.drawRoomOffers(room);
        }
        if (VISUALS.CONTROLLER) {
            Visuals.drawControllerInfo(room.controller);
        }
        if (VISUALS.SPAWN) {
            room.structures.spawns.filter(s => s.spawning).forEach(Visuals.drawSpawnInfo);
        }
        if (VISUALS.MINERAL) {
            let [mineral] = room.minerals;
            if (mineral) Visuals.drawMineralInfo(mineral);
        }
        if (VISUALS.SOURCE) {
            room.sources.forEach(Visuals.drawSourceInfo);
        }
        if (VISUALS.WALL) {
            Visuals.highlightWeakest(room, STRUCTURE_WALL);
        }
        if (VISUALS.RAMPART) {
            Visuals.highlightWeakest(room, STRUCTURE_RAMPART);
        }
        if (VISUALS.ROAD) {
            Visuals.highlightWeakest(room, STRUCTURE_ROAD);
        }
        if (VISUALS.STORAGE) {
            Visuals.storage(room);
        }
        if (VISUALS.TERMINAL) {
            Visuals.terminal(room);
        }
        if (VISUALS.TOWER) {
            room.structures.towers.forEach(Visuals.drawTowerInfo);
        }
        if (VISUALS.TRANSACTIONS) {
            Visuals.drawTransactions(room);
        }
        if (VISUALS.LABS) {
            Visuals.drawLabs(room);
        }
        if (VISUALS.CREEP) {
            Visuals.drawCreepPath(room);
        }
    }
    if (VISUALS.ROOM_GLOBAL) {
        if (VISUALS.CPU) {
            Visuals.collectSparklineStats();
        }
        Visuals.drawGlobal();
    }
};

function storageObject(vis, store, x, startY) {
    Object.keys(store).forEach(resource => vis.text(`${resource}: ${Util.formatNumber(store[resource])}`, x, startY += 0.6, Object.assign({color: getResourceColour(resource)}, Visuals.tooltipStyle)));
}

function getResourceColour(resourceType) {
    const BASE = {
        [RESOURCE_ENERGY]: '#FFE56D',
        [RESOURCE_POWER]: '#FF0000',
        [RESOURCE_CATALYST]: '#FF7A7A',
        [RESOURCE_GHODIUM]: '#FFFFFF',
        [RESOURCE_HYDROGEN]: '#CCCCCC',
        [RESOURCE_KEANIUM]: '#9370FF',
        [RESOURCE_LEMERGIUM]: '#89F4A5',
        [RESOURCE_OXYGEN]: '#CCCCCC',
        [RESOURCE_UTRIUM]: '#88D6F7',
        [RESOURCE_ZYNTHIUM]: '#F2D28B',
    };
    
    let colour = BASE[resourceType];
    
    if (!colour) {
        let compoundType = [RESOURCE_UTRIUM, RESOURCE_LEMERGIUM, RESOURCE_KEANIUM, RESOURCE_ZYNTHIUM, RESOURCE_GHODIUM, RESOURCE_HYDROGEN, RESOURCE_OXYGEN].find(type => resourceType.indexOf(type) !== -1);
        colour = BASE[compoundType];
    }
    return colour;
}

function getColourByPercentage(percentage, reverse = false) {
    const value = reverse ? percentage : 1 - percentage;
    const hue = (value * 120).toString(10);
    return `hsl(${hue}, 100%, 50%)`;
}
