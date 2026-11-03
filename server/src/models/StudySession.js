import mongoose from 'mongoose';

const studySessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
    },
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
    },
    studyPlanItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudyPlanItem',
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endTime: {
      type: Date,
    },
    durationMinutes: {
      type: Number,
    },
    studyType: {
      type: String,
      enum: ['Lecture', 'Reading', 'Practice', 'PYQ', 'Mock Test', 'Revision'],
      required: true,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

studySessionSchema.index({ userId: 1, date: -1 });
studySessionSchema.index({ userId: 1, subjectId: 1 });
studySessionSchema.index({ userId: 1, topicId: 1 });
studySessionSchema.index({ userId: 1, studyType: 1 });

const StudySession = mongoose.model('StudySession', studySessionSchema);

export default StudySession;
