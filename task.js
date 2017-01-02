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
    },
    memory: (task, s) => { // task:  (string) name of the task, s: (string) any selector for that task, could be room name, flag name, enemy name
        if( !Memory.tasks ) Memory.tasks = {};
        if( !Memory.tasks[task] ) Memory.tasks[task] = {};
        if( !Memory.tasks[task][s] ) Memory.tasks[task][s] = {};
        return Memory.tasks[task][s];
    }
};
module.exports = mod;