import mongoose from 'mongoose';

const mockTestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    testName: {
      type: String,
      required: true,
      trim: true,
    },
    exam: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    totalMarks: {
      type: Number,
      required: true,
    },
    obtainedMarks: {
      type: Number,
      required: true,
    },
    questionsAttempted: {
      type: Number,
      required: true,
    },
    correct: {
      type: Number,
      required: true,
    },
    wrong: {
      type: Number,
      required: true,
    },
    timeTaken: {
      type: Number, // in minutes
      required: true,
    },
    subjectPerformance: [
      {
        subject: {
          type: String,
          required: true,
        },
        score: {
          type: Number,
          required: true,
        },
      }
    ],
    topicPerformance: [
      {
        topic: {
          type: String,
          required: true,
        },
        score: {
          type: Number,
          required: true,
        },
      }
    ],
  },
  {
    timestamps: true,
  }
);

mockTestSchema.index({ userId: 1, date: -1 });

const MockTest = mongoose.model('MockTest', mockTestSchema);

export default MockTest;
