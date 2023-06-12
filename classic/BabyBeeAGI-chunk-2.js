const axios = require("axios");

let taskList = [];
let sessionSummary = "";

const OBJECTIVE = "YOUR_OBJECTIVE";
const YOUR_FIRST_TASK = "YOUR_FIRST_TASK_DESCRIPTION";

function addTask(task) {
  taskList.push(task);
}

async function executeTask(task, taskList, OBJECTIVE) {
  const taskId = task.id;
  const taskTool = task.tool;

  if (taskTool === "text-completion") {
    const prompt = `Objective: ${OBJECTIVE}\n\nTask ID: ${taskId}\nTask: ${task.task}\n\n${sessionSummary}\nUpdated session summary, which should describe all tasks in chronological order:`;
    const response = await axios.post("https://api.openai.com/v1/engines/text-davinci-003/completions", {
      prompt: prompt,
      temperature: 0.5,
      max_tokens: 200,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0
    });
    sessionSummary = response.data.choices[0].text.trim();
  }
}

const firstTask = {
  id: 1,
  task: YOUR_FIRST_TASK,
  tool: "text-completion",
  dependent_task_id: null,
  status: "incomplete",
  result: "",
  result_summary: ""
};
addTask(firstTask);

let task_id_counter = 0;

console.log("\033[96m\033[1m" + "\n*****OBJECTIVE*****\n" + "\033[0m\033[0m");
console.log(OBJECTIVE);

(async () => {
  while (taskList.some(task => task.status === "incomplete")) {
    const incompleteTasks = taskList.filter(task => task.status === "incomplete");

    if (incompleteTasks.length > 0) {
      incompleteTasks.sort((a, b) => a.id - b.id);

      const task = incompleteTasks[0];

      await executeTask(task, taskList, OBJECTIVE);

      console.log("\033[95m\033[1m" + "\n*****TASK LIST*****\n" + "\033[0m");
      for (const t of taskList) {
        const dependentTask = t.dependent_task_id !== null ? `\033[31m<dependency: #${t.dependent_task_id}>\033[0m` : "";
        const statusColor = t.status === "complete" ? "\033[32m" : "\033[31m";
        console.log(`\033[1m${t.id}\033[0m: ${t.task} ${statusColor}[${t.status}]\033[0m \033[93m[${t.tool}] ${dependentTask}\033[0m`);
      }
      console.log("\033[93m\033[1m" + "\n*****SESSION SUMMARY*****\n" + "\033[0m\033[0m");
      console.log(sessionSummary);
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  if (taskList.every(task => task.status !== "incomplete")) {
    console.log("\033[92m\033[1m" + "\n*****ALL TASKS COMPLETED*****\n" + "\033[0m\033[0m");
    for (const task of taskList) {
      console.log(`ID: ${task.id}, Task: ${task.task}, Result: ${task.result}`);
    }
  }
})();