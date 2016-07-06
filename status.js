var mod = {
    load: function(){
        var state = {
            debug: true,
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
            room.id = room.name;

            var roomState = {
                name: room.name,
                minCreepSize: room.energyCapacityAvailable/2,
                maxWorkerCount: 15, // TODO: Ermitteln aus Konstante + Anzahl Sourcen + zerfallende Strukturen + unfertige Strukturen
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
                    storing: 50, 
                    building: 50, 
                    upgrading: 50
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
                    maxCreeps: 4, 
                    completion: site.progress*100 / site.progressTotal
                };
            });

            // load repairable structures
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
                creep.id = creep.name;
                if (!creep) {
                    console.log('Clearing non-existing creep memory:', name);
                    delete Memory.creeps[name];
                } else {
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
                    //var creepTargetType = memCreeps[creep.name].targetType;
                    if( creepTarget ){//&& creepTargetType ){
                        if( setup == "worker") {
                            // TODO: Hier nötig oder wird das in der Action gemacht?

                            if( action == "harvesting" && roomState.sources[creepTarget])
                                roomState.sources[creepTarget].creeps.push(creep.id);

                            else if( action == "building" && roomState.constructionSites[creepTarget] )
                                roomState.constructionSites[creepTarget].creeps.push(creep.id);
                            
                            else if( action == "repairing" && roomState.repairableSites[creepTarget] )
                                roomState.repairableSites[creepTarget].creeps.push(creep.id);
                            }
                        }
                    }
                }
            }

            // load attributes
            // TODO: Mehr einzelne var machen - macht die formeln lesbarer
            roomState.missingEnergyQuote = (1- (room.energyAvailable/room.energyCapacityAvailable))*100;
            roomState.ticksToDowngrade = room.controller.ticksToDowngrade;

            // Storing
            roomState.creepActionRequirement.storing = room.energyAvailable < roomState.minCreepSize ? 90 : 
                (roomState.creepAction.storing && roomState.nonHarvestingWorkers > 0 ? 
                    roomState.missingEnergyQuote / (roomState.creepAction.storing / roomState.nonHarvestingWorkers) : 
                    roomState.missingEnergyQuote);

            // Building
            roomState.creepActionRequirement.building = roomState.creepId.length > 0 ? 
                (roomState.constructionSiteId.length + roomState.repairableSiteId.length - (roomState.creepAction.building ? roomState.creepAction.building : 0))*100 / roomState.creepId.length : 
                50;
            if( roomState.creepActionRequirement.building > 80 ) roomState.creepActionRequirement.building = 80;
            // TODO: Repairing

            // TODO: Fueling //Tower Loading
            
            // Upgrading
            roomState.creepActionRequirement.upgrading = (1 - (roomState.ticksToDowngrade/50000))*100;

            state.rooms[iRoom] = roomState;
        }
        return state;
    }
}

module.exports = mod;