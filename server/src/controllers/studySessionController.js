import StudySession from '../models/StudySession.js';

export const createStudySession = async (req, res, next) => {
  try {
    const sessionData = {
      ...req.body,
      userId: req.user._id,
    };

    if (sessionData.timerEvents && sessionData.timerEvents.length > 0) {
      let durationMs = 0;
      let lastStartTime = null;
      let firstStartTime = null;
      let lastEndTime = null;

      const sortedEvents = [...sessionData.timerEvents].sort(
        (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
      );

      for (const event of sortedEvents) {
        const eventTime = new Date(event.time);
        
        if (event.type === 'start') {
          lastStartTime = eventTime;
          if (!firstStartTime) firstStartTime = eventTime;
        } else if (event.type === 'resume') {
          lastStartTime = eventTime;
        } else if (event.type === 'pause' || event.type === 'stop') {
          if (lastStartTime) {
            durationMs += eventTime.getTime() - lastStartTime.getTime();
            lastStartTime = null;
          }
          lastEndTime = eventTime;
        }
      }

      sessionData.startTime = firstStartTime || new Date();
      sessionData.endTime = lastEndTime || new Date();
      sessionData.durationMinutes = Math.max(0, Math.round(durationMs / 60000));

      delete sessionData.timerEvents;
    } else if (sessionData.endTime && sessionData.startTime && !sessionData.durationMinutes) {

      const start = new Date(sessionData.startTime);
      const end = new Date(sessionData.endTime);
      const diffMs = end - start;
      sessionData.durationMinutes = Math.max(0, Math.round(diffMs / 60000));
    }

    if (!sessionData.startTime) {
       sessionData.startTime = new Date();
    }
    
    const studySession = await StudySession.create(sessionData);
    res.status(201).json(studySession);
  } catch (error) {
    next(error);
  }
};

export const getStudySessions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = { userId: req.user._id };

    if (req.query.subjectId) {
      query.subjectId = req.query.subjectId;
    }
    if (req.query.topicId) {
      query.topicId = req.query.topicId;
    }
    if (req.query.examId) {
      query.examId = req.query.examId;
    }
    if (req.query.studyType) {
      query.studyType = req.query.studyType;
    }

    if (req.query.startDate || req.query.endDate) {
      query.date = {};
      if (req.query.startDate) {
        query.date.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.date.$lte = new Date(req.query.endDate);
      }
    }

    const studySessions = await StudySession.find(query)
      .sort({ date: -1, startTime: -1 })
      .skip(skip)
      .limit(limit)
      .populate('examId', 'name')
      .populate('subjectId', 'name')
      .populate('topicId', 'name');

    const total = await StudySession.countDocuments(query);

    res.json({
      data: studySessions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateStudySession = async (req, res, next) => {
  try {
    const studySession = await StudySession.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!studySession) {
      res.status(404);
      throw new Error('Study session not found or you are not authorized to update it');
    }

    const updatedData = { ...req.body };
    const startTime = updatedData.startTime ? new Date(updatedData.startTime) : studySession.startTime;
    const endTime = updatedData.endTime ? new Date(updatedData.endTime) : studySession.endTime;

    if (endTime && startTime && updatedData.endTime && !updatedData.durationMinutes) {
       const diffMs = endTime - startTime;
       updatedData.durationMinutes = Math.max(0, Math.round(diffMs / 60000));
    }

    const updatedSession = await StudySession.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true, runValidators: true }
    )
      .populate('examId', 'name')
      .populate('subjectId', 'name')
      .populate('topicId', 'name');

    res.json(updatedSession);
  } catch (error) {
    next(error);
  }
};

export const deleteStudySession = async (req, res, next) => {
  try {
    const studySession = await StudySession.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!studySession) {
      res.status(404);
      throw new Error('Study session not found or you are not authorized to delete it');
    }

    await studySession.deleteOne();

    res.json({ message: 'Study session removed successfully' });
  } catch (error) {
    next(error);
  }
};
