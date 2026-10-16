import mongoose from 'mongoose';

/**
 * KnowledgeChunk Schema
 *
 * Stores individual text chunks derived from a KnowledgeDocument.
 * Each chunk carries:
 *  - its text content + position within the parent document
 *  - a dense vector embedding (768-dim for Gemini text-embedding-004)
 *    used by MongoDB Atlas Vector Search for semantic retrieval
 *  - inherited educational metadata (exam, subject, topic, difficulty)
 *    enabling pre-filter narrowing before ANN search
 *
 * ATLAS VECTOR SEARCH INDEX (create manually in Atlas UI or via Atlas CLI):
 * Collection: knowledgechunks
 * Field: embedding  → type: vector, dimensions: 768, similarity: cosine
 * Filter fields: metadata.exam, metadata.subject, metadata.topic,
 *                metadata.difficulty, documentId
 */
const knowledgeChunkSchema = new mongoose.Schema(
  {
    // ─── Parent reference ────────────────────────────────────────────────────
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'KnowledgeDocument',
      required: true,
      index: true,
    },

    // ─── Chunk Content ───────────────────────────────────────────────────────
    content: {
      type: String,
      required: true,
    },
    chunkIndex: {
      type: Number,
      required: true,
      min: 0,
    },
    totalChunksInDoc: {
      type: Number,
      default: 0,
    },
    charStart: {
      type: Number,
      default: 0,
    },
    charEnd: {
      type: Number,
      default: 0,
    },

    // ─── Vector Embedding ────────────────────────────────────────────────────
    // 768 dimensions for Gemini text-embedding-004 (or text-embedding-005)
    // Stored as plain Number array; Atlas Vector Search reads it natively.
    embedding: {
      type: [Number],
      default: undefined, // unset until embedding is generated
    },
    embeddingModel: {
      type: String,
      default: null,
    },

    // ─── Educational Metadata (inherited & searchable) ───────────────────────
    // Denormalized here to enable Atlas Vector Search pre-filter without
    // needing a join back to KnowledgeDocument.
    metadata: {
      exam: { type: String, default: null, index: true },
      subject: { type: String, default: null, index: true },
      topic: { type: String, default: null, index: true },
      source: { type: String, default: null },
      difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', null],
        default: null,
        index: true,
      },
      tags: { type: [String], default: [] },
      year: { type: Number, default: null },
      documentTitle: { type: String, default: null },
    },
  },
  {
    timestamps: true,
  }
);

// ─── Compound Indexes ─────────────────────────────────────────────────────────
knowledgeChunkSchema.index({ documentId: 1, chunkIndex: 1 }, { unique: true });
knowledgeChunkSchema.index({ 'metadata.exam': 1, 'metadata.subject': 1 });
knowledgeChunkSchema.index({ 'metadata.exam': 1, 'metadata.topic': 1 });
// Sparse index: only documents with an embedding
knowledgeChunkSchema.index({ embedding: 1 }, { sparse: true });

const KnowledgeChunk = mongoose.model('KnowledgeChunk', knowledgeChunkSchema);

export default KnowledgeChunk;
