import mongoose from 'mongoose';

const pyqAttemptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    pyqId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PYQ',
      required: true,
    },
    isCorrect: {
      type: Boolean,
      required: true,
    },
    timeTakenSeconds: {
      type: Number,
    },
    selectedOptionIndex: {
      type: Number,
    },
    bookmarked: {
      type: Boolean,
      default: false,
    },
    markedForRevision: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Primary lookup: find a user's attempt for a specific PYQ
pyqAttemptSchema.index({ userId: 1, pyqId: 1 });
// Attempt history sorted by recency
pyqAttemptSchema.index({ userId: 1, createdAt: -1 });
// Bookmark listing
pyqAttemptSchema.index({ userId: 1, bookmarked: 1 });
// Revision listing
pyqAttemptSchema.index({ userId: 1, markedForRevision: 1 });
// Accuracy aggregations (group by isCorrect)
pyqAttemptSchema.index({ userId: 1, isCorrect: 1 });

const PYQAttempt = mongoose.model('PYQAttempt', pyqAttemptSchema);

export default PYQAttempt;

