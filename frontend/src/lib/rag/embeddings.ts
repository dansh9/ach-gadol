/**
 * Embedding generation using OpenAI text-embedding-3-small.
 * Returns a 1536-dimensional vector for pgvector cosine similarity search.
 */

const OPENAI_EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 1536;

interface EmbeddingResponse {
  data: { embedding: number[]; index: number }[];
  usage: { prompt_tokens: number; total_tokens: number };
}

/**
 * Generate an embedding vector for the given text.
 * Requires OPENAI_API_KEY env var.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_EMBEDDING_MODEL,
      input: text,
      dimensions: EMBEDDING_DIMENSIONS,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `OpenAI embedding API error: ${response.status} ${errorBody}`
    );
  }

  const data: EmbeddingResponse = await response.json();
  return data.data[0].embedding;
}

/**
 * Generate embeddings for multiple texts in a single batch.
 */
export async function generateEmbeddings(
  texts: string[]
): Promise<number[][]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_EMBEDDING_MODEL,
      input: texts,
      dimensions: EMBEDDING_DIMENSIONS,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `OpenAI embedding API error: ${response.status} ${errorBody}`
    );
  }

  const data: EmbeddingResponse = await response.json();
  return data.data
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}
