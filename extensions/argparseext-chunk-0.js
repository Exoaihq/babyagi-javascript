const os = require('os');
const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

function canImport(moduleName) {
  try {
    require.resolve(moduleName);
    return true;
  } catch (error) {
    return false;
  }
}

function parseDotenvExtensions(argv) {
  const envArgv = [];
  const index = argv.indexOf('-e');
  if (index !== -1) {
    const tmpArgv = argv.slice(index + 1);
    const parsedArgs = [];
    for (const arg of tmpArgv) {
      if (arg.startsWith('-')) {
        break;
      }
      parsedArgs.push(arg);
    }
    envArgv.push('-e', ...parsedArgs);
  }

  const parser = new (require('argparse')).ArgumentParser();
  parser.add_argument('-e', '--env', { nargs: '+', help: '', default: (process.env.DOTENV_EXTENSIONS || '').split(' ') });

  return parser.parse_args(envArgv).env;
}

function parseArguments() {
  const dotenvExtensions = parseDotenvExtensions(process.argv);
  if (dotenvExtensions.length) {
    const loadDotenvExtensions = require('./extensions/dotenvext').loadDotenvExtensions;
    loadDotenvExtensions(parseDotenvExtensions(process.argv));
  }

  const parser = new (require('argparse')).ArgumentParser({ add_help: false });
  parser.add_argument('objective', { nargs: '*', metavar: '<objective>', help: '', default: [process.env.OBJECTIVE || ''] });
  parser.add_argument('-n', '--name', { required: false, help: '', default: process.env.INSTANCE_NAME || process.env.BABY_NAME || 'BabyAGI' });
  parser.add_argument('-m', '--mode', { choices: ['n', 'none', 'l', 'local', 'd', 'distributed'], help: '', default: 'none' });
  const group = parser.add_mutually_exclusive_group();
  group.add_argument('-t', '--task', { metavar: '<initial task>', help: '', default: process.env.INITIAL_TASK || process.env.FIRST_TASK || '' });
  group.add_argument('-j', '--join', { action: 'store_true', help: '' });
  const group2 = parser.add_mutually_exclusive_group();
  group2.add_argument('-4', '--gpt-4', { dest: 'llm_model', action: 'store_const', const: 'gpt-4', help: '' });
  group2.add_argument('-l', '--llama', { dest: 'llm_model', action: 'store_const', const: 'llama', help: '' });
  parser.add_argument('-e', '--env', { nargs: '+', help: '', default: (process.env.DOTENV_EXTENSIONS || '').split(' ') });
  parser.add_argument('-h', '-?', '--help', { action: 'help', help: '' });

  const args = parser.parse_args();

  const llmModel = args.llm_model || process.env.LLM_MODEL || process.env.OPENAI_API_MODEL || 'gpt-3.5-turbo';

  const instanceName = args.name;
  if (!instanceName) {
    console.error('\x1b[91m\x1b[1m' + 'BabyAGI instance name missing\n' + '\x1b[0m\x1b[0m');
    parser.print_help();
    process.exit(1);
  }

  const moduleName = 'ray';
  const cooperativeMode = args.mode;
  if (cooperativeMode === 'l' && !canImport(moduleName)) {
    console.error('\x1b[91m\x1b[1m' + `Local cooperative mode requires package ${moduleName}\nInstall:  npm install ${moduleName}\n` + '\x1b[0m\x1b[0m');
    parser.print_help();
    process.exit(1);
  } else if (cooperativeMode === 'd') {
    console.error('\x1b[91m\x1b[1m' + 'Distributed cooperative mode is not implemented yet\n' + '\x1b[0m\x1b[0m');
    parser.print_help();
    process.exit(1);
  }

  const joinExistingObjective = args.join;
  if (joinExistingObjective && cooperativeMode === 'n') {
    console.error('\x1b[91m\x1b[1m' + 'Joining existing objective requires local or distributed cooperative mode\n' + '\x1b[0m\x1b[0m');
    parser.print_help();
    process.exit(1);
  }

  const objective = args.objective.join(' ').trim();
  if (!objective) {
    console.error('\x1b[91m\x1b[1m' + 'No objective specified or found in environment.\n' + '\x1b[0m\x1b[0m');
    parser.print_help();
    process.exit(1);
  }

  const initialTask = args.task;
  if (!initialTask && !joinExistingObjective) {
    console.error('\x1b[91m\x1b[1m' + 'No initial task specified or found in environment.\n' + '\x1b[0m\x1b[0m');
    parser.print_help();
    process.exit(1);
  }

  return { objective, initialTask, llmModel, dotenvExtensions, instanceName, cooperativeMode, joinExistingObjective };
}

module.exports = {
  parseArguments,
};