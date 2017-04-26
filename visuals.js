const BLACK = '#000000';
const WHITE = '#FFFFFF';
const RED = '#FF0000';
const GREEN = '#00FF00';
const BLUE = '#0000FF';
const YELLOW = '#FFFF00';
const CYAN = '#00FFFF';

const getColourByPercentage = (percentage, reverse) => {
    const value = reverse ? percentage : 1 - percentage;
    const hue = (value * 120).toString(10);
    return `hsl(${hue}, 100%, 50%)`;
};

const getResourceColour = (resourceType) => {
    const BASE = {
        [RESOURCE_ENERGY]: '#FFE56D',
        [RESOURCE_POWER]: RED,
        [RESOURCE_CATALYST]: '#FF7A7A',
        [RESOURCE_GHODIUM]: WHITE,
        [RESOURCE_HYDROGEN]: '#CCCCCC',
        [RESOURCE_KEANIUM]: '#9370FF',
        [RESOURCE_LEMERGIUM]: '#89F4A5',
        [RESOURCE_OXYGEN]: '#CCCCCC',
        [RESOURCE_UTRIUM]: '#88D6F7',
        [RESOURCE_ZYNTHIUM]: '#F2D28B',
    };

    let colour = BASE[resourceType];
    
    if (colour) return colour;
    
    let compoundType = [RESOURCE_UTRIUM, RESOURCE_LEMERGIUM, RESOURCE_KEANIUM, RESOURCE_ZYNTHIUM, RESOURCE_GHODIUM, RESOURCE_HYDROGEN, RESOURCE_OXYGEN].find(type => resourceType.includes(type));
    return BASE[compoundType];
};

const storageObject = (vis, store, x, startY) => {
    Object.keys(store).forEach(resource => vis.text(`${resource}: ${Util.formatNumber(store[resource])}`, x, startY += 0.6, Object.assign({color: getResourceColour(resource)}, {align: 'left', font: 0.5})));
};

