import mongoose from 'mongoose';

const pyqSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
    },
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
    },
    year: {
      type: Number,
      required: true,
    },
    questionText: {
      type: String,
      required: true,
    },
    options: [
      {
        text: String,
        isCorrect: Boolean,
      },
    ],
    explanation: {
      type: String,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

pyqSchema.index({ examId: 1, subjectId: 1, year: 1 });
pyqSchema.index({ topicId: 1 });
pyqSchema.index({ difficulty: 1 });
pyqSchema.index({ tags: 1 });

pyqSchema.index({ questionText: 'text', tags: 'text' });

pyqSchema.index({ examId: 1, year: -1 });

const PYQ = mongoose.model('PYQ', pyqSchema);

export default PYQ;
