/**
 * ragRetrievalService.js
 *
 * Semantic retrieval layer for the RAG knowledge base.
 *
 * Primary strategy: MongoDB Atlas Vector Search ($vectorSearch aggregation)
 * Fallback strategy: Cosine similarity computed in-application over a filtered subset
 *                    (used when not on Atlas or vector index not yet created)
 *
 * The retriever supports:
 *  - Metadata pre-filtering (exam, subject, topic, difficulty)
 *  - Configurable top-K results
 *  - Score threshold filtering
 *  - Context formatting for LLM prompt injection (with injection sanitization)
 */

import KnowledgeChunk from '../../models/KnowledgeChunk.js';
import { embedQuery } from './embeddingService.js';
import { sanitizeChunkForPrompt } from './contentSanitizer.js';

// ─── Configuration ────────────────────────────────────────────────────────────
const ATLAS_VECTOR_INDEX_NAME =
  process.env.RAG_VECTOR_INDEX_NAME || 'knowledgechunks_vector_index';
const DEFAULT_TOP_K = 5;
const DEFAULT_SCORE_THRESHOLD = 0.65; // cosine similarity minimum
const MAX_TOP_K = 20; // hard cap to prevent context overflow

// ─── Cosine Similarity (fallback) ────────────────────────────────────────────

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

// ─── Atlas Vector Search ──────────────────────────────────────────────────────

/**
 * Performs semantic search via MongoDB Atlas Vector Search.
 * Requires a vector index named `knowledgechunks_vector_index` on the
 * `knowledgechunks` collection (see KnowledgeChunk model comments for setup).
 *
 * @param {number[]} queryEmbedding
 * @param {object}   filter           - Pre-filter metadata fields
 * @param {number}   topK
 * @returns {Promise<Array<{ chunk: object, score: number }>>}
 */
async function searchViaAtlasVectorSearch(queryEmbedding, filter, topK) {
  // Build pre-filter compound query from metadata filter
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
      numCandidates: Math.min(topK * 15, 500), // overrequest for better recall
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

// ─── Fallback In-App Cosine Search ───────────────────────────────────────────

/**
 * Fallback similarity search via in-application cosine computation.
 * Fetches a filtered subset and ranks by cosine similarity.
 * Less scalable than Atlas Vector Search but works on any MongoDB tier.
 *
 * @param {number[]} queryEmbedding
 * @param {object}   filter
 * @param {number}   topK
 * @returns {Promise<Array<{ chunk: object, score: number }>>}
 */
async function searchViaFallbackCosine(queryEmbedding, filter, topK) {
  const mongoFilter = { embedding: { $exists: true } };

  if (filter.exam) mongoFilter['metadata.exam'] = filter.exam;
  if (filter.subject) mongoFilter['metadata.subject'] = filter.subject;
  if (filter.topic) mongoFilter['metadata.topic'] = filter.topic;
  if (filter.difficulty) mongoFilter['metadata.difficulty'] = filter.difficulty;

  // Fetch up to 2000 candidates (practical limit for in-memory ranking)
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

// ─── Core Retrieval Function ──────────────────────────────────────────────────

/**
 * Retrieves the most semantically relevant knowledge chunks for a query.
 *
 * @param {object} params
 * @param {string}  params.query                - Natural language query
 * @param {object}  [params.filter]             - Metadata pre-filters
 * @param {string}  [params.filter.exam]
 * @param {string}  [params.filter.subject]
 * @param {string}  [params.filter.topic]
 * @param {string}  [params.filter.difficulty]
 * @param {number}  [params.topK]               - Max results (default 5, max 20)
 * @param {number}  [params.scoreThreshold]     - Minimum similarity score
 * @param {boolean} [params.forceAtlas]         - Force Atlas search even if it fails
 * @returns {Promise<{ chunks: object[], contextText: string, meta: object }>}
 */
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

  // ── 1. Embed the query ────────────────────────────────────────────────────
  const { embedding: queryEmbedding, model: embModel, isMock } = await embedQuery(query);

  // ── 2. Search (Atlas first, fallback to cosine) ───────────────────────────
  let searchResults = [];
  let usedAtlas = false;

  try {
    searchResults = await searchViaAtlasVectorSearch(queryEmbedding, filter, clampedTopK);
    usedAtlas = true;
  } catch (atlasErr) {
    if (forceAtlas) throw atlasErr;
    // Atlas Vector Search index not set up yet — use fallback
    console.warn(
      `[RAG Retrieval] Atlas Vector Search failed (${atlasErr.message}). Using fallback cosine search.`
    );
    searchResults = await searchViaFallbackCosine(queryEmbedding, filter, clampedTopK);
    usedAtlas = false;
  }

  // ── 3. Apply score threshold ──────────────────────────────────────────────
  const filtered = searchResults.filter((r) => r.score >= scoreThreshold);

  // ── 4. Sanitize chunks before prompt injection ────────────────────────────
  const safeChunks = filtered.map((r) => ({
    ...r.chunk,
    content: sanitizeChunkForPrompt(r.chunk.content),
    score: r.score,
  }));

  // ── 5. Format as LLM context string ──────────────────────────────────────
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

/**
 * RAG-augmented answer generation convenience wrapper.
 * Retrieves relevant chunks and returns a structured context payload
 * ready for injection into the AIService RAG_QUERY prompt template.
 *
 * @param {string} userQuery
 * @param {object} filterOptions   - { exam, subject, topic, difficulty }
 * @param {number} [topK]
 * @returns {Promise<{ contextChunks: string, retrievalMeta: object }>}
 */
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
