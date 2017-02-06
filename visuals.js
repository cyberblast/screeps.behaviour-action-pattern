const mod = {};
module.exports = mod;

mod.run = function() {
	for (let roomName in Game.rooms) {
		const room = Game.rooms[roomName];
		if (!room.my) continue; // Skip rooms not owned by you
		
		if (VISUALS.ROOM) {
			mod.drawRoomInfo(room, VISUALS.ROOM_GLOBAL);
		}
		if (VISUALS.CONTROLLER) {
			mod.drawControllerInfo(room.controller);
		}
		if (VISUALS.SPAWN) {
			room.structures.spawns.filter(s => s.spawning).forEach(s => mod.drawSpawnInfo(s));
		}
		if (VISUALS.MINERAL) {
			let [mineral] = room.minerals;
			if (mineral) mod.drawMineralInfo(mineral);
		}
		if (VISUALS.SOURCE) {
			room.sources.forEach(s => mod.drawSourceInfo(s));
		}
		if (VISUALS.WALL) {
			mod.highlightWeakest(room, STRUCTURE_WALL);
		}
		if (VISUALS.RAMPART) {
			mod.highlightWeakest(room, STRUCTURE_RAMPART);
		}
	}
};

mod.drawRoomInfo = function(room, global = true) {
	const vis = new RoomVisual(room.name);
	let line = 1;
	vis.text(`Room: ${vis.roomName}`, 2, ++line, {align: 'left',});
	vis.text(`Creeps: ${_.size(room.creeps)}`, 2, ++line, {align: 'left',});
	let RCL = room.controller.level;
	if (room.controller.progress) {
		RCL += ` (${(room.controller.progress / room.controller.progressTotal * 100).toFixed(2)}%)`;
	}
	vis.text(`RCL: ${RCL}`, 2, ++line, {align: 'left',});
	vis.text(`Energy: ${room.energyAvailable}/${room.energyCapacityAvailable} (${(room.energyAvailable / room.energyCapacityAvailable * 100).toFixed(0)}%)`, 2, ++line, {align: 'left',});
	// Blank line - Separate Room and Global
	++line;
	if (!global) {
		return;
	}
	let GCL = Game.gcl.level;
	if (Game.gcl.progress) {
		GCL += ` (${(Game.gcl.progress / Game.gcl.progressTotal * 100).toFixed(2)}%)`;
	}
	vis.text(`GCL: ${GCL}`, 2, ++line, {align: 'left',});
	vis.text(`CPU: ${Game.cpu.limit}`, 2, ++line, {align: 'left',});
	vis.text(`Used: ${Game.cpu.getUsed().toFixed(2)}`, 2, ++line, {align: 'left',});
	vis.text(`Bucket: ${Game.cpu.bucket}`, 2, ++line, {align: 'left',});
	vis.text(`Creeps: ${_.size(Game.creeps)}`, 2, ++line, {align: 'left',});
};

mod.drawSpawnInfo = function(spawn) {
	if (!spawn.spawning) return;
	const vis = new RoomVisual(spawn.room.name);
	vis.text(`${spawn.spawning.name} (${((spawn.spawning.needTime - spawn.spawning.remainingTime) / spawn.spawning.needTime * 100).toFixed(1)}%)`, spawn.pos.x + 1, spawn.pos.y - 0.5, {align: 'left', size: 0.4,});
};

mod.drawMineralInfo = function(mineral) {
	const vis = new RoomVisual(mineral.room.name);
	let x = mineral.pos.x + 1;
	let y = mineral.pos.y - 0.5;
	if (mineral.mineralAmount) {
		vis.text(`Amount: ${formatNum(mineral.mineralAmount)}`, x, y, {align: 'left', size: 0.4,});
	} else {
		vis.text(`Regen: ${formatNum(mineral.ticksToRegeneration)}`, x, y, {align: 'left', size: 0.4,});
	}
};

mod.drawSourceInfo = function(source) {
	const vis = new RoomVisual(source.room.name);
	let x = source.pos.x + 0.5;
	let y = source.pos.y - 0.5;
	if (source.energy) {
		vis.text(`Amount: ${source.energy}`, x, y, {align: 'left', size: 0.4,});
	} else {
		vis.text(`Regen: ${source.ticksToRegeneration}`, x, y, {align: 'left', size: 0.4,});
	}
};

mod.drawControllerInfo = function(controller) {
	const vis = new RoomVisual(controller.room.name);
	const BASE_X = controller.pos.x + 1;
	let y = controller.pos.y - 0.5;
	const style = {align: 'left', size: 0.4,};
	vis.text(`L: ${controller.level}`, BASE_X, y, style);
	vis.text(`P: ${formatNum(controller.progress)}/${formatNum(controller.progressTotal)} (${(controller.progress / controller.progressTotal * 100).toFixed(2)}%)`, BASE_X, y += 0.4, style);
	if (controller.ticksToDowngrade < CONTROLLER_DOWNGRADE[controller.level]) {
		let downgradeStyle = Object.assign({}, style, {color: '#FF0000'});
		vis.text(`D: ${formatNum(controller.ticksToDowngrade)}`, BASE_X, y += 0.4, downgradeStyle);
	}
};

mod.highlightWeakest = function(room, type) {
	const vis = new RoomVisual(room.name);
	let weakest = _(room.find(FIND_STRUCTURES)).filter(s => s.structureType === type).min(s => s.hits);
	if (weakest) {
		vis.circle(weakest.pos.x, weakest.pos.y, {radius: 0.4, fill: '#FF0000', opacity: 0.3, strokeWidth: 0,});
		vis.text(`H: ${formatNum(weakest.hits)} (${(weakest.hits / weakest.hitsMax * 100).toFixed(2)}%)`, weakest.pos.x + 1, weakest.pos.y - 0.5, {align: 'left', size: 0.4,});
	}
};

function formatNum(n) {
	if (n >= 1000000) {
		return (n / 1000000).toFixed(2) + 'M';
	} else if (n >= 1000) {
		return (n / 1000).toFixed(1) + 'K';
	}
	return n;
}