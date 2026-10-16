import mongoose from 'mongoose';

const revisionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
      required: true,
    },
    studiedDate: {
      type: Date,
      default: Date.now,
    },
    lastRevisedDate: {
      type: Date,
      default: null,
    },
    revisionCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    intervalStage: {
      type: Number,
      default: 0,
      min: 0,
    },
    nextRevisionDate: {
      type: Date,
      required: true,
    },
    // Alias field for backward compatibility
    nextReviewDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['PENDING', 'DUE', 'COMPLETED', 'OVERDUE'],
      default: 'PENDING',
    },
    intervals: {
      type: [Number],
      default: [1, 3, 7, 14, 30],
    },
    interval: {
      type: Number, // days until next review
      default: 1,
    },
    easeFactor: {
      type: Number, // e.g. SuperMemo-2
      default: 2.5,
    },
    reviewHistory: [
      {
        date: { type: Date, default: Date.now },
        quality: { type: Number, min: 0, max: 5 }, // 0: forgot, 5: perfect
        stage: { type: Number, default: 0 },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Middleware to sync nextReviewDate with nextRevisionDate
revisionSchema.pre('save', function (next) {
  if (this.nextRevisionDate && !this.nextReviewDate) {
    this.nextReviewDate = this.nextRevisionDate;
  } else if (this.nextReviewDate && !this.nextRevisionDate) {
    this.nextRevisionDate = this.nextReviewDate;
  }
  next();
});

revisionSchema.index({ userId: 1, topicId: 1 }, { unique: true });
revisionSchema.index({ userId: 1, nextRevisionDate: 1, status: 1 });

const Revision = mongoose.model('Revision', revisionSchema);

export default Revision;
