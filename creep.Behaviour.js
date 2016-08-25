var Behaviour = function(typeName){
    this.name = typeName;
    this.run = function(creep) {
        // Assign next Action
        if( creep.action == null ) {
            this.nextAction(creep);
        }
        // Do some work
        if( creep.action && creep.target ) {
            creep.action.step(creep);
        }
        // TODO: Else Alert
    };
    this.nextAction = function(creep){};
}
module.exports = Behaviour;