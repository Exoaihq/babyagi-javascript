const openai = require("openai");

let OBJECTIVE = "Research Untapped Capital and provide a summary of their investment strategy, portfolio, and team.";
let session_summary = "";

function print_tasklist() {
    console.log("\033[96m\033[1m" + "\n*****TASK LIST*****\n" + "\033[0m\033[0m");
    console.log(JSON.stringify(task_list, null, 2));
}

async function task_creation_agent(prompt) {
    console.log("\033[90m\033[3m" + "\nInitializing...\n" + "\033[0m");
    console.log("\033[90m\033[3m" + "Analyzing objective...\n" + "\033[0m");
    console.log("\033[90m\033[3m" + "Running task creation agent...\n" + "\033[0m");
    let response = await openai.ChatCompletion.create({
        model: "gpt-4",
        messages: [
            {
                role: "system",
                content: "You are a task creation AI."
            },
            {
                role: "user",
                content: prompt
            }
        ],
        temperature: 0,
        max_tokens: 1500,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
    });

    let result = response.choices[0].message.content;
    console.log("\033[90m\033[3m" + "\nDone!\n" + "\033[0m");
    let task_list;
    try {
        task_list = JSON.parse(result);
    } catch (error) {
        console.log(error);
    }

    return task_list;
}

async function execute_task(task, task_list, OBJECTIVE) {
    // Add your task execution logic here
}

console.log("\033[96m\033[1m" + "\n*****OBJECTIVE*****\n" + "\033[0m\033[0m");
console.log(OBJECTIVE);

let task_id_counter = 1;

(async () => {
    let task_list = await task_creation_agent(OBJECTIVE);
    print_tasklist();

    while (task_list.length > 0) {
        for (let task of task_list) {
            if (task.status === "incomplete") {
                await execute_task(task, task_list, OBJECTIVE);
                print_tasklist();
                break;
            }
        }
    }

    console.log("\033[96m\033[1m" + "\n*****SESSION SUMMARY*****\n" + "\033[0m\033[0m");
    console.log(session_summary);
})();