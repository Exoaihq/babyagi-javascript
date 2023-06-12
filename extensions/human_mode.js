const readline = require("readline");

function userInputAwait(prompt) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    console.log("\x1b[94m\x1b[1m" + "\n> COPY FOLLOWING TEXT TO CHATBOT\n" + "\x1b[0m\x1b[0m");
    console.log(prompt);
    console.log("\x1b[91m\x1b[1m" + "\n AFTER PASTING, PRESS: (ENTER), (CTRL+Z), (ENTER) TO FINISH\n" + "\x1b[0m\x1b[0m");
    console.log("\x1b[96m\x1b[1m" + "\n> PASTE YOUR RESPONSE:\n" + "\x1b[0m\x1b[0m");

    rl.on("line", (input) => {
      rl.close();
      resolve(input.trim());
    });
  });
}