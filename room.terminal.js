const mod = {};
module.exports = mod;
mod.extend = function() {
    Room.prototype.terminalBroker = function () {
        if( !this.my || !this.terminal || !this.storage ) return;
        let that = this;
        let mineral = this.mineralType;
        let transacting = false;
        let terminalFull = (this.terminal.sum / this.terminal.storeCapacity) > 0.8;
        if( this.terminal.store[mineral] >= MIN_MINERAL_SELL_AMOUNT ) {
            let orders = Game.market.getAllOrders( o => {
                if( !o.roomName ||
                    o.resourceType != mineral ||
                    o.type != 'buy' ||
                    o.amount < MIN_MINERAL_SELL_AMOUNT ) return false;

                o.range = Game.map.getRoomLinearDistance(o.roomName, that.name, true);
                o.transactionAmount = Math.min(o.amount, that.terminal.store[mineral]);
                o.transactionCost = Game.market.calcTransactionCost(
                    o.transactionAmount,
                    that.name,
                    o.roomName);
                if(o.transactionCost > that.terminal.store.energy && o.transactionAmount > MIN_MINERAL_SELL_AMOUNT) {
                    // cant afford. try min amount
                    o.transactionAmount = MIN_MINERAL_SELL_AMOUNT;
                    o.transactionCost = Game.market.calcTransactionCost(
                        o.transactionAmount,
                        that.name,
                        o.roomName);
                }

                o.credits = o.transactionAmount*o.price;
                //o.ratio = o.credits/o.transactionCost; // old formula
                //o.ratio = (o.credits-o.transactionCost)/o.transactionAmount; // best offer assuming 1e == 1 credit
                //o.ratio = o.credits/(o.transactionAmount+o.transactionCost); // best offer assuming 1e == 1 mineral
                o.ratio = (o.credits - (o.transactionCost*ENERGY_VALUE_CREDITS)) / o.transactionAmount; // best offer assuming 1e == ENERGY_VALUE_CREDITS credits

                return (
                    (terminalFull || o.ratio >= MIN_SELL_RATIO[mineral]) &&
                    //o.range <= MAX_SELL_RANGE &&
                    o.transactionCost <= that.terminal.store.energy);
            });

            if( orders.length > 0 ){
                let order = _.max(orders, 'ratio');
                let result = Game.market.deal(order.id, order.transactionAmount, that.name);
                if( DEBUG || SELL_NOTIFICATION ) logSystem(that.name, `Selling ${order.transactionAmount} ${mineral} for ${order.credits} (${order.price} ¢/${mineral}, ${order.transactionCost} e): ${translateErrorCode(result)}`);
                if( SELL_NOTIFICATION ) Game.notify( `<h2>Room ${that.name} executed an order!</h2><br/>Result: ${translateErrorCode(result)}<br/>Details:<br/>${JSON.stringify(order).replace(',',',<br/>')}` );
                transacting = result == OK;
            }
        }
        if( this.controller.level == 8 && !transacting &&
            this.storage.charge > 0.8 &&
            (this.terminal.store[mineral]||0) < 150000 &&
            this.terminal.store.energy > 55000 ){
            let requiresEnergy = room => (
                room.my &&
                //room.controller.level < 8 &&
                room.storage && room.terminal &&
                room.terminal.sum < room.terminal.storeCapacity - 50000 &&
                room.storage.sum < room.storage.storeCapacity * 0.6 &&
                !room._isReceivingEnergy
            );
            let targetRoom = _.min(_.filter(Game.rooms, requiresEnergy), 'storage.store.energy');
            if( targetRoom instanceof Room && Game.market.calcTransactionCost(50000, this.name, targetRoom.name) < (this.terminal.store.energy-50000)) {
                targetRoom._isReceivingEnergy = true;
                let response = this.terminal.send('energy', 50000, targetRoom.name, 'have fun');
                if( DEBUG ) logSystem(that.name, `Transferring 50k energy to ${targetRoom.name}: ${translateErrorCode(response)}`);
                transacting = response == OK;
            }
        }
        if ( !transacting ) {
            transacting = this.fillARoomOrder();
        }
    };
};
mod.analyze = function(room) {
    if( Game.time % MEMORY_RESYNC_INTERVAL === 0 || room.name == 'sim' ) room.terminalBroker();
};
mod.flush = function(room) {
    delete room._isReceivingEnergy;
};