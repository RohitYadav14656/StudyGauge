import mongoose from 'mongoose';
import Revision from '../models/Revision.js';
import Topic from '../models/Topic.js';

export const getStartAndEndOfDay = (dateInput = new Date(), timezoneOffsetMinutes = 0) => {
  const dateObj = new Date(dateInput);

  const localTimeMs = dateObj.getTime() - timezoneOffsetMinutes * 60 * 1000;
  const localDate = new Date(localTimeMs);

  const year = localDate.getUTCFullYear();
  const month = localDate.getUTCMonth();
  const day = localDate.getUTCDate();

  const startOfDayLocal = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  const endOfDayLocal = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));

  const startOfDay = new Date(startOfDayLocal.getTime() + timezoneOffsetMinutes * 60 * 1000);
  const endOfDay = new Date(endOfDayLocal.getTime() + timezoneOffsetMinutes * 60 * 1000);

  return { startOfDay, endOfDay };
};

export const calculateNextRevisionDate = (baseDate, intervals = [1, 3, 7, 14, 30], stage = 0) => {
  const safeStage = Math.max(0, Math.min(stage, intervals.length - 1));
  const intervalDays = intervals[safeStage] || 1;

  const nextDate = new Date(baseDate);
  nextDate.setDate(nextDate.getDate() + intervalDays);

  return { nextRevisionDate: nextDate, intervalDays };
};

export const getDueRevisions = async (userId, options = {}) => {
  const { examId, subjectId, timezoneOffset = 0, targetDate = new Date() } = options;
  const { startOfDay, endOfDay } = getStartAndEndOfDay(targetDate, Number(timezoneOffset) || 0);

  const query = {
    userId: new mongoose.Types.ObjectId(userId),
    nextRevisionDate: { $lte: endOfDay },
  };

  const revisions = await Revision.find(query)
    .populate({
      path: 'topicId',
      select: 'name subjectId examId',
      populate: [
        { path: 'subjectId', select: 'name' },
        { path: 'examId', select: 'name' },
      ],
    })
    .sort({ nextRevisionDate: 1 })
    .lean();

  let filtered = revisions;
  if (subjectId && mongoose.Types.ObjectId.isValid(subjectId)) {
    filtered = filtered.filter((r) => r.topicId?.subjectId?._id?.toString() === subjectId.toString());
  }
  if (examId && mongoose.Types.ObjectId.isValid(examId)) {
    filtered = filtered.filter((r) => r.topicId?.examId?._id?.toString() === examId.toString());
  }

  const mapped = filtered.map((rev) => {
    const revDate = new Date(rev.nextRevisionDate);
    let computedStatus = rev.status;

    if (revDate < startOfDay) {
      computedStatus = 'OVERDUE';
    } else if (revDate >= startOfDay && revDate <= endOfDay) {
      computedStatus = 'DUE';
    }

    return {
      ...rev,
      status: computedStatus,
    };
  });

  const dueTodayCount = mapped.filter((r) => r.status === 'DUE').length;
  const overdueCount = mapped.filter((r) => r.status === 'OVERDUE').length;

  return {
    targetDate: new Date(targetDate).toISOString(),
    startOfDay: startOfDay.toISOString(),
    endOfDay: endOfDay.toISOString(),
    dueTodayCount,
    overdueCount,
    totalDue: mapped.length,
    revisions: mapped,
  };
};

export const createOrUpdateRevision = async (userId, payload) => {
  const {
    topicId,
    action = 'COMPLETE',
    studiedDate,
    lastRevisedDate,
    quality = 5,
    intervals = [1, 3, 7, 14, 30],
  } = payload;

  const topicExists = await Topic.findById(topicId);
  if (!topicExists) {
    throw new Error('Topic not found');
  }

  let revision = await Revision.findOne({ userId, topicId });

  const now = new Date();

  if (!revision || action === 'SCHEDULE') {

    const initialStudiedDate = studiedDate ? new Date(studiedDate) : now;
    const stage = 0;
    const { nextRevisionDate, intervalDays } = calculateNextRevisionDate(initialStudiedDate, intervals, stage);

    if (!revision) {
      revision = new Revision({
        userId,
        topicId,
        studiedDate: initialStudiedDate,
        lastRevisedDate: null,
        revisionCount: 0,
        intervalStage: stage,
        nextRevisionDate,
        interval: intervalDays,
        intervals,
        status: nextRevisionDate <= now ? 'DUE' : 'PENDING',
      });
    } else {
      revision.studiedDate = initialStudiedDate;
      revision.intervals = intervals;
      revision.intervalStage = stage;
      revision.nextRevisionDate = nextRevisionDate;
      revision.interval = intervalDays;
      revision.status = nextRevisionDate <= now ? 'DUE' : 'PENDING';
    }
  } else if (action === 'COMPLETE') {

    const completionDate = lastRevisedDate ? new Date(lastRevisedDate) : now;
    revision.lastRevisedDate = completionDate;
    revision.revisionCount = (revision.revisionCount || 0) + 1;

    const nextStage = Math.min((revision.intervalStage || 0) + 1, (revision.intervals || intervals).length - 1);
    revision.intervalStage = nextStage;

    const activeIntervals = revision.intervals?.length > 0 ? revision.intervals : intervals;
    const { nextRevisionDate, intervalDays } = calculateNextRevisionDate(completionDate, activeIntervals, nextStage);

    revision.nextRevisionDate = nextRevisionDate;
    revision.interval = intervalDays;
    revision.status = nextRevisionDate <= now ? 'DUE' : 'PENDING';

    revision.reviewHistory.push({
      date: completionDate,
      quality,
      stage: nextStage,
    });
  }

  await revision.save();

  return Revision.findById(revision._id).populate({
    path: 'topicId',
    select: 'name subjectId examId',
    populate: [
      { path: 'subjectId', select: 'name' },
      { path: 'examId', select: 'name' },
    ],
  });
};
