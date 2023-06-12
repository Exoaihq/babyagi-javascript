```python
#!/usr/bin/env node
const dotenv = require("dotenv");

// Load default environment variables (.env)
dotenv.config();

const os = require("os");
const time = require("time");
const logging = require("logging");
const deque = require("collections/deque");
const importlib = require("importlib");
const openai = require("openai");
const chromadb = require("chromadb");
const tiktoken = require("tiktoken");
const OpenAIEmbeddingFunction = require("chromadb/utils/embedding_functions").OpenAIEmbeddingFunction;
const Documents = require("chromadb/api/types").Documents;
const EmbeddingFunction = require("chromadb/api/types").EmbeddingFunction;
const Embeddings = require("chromadb/api/types").Embeddings;
const re = require("re");

// default opt out of chromadb telemetry.
const Settings = require("chromadb/config").Settings;

const client = chromadb.Client(Settings({ anonymized_telemetry: false }));

// Engine configuration

// Model: GPT, LLAMA, HUMAN, etc.
const LLM_MODEL = process.env.LLM_MODEL || process.env.OPENAI_API_MODEL || "gpt-3.5-turbo";

// API Keys
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
if (!LLM_MODEL.startsWith("llama") && !LLM_MODEL.startsWith("human")) {
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY environment variable is missing from .env");

// Table config
const RESULTS_STORE_NAME = process.env.RESULTS_STORE_NAME || process.env.TABLE_NAME || "";
if (!RESULTS_STORE_NAME) throw new Error("RESULTS_STORE_NAME environment variable is missing from .env");

// Run configuration
const INSTANCE_NAME = process.env.INSTANCE_NAME || process.env.BABY_NAME || "BabyAGI";
const COOPERATIVE_MODE = "none";
const JOIN_EXISTING_OBJECTIVE = false;

// Goal configuration
const OBJECTIVE = process.env.OBJECTIVE || "";
const INITIAL_TASK = process.env.INITIAL_TASK || process.env.FIRST_TASK || "";

// Model configuration
const OPENAI_TEMPERATURE = parseFloat(process.env.OPENAI_TEMPERATURE || 0.0);

// Extensions support begin

function canImport(moduleName) {
    try {
        require(moduleName);
        return true;
    } catch (error) {
        return false;
    }
}

const DOTENV_EXTENSIONS = (process.env.DOTENV_EXTENSIONS || "").split(" ");

// Command line arguments extension
// Can override any of the above environment variables
const ENABLE_COMMAND_LINE_ARGS = process.env.ENABLE_COMMAND_LINE_ARGS.toLowerCase() === "true";
if (ENABLE_COMMAND_LINE_ARGS) {
    if (canImport("extensions.argparseext")) {
        const parseArguments = require("extensions.argparseext").parse_arguments;

        [OBJECTIVE, INITIAL_TASK, LLM_MODEL, DOTENV_EXTENSIONS, INSTANCE_NAME, COOPERATIVE_MODE, JOIN_EXISTING_OBJECTIVE] = parseArguments();
    }
}

// Human mode extension
// Gives human input to babyagi
if (LLM_MODEL.startsWith("human")) {
    if (canImport("extensions.human_mode")) {
        const user_input_await = require("extensions.human_mode").user_input_await;
    }
}

// Load additional environment variables for enabled extensions
// TODO: This might override the following command line arguments as well:
//    OBJECTIVE, INITIAL_TASK, LLM_MODEL, INSTANCE_NAME, COOPERATIVE_MODE, JOIN_EXISTING_OBJECTIVE
if (DOTENV_EXTENSIONS.length) {
    if (canImport("extensions.dotenvext")) {
        const load_dotenv_extensions = require("extensions.dotenvext").load_dotenv_extensions;

        load_dotenv_extensions(DOTENV_EXTENSIONS);
    }
}

// TODO: There's still work to be done here to enable people to get
// defaults from dotenv extensions, but also provide command line
// arguments to override them

// Extensions support end

console.log("\n*****CONFIGURATION*****\n");
console.log(`Name  : ${INSTANCE_NAME}`);
console.log(`Mode  : ${COOPERATIVE_MODE === 'none' ? 'alone' : COOPERATIVE_MODE === 'local' ? 'local' : COOPERATIVE_MODE === 'distributed' ? 'distributed' : 'undefined'}`);
console.log(`LLM   : ${LLM_MODEL}`);

// Check if we know what we are doing
if (!OBJECTIVE) throw new Error("OBJECTIVE environment variable is missing from .env");
if (!INITIAL_TASK) throw new Error("INITIAL_TASK environment variable is missing from .env");

const LLAMA_MODEL_PATH = process.env.LLAMA_MODEL_PATH || "models/llama-13B/ggml-model.bin";
if (LLM_MODEL.startsWith("llama")) {
    if (canImport("llama_cpp")) {
        const Llama = require("llama_cpp").Llama;

        console.log(`LLAMA : ${LLAMA_MODEL_PATH}\n`);
        if (!fs.existsSync(LLAMA_MODEL_PATH)) throw new Error("Model can't be found.");

        const CTX_MAX = 1024;
        const LLAMA_THREADS_NUM = parseInt(process.env.LLAMA_THREADS_NUM || 8);

        console.log('Initialize model for evaluation');
        const llm = new Llama(
            LLAMA_MODEL_PATH,
            CTX_MAX,
            LLAMA_THREADS_NUM,
            512,
            false,
        );

        console.log('\nInitialize model for embedding');
        const llm_embed = new Llama(
            LLAMA_MODEL_PATH,
            CTX_MAX,
            LLAMA_THREADS_NUM,
            512,
            true,
            false,
        );

        console.log("\n*****USING LLAMA.CPP. POTENTIALLY SLOW.*****");
    } else {
        console.log("\nLlama LLM requires package llama-cpp. Falling back to GPT-3.5-turbo.");
    }
}
```