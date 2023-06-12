const openai = require("openai");
const pinecone = require("pinecone");
const time = require("time");
const requests = require("requests");
const { BeautifulSoup } = require("beautifulsoup4");
const { deque } = require("collections");
const { Dict, List } = require("typing");
const re = require("re");
const ast = require("ast");
const json = require("json");
const { GoogleSearch } = require("serpapi");

// Set variables
const OPENAI_API_KEY = "";
const SERPAPI_API_KEY = "";

// Configure OpenAI and SerpAPI client
openai.api_key = OPENAI_API_KEY;
const serpapi_client = new GoogleSearch({ api_key: SERPAPI_API_KEY });
const websearch_var = SERPAPI_API_KEY ? "[web-search] " : "";

// Initialize task list
const task_list = [];

// Initialize session_summary
let session_summary = "";

// Task list functions
function add_task(task) {
  task_list.push(task);
}

function get_task_by_id(task_id) {
  for (const task of task_list) {
    if (task.id === task_id) {
      return task;
    }
  }
  return null;
}

function get_completed_tasks() {
  return task_list.filter(task => task.status === "complete");
}

// Tool functions
function text_completion_tool(prompt) {
  return openai.Completion.create({
    engine: "text-davinci-003",
    prompt: prompt,
    temperature: 0.5,
    max_tokens: 1500,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0
  }).then(response => response.choices[0].text.trim());
}

function web_search_tool(query) {
  const search_params = {
    engine: "google",
    q: query,
    api_key: SERPAPI_API_KEY,
    num: 3
  };
  const search_results = new GoogleSearch(search_params);
  const results = search_results.get_dict();

  return JSON.stringify(results.organic_results);
}

function web_scrape_tool(url) {
  const response = requests.get(url);
  const soup = new BeautifulSoup(response.content, "html.parser");
  let result = soup.get_text({ strip: true }) + "URLs: ";
  for (const link of soup.findAll('a', { href: re.compile("^https://") })) {
    result += link.get('href') + ", ";
  }
  return result;
}

// Agent functions
function execute_task(task, task_list, OBJECTIVE) {
  // Check if dependent_task_id is complete
  if (task.dependent_task_id) {
    const dependent_task = get_task_by_id(task.dependent_task_id);
    if (!dependent_task || dependent_task.status !== "complete") {
      return;
    }
  }

  // Execute task
  console.log("\x1b[92m\x1b[1m\n*****NEXT TASK*****\n\x1b[0m\x1b[0m");
  console.log(`${task.id}: ${task.task} [${task.tool}]`);
  let task_prompt = `Complete your assigned task based on the objective: ${OBJECTIVE}. Your task: ${task.task}`;
  if (task.dependent_task_id) {
    const dependent_task_result = dependent_task.result;
    task_prompt += `\nThe previous task (${dependent_task.id}. ${dependent_task.task}) result: ${dependent_task_result}`;
  }

  task_prompt += "\nResponse:";
  let result;
  if (task.tool === "text-completion") {
    result = await text_completion_tool(task_prompt);
  } else if (task.tool === "web-search") {
    result = web_search_tool(task_prompt);
  } else if (task.tool === "web-scrape") {
    result = web_scrape_tool(task.task);
  } else {
    result = "Unknown tool";
  }

  console.log("\x1b[93m\x1b[1m\n*****TASK RESULT*****\n\x1b[0m\x1b[0m");
  const print_result = result.slice(0, 2000);
  if (result !== print_result) {
    console.log(`${print_result}...`);
  } else {
    console.log(result);
  }

  // Update task status and result
  task.status = "complete";
  task.result = result;
  task.result_summary = summarizer_agent(result);

  // Update session_summary
  session_summary = overview_agent(task.id);

  // Increment task_id_counter
  task_id_counter += 1;

  // Update task_manager_agent of tasks
  task_manager_agent(
    OBJECTIVE,
    result,
    task.task,
    task_list.filter(t => t.status === "incomplete").map(t => t.task),
    task.id
  );
}

function task_manager_agent(objective, result, task_description, incomplete_tasks, current_task_id) {
  const original_task_list = task_list.slice();
  const minified_task_list = task_list.map(task => {
    const newTask = {};
    for (const key in task) {
      if (key !== "result") {
        newTask[key] = task[key];
      }
    }
    return newTask;
  });
}