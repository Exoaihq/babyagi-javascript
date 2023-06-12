const fs = require('fs');
const path = require('path');
const openai = require('openai');
const pinecone = require('pinecone');
const dotenv = require('dotenv');
const readline = require('readline');
const { promisify } = require('util');

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY environment variable is missing from .env');

const PINECONE_API_KEY = process.env.PINECONE_API_KEY || '';
if (!PINECONE_API_KEY) throw new Error('PINECONE_API_KEY environment variable is missing from .env');

const PINECONE_ENVIRONMENT = process.env.PINECONE_ENVIRONMENT || 'us-east1-gcp';
if (!PINECONE_ENVIRONMENT) throw new Error('PINECONE_ENVIRONMENT environment variable is missing from .env');

const PINECONE_TABLE_NAME = process.env.TABLE_NAME || '';
if (!PINECONE_TABLE_NAME) throw new Error('TABLE_NAME environment variable is missing from .env');

async function queryRecords(index, query, topK = 1000) {
  const results = await index.query(query, topK, true);
  return results.matches.map(task => ({
    name: task.metadata.task,
    result: task.metadata.result,
  }));
}

async function getAdaEmbedding(text) {
  const response = await openai.Embedding.create({
    input: [text],
    model: 'text-embedding-ada-002',
  });
  return response.data[0].embedding;
}

async function main() {
  openai.apiKey = OPENAI_API_KEY;
  pinecone.init(PINECONE_API_KEY);

  const index = new pinecone.Index(PINECONE_TABLE_NAME);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = promisify(rl.question).bind(rl);

  const objective = await question('Enter the main objective description: ');

  const retrievedTasks = await queryRecords(index, await getAdaEmbedding(objective));

  for (const task of retrievedTasks) {
    console.log(`Task: ${task.name}`);
    console.log(`Result: ${task.result}`);
    console.log('------------------');
  }

  rl.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});