function printColoredText(text, color) {
  const colors = {
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
    reset: "\x1b[0m",
  };

  console.log(colors[color] + text + colors.reset);
}

function printCharByChar(text, delay, maxChars) {
  let printedChars = 0;
  for (const char of text) {
    if (printedChars >= maxChars) break;
    process.stdout.write(char);
    printedChars++;
  }
  console.log();
}

function saveCodeToFile(code, filePath) {
  const fs = require("fs");
  fs.writeFileSync(filePath, code);
}

function executeCommandString(command) {
  const { execSync } = require("child_process");
  const output = execSync(command).toString();
  return output;
}

function executeCommandJson(commandJson) {
  const command = JSON.parse(commandJson).command;
  return executeCommandString(command);
}

// Example usage:

printColoredText("Hello, world!", "green");
printCharByChar("This is a test.", 0.00001, 10);

const code = 'console.log("Generated code");';
const filePath = "generatedCode.js";
saveCodeToFile(code, filePath);

const commandOutput = executeCommandString("ls");
console.log("Command output:", commandOutput);

const commandJson = '{"command": "ls"}';
const commandExecutionOutput = executeCommandJson(commandJson);
console.log("Command execution output:", commandExecutionOutput);