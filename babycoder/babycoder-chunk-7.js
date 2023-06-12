let currentDirectoryFiles = executeCommandString("ls");
let fileManagementOutput = fileManagementAgent(OBJECTIVE, taskDescription, currentDirectoryFiles, task["file_path"]);
let filePath = JSON.parse(fileManagementOutput)["file_path"];

console.log("*****FILE MANAGEMENT*****".yellow);
printCharByChar(fileManagementOutput);

// Split the code into chunks and get the relevance scores for each chunk
let codeChunks = splitCodeIntoChunks(filePath, 80);
console.log("*****ANALYZING EXISTING CODE*****".yellow);
let relevanceScores = [];
for (let chunk of codeChunks) {
    let score = codeRelevanceAgent(OBJECTIVE, taskDescription, chunk["code"]);
    relevanceScores.push(score);
}

// Select the most relevant chunk
let selectedChunk = relevanceScores.map((score, index) => [score, codeChunks[index]]).sort((a, b) => b[0] - a[0])[0][1];

// Refactor the code
let modifiedCodeOutput = codeRefactorAgent(taskDescription, selectedChunk, {contextChunks: [selectedChunk], isolatedContext: taskIsolatedContext});

// Extract the start_line and end_line of the selected chunk. This will be used to replace the code in the original file
let startLine = selectedChunk["start_line"];
let endLine = selectedChunk["end_line"];

// Count the number of lines in the modified_code_output
let modifiedCodeLines = modifiedCodeOutput.split("\n").length;
// Create an object with the necessary information for the refactorCode function
let modifiedCodeInfo = {
    "start_line": startLine,
    "end_line": startLine + modifiedCodeLines - 1,
    "modified_code": modifiedCodeOutput
};
console.log("*****REFACTORED CODE*****".green);
printCharByChar(modifiedCodeOutput);

// Save the refactored code to the file
refactorCode([modifiedCodeInfo], filePath);