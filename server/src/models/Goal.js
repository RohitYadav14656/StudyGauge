import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    period: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'long-term'],
      required: true,
    },
    metric: {
      type: String,
      enum: ['study_hours', 'topics_completed', 'pyqs_attempted', 'mock_tests_completed'],
      required: true,
    },
    targetValue: {
      type: Number,
      required: true,
      min: 0,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['in-progress', 'achieved', 'abandoned', 'failed'],
      default: 'in-progress',
    },
  },
  {
    timestamps: true,
  }
);

goalSchema.index({ userId: 1, status: 1 });

const Goal = mongoose.model('Goal', goalSchema);

export default Goal;
