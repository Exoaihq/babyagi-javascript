let tasks_submitted = false;
let task_list = [];

while (true) {
    if (!tasks_submitted) {
        for (let task of task_list) {
            if (task["status"] === "pending") {
                // Add code to submit the task
                task["status"] = "complete";
            }
        }

        tasks_submitted = task_list.every(task => task["status"] === "complete");
    }

    if (!tasks_submitted && task_list.every(task => task["status"] === "complete")) {
        break;
    }

    setTimeout(() => {}, 5000);
}

console.log("\x1b[96m\x1b[1m" + "\n*****SAVING FILE...*****\n" + "\x1b[0m\x1b[0m");
const fs = require('fs');
const date = new Date();
const fileName = `output/output_${date.getDate()}_${date.getMonth() + 1}_${date.getFullYear()}_${date.getHours()}_${date.getMinutes()}_${date.getSeconds()}.txt`;
fs.writeFileSync(fileName, session_summary);
console.log("...file saved.");
console.log("END");