

import KnowledgeChunk from '../../models/KnowledgeChunk.js';
import { embedQuery } from './embeddingService.js';
import { sanitizeChunkForPrompt } from './contentSanitizer.js';

const ATLAS_VECTOR_INDEX_NAME =
  process.env.RAG_VECTOR_INDEX_NAME || 'knowledgechunks_vector_index';
const DEFAULT_TOP_K = 5;
const DEFAULT_SCORE_THRESHOLD = 0.65;
const MAX_TOP_K = 20;

function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

async function searchViaAtlasVectorSearch(queryEmbedding, filter, topK) {

  const preFilter = {};
  if (filter.exam) preFilter['metadata.exam'] = filter.exam;
  if (filter.subject) preFilter['metadata.subject'] = filter.subject;
  if (filter.topic) preFilter['metadata.topic'] = filter.topic;
  if (filter.difficulty) preFilter['metadata.difficulty'] = filter.difficulty;

  const vectorSearchStage = {
    $vectorSearch: {
      index: ATLAS_VECTOR_INDEX_NAME,
      path: 'embedding',
      queryVector: queryEmbedding,
      numCandidates: Math.min(topK * 15, 500),
      limit: topK,
      ...(Object.keys(preFilter).length > 0 ? { filter: preFilter } : {}),
    },
  };

  const pipeline = [
    vectorSearchStage,
    {
      $project: {
        content: 1,
        chunkIndex: 1,
        documentId: 1,
        metadata: 1,
        embeddingModel: 1,
        score: { $meta: 'vectorSearchScore' },
      },
    },
  ];

  const results = await KnowledgeChunk.aggregate(pipeline);
  return results.map((r) => ({ chunk: r, score: r.score }));
}

async function searchViaFallbackCosine(queryEmbedding, filter, topK) {
  const mongoFilter = { embedding: { $exists: true } };

  if (filter.exam) mongoFilter['metadata.exam'] = filter.exam;
  if (filter.subject) mongoFilter['metadata.subject'] = filter.subject;
  if (filter.topic) mongoFilter['metadata.topic'] = filter.topic;
  if (filter.difficulty) mongoFilter['metadata.difficulty'] = filter.difficulty;

  const candidates = await KnowledgeChunk.find(mongoFilter)
    .select('content chunkIndex documentId metadata embeddingModel embedding')
    .limit(2000)
    .lean();

  const scored = candidates
    .map((chunk) => ({
      chunk,
      score: cosineSimilarity(queryEmbedding, chunk.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scored;
}

export async function retrieveRelevantChunks(params) {
  const {
    query,
    filter = {},
    topK = DEFAULT_TOP_K,
    scoreThreshold = DEFAULT_SCORE_THRESHOLD,
    forceAtlas = false,
  } = params;

  if (!query || query.trim().length === 0) {
    throw new Error('Query must be a non-empty string.');
  }

  const clampedTopK = Math.min(Math.max(1, topK), MAX_TOP_K);

  const { embedding: queryEmbedding, model: embModel, isMock } = await embedQuery(query);

  let searchResults = [];
  let usedAtlas = false;

  try {
    searchResults = await searchViaAtlasVectorSearch(queryEmbedding, filter, clampedTopK);
    usedAtlas = true;
  } catch (atlasErr) {
    if (forceAtlas) throw atlasErr;

    console.warn(
      `[RAG Retrieval] Atlas Vector Search failed (${atlasErr.message}). Using fallback cosine search.`
    );
    searchResults = await searchViaFallbackCosine(queryEmbedding, filter, clampedTopK);
    usedAtlas = false;
  }

  const filtered = searchResults.filter((r) => r.score >= scoreThreshold);

  const safeChunks = filtered.map((r) => ({
    ...r.chunk,
    content: sanitizeChunkForPrompt(r.chunk.content),
    score: r.score,
  }));

  const contextText = safeChunks
    .map((chunk, i) => {
      const meta = chunk.metadata || {};
      const attrs = [
        meta.exam && `Exam: ${meta.exam}`,
        meta.subject && `Subject: ${meta.subject}`,
        meta.topic && `Topic: ${meta.topic}`,
        meta.source && `Source: ${meta.source}`,
        meta.difficulty && `Difficulty: ${meta.difficulty}`,
      ]
        .filter(Boolean)
        .join(' | ');

      return `[Context ${i + 1}${attrs ? ` | ${attrs}` : ''}]\n${chunk.content}`;
    })
    .join('\n\n---\n\n');

  return {
    chunks: safeChunks,
    contextText: contextText || 'No relevant knowledge base context found for this query.',
    meta: {
      query,
      topK: clampedTopK,
      returned: safeChunks.length,
      scoreThreshold,
      usedAtlas,
      embeddingModel: embModel,
      isMockEmbedding: isMock,
      filter,
    },
  };
}

export async function buildRagContext(userQuery, filterOptions = {}, topK = DEFAULT_TOP_K) {
  const { chunks, contextText, meta } = await retrieveRelevantChunks({
    query: userQuery,
    filter: filterOptions,
    topK,
  });

  return {
    contextChunks: contextText,
    retrievalMeta: {
      ...meta,
      chunkCount: chunks.length,
    },
  };
}
