const { promisify } = require("util");
const exec = promisify(require("child_process").exec);
const openai = require("openai");
const pinecone = require("pinecone-node");
const regex = /[\x00-\x7F]/g;

async function canImport(moduleName) {
  try {
    require.resolve(moduleName);
    return true;
  } catch (error) {
    return false;
  }
}

(async () => {
  if (!(await canImport("pinecone-node"))) {
    console.error("\x1b[91m\x1b[1mPinecone storage requires package pinecone-node.\nInstall:  npm install pinecone-node");
    process.exit(1);
  }
})();

class PineconeResultsStorage {
  constructor(openaiApiKey, pineconeApiKey, pineconeEnvironment, llmModel, llamaModelPath, resultsStoreName, objective) {
    openai.apiKey = openaiApiKey;
    pinecone.init(pineconeApiKey, pineconeEnvironment);

    this.namespace = objective.replace(/[^\x00-\x7F]+/g, "");

    this.llmModel = llmModel;
    this.llamaModelPath = llamaModelPath;

    resultsStoreName = resultsStoreName;
    const dimension = !this.llmModel.startsWith("llama") ? 1536 : 5120;
    const metric = "cosine";
    const podType = "p1";
    if (!pinecone.listIndexes().includes(resultsStoreName)) {
      pinecone.createIndex(resultsStoreName, dimension, metric, podType);
    }

    this.index = new pinecone.Index(resultsStoreName);
    const indexStatsResponse = this.index.describeIndexStats();
    if (dimension !== indexStatsResponse.dimension) {
      throw new Error("Dimension of the index does not match the dimension of the LLM embedding");
    }
  }

  async add(task, result, resultId) {
    const vector = await this.getEmbedding(result);
    await this.index.upsert([{ id: resultId, vector, metadata: { task: task.task_name, result } }], this.namespace);
  }

  async query(query, topResultsNum) {
    const queryEmbedding = await this.getEmbedding(query);
    const results = await this.index.query(queryEmbedding, topResultsNum, true, this.namespace);
    const sortedResults = results.matches.sort((a, b) => b.score - a.score);
    return sortedResults.map(item => item.metadata.task);
  }

  async getEmbedding(text) {
    text = text.replace(/\n/g, " ");

    if (this.llmModel.startsWith("llama")) {
      const { stdout } = await exec(`"${this.llamaModelPath}" --input "${text}" --n_ctx 2048 --n_threads 4 --embedding --use_mlock`);
      return JSON.parse(stdout);
    }

    const response = await openai.Embedding.create({ input: [text], model: "text-embedding-ada-002" });
    return response.data[0].embedding;
  }
}

module.exports = PineconeResultsStorage;