const tasksStorage = new TasksStorage();
const resultsStorage = new ResultsStorage();

const OBJECTIVE = "Perform a series of tasks";
const INITIAL_TASK = "Task 1";
const JOIN_EXISTING_OBJECTIVE = false;

function openaiCall(prompt, maxTokens) {
  // Implement your OpenAI API call here
}

function executionAgent(objective, task) {
  const context = resultsStorage.getRelevantContext(task);
  let prompt = `Perform one task based on the following objective: ${objective}.\n`;
  if (context) {
    prompt += 'Take into account these previously completed tasks:' + context.join('\n');
  }
  prompt += `\nYour task: ${task}\nResponse:`;
  return openaiCall(prompt, 2000);
}

function contextAgent(query, topResultsNum) {
  const results = resultsStorage.query(query, topResultsNum);
  return results;
}

if (!JOIN_EXISTING_OBJECTIVE) {
  const initialTask = {
    task_id: tasksStorage.nextTaskId(),
    task_name: INITIAL_TASK,
  };
  tasksStorage.append(initialTask);
}

function main() {
  let loop = true;
  while (loop) {
    if (!tasksStorage.isEmpty()) {
      console.log("\n*****TASK LIST*****\n");
      for (const t of tasksStorage.getTaskNames()) {
        console.log(" • " + t);
      }

      const task = tasksStorage.popleft();
      console.log("\n*****NEXT TASK*****\n");
      console.log(task.task_name);

      const result = executionAgent(OBJECTIVE, task.task_name);
      console.log("\n*****TASK RESULT*****\n");
      console.log(result);

      const enrichedResult = {
        data: result,
      };

      const resultId = `result_${task.task_id}`;

      resultsStorage.add(task, result, resultId);

      const newTasks = taskCreationAgent(
        OBJECTIVE,
        enrichedResult,
        task.task_name,
        tasksStorage.getTaskNames(),
      );

      console.log('Adding new tasks to task_storage');
      for (const newTask of newTasks) {
        newTask.task_id = tasksStorage.nextTaskId();
        console.log(newTask);
        tasksStorage.append(newTask);
      }

      if (!JOIN_EXISTING_OBJECTIVE) {
        const prioritizedTasks = prioritizationAgent();
        if (prioritizedTasks) {
          tasksStorage.replace(prioritizedTasks);
        }
      }

      setTimeout(() => {}, 5000);
    } else {
      console.log('Done.');
      loop = false;
    }
  }
}

main();