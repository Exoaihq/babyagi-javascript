function updateTaskList(current_task_id) {
    let original_task_list = task_list.slice();
    let minified_task_list = original_task_list.map(task => {
        let newTask = {};
        for (let key in task) {
            if (key !== "result") {
                newTask[key] = task[key];
            }
        }
        return newTask;
    });

    let result = result.slice(0, 4000);

    let prompt = (
        // ... (the same prompt text as in the original Python code)
    );

    console.log("\x1b[90m\x1b[3m" + "\nRunning task manager agent...\n" + "\x1b[0m");

    // You'll need to use a JavaScript library or API client to make the API call here
    // For example, using the OpenAI JavaScript library:
    // https://github.com/openai/openai-node

    // Extract the content of the assistant's response and parse it as JSON
    let result = response.choices[0].message.content;
    console.log("\x1b[90m\x1b[3m" + "\nDone!\n" + "\x1b[0m");

    try {
        task_list = JSON.parse(result);
    } catch (error) {
        console.log(error);
    }

    // Add the 'result' field back in
    for (let i = 0; i < task_list.length; i++) {
        if ("result" in original_task_list[i]) {
            task_list[i]["result"] = original_task_list[i]["result"];
        }
    }
    task_list[current_task_id]["result"] = result;

    return task_list;
}

function summarizerAgent(text) {
    text = text.slice(0, 4000);

    let prompt = `Please summarize the following text:\n${text}\nSummary:`;

    // You'll need to use a JavaScript library or API client to make the API call here
    // For example, using the OpenAI JavaScript library:
    // https://github.com/openai/openai-node

    return response.choices[0].text.trim();
}

function overviewAgent(last_task_id) {
    let completed_tasks = getCompletedTasks();
    let completed_tasks_text = completed_tasks.map(task => `${task.id}. ${task.task} - ${task.result_summary}`).join("\n");

    let prompt = `Here is the current session summary:\n${session_summary}\nThe last completed task is task ${last_task_id}. Please update the session summary with the information of the last task:\n${completed_tasks_text}\nUpdated session summary, which should describe all tasks in chronological order:`;

    // You'll need to use a JavaScript library or API client to make the API call here
    // For example, using the OpenAI JavaScript library:
    // https://github.com/openai/openai-node

    return response.choices[0].text.trim();
}