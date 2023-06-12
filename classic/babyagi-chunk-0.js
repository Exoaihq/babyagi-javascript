const openai = require("openai");
const pinecone = require("pinecone-node");
const { Deque } = require("collections");

// Set API Keys
const OPENAI_API_KEY = "";
const PINECONE_API_KEY = "";
const PINECONE_ENVIRONMENT = "us-east1-gcp"; // Pinecone Environment (eg. "us-east1-gcp")

// Set Variables
const YOUR_TABLE_NAME = "test-table";
const OBJECTIVE = "Solve world hunger.";
const YOUR_FIRST_TASK = "Develop a task list.";

// Print OBJECTIVE
console.log("\x1b[96m\x1b[1m" + "\n*****OBJECTIVE*****\n" + "\x1b[0m\x1b[0m");
console.log(OBJECTIVE);

// Configure OpenAI and Pinecone
openai.api_key = OPENAI_API_KEY;
pinecone.init(PINECONE_API_KEY, PINECONE_ENVIRONMENT);

// Create Pinecone index
const table_name = YOUR_TABLE_NAME;
const dimension = 1536;
const metric = "cosine";
const pod_type = "p1";
if (!pinecone.listIndexes().includes(table_name)) {
  pinecone.createIndex(table_name, dimension, metric, pod_type);
}

// Connect to the index
const index = pinecone.Index(table_name);

// Task list
const task_list = new Deque([]);

function add_task(task) {
  task_list.push(task);
}

async function get_ada_embedding(text) {
  text = text.replace("\n", " ");
  const response = await openai.Embedding.create({ input: [text], model: "text-embedding-ada-002" });
  return response.data[0].embedding;
}

async function task_creation_agent(objective, result, task_description, task_list) {
  const prompt = `You are an task creation AI that uses the result of an execution agent to create new tasks with the following objective: ${objective}, The last completed task has the result: ${result}. This result was based on this task description: ${task_description}. These are incomplete tasks: ${task_list.join(', ')}. Based on the result, create new tasks to be completed by the AI system that do not overlap with incomplete tasks. Return the tasks as an array.`;
  const response = await openai.Completion.create({ engine: "text-davinci-003", prompt, temperature: 0.5, max_tokens: 100, top_p: 1, frequency_penalty: 0, presence_penalty: 0 });
  const new_tasks = response.choices[0].text.trim().split('\n');
  return new_tasks.map(task_name => ({ task_name }));
}

async function prioritization_agent(this_task_id) {
  const task_names = task_list.map(t => t.task_name);
  const next_task_id = this_task_id + 1;
  const prompt = `You are an task prioritization AI tasked with cleaning the formatting of and reprioritizing the following tasks: ${task_names}. Consider the ultimate objective of your team:${OBJECTIVE}. Do not remove any tasks. Return the result as a numbered list, like:
  #. First task
  #. Second task
  Start the task list with number ${next_task_id}.`;
  const response = await openai.Completion.create({ engine: "text-davinci-003", prompt, temperature: 0.5, max_tokens: 1000, top_p: 1, frequency_penalty: 0, presence_penalty: 0 });
  const new_tasks = response.choices[0].text.trim().split('\n');
  task_list.clear();
  new_tasks.forEach(task_string => {
    const task_parts = task_string.trim().split(".", 1);
    if (task_parts.length === 2) {
      const task_id = task_parts[0].trim();
      const task_name = task_parts[1].trim();
      task_list.push({ task_id, task_name });
    }
  });
}

async function execution_agent(objective, task) {
  const context = await context_agent(YOUR_TABLE_NAME, objective, 5);
  const response = await openai.Completion.create({
    engine: "text-davinci-003",
    prompt: `You are an AI who performs one task based on the following objective: ${objective}. Your task: ${task}\nResponse:`,
    temperature: 0.7,
    max_tokens: 2000,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0
  });
  return response.choices[0].text.trim();
}

async function context_agent(query, index, n) {
  const query_embedding = await get_ada_embedding(query);
  const indexInstance = pinecone.Index(index);
  const results = await indexInstance.query(query_embedding, { top_k: n, include_metadata: true });
  const sorted_results = results.matches.sort((a, b) => b.score - a.score);
  return sorted_results.map(item => item.metadata.task);
}

// Add the first task
const first_task = {
  task_id: 1,
  task_name: YOUR_FIRST_TASK
};

add_task(first_task);

// Main loop
let task_id_counter = 1;
(async function mainLoop() {
  while (true) {
    if (task_list.length > 0) {
      // Print the task list
      console.log("\x1b[95m\x1b[1m" + "\n*****TASK LIST*****\n" + "\x1b[0m\x1b[0m");
      task_list.forEach(t => console.log(`${t.task_id}: ${t.task_name}`));

      // Step 1: Pull the first task
      const task = task_list.shift();
      console.log("\x1b[92m\x1b[1m" + "\n*****NEXT TASK*****\n" + "\x1b[0m\x1b[0m");
      console.log(`${task.task_id}: ${task.task_name}`);

      // Send to execution function to complete the task based on the context
      const result = await execution_agent(OBJECTIVE, task.task_name);
      const this_task_id = parseInt(task.task_id);
      console.log("\x1b[93m\x1b[1m" + "\n*****TASK RESULT*****\n" + "\x1b[0m\x1b[0m");
      console.log(result);

      // Step 2: Create new tasks based on the result
      const new_tasks = await task_creation_agent(OBJECTIVE, result, task.task_name, task_list.map(t => t.task_name));
      new_tasks.forEach(add_task);

      // Step 3: Prioritize tasks
      await prioritization_agent(this_task_id);
    }

    // Sleep for a while
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
})();