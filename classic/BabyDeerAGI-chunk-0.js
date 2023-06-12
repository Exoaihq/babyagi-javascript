function getTaskById(taskId) {
  for (let task of taskList) {
    if (task.id === taskId) {
      return task;
    }
  }
  return null;
}

function printTasklist() {
  let pTasklist = "\033[95m\033[1m" + "\n*****TASK LIST*****\n" + "\033[0m";
  for (let t of taskList) {
    let dependentTask = "";
    if (t.dependentTaskIds.length > 0) {
      dependentTask = `\033[31m<dependencies: ${t.dependentTaskIds.map(depId => `#${depId}`).join(', ')}>\033[0m`;
    }
    let statusColor = t.status === "complete" ? "\033[32m" : "\033[31m";
    pTasklist += `\033[1m${t.id}\033[0m: ${t.task} ${statusColor}[${t.status}]\033[0m \033[93m[${t.tool}] ${dependentTask}\033[0m\n`;
  }
  console.log(pTasklist);
}

function textCompletionTool(prompt) {
  // You will need to implement this function using an appropriate JavaScript library for OpenAI API
}

function userInputTool(prompt) {
  let val = prompt(`\n${prompt}\nYour response: `);
  return String(val);
}

function webSearchTool(query, dependentTasksOutput) {
  // You will need to implement this function using an appropriate JavaScript library for SerpAPI
}

function simplifySearchResults(searchResults) {
  let simplifiedResults = [];
  for (let result of searchResults) {
    let simplifiedResult = {
      "position": result.get("position"),
      "title": result.get("title"),
      "link": result.get("link")
    };
    simplifiedResults.push(simplifiedResult);
  }
  return simplifiedResults;
}