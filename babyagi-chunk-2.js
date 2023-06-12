const { deque } = require("collections");

class DefaultResultsStorage {
  constructor() {
    this.results = [];
  }

  append(result) {
    this.results.push(result);
  }

  getResults() {
    return this.results;
  }
}

class SingleTaskListStorage {
  constructor() {
    this.tasks = new deque([]);
    this.task_id_counter = 0;
  }

  append(task) {
    this.tasks.push(task);
  }

  replace(tasks) {
    this.tasks = new deque(tasks);
  }

  popleft() {
    return this.tasks.shift();
  }

  isEmpty() {
    return this.tasks.length === 0;
  }

  nextTaskId() {
    this.task_id_counter += 1;
    return this.task_id_counter;
  }

  getTaskNames() {
    return this.tasks.map(t => t.task_name);
  }
}

function limitTokensFromString(string, model, limit) {
  // This function is not directly translatable to JavaScript as it relies on the tiktoken library which is Python-specific.
  // You would need to find a JavaScript equivalent library or implement your own token counting logic.
  throw new Error("Not implemented");
}

function openaiCall(prompt, model = LLM_MODEL, temperature = OPENAI_TEMPERATURE, max_tokens = 100) {
  // This function is not directly translatable to JavaScript as it relies on the OpenAI Python library.
  // You would need to use the OpenAI API directly with a JavaScript library like Axios or Fetch to make the API calls.
  throw new Error("Not implemented");
}

// Usage example:
const resultsStorage = new DefaultResultsStorage();
const tasksStorage = new SingleTaskListStorage();