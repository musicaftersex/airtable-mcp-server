import { ChromaClient } from "chromadb";

const client = new ChromaClient({ path: "./vector_store" });

// Save a memory
export async function storeMemory(id, text, embedding, metadata) {
  const collection = await client.getOrCreateCollection({ name: "memories" });
  await collection.add({
    ids: [id],
    documents: [text],
    embeddings: [embedding],
    metadatas: [metadata],
  });
}

// Find similar memories
export async function retrieveMemory(queryEmbedding, topK = 3) {
  const collection = await client.getOrCreateCollection({ name: "memories" });
  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: topK,
  });
  return results.documents.flat();
}
