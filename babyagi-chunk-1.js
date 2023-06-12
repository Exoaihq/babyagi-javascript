// ```javascript
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const openai = require("openai");
const { Documents, Embeddings, EmbeddingFunction } = require("chroma");
const chromadb = require("chromadb");
const { canImport } = require("extensions.utils");

const OBJECTIVE = process.env.OBJECTIVE;
const INITIAL_TASK = process.env.INITIAL_TASK;
const JOIN_EXISTING_OBJECTIVE = process.env.JOIN_EXISTING_OBJECTIVE === "True";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const LLM_MODEL = process.env.LLM_MODEL;
const LLAMA_MODEL_PATH = process.env.LLAMA_MODEL_PATH;
const RESULTS_STORE_NAME = process.env.RESULTS_STORE_NAME;

if (LLM_MODEL.startsWith("llama")) {
  if (fs.existsSync(LLAMA_MODEL_PATH)) {
    console.log("\nUsing Llama LLM model: " + LLM_MODEL);
  } else {
    console.log("\nLlama LLM requires package llama-cpp. Falling back to GPT-3.5-turbo.");
    LLM_MODEL = "gpt-3.5-turbo";
  }
}

if (LLM_MODEL.startsWith("gpt-4")) {
  console.log("\n*****USING GPT-4. POTENTIALLY EXPENSIVE. MONITOR YOUR COSTS*****");
}

if (LLM_MODEL.startsWith("human")) {
  console.log("\n*****USING HUMAN INPUT*****");
}

console.log("\n*****OBJECTIVE*****\n" + OBJECTIVE);

if (!JOIN_EXISTING_OBJECTIVE) {
  console.log("\nInitial task: " + INITIAL_TASK);
} else {
  console.log("\nJoining to help the objective");
}

openai.api_key = OPENAI_API_KEY;

class LlamaEmbeddingFunction extends EmbeddingFunction {
  constructor() {
    super();
  }

  async __call__(texts) {
    const embeddings = [];
    for (const t of texts) {
      const e = await llm_embed.embed(t);
      embeddings.push(e);
    }
    return embeddings;
  }
}

class DefaultResultsStorage {
  constructor() {
    const chroma_persist_dir = "chroma";
    const chroma_client = chromadb.Client(
      chromadb.config.Settings(
        "duckdb+parquet",
        chroma_persist_dir
      )
    );

    const metric = "cosine";
    const embedding_function = LLM_MODEL.startsWith("llama")
      ? new LlamaEmbeddingFunction()
      : new OpenAIEmbeddingFunction({ api_key: OPENAI_API_KEY });
    this.collection = chroma_client.get_or_create_collection(
      RESULTS_STORE_NAME,
      { "hnsw:space": metric },
      embedding_function
    );
  }

  add(task, result, result_id) {
    if (LLM_MODEL.startsWith("human")) {
      return;
    }

    const embeddings = LLM_MODEL.startsWith("llama")
      ? llm_embed.embed(result)
      : null;
    if (this.collection.get({ ids: [result_id], include: [] }).ids.length > 0) {
      this.collection.update(
        result_id,
        embeddings,
        result,
        { task: task.task_name, result: result }
      );
    } else {
      this.collection.add(
        result_id,
        embeddings,
        result,
        { task: task.task_name, result: result }
      );
    }
  }

  async query(query, top_results_num) {
    const count = await this.collection.count();
    if (count === 0) {
      return [];
    }
    const results = await this.collection.query(
      query,
      Math.min(top_results_num, count),
      ["metadatas"]
    );
    return results.metadatas[0].map(item => item.task);
  }
}

async function try_weaviate() {
  const WEAVIATE_URL = process.env.WEAVIATE_URL;
  const WEAVIATE_USE_EMBEDDED = process.env.WEAVIATE_USE_EMBEDDED === "True";
  if ((WEAVIATE_URL || WEAVIATE_USE_EMBEDDED) && canImport("extensions.weaviate_storage")) {
    const WEAVIATE_API_KEY = process.env.WEAVIATE_API_KEY;
    const { WeaviateResultsStorage } = require("extensions.weaviate_storage");
    console.log("\nUsing results storage: Weaviate");
    return new WeaviateResultsStorage(OPENAI_API_KEY, WEAVIATE_URL, WEAVIATE_API_KEY, WEAVIATE_USE_EMBEDDED, LLM_MODEL, LLAMA_MODEL_PATH, RESULTS_STORE_NAME, OBJECTIVE);
  }
  return null;
}

async function try_pinecone() {
  const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
  if (PINECONE_API_KEY && canImport("extensions.pinecone_storage")) {
    const PINECONE_ENVIRONMENT = process.env.PINECONE_ENVIRONMENT;
    if (!PINECONE_ENVIRONMENT) {
      throw new Error("PINECONE_ENVIRONMENT environment variable is missing from .env");
    }
    const { PineconeResultsStorage } = require("extensions.pinecone_storage");
    console.log("\nUsing results storage: Pinecone");
    return new PineconeResultsStorage(OPENAI_API_KEY, PINECONE_API_KEY, PINECONE_ENVIRONMENT, LLM_MODEL, LLAMA_MODEL_PATH, RESULTS_STORE_NAME, OBJECTIVE);
  }
  return null;
}

async function use_chroma() {
  console.log("\nUsing results storage: Chroma (Default)");
  return new DefaultResultsStorage();
}
```
