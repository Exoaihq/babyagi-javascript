let result = execution_agent(OBJECTIVE, task["task_name"]);
let this_task_id = parseInt(task["task_id"]);
console.log("\x1b[93m\x1b[1m" + "\n*****TASK RESULT*****\n" + "\x1b[0m\x1b[0m");
console.log(result);

// Step 2: Enrich result and store in Pinecone
let enriched_result = { 'data': result }; // This is where you should enrich the result if needed
let result_id = `result_${task['task_id']}`;
let vector = enriched_result['data']; // extract the actual result from the dictionary
index.upsert([(result_id, get_ada_embedding(vector), { "task": task['task_name'], "result": result })]);

// Step 3: Create new tasks and reprioritize task list
let new_tasks = task_creation_agent(OBJECTIVE, enriched_result, task["task_name"], task_list.map(t => t["task_name"]));

for (let new_task of new_tasks) {
    task_id_counter += 1;
    new_task["task_id"] = task_id_counter;
    add_task(new_task);
}
prioritization_agent(this_task_id);

setTimeout(() => {
    // Sleep before checking the task list again
}, 1000);