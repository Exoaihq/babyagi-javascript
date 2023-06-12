const fs = require('fs');
const path = require('path');
const { CooperativeObjectivesListStorage } = require('../extensions/ray_objectives');
const { CooperativeTaskListStorage } = require('../extensions/ray_tasks');

function printBuffer(lines) {
    console.clear();
    for (const line of lines) {
        console.log(line);
    }
}

async function main() {
    const objectives = new CooperativeObjectivesListStorage();
    while (true) {
        const objectivesList = await objectives.getObjectiveNames();
        const buffer = [];
        if (!objectivesList.length) {
            buffer.push("No objectives");
        }
        for (const objective of objectivesList) {
            buffer.push("-----------------");
            buffer.push(`Objective: ${objective}`);
            buffer.push("-----------------");
            const tasks = new CooperativeTaskListStorage(objective);
            const tasksList = await tasks.getTaskNames();
            buffer.push("Tasks:");
            for (const t of tasksList) {
                buffer.push(` * ${t}`);
            }
            buffer.push("-----------------");
        }
        printBuffer(buffer);
        await new Promise(resolve => setTimeout(resolve, 30000));
    }
}

main();