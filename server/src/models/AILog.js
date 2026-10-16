import mongoose from 'mongoose';

/**
 * AILog Schema - Anonymized AI Usage & Telemetry Log
 * 
 * IMPORTANT PRIVACY RULE:
 * This collection logs operational telemetry (token counts, latency, status, provider metadata)
 * WITHOUT storing sensitive user prompt text, context payload, or completion response text.
 */
const aiLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    provider: {
      type: String,
      required: true,
      enum: ['gemini', 'openai', 'anthropic', 'groq', 'mock'],
      index: true,
    },
    model: {
      type: String,
      required: true,
    },
    taskType: {
      type: String,
      required: true,
      enum: [
        'CONCEPT_EXPLANATION',
        'QUESTION_GENERATION',
        'STUDY_GUIDANCE',
        'REVISION_SUMMARY',
        'RAG_QUERY',
        'GENERAL_STUDY_HELP',
      ],
      index: true,
    },
    promptTokens: {
      type: Number,
      default: 0,
      min: 0,
    },
    completionTokens: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalTokens: {
      type: Number,
      default: 0,
      min: 0,
    },
    latencyMs: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      required: true,
      enum: ['SUCCESS', 'FAILED', 'FALLBACK'],
      index: true,
    },
    errorType: {
      type: String,
      default: null,
    },
    costEstimate: {
      type: Number,
      default: 0,
      min: 0,
    },
    isFallbackUsed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for analytical aggregation queries (e.g. daily token usage per user or overall provider health)
aiLogSchema.index({ createdAt: -1 });
aiLogSchema.index({ userId: 1, createdAt: -1 });
aiLogSchema.index({ provider: 1, status: 1 });

const AILog = mongoose.model('AILog', aiLogSchema);

export default AILog;
