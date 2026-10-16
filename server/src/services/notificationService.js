import Notification from '../models/Notification.js';
import Revision from '../models/Revision.js';
import StudyPlanItem from '../models/StudyPlanItem.js';
import StudyPlan from '../models/StudyPlan.js';
import Goal from '../models/Goal.js';
import UserExam from '../models/UserExam.js';
import Recommendation from '../models/Recommendation.js';
import StudySession from '../models/StudySession.js';

/**
 * Creates a notification if it doesn't already exist (deduplication check).
 */
export const createNotification = async (userId, notificationData) => {
  const {
    title,
    message,
    type = 'system',
    link,
    dedupKey,
    entityId,
    entityType,
    metadata = {},
    channels = { inApp: true, email: false, push: false },
  } = notificationData;

  // Deduplication check
  if (dedupKey) {
    const existing = await Notification.findOne({ userId, dedupKey });
    if (existing) {
      return { notification: existing, created: false };
    }
  }

  try {
    const notification = new Notification({
      userId,
      title,
      message,
      type,
      link,
      dedupKey,
      entityId,
      entityType,
      metadata,
      channels,
    });

    await notification.save();
    return { notification, created: true };
  } catch (error) {
    // Handle concurrent duplicate insertion (E11000)
    if (error.code === 11000 && dedupKey) {
      const existing = await Notification.findOne({ userId, dedupKey });
      if (existing) {
        return { notification: existing, created: false };
      }
    }
    throw error;
  }
};

/**
 * Get paginated user notifications with filtering and unread count.
 */
export const getUserNotifications = async (userId, options = {}) => {
  const page = parseInt(options.page, 10) || 1;
  const limit = parseInt(options.limit, 10) || 20;
  const skip = (page - 1) * limit;

  // Sync auto-generated notifications first
  try {
    await generateAutoNotifications(userId);
  } catch (err) {
    console.error('Error generating auto notifications:', err);
  }

  const query = { userId };

  if (options.isRead !== undefined && options.isRead !== '') {
    query.isRead = options.isRead === 'true' || options.isRead === true;
  }

  if (options.type && options.type !== 'all') {
    query.type = options.type;
  }

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments(query),
    Notification.countDocuments({ userId, isRead: false }),
  ]);

  return {
    notifications,
    total,
    unreadCount,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

/**
 * Get quick unread count for user badge.
 */
export const getUnreadCount = async (userId) => {
  try {
    await generateAutoNotifications(userId);
  } catch (err) {
    console.error('Error generating auto notifications for count:', err);
  }

  const unreadCount = await Notification.countDocuments({ userId, isRead: false });
  return { unreadCount };
};

/**
 * Mark single notification as read.
 */
export const markAsRead = async (userId, notificationId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { isRead: true, readAt: new Date() },
    { new: true }
  );

  if (!notification) {
    throw new Error('Notification not found');
  }

  return notification;
};

/**
 * Mark all notifications for user as read.
 */
