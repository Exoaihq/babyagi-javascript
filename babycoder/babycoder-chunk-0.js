const fs = require('fs');
const path = require('path');
const openai = require('openai');
const { exec } = require('child_process');
const dotenv = require('dotenv');

dotenv.config();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_MODEL = process.env.OPENAI_API_MODEL;

if (!OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is missing from .env');
}

if (!OPENAI_API_MODEL) {
  throw new Error('OPENAI_API_MODEL environment variable is missing from .env');
}

if (OPENAI_API_MODEL.toLowerCase().includes('gpt-4')) {
  console.error('\x1b[31m\x1b[1m%s\x1b[0m\x1b[0m', '*****USING GPT-4. POTENTIALLY EXPENSIVE. MONITOR YOUR COSTS*****');
}

openai.apiKey = OPENAI_API_KEY;

const currentDirectory = process.cwd();
const osVersion = process.release;

let OBJECTIVE = '';

if (process.argv.length > 2) {
  OBJECTIVE = process.argv[2];
} else {
  const objectivePath = path.join(currentDirectory, 'objective.txt');
  if (fs.existsSync(objectivePath)) {
    OBJECTIVE = fs.readFileSync(objectivePath, 'utf-8');
  }
}

if (!OBJECTIVE) {
  throw new Error('OBJECTIVE missing');
}

const printColoredText = (text, color) => {
  const colorMapping = {
    blue: '\x1b[34m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    green: '\x1b[32m',
  };
  const colorCode = colorMapping[color.toLowerCase()] || '';
  const resetCode = '\x1b[0m';
  console.log(colorCode + text + resetCode);
};

const printCharByChar = (text, delay = 0.00001, charsAtOnce = 3) => {
  for (let i = 0; i < text.length; i += charsAtOnce) {
    const chunk = text.slice(i, i + charsAtOnce);
    process.stdout.write(chunk);
    sleep(delay);
  }
  console.log();
};

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const openaiCall = async (prompt, model = OPENAI_API_MODEL, temperature = 0.5, maxTokens = 100) => {
  if (!model.startsWith('gpt-')) {
    const response = await openai.Completion.create({
      engine: model,
      prompt: prompt,
      temperature: temperature,
      max_tokens: maxTokens,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });
    return response.choices[0].text.trim();
  } else {
    const messages = [{ role: 'user', content: prompt }];
    try {
      const response = await openai.ChatCompletion.create({
        model: model,
        messages: messages,
        temperature: temperature,
        max_tokens: maxTokens,
        n: 1,
        stop: null,
      });
      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error(`Error calling OpenAI: ${error.message}`);
      throw error;
    }
  }
};

const executeCommandJson = (jsonString) => {
  return new Promise((resolve, reject) => {
    try {
      const commandData = JSON.parse(jsonString);
      const fullCommand = commandData.command;

      exec(fullCommand, { cwd: 'playground' }, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout || stderr || 'No output');
        }
      });
    } catch (error) {
      reject(`Error: Unable to decode JSON string: ${error.message}`);
    }
  });
};

const executeCommandString = (commandString) => {
  return new Promise((resolve, reject) => {
    exec(commandString, { cwd: 'playground' }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout || stderr || 'No output');
      }
    });
  });
};

const saveCodeToFile = (code, filePath) => {
  const fullPath = path.join(currentDirectory, 'playground', filePath);
  const mode = fs.existsSync(fullPath) ? 'a' : 'w';
  fs.writeFileSync(fullPath, code + '\n\n', { encoding: 'utf-8', flag: mode });
};

const refactorCode = (modifiedCode, filePath) => {
  const fullPath = path.join(currentDirectory, 'playground', filePath);

  fs.readFile(fullPath, 'utf-8', (err, data) => {
    if (err) {
      throw err;
    }

    const lines = data.split('\n');

    modifiedCode.forEach((modification) => {
      const startLine = modification.start_line;
      const endLine = modification.end_line;
      const modifiedChunk = modification.modified_code.split('\n');

      lines.splice(startLine - 1, endLine - startLine + 1, ...modifiedChunk);
    });

    const updatedCode = lines.join('\n');
    fs.writeFile(fullPath, updatedCode, 'utf-8', (err) => {
      if (err) {
        throw err;
      }
    });
  });
};