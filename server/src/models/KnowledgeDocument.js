import mongoose from 'mongoose';
import crypto from 'crypto';

/**
 * KnowledgeDocument Schema
 *
 * Represents a top-level document ingested into the RAG knowledge base.
 * Tracks ingestion state, metadata, security hash (dedup + integrity),
 * and rich educational metadata for filtered semantic retrieval.
 */
const knowledgeDocumentSchema = new mongoose.Schema(
  {
    // ─── Content Identity ────────────────────────────────────────────────────
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    rawContent: {
      type: String,
      required: true,
    },
    contentHash: {
      type: String,
      unique: true,
      index: true,
    },
    contentType: {
      type: String,
      enum: ['text', 'markdown', 'pdf_extracted', 'web_scraped'],
      default: 'text',
    },
    sourceUrl: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Educational Metadata ────────────────────────────────────────────────
    metadata: {
      exam: {
        type: String,
        trim: true,
        default: null,
        index: true,
      },
      subject: {
        type: String,
        trim: true,
        default: null,
        index: true,
      },
      topic: {
        type: String,
        trim: true,
        default: null,
        index: true,
      },
      source: {
        type: String,
        trim: true,
        default: null,
      },
      difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', null],
        default: null,
        index: true,
      },
      tags: {
        type: [String],
        default: [],
      },
      year: {
        type: Number,
        default: null,
      },
      language: {
        type: String,
        default: 'en',
      },
    },

    // ─── Ingestion State ─────────────────────────────────────────────────────
    isProcessed: {
      type: Boolean,
      default: false,
      index: true,
    },
    processingStatus: {
      type: String,
      enum: ['pending', 'chunking', 'embedding', 'complete', 'failed'],
      default: 'pending',
    },
    processingError: {
      type: String,
      default: null,
    },
    totalChunks: {
      type: Number,
      default: 0,
    },
    charCount: {
      type: Number,
      default: 0,
    },

    // ─── Security & Safety ───────────────────────────────────────────────────
    safetyFlags: {
      hasSuspiciousContent: { type: Boolean, default: false },
      hasPromptInjectionRisk: { type: Boolean, default: false },
      flagReason: { type: String, default: null },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // ─── Authorship ──────────────────────────────────────────────────────────
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Compound Indexes for filtered vector retrieval ───────────────────────────
knowledgeDocumentSchema.index({ 'metadata.exam': 1, 'metadata.subject': 1, isActive: 1 });
knowledgeDocumentSchema.index({ 'metadata.exam': 1, 'metadata.topic': 1, isActive: 1 });
knowledgeDocumentSchema.index({ processingStatus: 1, isActive: 1 });

// ─── Pre-validate: compute deterministic SHA-256 content hash ────────────────
knowledgeDocumentSchema.pre('validate', function (next) {
  if (this.rawContent && !this.contentHash) {
    this.contentHash = crypto
      .createHash('sha256')
      .update(this.rawContent.trim())
      .digest('hex');
  }
  if (this.rawContent) {
    this.charCount = this.rawContent.length;
  }
  next();
});

const KnowledgeDocument = mongoose.model('KnowledgeDocument', knowledgeDocumentSchema);

export default KnowledgeDocument;
