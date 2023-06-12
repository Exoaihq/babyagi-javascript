const importlib = require('importlib');
const logging = require('logging');
const re = require('re');
const { Dict, List } = require('typing');

const openai = require('openai');
const weaviate = require('weaviate');
const { EmbeddedOptions } = require('weaviate.embedded');

function canImport(moduleName) {
    try {
        importlib.importModule(moduleName);
        return true;
    } catch (error) {
        return false;
    }
}

if (!canImport("weaviate")) {
    console.error(
        "\033[91m\033[1m" +
        "Weaviate storage requires package weaviate-client.\nInstall:  npm install weaviate-client"
    );
}

function createClient(weaviateUrl, weaviateApiKey, weaviateUseEmbedded) {
    let client;
    if (weaviateUseEmbedded) {
        client = new weaviate.Client({ embeddedOptions: new EmbeddedOptions() });
    } else {
        const authConfig = (
            weaviateApiKey
                ? new weaviate.auth.AuthApiKey({ apiKey: weaviateApiKey })
                : null
        );
        client = new weaviate.Client(weaviateUrl, { authClientSecret: authConfig });
    }

    return client;
}

class WeaviateResultsStorage {
    constructor(
        openaiApiKey,
        weaviateUrl,
        weaviateApiKey,
        weaviateUseEmbedded,
        llmModel,
        llamaModelPath,
        resultsStoreName,
        objective
    ) {
        openai.apiKey = openaiApiKey;
        this.client = createClient(weaviateUrl, weaviateApiKey, weaviateUseEmbedded);
        this.indexName = null;
        this.createSchema(resultsStoreName);

        this.llmModel = llmModel;
        this.llamaModelPath = llamaModelPath;
    }

    createSchema(resultsStoreName) {
        const validClassName = /^[A-Z][a-zA-Z0-9_]*$/;
        if (!validClassName.test(resultsStoreName)) {
            throw new Error(
                `Invalid index name: ${resultsStoreName}. ` +
                "Index names must start with a capital letter and " +
                "contain only alphanumeric characters and underscores."
            );
        }

        this.schema = {
            "class": resultsStoreName,
            "properties": [
                { "name": "result_id", "dataType": ["string"] },
                { "name": "task", "dataType": ["string"] },
                { "name": "result", "dataType": ["text"] },
            ]
        };

        if (this.client.schema.contains(this.schema)) {
            logging.info(
                `Index named ${resultsStoreName} already exists. Reusing it.`
            );
        } else {
            logging.info(`Creating index named ${resultsStoreName}`);
            this.client.schema.createClass(this.schema);
        }

        this.indexName = resultsStoreName;
    }

    add(task, result, resultId, vector) {
        const enrichedResult = { "data": result };
        vector = this.getEmbedding(enrichedResult["data"]);

        this.client.batch((batch) => {
            const dataObject = {
                "result_id": resultId,
                "task": task["task_name"],
                "result": result,
            };
            batch.addDataObject(
                { dataObject, className: this.indexName, vector }
            );
        });
    }

    query(query, topResultsNum) {
        const queryEmbedding = this.getEmbedding(query);

        const results = (
            this.client.query.get(this.indexName, ["task"])
                .withHybrid({ query, alpha: 0.5, vector: queryEmbedding })
                .withLimit(topResultsNum)
                .do()
        );

        return this._extractTasks(results);
    }

    _extractTasks(data) {
        const taskData = data.get("data", {}).get("Get", {}).get(this.indexName, []);
        return taskData.map(item => item["task"]);
    }

    getEmbedding(text) {
        text = text.replace("\n", " ");

        if (this.llmModel.startsWith("llama")) {
            const Llama = require('llama_cpp');

            const llmEmbed = new Llama({
                modelPath: this.llamaModelPath,
                nCtx: 2048,
                nThreads: 4,
                embedding: true,
                useMlock: true,
            });
            return llmEmbed.embed(text);
        }

        return openai.Embedding.create({ input: [text], model: "text-embedding-ada-002" })[
            "data"
        ][0]["embedding"];
    }
}