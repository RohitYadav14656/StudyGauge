import StudyPlanItem from '../models/StudyPlanItem.js';
import StudyPlan from '../models/StudyPlan.js';

export const getPlannerItems = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const userPlans = await StudyPlan.find({ userId: req.user._id }).select('_id');
    const planIds = userPlans.map((plan) => plan._id);

    let query = { studyPlanId: { $in: planIds } };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (startDate) {
      query.date = { $gte: new Date(startDate) };
    }

    const items = await StudyPlanItem.find(query)
      .populate('topicId', 'name')
      .populate('subjectId', 'name')
      .sort({ date: 1, priority: 1 });

    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updatePlannerItemStatus = async (req, res) => {
    try {
        const { status, actualDuration, completion } = req.body;

        const item = await StudyPlanItem.findById(req.params.itemId).populate('studyPlanId', 'userId');
        
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }
        
        if (item.studyPlanId.userId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        if (status) item.status = status;
        if (actualDuration !== undefined) item.actualDuration = actualDuration;
        if (completion !== undefined) item.completion = completion;

        const updatedItem = await item.save();
        res.json(updatedItem);

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}
