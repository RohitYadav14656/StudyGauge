import mongoose from 'mongoose';

const knowledgeChunkSchema = new mongoose.Schema(
  {

    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'KnowledgeDocument',
      required: true,
      index: true,
    },

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

    embedding: {
      type: [Number],
      default: undefined,
    },
    embeddingModel: {
      type: String,
      default: null,
    },

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

knowledgeChunkSchema.index({ documentId: 1, chunkIndex: 1 }, { unique: true });
knowledgeChunkSchema.index({ 'metadata.exam': 1, 'metadata.subject': 1 });
knowledgeChunkSchema.index({ 'metadata.exam': 1, 'metadata.topic': 1 });

knowledgeChunkSchema.index({ embedding: 1 }, { sparse: true });

const KnowledgeChunk = mongoose.model('KnowledgeChunk', knowledgeChunkSchema);

export default KnowledgeChunk;
