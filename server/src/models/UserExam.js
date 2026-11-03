import mongoose from 'mongoose';

const userExamSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
    },
    targetDate: {
      type: Date,
    },
    targetScore: {
      type: String,
    },
    targetRank: {
      type: Number,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

userExamSchema.index({ userId: 1, examId: 1 }, { unique: true });

const UserExam = mongoose.model('UserExam', userExamSchema);

export default UserExam;
