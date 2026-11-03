import mongoose from 'mongoose';

const userTopicProgressSchema = new mongoose.Schema(
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
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
      required: true,
    },
    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Completed', 'Revised'],
      default: 'Not Started',
    },
  },
  {
    timestamps: true,
  }
);

userTopicProgressSchema.index({ userId: 1, topicId: 1 }, { unique: true });

userTopicProgressSchema.index({ userId: 1, examId: 1 });

const UserTopicProgress = mongoose.model('UserTopicProgress', userTopicProgressSchema);

export default UserTopicProgress;