const Visuals = class {
    
    // VISUAL UTIL METHODS
    drawBar(vis, val, x, y, width, height, inner, fillStyle={}) {
        if (!inner) inner = val;
        const TEXT_Y = y + 0.75;
        vis.rect(x, y, width, height, this.barStyle);
        vis.rect(x, y, width * val, height, fillStyle);
        vis.text(inner, x + width / 2, TEXT_Y);
    }
    
    drawPie(vis, val, max, title, colour, center, inner) {
       if (!inner) inner = val;
        
        let p = 1;
        if (max !== 0) p = val / max;
        const r = 1; // radius
        center = {x: center.x, y: center.y * r * 4.5};
        vis.circle(center, {
            radius: r + 0.1,
            fill: BLACK,
            stroke: 'rgba(255, 255, 255, 0.8)',
        });
        const poly = [center];
        const tau = 2 * Math.PI;
        const surf = tau * (p + 0.1);
        const offs = -Math.PI / 2;
        const step = tau / 32;
        for (let i = 0; i <= surf; i += step) {
            poly.push({
                x: center.x + Math.cos(i + offs),
                y: center.y - Math.cos(i),
            });
        }
        poly.push(center);
        vis.poly(poly, {
            fill: colour,
            opacity: 1,
            stroke: colour,
            strokeWidth: 0.05,
        });
        vis.text(Number.isFinite(inner) ? Util.formatNumber(inner) : inner, center.x, center.y + 0.33, {
            color: WHITE,
            font: '1 monospace',
            align: 'center',
            stroke: 'rgba(0, 0, 0, 0.8)',
            strokeWidth: 0.08,
        });
        let yoff = 0.7;
        if (0.35 < p && p < 0.65) yoff += 0.3;
        vis.text(title, center.x, center.y + r + yoff, {
            color: WHITE,
            font: '0.6 monospace',
            align: 'center',
        });
        const lastpol = poly[poly.length - 2];
        vis.text('' + Math.floor(p * 100) + '%', lastpol.x + (lastpol.x - center.x) * 0.7, lastpol.y + (lastpol.y - center.y) * 0.4 + 0.1, {
            color: WHITE,
            font: '0.4 monospace',
            align: 'center',
        });
    }
    
    drawLine(from, to, style) {
        if (from instanceof RoomObject) from = from.pos;
        if (to instanceof RoomObject) to = to.pos;
        if (!(from instanceof RoomPosition || to instanceof RoomPosition)) throw new Error('Visuals: Point not a RoomPosition');
        if (from.roomName !== to.roomName) return; // cannot draw lines to another room
        const vis = new RoomVisual(from.roomName);
        style = style instanceof Creep
            ? this.creepPathStyle(style)
            : (style || {});
        vis.line(from, to, style);
    }
    
    drawArrow(from, to, style) {
        if (from instanceof RoomObject) from = from.pos;
        if (to instanceof RoomObject) to = to.pos;
        if (!(from instanceof RoomPosition || to instanceof RoomPosition)) throw new Error('Visuals: Point not a RoomPosition');
        if (from.roomName !== to.roomName) return; // cannot draw lines to another room
        const vis = new RoomVisual(from.roomName);
        this.drawLine(from, to, style);
    
        const delta_x = from.x - to.x;
        const delta_y = from.y - to.y;
        const theta_radians = Math.atan2(delta_y, delta_x);
        const base_angle = 0.610865;
        const new_angle = theta_radians + base_angle;
        const length = Math.log1p(Util.getDistance(from, to)) * 0.5;
        style = style instanceof Creep
            ? this.creepPathStyle(style)
            : (style || {});
        
        vis.line(to.x, to.y, to.x + length * Math.cos(theta_radians + base_angle), to.y + length * Math.sin(theta_radians + base_angle), style);
        vis.line(to.x, to.y, to.x + length * Math.cos(theta_radians - base_angle), to.y + length * Math.sin(theta_radians - base_angle), style);
    }
    
    constructor() {
        this.barStyle = {fill: '#2B2B2B', opacity: 0.8, stroke: BLACK};
        this.sparklineStyle = [
            {
                key: 'limit',
                min: Game.cpu.limit * 0.5,
                max: Game.cpu.limit * 1.5,
                stroke: '#808080',
                opacity: 0.25,
            }, {
                key: 'cpu',
                min: Game.cpu.limit * 0.5,
                max: Game.cpu.limit * 1.5,
                stroke: YELLOW,
                opacity: 0.5,
            }, {
                key: 'bucket',
                min: 0,
                max: 10000,
                stroke: CYAN,
                opacity: 0.5,
            },
        ];
        this.toolTipStyle = {align: 'left', font: 0.4};
        this.weakestStyle = {radius: 0.4, fill: RED, opacity: 0.3, strokeWidth: 0};
        this.vis = new RoomVisual;
    }
    
    run() {
        const p = Util.startProfiling('Visuals', {enabled: PROFILING.VISUALS});
        const visibleChecked = VISUALS.VISIBLE_ONLY;
        const VISUAL_ROOMS = visibleChecked ? Util.getVisibleRooms() : Object.keys(Game.rooms);
        _.forEach(VISUAL_ROOMS, roomName => {
            const room = Game.rooms[roomName];
            if (!room) return;
            if (!ROOM_VISUALS_ALL && !room.my) return;
            if (!visibleChecked && !room.controller) return;
            const p2 = Util.startProfiling('Visuals: ' + room.name, {enabled: PROFILING.VISUALS});
            
            Util.set(Memory, 'heatmap', false);
            
            if (VISUALS.HEATMAP) {
                if (Game.time % VISUALS.HEATMAP_INTERVAL === 0) {
                    this.setHeatMapData(room);
                    p2.checkCPU('Heatmap.set', PROFILING.VISUALS_LIMIT);
                }
                
                if (Memory.heatmap) {
                    this.drawHeatMapData(room);
                    p2.checkCPU('Heatmap.draw', PROFILING.VISUALS_LIMIT);
                    return;
                }
            }
            
            if (VISUALS.ROOM) {
                this.drawRoomInfo(room, VISUALS.ROOM_GLOBAL);
                p2.checkCPU('Room Info', PROFILING.VISUALS_LIMIT);
            }
            if (VISUALS.ROOM_ORDERS) {
                this.drawRoomOrders(room);
                p2.checkCPU('Room Orders', PROFILING.VISUALS_LIMIT);
            }
            if (VISUALS.ROOM_OFFERS) {
                this.drawRoomOffers(room);
                p2.checkCPU('Room Offers', PROFILING.VISUALS_LIMIT);
            }
            if (VISUALS.CONTROLLER) {
                this.drawControllerInfo(room.controller);
                p2.checkCPU('Controller', PROFILING.VISUALS_LIMIT);
            }
            if (VISUALS.SPAWN) {
                room.structures.spawns.filter(s => s.spawning).forEach(spawn => this.drawSpawnInfo(spawn));
                p2.checkCPU('Spawns', PROFILING.VISUALS_LIMIT);
            }
            if (VISUALS.MINERAL) {
                let [mineral] = room.minerals;
                if (mineral) {
                    this.drawMineralInfo(mineral);
                    p2.checkCPU('Mineral', PROFILING.VISUALS_LIMIT);
                }
            }
            if (VISUALS.SOURCE) {
                room.sources.forEach(source => this.drawSourceInfo(source));
                p2.checkCPU('Sources', PROFILING.VISUALS_LIMIT);
            }
            if (VISUALS.WALL) {
                this.highlightWeakest(room, STRUCTURE_WALL);
                p2.checkCPU('Walls', PROFILING.VISUALS_LIMIT);
            }
            if (VISUALS.RAMPART) {
                this.highlightWeakest(room, STRUCTURE_RAMPART);
                p2.checkCPU('Ramparts', PROFILING.VISUALS_LIMIT);
            }
            if (VISUALS.ROAD) {
                this.highlightWeakest(room, STRUCTURE_ROAD);
                p2.checkCPU('Roads', PROFILING.VISUALS_LIMIT);
            }
            if (VISUALS.STORAGE) {
                this.drawStorageInfo(room.storage);
                p2.checkCPU('Storage', PROFILING.VISUALS_LIMIT);
            }
            if (VISUALS.TERMINAL) {
                this.drawTerminalInfo(room.terminal);
                p2.checkCPU('Terminal', PROFILING.VISUALS_LIMIT);
            }
            if (VISUALS.TRANSACTIONS) {
                this.drawTransactions(room);
                p2.checkCPU('Transactions', PROFILING.VISUALS_LIMIT);
            }
            if (VISUALS.LABS) {
                room.structures.labs.all.forEach(lab => this.drawLabInfo(lab));
                p2.checkCPU('Labs', PROFILING.VISUALS_LIMIT);
            }
            if (VISUALS.CREEP) {
                room.creeps.forEach(creep => this.drawCreepPath(creep));
                p2.checkCPU('Creep Paths', PROFILING.VISUALS_LIMIT);
            }
            if (VISUALS.TOWER) {
                room.structures.towers.forEach(tower => this.drawTowerInfo(tower));
                p2.checkCPU('Towers', PROFILING.VISUALS_LIMIT);
            }
        });
        p.checkCPU('Total for all rooms', PROFILING.VISUALS_LIMIT);
        if (VISUALS.ROOM_GLOBAL) {
            if (VISUALS.CPU) {
                this.collectSparklineStats();
                p.checkCPU('CPU Sparklines', PROFILING.VISUALS_LIMIT);
            }
            this.drawGlobal();
            p.checkCPU('Global', PROFILING.VISUALS_LIMIT);
        }
    }
    
    drawGlobal() {
        const vis = this.vis;
        const bufferWidth = 1;
        if (!VISUALS.INFO_PIE_CHART) {
            const sectionWidth = 49 / 5;
            const BAR_STYLE = this.barStyle;
    
            let x = bufferWidth;
            let y = 2;
            const BAR_Y = y - 0.75;
            if (VISUALS.ROOM) {
                // GCL
                x = bufferWidth * 2 + sectionWidth;
                const GCL_PERCENTAGE = Game.gcl.progress / Game.gcl.progressTotal;
                this.drawBar(vis, GCL_PERCENTAGE, x, BAR_Y, sectionWidth, 1, `GCL: ${Game.gcl.level} (${(GCL_PERCENTAGE * 100).toFixed(2)}%)`, {
                    fill: getColourByPercentage(GCL_PERCENTAGE, true),
                    opacity: BAR_STYLE.opacity,
                });
        
                // CPU
                x += sectionWidth + bufferWidth;
                const CPU_PERCENTAGE = Game.cpu.getUsed() / Game.cpu.limit;
                const FUNCTIONAL_CPU_PERCENTAGE = Math.min(1, CPU_PERCENTAGE);
                this.drawBar(vis, FUNCTIONAL_CPU_PERCENTAGE, x, BAR_Y, sectionWidth, 1, `CPU: ${(CPU_PERCENTAGE * 100).toFixed(2)}%`, {
                    fill: getColourByPercentage(FUNCTIONAL_CPU_PERCENTAGE),
                    opacity: BAR_STYLE.opacity,
                });
      
                // BUCKET
                x += sectionWidth + bufferWidth;
                const BUCKET_PERCENTAGE = Math.min(1, Game.cpu.bucket / 10000);
                this.drawBar(vis, BUCKET_PERCENTAGE, x, BAR_Y, sectionWidth, 1, `Bucket: ${Game.cpu.bucket}`, {
                    fill: getColourByPercentage(BUCKET_PERCENTAGE, true),
                    opacity: BAR_STYLE.opacity,
                });
        
                // TICK
                x += sectionWidth + bufferWidth;
                vis.text(`Tick: ${Game.time}`, x, y, {align: 'left'});

               //  Second Row
                x = bufferWidth * 2 + sectionWidth;
                y += 1.5;
                
                //  SPAWN CAPACITY UTILIZATION (SCU)
                const spawnCount = _.size(Game.spawns);
                let count = _(Game.spawns).filter('spawning').size();
                count += _(Game.rooms).map(r => r.spawnQueueHigh.concat(r.spawnQueueMedium, r.spawnQueueLow)).flatten().size();
                const SCU_PERCENTAGE = count / spawnCount;
                this.drawBar(vis, Math.min(1, SCU_PERCENTAGE), x, y - 0.75, sectionWidth, 1, `SCU: ${(SCU_PERCENTAGE * 100).toFixed(2)}%`, {
                    fill: getColourByPercentage(Math.min(1, SCU_PERCENTAGE)),
                    opacity: BAR_STYLE.opacity,
                });
            }
        } else {
            let x = bufferWidth + 1;
            let y = 0.5;
            // GCL
            this.drawPie(vis, Math.round(Game.gcl.progress), Game.gcl.progressTotal, `GCL ${Game.gcl.level}`, getColourByPercentage(Game.gcl.progress / Game.gcl.progressTotal, true), {x, y: y++});
            
            // CPU
            const CPU_PERCENTAGE = Game.cpu.getUsed() / Game.cpu.limit;
            const FUNCTIONAL_CPU_PERCENTAGE = Math.min(1, CPU_PERCENTAGE);
            this.drawPie(vis, Math.round(Game.cpu.getUsed()), Game.cpu.limit, 'CPU', getColourByPercentage(FUNCTIONAL_CPU_PERCENTAGE), {x, y: y++});
            
            // BUCKET
            this.drawPie(vis, Game.cpu.bucket, 10000, 'Bucket', getColourByPercentage(Math.min(1, Game.cpu.bucket / 10000), true), {x, y: y++});
            
            //  SPAWN CAPACITY UTILIZATION (SCU)
            const spawnCount = _.size(Game.spawns);
            let count = _(Game.spawns).filter('spawning').size();
            count += _(Game.rooms).map(r => r.spawnQueueHigh.concat(r.spawnQueueMedium, r.spawnQueueLow)).flatten().size();
            const SCU_PERCENTAGE = count / spawnCount;
            this.drawPie(vis, SCU_PERCENTAGE, 1, 'SCU', getColourByPercentage(SCU_PERCENTAGE), {x, y: y++});

            // TICK
            y += 15;
            vis.text('Tick', x, y++, {
                color: WHITE,
                align: 'center',
            });
            vis.text(Game.time, x, y++, {
                color: WHITE,
                align: 'center',
            });
        }
        if (VISUALS.CPU) {
            this.drawSparkline(undefined, 1.5, 46.5, 20, 2, _.map(Memory.visualStats.cpu, (v, i) => Memory.visualStats.cpu[i]), this.sparklineStyle);
        }
    }
    
    collectSparklineStats() {
        Util.set(Memory, 'visualStats.cpu', []);
        Memory.visualStats.cpu.push({
            limit: Game.cpu.limit,
            bucket: Game.cpu.bucket,
            cpu: Game.cpu.getUsed(),
        });
        if (Memory.visualStats.cpu.length >= 100) {
            Memory.visualStats.cpu.shift();
        }
    }
    
    drawSparkline(room, x, y, w, h, values, opts) {
        const vis = room ? new RoomVisual(room) : this.vis;
        _.forEach(opts, opt => {
            vis.poly(_.map(values, (v, i) => [x + w * (i / (values.length - 1)), y + h * (1 - (v[opt.key] - opt.min) / (opt.max - opt.min))]), opt);
        });
    }
    
    drawRoomInfo(room) {
        const vis = new RoomVisual(room.name);
        let x;
        let y = 0;
        // Room Name: centered middle
        vis.text(`Room: ${vis.roomName}`, 24.5, ++y);
        // Displays bars: RCL, Room Energy
        const bufferWidth = 1;
        if (!VISUALS.INFO_PIE_CHART) {
            const sectionWidth = 49 / 5;
            const BAR_STYLE = this.barStyle;
    
            // RCL
            x = bufferWidth;
            y++;
            let text;
            let RCL_PERCENTAGE;
            if (room.controller.level === 8) {
                RCL_PERCENTAGE = 1;
                text = 'RCL: 8';
            } else if (room.controller.reservation) {
                RCL_PERCENTAGE = 0;
                text = `Reserved: ${room.controller.reservation.ticksToEnd}`;
            } else if (room.controller.owner) {
                RCL_PERCENTAGE = Math.min(1, room.controller.progress / room.controller.progressTotal);
                text = `RCL: ${room.controller.level} (${(RCL_PERCENTAGE * 100).toFixed(2)}%)`;
            } else {
                RCL_PERCENTAGE = 0;
                text = `Unowned`;
            }
            this.drawBar(vis, RCL_PERCENTAGE, x, y - 0.75, sectionWidth, 1, text, {
                fill: getColourByPercentage(RCL_PERCENTAGE, true),
                opacity: BAR_STYLE.opacity,
            });
    
            if (VISUALS.ROOM_GLOBAL) {
                // New line
                y += 1.5;
        
                x = bufferWidth;
            } else {
                x += sectionWidth + bufferWidth;
            }
    
            // Display Energy Available
            if (!room.controller.reservation && room.controller.owner) {
                const ENERGY_PERCENTAGE = room.energyAvailable / room.energyCapacityAvailable || 0;
                this.drawBar(vis, ENERGY_PERCENTAGE, x, y - 0.75, sectionWidth, 1, `Energy: ${room.energyAvailable}/${room.energyCapacityAvailable} (${(ENERGY_PERCENTAGE * 100).toFixed(2)}%)`, {
                    fill: getColourByPercentage(ENERGY_PERCENTAGE, true),
                    opacity: BAR_STYLE.opacity,
                });
            }
        } else {
            let x = bufferWidth + 1;
            let y = 0.5;
            if (VISUALS.ROOM_GLOBAL) {
                x += 4;
            }
            
            // RCL
            let val;
            let max;
            let title = 'RCL';
            let inner;
            if (room.controller.level === 8) {
                val = 1;
                max = 1;
                inner = ' ';
            } else if (room.controller.reservation) {
                val = room.controller.reservation.ticksToEnd;
                max = 5000;
            } else if (room.controller.owner) {
                val = Math.min(room.controller.progress, room.controller.progressTotal);
                max = room.controller.progressTotal;
                title += ` ${room.controller.level}`;
            } else {
                val = 0;
                max = 1;
                inner = 'N/A';
            }
            this.drawPie(vis, val, max, title, getColourByPercentage(val / max, true), {x, y: y++}, inner);
            
            // Energy Available
            if (!room.controller.reservation && room.controller.owner) {
                const PERCENTAGE = room.energyAvailable / room.energyCapacityAvailable || 0;
                this.drawPie(vis, room.energyAvailable, room.energyCapacityAvailable, 'Energy', getColourByPercentage(PERCENTAGE, true), {x, y: y++});
            }
        }
    }
    
    drawSpawnInfo(spawn) {
        if (!spawn.spawning) return;
        const vis = new RoomVisual(spawn.room.name);
        vis.text(`${spawn.spawning.name} (${((spawn.spawning.needTime - spawn.spawning.remainingTime) / spawn.spawning.needTime * 100).toFixed(1)}%)`, spawn.pos.x + 1, spawn.pos.y - 0.5, this.toolTipStyle);
    }
    
    drawMineralInfo(mineral) {
        const vis = new RoomVisual(mineral.room.name);
        const x = mineral.pos.x + 1;
        const y = mineral.pos.y - 0.5;
        if (mineral.mineralAmount) {
            vis.text(`Amount: ${Util.formatNumber(mineral.mineralAmount)}`, x, y, this.toolTipStyle);
        } else {
            vis.text(`Regen: ${Util.formatNumber(mineral.ticksToRegeneration)}`, x, y, this.toolTipStyle);
        }
    }
    
    drawSourceInfo(source) {
        const vis = new RoomVisual(source.room.name);
        const x = source.pos.x + 1;
        const y = source.pos.y - 0.5;
        if (source.energy) {
            vis.text(`Amount: ${source.energy}`, x, y, this.toolTipStyle);
        } else {
            vis.text(`Regen: ${source.ticksToRegeneration}`, x, y, this.toolTipStyle);
        }
    }
    
    drawControllerInfo(controller) {
        const vis = new RoomVisual(controller.room.name);
        const BASE_X = controller.pos.x + 1;
        let y = controller.pos.y - 0.5;
        const style = this.toolTipStyle;
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
            let downgradeStyle = Object.assign({}, style, {color: RED});
            vis.text(line2, BASE_X, y += 0.4, downgradeStyle);
        }
    }
    
    highlightWeakest(room, structureType) {
        const vis = new RoomVisual(room.name);
        const weakest = _(room.find(FIND_STRUCTURES)).filter({structureType}).min('hits');
        if (weakest && weakest.pos) {
            vis.circle(weakest.pos.x, weakest.pos.y, this.weakestStyle);
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
            vis.text(`H: ${Util.formatNumber(weakest.hits)} (${(weakest.hits / weakest.hitsMax * 100).toFixed(2)}%)`, weakest.pos.x + 1, y, this.toolTipStyle);
        }
    }
    
    drawRoomOrders(room) {
        const vis = new RoomVisual(room.name);
        const x = 43;
        let y = VISUALS.INFO_PIE_CHART ? 0.5 : 4.5;
        if (!room.memory.resources || !room.memory.resources.orders || !_.size(room.memory.resources.orders)) {
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
            vis.text(`${order.type}: ${Util.formatNumber(order.amount)}`, x, y += 0.6, Object.assign({color: getResourceColour(order.type)}, this.toolTipStyle));
        }
    }
    
    drawRoomOffers(room) {
        const vis = new RoomVisual(room.name);
        const x = 43;
        let y = VISUALS.INFO_PIE_CHART ? 0.5 : 4.5;
        if (!room.memory.resources || !room.memory.resources.offers || !_.size(room.memory.resources.offers)) {
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
            vis.text(`${offer.type}: ${Util.formatNumber(offer.amount)} (to ${offer.room})`, x, y += 0.6, Object.assign({color: getResourceColour(offer.type)}, this.toolTipStyle));
        }
    }
    
    drawStorageInfo(storage) {
        if (!storage || !_.size(storage.store)) return;
        const vis = new RoomVisual(storage.room.name);
        const x = 43;
        let y = VISUALS.INFO_PIE_CHART ? 0.5 : 4.5;
        vis.text('Storage Contents', x, ++y, {align: 'left'});
        storageObject(vis, storage.store, x, y);
    }
    
    drawTerminalInfo(terminal) {
        if (!terminal || !_.size(terminal.store)) return;
        const vis = new RoomVisual(terminal.room.name);
        const x = 43;
        let y = VISUALS.INFO_PIE_CHART ? 0.5 : 4.5;
        if (VISUALS.STORAGE && terminal.room.storage) {
            y += 2 + _.size(terminal.room.storage.store) * 0.6;
        }
        vis.text('Terminal Contents', x, ++y, {align: 'left'});
        storageObject(vis, terminal.store, x, y);
    }
    
    drawTransactions(room) {
        if (!room.terminal) return;
        const vis = new RoomVisual(room.name);
        const x = room.terminal.pos.x;
        let y = room.terminal.pos.y - 1;
        
        const transactions = _(Game.market.incomingTransactions)
            .concat(Game.market.outgoingTransactions)
            .filter(transaction => transaction.from === room.name || transaction.to === room.name)
            .sortByOrder('time', 'desc')
            .slice(0, 2)
            .value();
        
        if (transactions.length === 0) return;
        if (transactions.length === 2) y -= 0.4;
        
        transactions.forEach(transaction => {
            const outgoing = transaction.sender.username === room.controller.owner.username;
            const toSelf = transaction.recipient ? transaction.sender.username === transaction.recipient.username : false;
            const receiving = room.name === transaction.to;
            const colour = outgoing || receiving ? GREEN : RED;
            const prefix = outgoing ? '+' : '-';
            let text = '';
            if (toSelf || !transaction.order) {
                const roomName = receiving ? transaction.from : transaction.to;
                text = `${roomName} : ${transaction.amount} ${transaction.resourceType}`;
            } else {
                text = `${prefix}${transaction.amount * transaction.order.price}`;
            }
            vis.text(text, x, y, {font: this.toolTipStyle.font, color: colour});
            
            y += 0.4;
        });
    }
    
    drawLabInfo(lab) {
        const vis = new RoomVisual(lab.room.name);
        if (!lab.energy && !lab.mineralAmount && !lab.cooldown) return;
        const x = lab.pos.x + 0.8;
        let y = lab.pos.y - 0.5;
        if (lab.energy) {
            vis.text(`E: ${Util.formatNumber(lab.energy)}`, x, y, Object.assign({color: getResourceColour(RESOURCE_ENERGY)}, this.toolTipStyle));
        }
        if (lab.mineralAmount) {
            vis.text(`M: ${lab.mineralType} (${Util.formatNumber(lab.mineralAmount)})`, x, y += 0.4, Object.assign({color: getResourceColour(lab.mineralType)}, this.toolTipStyle));
        }
        if (lab.cooldown) {
            vis.text(`C: ${lab.cooldown}`, x, y += 0.4, Object.assign({color: RED}, this.toolTipStyle));
        }
    }
    
    setHeatMapData(room) {
        Util.set(room.memory, 'heatmap', () => {
            const r = {};
            for (let x = 0; x < 50; x++) {
                for (let y = 0; y < 50; y++) {
                    const pos = room.getPositionAt(x, y);
                    if (Game.map.getTerrainAt(pos) === 'wall') continue;
                    const key = `${String.fromCharCode(32 + x)}${String.fromCharCode(32 + y)}_x${x}-y${y}`;
                    r[key] = 0;
                }
            }
            return r;
        });
        room.creeps.filter(creep => !creep.spawning).forEach(creep => {
            const x = creep.pos.x;
            const y = creep.pos.y;
            const key = `${String.fromCharCode(32 + x)}${String.fromCharCode(32 + y)}_x${x}-y${y}`;
            room.memory.heatmap[key]++;
        });
    }
    
    drawHeatMapData(room) {
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
            const colour = getColourByPercentage(Math.min(1, PERCENTAGE));
            vis.rect(d.x - 0.5, d.y - 0.5, 1, 1, {fill: colour});
        });
    }
    
    drawTowerInfo(tower) {
        const vis = new RoomVisual(tower.room.name);
        vis.text(`E: ${tower.energy}/${tower.energyCapacity}`, tower.pos.x + 1, tower.pos.y - 0.5, this.toolTipStyle);
    }
    
    creepPathStyle(creep) {
        function randomColour() {
            let c = '#';
            while (c.length < 7) c += Math.random().toString(16).substr(-7).substr(-1);
            return c;
        }
        
        Util.set(creep.data, 'pathColour', randomColour);
        
        return {
            width: 0.15,
            color: creep.data.pathColour,
            lineStyle: 'dashed',
        };
    }
    
    drawCreepPath(creep) {
        const vis = new RoomVisual(creep.room.name);
        if (creep.action && creep.action.name === 'idle') return; // don't draw idle path
        if (_(creep.pos).pick(['x', 'y']).eq(creep.data.determinatedSpot)) return;
        if (!creep.memory || !creep.memory._travel || !creep.memory._travel.path) return;
        
        const path = creep.memory._travel.path.substr(1);
        const style = this.creepPathStyle(creep);
        let x = creep.pos.x;
        let y = creep.pos.y;
        const maths = {
            [TOP]: {x: 0, y: -1},
            [TOP_RIGHT]: {x: 1, y: -1},
            [RIGHT]: {x: 1, y: 0},
            [BOTTOM_RIGHT]: {x: 1, y: 1},
            [BOTTOM]: {x: 0, y: 1},
            [BOTTOM_LEFT]: {x: -1, y: 1},
            [LEFT]: {x: -1, y: 0},
            [TOP_LEFT]: {x: -1, y: -1},
        };
        if (creep.fatigue === 0) {
            const initDir = +creep.memory._travel.path[0]; // get initial so we know where to set the start (x, y)
            x += maths[initDir].x;
            y += maths[initDir].y;
        }
        for (let dir of path) {
            dir = +dir; // force coerce to number
            vis.line(x, y, x += maths[dir].x, y += maths[dir].y, style);
            
        }
    }
    
};
module.exports = new Visuals;
