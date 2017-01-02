var mod = {
    // load all task modules
    guard: load("task.guard"),
    // register tasks (hook up into events)
    register: function () {
        let tasks = [
            Task.guard
        ];
        var loop = task => {
            task.register();
        }
        _.forEach(tasks, loop);
    }
};
module.exports = mod;