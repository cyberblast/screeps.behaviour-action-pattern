var mod = {
    load: function(){
        var state = {
            minBuildEnergy: 200, 
            maxSpawnCount: 13,
            partCost: {
                work: 100,
                carry: 50,
                move: 50
            },
            roomId: [],
            rooms: [], 
            memory: Memory
        };

        // load rooms
        for(var iRoom in Game.rooms){
            var room = Game.rooms[iRoom];
            state.roomId.push(room.name);

            var roomState = {
                name: room.name,
                constructionSiteId: [], 
                constructionSites: {},
                repairableSiteId: [],
                repairableSites: {},
                sourceId:[], 
                sources:{},
                creepId: [],
                creepSetup: {
                },
                creepAction: {
                },
                creepActionRequirement: {
                    storing: 100, 
                    building: 100, 
                    upgrading: 100
                },
                missingEnergyQuote: 100, 
                nonHarvestingWorkers: 0, 
                ticksToDowngrade: 0
            };

            // load construction sites
            room.find(FIND_CONSTRUCTION_SITES).forEach(function(site){
                roomState.constructionSiteId.push(site.id);
                roomState.constructionSites[site.id] = {
                    id: site.id, 
                    creeps: [], 
                    maxCreeps: 1, 
                    completion: site.progress*100 / site.progressTotal
                };
            });

            // load damages structures
            room.find(FIND_STRUCTURES, {
                filter: (structure) => structure.hits < structure.hitsMax
            }).forEach(function(site){
                    roomState.repairableSiteId.push(site.id);
                    roomState.repairableSites[site.id] = {
                        id: site.id, 
                        creeps: [], 
                        maxCreeps: 1, 
                        damage: (1- (site.hits/site.hitsMax))*100
                    };
                }
            );
            
            // load sources
            room.find(FIND_SOURCES).forEach(
                function(source){
                    roomState.sourceId.push(source.id);
                    roomState.sources[source.id] = {
                        id: source.id, 
                        creeps: [], 
                        maxCreeps: 5, 
                        energy: source.energy
                    };
                }
            );
            
            // load creeps
            var memCreeps = state.memory.creeps;
            for (var name in memCreeps) {
                // clean memory for died creep
                var creep = Game.creeps[name];
                if (!creep) {
                    console.log('Clearing non-existing creep memory:', name);
                    delete Memory.creeps[name];
                } else {
                    // bug @ createCreep Workaround
                    //if (!memCreeps[creep.name].id) //creep.memory.id)
                    //    creep.memory.id = creep.id; 
                    roomState.creepId.push(creep.id);

                    var setup = memCreeps[creep.name].setup;
                    if( roomState.creepSetup[setup]) {
                        roomState.creepSetup[setup]++;
                    } else roomState.creepSetup[setup] = 1;

                    var action = memCreeps[creep.name].action;
                    if( action != null) {
                        if( roomState.creepAction[action]) {
                            roomState.creepAction[action]++;
                        } else roomState.creepAction[action] = 1;
                    } 
                    if( setup == "worker" && action != "harvesting")
                        roomState.nonHarvestingWorkers++;
                    
                    var creepTarget = memCreeps[creep.name].target;
                    var creepTargetType = memCreeps[creep.name].targetType;
                    if( creepTarget && creepTargetType ){
                        if( setup == "worker") {

                            if( action == "harvesting" && creepTargetType == "source" )
                                roomState.sources[creepTarget].creeps.push(creep.id);

                            else if( action == "building"){
                                if( creepTargetType == "constructionSite" )
                                    roomState.constructionSites[creepTarget].creeps.push(creep.id);
                                else if( creepTargetType == "repairableSite" )
                                    roomState.repairableSites[creepTarget].creeps.push(creep.id);
                            }
                        }
                    }
                }
            }

            // load attributes
            roomState.missingEnergyQuote = (1- (room.energyAvailable/room.energyCapacityAvailable))*100;
            roomState.ticksToDowngrade = room.controller.ticksToDowngrade;

            state.rooms[iRoom] = this.setActionRequirement(roomState);
        }
        return state;
    },
    setActionRequirement: function(roomState){

        roomState.creepActionRequirement.storing = roomState.creepAction.storing && roomState.nonHarvestingWorkers > 0 ? 
            roomState.missingEnergyQuote / (roomState.creepAction.storing / roomState.nonHarvestingWorkers) : 
            100;

        roomState.creepActionRequirement.building = roomState.creepAction.building ? 
            (roomState.constructionSiteId.length + roomState.repairableSiteId.length - roomState.creepAction.building)*100 / roomState.creepId.length : 
            100;
            
        roomState.creepActionRequirement.upgrading = roomState.creepAction.upgrading && roomState.nonHarvestingWorkers > 0 && roomState.ticksToDowngrade > 0 ? 
            (1 - (roomState.ticksToDowngrade/50000))*100 : 
            100;
        return roomState;
    }
}

module.exports = mod;