import mongoose from 'mongoose';

const recommendationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    type: {
      type: String, // e.g. 'topic-review', 'practice-mock'
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId, // Can point to Topic, MockTest etc. depending on type
    },
    status: {
      type: String,
      enum: ['pending', 'acted', 'dismissed'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

recommendationSchema.index({ userId: 1, status: 1 });

const Recommendation = mongoose.model('Recommendation', recommendationSchema);

export default Recommendation;
