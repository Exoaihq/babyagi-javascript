class CodeGenerator {
  constructor() {
    this.SEPARATOR = "|||";
    this.DOC_EMBEDDINGS_MODEL = "doc-embeddings-model";
    this.QUERY_EMBEDDINGS_MODEL = "query-embeddings-model";
  }

  async get_embedding(text, model) {
    const result = await openai.Embedding.create({
      model: model,
      input: text
    });
    return result["data"][0]["embedding"];
  }

  async get_doc_embedding(text) {
    return await this.get_embedding(text, this.DOC_EMBEDDINGS_MODEL);
  }

  async get_query_embedding(text) {
    return await this.get_embedding(text, this.QUERY_EMBEDDINGS_MODEL);
  }

  vector_similarity(x, y) {
    return np.dot(np.array(x), np.array(y));
  }

  async order_document_sections_by_query_similarity(query, contexts) {
    const query_embedding = await this.get_query_embedding(query);

    const document_similarities = Object.entries(contexts).map(([doc_index, doc_embedding]) => {
      return [this.vector_similarity(query_embedding, doc_embedding), doc_index];
    }).sort((a, b) => b[0] - a[0]);

    return document_similarities;
  }
}