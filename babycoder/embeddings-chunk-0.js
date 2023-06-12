const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const csvWriter = require('csv-writer');
const dotenv = require('dotenv');
const openai = require('openai');
const { GPT2TokenizerFast } = require('transformers');
const { promisify } = require('util');

dotenv.config();

const REPOSITORY_PATH = path.join(__dirname, 'playground');

class Embeddings {
  constructor(workspacePath) {
    this.workspacePath = workspacePath;
    openai.apiKey = process.env.OPENAI_API_KEY || '';

    this.DOC_EMBEDDINGS_MODEL = 'text-embedding-ada-002';
    this.QUERY_EMBEDDINGS_MODEL = 'text-embedding-ada-002';

    this.SEPARATOR = '\n* ';

    this.tokenizer = GPT2TokenizerFast.from_pretrained('gpt2');
    this.separatorLen = this.tokenizer.tokenize(this.SEPARATOR).length;
  }

  async computeRepositoryEmbeddings() {
    try {
      const playgroundDataPath = path.join(this.workspacePath, 'playground_data');

      // Delete the contents of the playground_data directory but not the directory itself
      // This is to ensure that we don't have any old data lying around
      const files = await promisify(fs.readdir)(playgroundDataPath);
      for (const filename of files) {
        const filePath = path.join(playgroundDataPath, filename);

        try {
          const stats = await promisify(fs.stat)(filePath);
          if (stats.isFile() || stats.isSymbolicLink()) {
            await promisify(fs.unlink)(filePath);
          } else if (stats.isDirectory()) {
            await promisify(fs.rmdir)(filePath, { recursive: true });
          }
        } catch (e) {
          console.log(`Failed to delete ${filePath}. Reason: ${e}`);
        }
      }
    } catch (e) {
      console.log(`Error: ${e}`);
    }

    // Extract and save info to CSV
    const info = await this.extractInfo(REPOSITORY_PATH);
    await this.saveInfoToCsv(info);

    const df = await this.readCsv(path.join(this.workspacePath, 'playground_data', 'repository_info.csv'));
    df.index = ['filePath', 'lineCoverage'];
    this.df = df;
    const contextEmbeddings = await this.computeDocEmbeddings(df);
    await this.saveDocEmbeddingsToCsv(contextEmbeddings, df, path.join(this.workspacePath, 'playground_data', 'doc_embeddings.csv'));

    try {
      this.documentEmbeddings = await this.loadEmbeddings(path.join(this.workspacePath, 'playground_data', 'doc_embeddings.csv'));
    } catch {
      // Do nothing
    }
  }

  // Extract information from files in the repository in chunks
  // Return a list of [filePath, lineCoverage, chunkContent]
  async extractInfo(REPOSITORY_PATH) {
    // Initialize an empty list to store the information
    const info = [];

    const LINES_PER_CHUNK = 60;

    // Iterate through the files in the repository
    const files = await this.walk(REPOSITORY_PATH);
    for (const file of files) {
      const fileContents = await promisify(fs.readFile)(file, 'utf-8');
      const lines = fileContents.split('\n');
      const nonEmptyLines = lines.filter(line => line.trim());
      const chunks = this.chunk(nonEmptyLines, LINES_PER_CHUNK);

      for (const [i, chunk] of chunks.entries()) {
        const chunkContent = chunk.join('\n');
        const firstLine = i * LINES_PER_CHUNK + 1;
        const lastLine = firstLine + chunk.length - 1;
        const lineCoverage = [firstLine, lastLine];
        info.push([file, lineCoverage, chunkContent]);
      }
    }

    return info;
  }

  async saveInfoToCsv(info) {
    const writer = csvWriter.createObjectCsvWriter({
      path: path.join(this.workspacePath, 'playground_data', 'repository_info.csv'),
      header: [
        { id: 'filePath', title: 'filePath' },
        { id: 'lineCoverage', title: 'lineCoverage' },
        { id: 'content', title: 'content' },
      ],
    });

    const records = info.map(([filePath, lineCoverage, content]) => ({
      filePath,
      lineCoverage: JSON.stringify(lineCoverage),
      content,
    }));

    await writer.writeRecords(records);
  }

  // Helper functions
  async walk(dir) {
    let files = await promisify(fs.readdir)(dir);
    files = await Promise.all(
      files.map(async file => {
        const filePath = path.join(dir, file);
        const stats = await promisify(fs.stat)(filePath);
        if (stats.isDirectory()) {
          return this.walk(filePath);
        } else {
          return [filePath];
        }
      })
    );
    return files.reduce((all, folderContents) => all.concat(folderContents), []);
  }

  chunk(array, size) {
    return Array.from({ length: Math.ceil(array.length / size) }, (v, i) =>
      array.slice(i * size, i * size + size)
    );
  }

  async readCsv(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', data => results.push(data))
        .on('end', () => {
          resolve(results);
        })
        .on('error', error => {
          reject(error);
        });
    });
  }
}

module.exports = Embeddings;