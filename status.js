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
            //room.id = room.name;

            var roomState = {
                name: room.name,
                minCreepSize: room.energyCapacityAvailable/2,
                maxWorkerCount: 11, // TODO: Ermitteln aus Konstante + Anzahl Sourcen + zerfallende Strukturen + unfertige Strukturen ODER Historie 'crowded source' vs 'freie Plätze an Sources'
                constructionSiteId: [], 
                constructionSites: {},
                repairableSiteIdPrio: [],
                repairableSitesPrio: {},
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
                    upgrading: 50, 
                    repairing: 50
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


            var prio = [STRUCTURE_SPAWN,STRUCTURE_EXTENSION,STRUCTURE_ROAD,STRUCTURE_CONTROLLER];    
            // load repairable structures
            room.find(FIND_STRUCTURES, {
                filter: (structure) => structure.hits < structure.hitsMax*0.5
            }).forEach(function(site){
                    if( prio.includes(site.structureType) ){
                        roomState.repairableSiteIdPrio.push(site.id);
                        roomState.repairableSitesPrio[site.id] = {
                            id: site.id, 
                            creeps: [], 
                            maxCreeps: 1, 
                            damage: (1- (site.hits/site.hitsMax))*100
                        };
                    } else {
                        roomState.repairableSiteId.push(site.id);
                        roomState.repairableSites[site.id] = {
                            id: site.id, 
                            creeps: [], 
                            maxCreeps: 1, 
                            damage: (1- (site.hits/site.hitsMax))*100
                        };
                    }
                }
            );
            
            // load sources
            room.find(FIND_SOURCES).forEach(
                function(source){
                    roomState.sourceId.push(source.id);
                    roomState.sources[source.id] = {
                        id: source.id, 
                        creeps: [], 
                        maxCreeps: (source.id == '' ? 2 : 6), // TODO: Anhand der Anzahl der offenen Felder (kein Fels) um die Source bestimmen (-> Memory) 
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
                    console.log(room.name + ' > Goodbye',name);
                    delete Memory.creeps[name];
                } else {
                    //creep.id = creep.name;
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
                            // TODO: Hier noetig oder wird das in der Action gemacht?
                            // TODO: Vielleicht einfach nur Object ID und darauf registrierte creeps => generischer

                            if( action == "harvesting" && roomState.sources[creepTarget])
                                roomState.sources[creepTarget].creeps.push(creep.id);

                            else if( action == "building" && roomState.constructionSites[creepTarget] )
                                roomState.constructionSites[creepTarget].creeps.push(creep.id);
                            
                            else if( action == "repairing" && roomState.repairableSites[creepTarget] )
                                roomState.repairableSites[creepTarget].creeps.push(creep.id);
                            else if( action == "repairing" && roomState.repairableSitesPrio[creepTarget] )
                                roomState.repairableSitesPrio[creepTarget].creeps.push(creep.id);
                        }
                    }
                }
            }
        }
        
        roomState.minCreepSize *= this.bender(0.75, (roomState.creepId.length/roomState.maxWorkerCount), -0.125);

        // load attributes
        // TODO: Mehr einzelne var machen - macht die formeln lesbarer
        
        var towerEnergy = 0;
        var towerCapacity = 0;
        var towers = room.find(
        FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_TOWER}});
        towers.forEach(tower => {towerEnergy += tower.energy; towerCapacity += energyCapacity;});
        
        roomState.missingEnergyQuote = (1- ((room.energyAvailable+towerEnergy)/(room.energyCapacityAvailable+towerCapacity)))*100;
        roomState.missingEnergy = (room.energyCapacityAvailable+towerCapacity) - (room.energyAvailable+towerEnergy);
        //roomState.missingEnergyQuote = (1- (room.energyAvailable/room.energyCapacityAvailable))*100;
        roomState.ticksToDowngrade = room.controller.ticksToDowngrade;
        var storerQuote;
        var builderQuote;
        var upgraderQuote;
        var repairerQuote;
        if( roomState.nonHarvestingWorkers == 0 ) {
            upgraderQuote = 0;
            builderQuote = 0;
            storerQuote = 0;
            repairerQuote = 0;
        } else {
            storerQuote = (roomState.creepAction.building ? roomState.creepAction.building : 0)/roomState.nonHarvestingWorkers;
            builderQuote = (roomState.creepAction.repairing ? roomState.creepAction.repairing : 0)/roomState.nonHarvestingWorkers;
            upgraderQuote = (roomState.creepAction.upgrading ? roomState.creepAction.upgrading : 0)/roomState.nonHarvestingWorkers;
            repairerQuote = (roomState.creepAction.repairing ? roomState.creepAction.repairing : 0)/roomState.nonHarvestingWorkers;
        }

        // Storing
        roomState.creepActionRequirement.storing = room.energyAvailable < roomState.minCreepSize || room.energyAvailable < 200 ? 90 : // 90 until min filling reached 
                roomState.missingEnergyQuote * this.bender(0.2, (1-storerQuote));

        // Building       
        var constructionSiteCountQuote = roomState.constructionSiteId.length / 10;
        constructionSiteCountQuote = constructionSiteCountQuote > 1 ? 1 : constructionSiteCountQuote;
        roomState.creepActionRequirement.building = 
            roomState.constructionSiteId.length > 0 ? 40 + (1 - builderQuote) * 28 * this.bender(0.5, constructionSiteCountQuote, -0.3): 0;
        
        // Repairing       
        var reparationSiteCountQuote = (roomState.repairableSiteId.length/4)+roomState.repairableSiteIdPrio.length / 10;
        reparationSiteCountQuote = reparationSiteCountQuote > 1 ? 1 : reparationSiteCountQuote;
        roomState.creepActionRequirement.repairing = roomState.repairableSiteId.length+roomState.repairableSiteIdPrio.length > 0 ? 35 + (1 - builderQuote) * 28 * this.bender(0.2, reparationSiteCountQuote, -0.2): 0;

        // TODO: Fueling //Tower Loading
        
        // Upgrading
        roomState.creepActionRequirement.upgrading = (25 + ((1 - (roomState.ticksToDowngrade/50000))*75) ) * this.bender(0.2, (1-upgraderQuote));

        //if(state.debug) console.log(room.name + ' > Population: ' + JSON.stringify(roomState.creepAction));
        //if(state.debug) console.log(room.name + ' > New Wishlist: ' + JSON.stringify(roomState.creepActionRequirement));
        //if(state.debug) console.log(room.name + ' > Damaged buildings (important/other): ' + roomState.repairableSiteIdPrio.length + ' / ' + roomState.repairableSiteId.length);
        
        
        state.rooms[iRoom] = roomState;
        return state;
    }, 

    bender: function(deviation, quote, shift = 0){
        return (1-deviation) + (quote * deviation * 2) + shift;
    }
}

module.exports = mod;