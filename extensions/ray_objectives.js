const ray = require("ray");
const { Deque } = require("collections");

const ACTOR_NAME = "BabyAGI Objectives";

let rayConfig = {
  namespace: "babyagi",
  logging: { level: "fatal" },
  ignoreReinitError: true,
};

try {
  ray.init({ ...rayConfig, address: "auto" });
} catch {
  ray.init(rayConfig);
}

class CooperativeObjectivesListStorageActor {
  constructor() {
    this.objectives = new Deque([]);
  }

  append(objective) {
    if (!this.objectives.contains(objective)) {
      this.objectives.push(objective);
    }
  }

  isEmpty() {
    return this.objectives.length === 0;
  }

  getObjectiveNames() {
    return this.objectives.toArray();
  }
}

class CooperativeObjectivesListStorage {
  constructor() {
    try {
      this.actor = ray.getActor({ name: ACTOR_NAME, namespace: "babyagi" });
    } catch (error) {
      this.actor = new CooperativeObjectivesListStorageActor();
      ray.registerActor({
        name: ACTOR_NAME,
        namespace: "babyagi",
        lifetime: "detached",
        actor: this.actor,
      });
    }
  }

  append(objective) {
    this.actor.append(objective);
  }

  isEmpty() {
    return this.actor.isEmpty();
  }

  getObjectiveNames() {
    return this.actor.getObjectiveNames();
  }
}