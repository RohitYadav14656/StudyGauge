import mongoose from 'mongoose';

const mockTestResultSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    mockTestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MockTest',
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    timeTakenMinutes: {
      type: Number,
    },
    analytics: {
      type: Map,
      of: mongoose.Schema.Types.Mixed, // e.g. section-wise scores
    },
  },
  {
    timestamps: true,
  }
);

mockTestResultSchema.index({ userId: 1, mockTestId: 1 });

const MockTestResult = mongoose.model('MockTestResult', mockTestResultSchema);

export default MockTestResult;
