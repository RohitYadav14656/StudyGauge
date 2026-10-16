import mongoose from 'mongoose';

const studyPlanItemSchema = new mongoose.Schema(
  {
    studyPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudyPlan',
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
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
    },
    title: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    plannedDuration: {
      type: Number,
      default: 60,
    },
    actualDuration: {
      type: Number,
      default: 0,
    },
    activityType: {
      type: String,
      enum: ['reading', 'revision', 'practice', 'mock_test', 'other'],
      default: 'reading',
    },
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['planned', 'in_progress', 'completed', 'partially_completed', 'missed', 'rescheduled'],
      default: 'planned',
    },
    completion: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
    rescheduleCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    originalDate: {
      type: Date,
    },
    adaptationReason: {
      type: String,
      trim: true,
    },
    isProtectedRevision: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

studyPlanItemSchema.index({ studyPlanId: 1, date: 1 });
studyPlanItemSchema.index({ examId: 1 });

const StudyPlanItem = mongoose.model('StudyPlanItem', studyPlanItemSchema);

export default StudyPlanItem;
