const ray = require("ray");
const path = require("path");
const logging = require("logging");

ray.init({
  address: "auto",
  namespace: "babyagi",
  loggingLevel: logging.FATAL,
  ignoreReinitError: true
}).catch(() => {
  ray.init({
    namespace: "babyagi",
    loggingLevel: logging.FATAL,
    ignoreReinitError: true
  });
});

const CooperativeTaskListStorageActor = ray.remote(class {
  constructor() {
    this.tasks = new Array();
    this.taskIdCounter = 0;
  }

  append(task) {
    this.tasks.push(task);
  }

  replace(tasks) {
    this.tasks = Array.from(tasks);
  }

  popleft() {
    return this.tasks.shift();
  }

  isEmpty() {
    return this.tasks.length === 0;
  }

  nextTaskId() {
    this.taskIdCounter += 1;
    return this.taskIdCounter;
  }

  getTaskNames() {
    return this.tasks.map(t => t.task_name);
  }
});

class CooperativeTaskListStorage {
  constructor(name) {
    this.name = name;

    try {
      this.actor = ray.getActor({ name: this.name, namespace: "babyagi" });
    } catch (error) {
      this.actor = CooperativeTaskListStorageActor.options({
        name: this.name,
        namespace: "babyagi",
        lifetime: "detached"
      }).remote();
    }

    const objectives = new CooperativeObjectivesListStorage();
    objectives.append(this.name);
  }

  append(task) {
    this.actor.remote("append", task);
  }

  replace(tasks) {
    this.actor.remote("replace", tasks);
  }

  async popleft() {
    return await this.actor.remote("popleft");
  }

  async isEmpty() {
    return await this.actor.remote("isEmpty");
  }

  async nextTaskId() {
    return await this.actor.remote("nextTaskId");
  }

  async getTaskNames() {
    return await this.actor.remote("getTaskNames");
  }
}

module.exports = CooperativeTaskListStorage;