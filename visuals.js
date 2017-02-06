const mod = {};
module.exports = mod;

mod.run = function() {
	for (let roomName in Game.rooms) {
		const room = Game.rooms[roomName];
		if (!room.my) continue; // Skip rooms not owned by you
		
		if (VISUALS.ROOM) {
			mod.drawRoomInfo(room, VISUALS.ROOM_GLOBAL);
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
	vis.text(`Used: ${Game.cpu.getUsed()}`, 2, ++line, {align: 'left',});
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
		vis.text(`Amount: ${mineral.mineralAmount}`, x, y, {align: 'left', size: 0.4,});
	} else {
		vis.text(`Regen: ${mineral.ticksToRegeneration}`, x, y, {align: 'left', size: 0.4,});
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