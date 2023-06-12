const dotenv = require("dotenv");
const openai = require("openai");
const pinecone = require("pinecone-node");
const { ArgumentParser } = require("argparse");

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY environment variable is missing from .env");

const PINECONE_API_KEY = process.env.PINECONE_API_KEY || "";
if (!PINECONE_API_KEY) throw new Error("PINECONE_API_KEY environment variable is missing from .env");

const PINECONE_ENVIRONMENT = process.env.PINECONE_ENVIRONMENT || "us-east1-gcp";
if (!PINECONE_ENVIRONMENT) throw new Error("PINECONE_ENVIRONMENT environment variable is missing from .env");

const PINECONE_TABLE_NAME = process.env.TABLE_NAME || "";
if (!PINECONE_TABLE_NAME) throw new Error("TABLE_NAME environment variable is missing from .env");

async function queryRecords(index, query, topK = 1000) {
  const results = await index.query(query, { topK, includeMetadata: true });
  return results.matches.map(task => `${task.metadata.task}:\n${task.metadata.result}\n------------------`);
}

async function getAdaEmbedding(text) {
  text = text.replace("\n", " ");
  const response = await openai.Embedding.create({ input: [text], model: "text-embedding-ada-002" });
  return response.data[0].embedding;
}

async function main() {
  const parser = new ArgumentParser({ description: "Query Pinecone index using a string." });
  parser.add_argument("objective", { nargs: "*", metavar: "<objective>", help: "main objective description. Doesn't need to be quoted. if not specified, get objective from environment.", default: [process.env.OBJECTIVE || ""] });
  const args = parser.parse_args();

  openai.api_key = OPENAI_API_KEY;

  pinecone.init({ apiKey: PINECONE_API_KEY });

  const index = pinecone.Index(PINECONE_TABLE_NAME);

  const query = await getAdaEmbedding(args.objective.join(" ").trim());
  const retrievedTasks = await queryRecords(index, query);
  retrievedTasks.forEach(task => console.log(task));
}

main();