export const markAllAsRead = async (userId) => {
  const result = await Notification.updateMany(
    { userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  return { modifiedCount: result.modifiedCount };
};

/**
 * Delete a notification.
 */
export const deleteNotification = async (userId, notificationId) => {
  const notification = await Notification.findOneAndDelete({ _id: notificationId, userId });

  if (!notification) {
    throw new Error('Notification not found');
  }

  return { success: true };
};

/**
 * Generator engine for 6 core in-app notification types.
 * Prevents spam and duplicate generation via `dedupKey`.
 */
export const generateAutoNotifications = async (userId) => {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // 1. REVISION DUE
  try {
    const dueRevisions = await Revision.find({
      userId,
      status: { $ne: 'COMPLETED' },
      nextRevisionDate: { $lte: now },
    })
      .populate('topicId', 'name')
      .limit(10)
      .lean();

    for (const rev of dueRevisions) {
      const topicName = rev.topicId?.name || 'Topic';
      const dedupKey = `revision_due:${userId}:${rev._id}:${todayStr}`;

      await createNotification(userId, {
        title: `Revision Due: ${topicName}`,
        message: `Topic "${topicName}" is scheduled for revision today. Keep your recall strong!`,
        type: 'revision_due',
        link: '/study-tracker',
        dedupKey,
        entityId: rev._id,
        entityType: 'Revision',
      });
    }
  } catch (err) {
    console.error('Error generating revision_due notifications:', err);
  }

  // 2. MISSED STUDY PLAN
  try {
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const userPlans = await StudyPlan.find({ userId }).select('_id').lean();
    const userPlanIds = userPlans.map((p) => p._id);

    if (userPlanIds.length > 0) {
      const missedItems = await StudyPlanItem.find({
        studyPlanId: { $in: userPlanIds },
        date: { $lt: startOfToday },
        status: { $in: ['planned', 'in_progress', 'missed'] },
      })
        .populate('topicId', 'name')
        .limit(10)
        .lean();

      for (const item of missedItems) {
        const itemDateStr = new Date(item.date).toISOString().split('T')[0];
        const titleText = item.title || item.topicId?.name || 'Study Task';
        const dedupKey = `missed_study_plan:${userId}:${item._id}:${itemDateStr}`;

        await createNotification(userId, {
          title: `Missed Study Task`,
          message: `Scheduled task "${titleText}" for ${itemDateStr} was missed. Rebalance your planner to stay on track.`,
          type: 'missed_study_plan',
          link: '/planner',
          dedupKey,
          entityId: item._id,
          entityType: 'StudyPlanItem',
        });
      }
    }
  } catch (err) {
    console.error('Error generating missed_study_plan notifications:', err);
  }

  // 3. GOAL PROGRESS
  try {
    const activeGoals = await Goal.find({ userId, status: 'in-progress' }).lean();

    for (const goal of activeGoals) {
      let currentValue = 0;

      if (goal.metric === 'study_hours') {
        const sessions = await StudySession.find({
          userId,
          startTime: { $gte: goal.startDate, $lte: goal.endDate },
        }).lean();
        const totalMinutes = sessions.reduce((acc, s) => acc + (s.durationMinutes || s.duration || 0), 0);
        currentValue = Math.round((totalMinutes / 60) * 10) / 10;
      }

      if (goal.targetValue > 0) {
        const percent = Math.min(100, Math.floor((currentValue / goal.targetValue) * 100));
        // Check milestone thresholds: 50%, 75%, 100%
        const milestones = [100, 75, 50];
        for (const milestone of milestones) {
          if (percent >= milestone) {
            const dedupKey = `goal_progress:${userId}:${goal._id}:${milestone}`;
            const msg =
              milestone === 100
                ? `Congratulations! You completed your goal "${goal.title}" (${currentValue}/${goal.targetValue})!`
                : `Great progress! You reached ${milestone}% of your goal "${goal.title}".`;

            await createNotification(userId, {
              title: milestone === 100 ? `Goal Achieved! 🎉` : `Goal Milestone Reached`,
              message: msg,
              type: 'goal_progress',
              link: '/goals',
              dedupKey,
              entityId: goal._id,
              entityType: 'Goal',
              metadata: { milestone, currentValue, targetValue: goal.targetValue },
            });
            break; // Stop at highest milestone reached
          }
        }
      }
    }
  } catch (err) {
    console.error('Error generating goal_progress notifications:', err);
  }

  // 4. RECOMMENDATION
  try {
    const pendingRecs = await Recommendation.find({ userId, status: 'pending' })
      .limit(5)
      .lean();

    for (const rec of pendingRecs) {
      const dedupKey = `recommendation:${userId}:${rec._id}`;
      await createNotification(userId, {
        title: `AI Recommendation: ${rec.title}`,
        message: rec.description || 'New adaptive recommendation available for your preparation.',
        type: 'recommendation',
        link: '/analytics',
        dedupKey,
        entityId: rec._id,
        entityType: 'Recommendation',
      });
    }
  } catch (err) {
    console.error('Error generating recommendation notifications:', err);
  }

  // 5. UPCOMING EXAM
  try {
    const userExams = await UserExam.find({ userId, status: 'active' })
      .populate('examId', 'name examDate')
      .lean();

    for (const ue of userExams) {
      const examDate = ue.targetDate || ue.examId?.examDate;
      if (!examDate) continue;

      const examName = ue.examId?.name || 'Target Exam';
      const targetTime = new Date(examDate).getTime();
      const diffDays = Math.ceil((targetTime - Date.now()) / (1000 * 60 * 60 * 24));

      // Trigger alerts at threshold days
      const targetMilestones = [30, 14, 7, 3, 1];
      for (const milestoneDays of targetMilestones) {
        if (diffDays > 0 && diffDays <= milestoneDays) {
          const dedupKey = `upcoming_exam:${userId}:${ue._id}:${milestoneDays}d`;
          await createNotification(userId, {
            title: `Upcoming Exam: ${examName}`,
            message: `${examName} is coming up in ${diffDays} day${diffDays > 1 ? 's' : ''}! Make sure your revision is on track.`,
            type: 'upcoming_exam',
            link: '/my-exams',
            dedupKey,
            entityId: ue._id,
            entityType: 'UserExam',
            metadata: { diffDays },
          });
          break; // Trigger highest applicable threshold
        }
      }
    }
  } catch (err) {
    console.error('Error generating upcoming_exam notifications:', err);
  }

  // 6. PLANNER CHANGES
  try {
    const userPlans = await StudyPlan.find({ userId }).select('_id').lean();
    const userPlanIds = userPlans.map((p) => p._id);

    if (userPlanIds.length > 0) {
      const modifiedItems = await StudyPlanItem.find({
        studyPlanId: { $in: userPlanIds },
        $or: [
          { rescheduleCount: { $gt: 0 } },
          { adaptationReason: { $exists: true, $ne: '' } },
        ],
      })
        .populate('topicId', 'name')
        .sort({ updatedAt: -1 })
        .limit(5)
        .lean();

      for (const item of modifiedItems) {
        const updatedStr = new Date(item.updatedAt || Date.now()).toISOString().split('T')[0];
        const dedupKey = `planner_changes:${userId}:${item._id}:${updatedStr}`;
        const itemTitle = item.title || item.topicId?.name || 'Study Schedule';

        await createNotification(userId, {
          title: `Planner Changes`,
          message: `Schedule updated for "${itemTitle}". Reason: ${item.adaptationReason || 'Adaptive rebalancing'}.`,
          type: 'planner_changes',
          link: '/planner',
          dedupKey,
          entityId: item._id,
          entityType: 'StudyPlanItem',
        });
      }
    }
  } catch (err) {
    console.error('Error generating planner_changes notifications:', err);
  }
};
