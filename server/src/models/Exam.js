import mongoose from 'mongoose';

const examSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
    },
    level: {
      type: String,
      trim: true,
    },
    metadata: {
      // For any exam-specific extensible properties
      type: Map,
      of: String,
    },
  },
  {
    timestamps: true,
  }
);

const Exam = mongoose.model('Exam', examSchema);

export default Exam;
