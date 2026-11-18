import { useState, useEffect, useMemo } from 'react';
import { plannerService } from '../../services/plannerService';
import { studyPlanService, StudyPlanItemData } from '../../services/studyPlanService';
import { getExams, getUserExams } from '../../services/examService';

type ViewMode = 'today' | 'week' | 'upcoming';

const formatLocalDate = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const Planner = () => {
  const [items, setItems] = useState<StudyPlanItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('today');
  const [isAdapting, setIsAdapting] = useState(false);
  const [adaptResultMsg, setAdaptResultMsg] = useState<string | null>(null);

  const [editingItem, setEditingItem] = useState<StudyPlanItemData | null>(null);
  const [editDuration, setEditDuration] = useState<number>(0);
  const [isUpdating, setIsUpdating] = useState(false);

  // Custom Plan Generation Modal State
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [availableExams, setAvailableExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [dailyHours, setDailyHours] = useState(4);
  const [prepLevel, setPrepLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [durationDays, setDurationDays] = useState(90);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchPlannerItems();
    loadExamsList();
  }, [viewMode]);

  const loadExamsList = async () => {
    try {
      const userExamsData = await getUserExams().catch(() => null);
      if (userExamsData && userExamsData.length > 0) {
        const mapped = userExamsData.map((ue: any) => ({
          _id: typeof ue.examId === 'string' ? ue.examId : ue.examId?._id,
          name: typeof ue.examId === 'object' ? ue.examId?.name : 'My Exam',
          isActive: ue.isActive,
        })).filter((e: any) => e._id);
        setAvailableExams(mapped);
        const active = mapped.find((e: any) => e.isActive) || mapped[0];
        if (active) setSelectedExamId(active._id);
      } else {
        const all = await getExams().catch(() => []);
        setAvailableExams(all);
        if (all.length > 0) setSelectedExamId(all[0]._id);
      }
    } catch (err) {
      console.error('Error preloading exams:', err);
    }
  };

  const fetchPlannerItems = async () => {
    try {
      setLoading(true);
      const today = new Date();
      let startStr = '';
      let endStr = '';

      if (viewMode === 'today') {
        startStr = formatLocalDate(today);
        endStr = startStr;
      } else if (viewMode === 'week') {
        const start = new Date(today);
        start.setDate(today.getDate() - today.getDay());
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        startStr = formatLocalDate(start);
        endStr = formatLocalDate(end);
      } else if (viewMode === 'upcoming') {
        const start = new Date(today);
        start.setDate(today.getDate() + 1);
        const end = new Date(today);
        end.setMonth(today.getMonth() + 3);
        startStr = formatLocalDate(start);
        endStr = formatLocalDate(end);
      }

      const fetchedItems = await plannerService.getPlannerItems(startStr, endStr);
      setItems(fetchedItems);
    } catch (error) {
      console.error('Error fetching planner items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (
    itemId: string,
    status: StudyPlanItemData['status'],
    actualDuration?: number
  ) => {
    try {
      setIsUpdating(true);
      await plannerService.updateItemStatus(itemId, {
        status,
        ...(actualDuration !== undefined && { actualDuration }),
      });
      await fetchPlannerItems();
      setEditingItem(null);
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAutoGeneratePlan = async (examIdToUse?: string) => {
    try {
      setIsGenerating(true);
      setAdaptResultMsg(null);
      let targetId = examIdToUse || selectedExamId;
      let targetName = 'Target Exam';

      if (!targetId) {
        const userExamsData = await getUserExams().catch(() => null);
        const activeUe = userExamsData?.find((ue: any) => ue.isActive) || userExamsData?.[0];
        if (activeUe) {
          targetId = typeof activeUe.examId === 'string' ? activeUe.examId : activeUe.examId._id;
          targetName = typeof activeUe.examId === 'object' ? activeUe.examId.name : 'Target Exam';
        } else {
          const allExams = await getExams().catch(() => []);
          if (allExams.length > 0) {
            targetId = allExams[0]._id;
            targetName = allExams[0].name;
          }
        }
      }

      if (!targetId) {
        setAdaptResultMsg('No exam available to generate a study schedule. Please select an exam in My Exams.');
        return;
      }

      const matched = availableExams.find((e) => e._id === targetId);
      if (matched) targetName = matched.name;

      const today = new Date();
      const startDate = formatLocalDate(today);
      const endDateObj = new Date(today);
      endDateObj.setDate(today.getDate() + (durationDays || 90));
      const endDate = formatLocalDate(endDateObj);

      await studyPlanService.generatePlan({
        examId: targetId,
        title: `${targetName} Adaptive Schedule`,
        startDate,
        endDate,
        dailyStudyHours: dailyHours || 4,
        preparationLevel: prepLevel || 'intermediate',
      });

      setAdaptResultMsg(`✓ Successfully created adaptive schedule for ${targetName}! Daily study blocks are now scheduled.`);
      setIsGenerateModalOpen(false);
      await fetchPlannerItems();
    } catch (err: any) {
      setAdaptResultMsg(err.response?.data?.message || 'Failed to auto-generate study schedule.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTriggerAdaptation = async () => {
    try {
      setIsAdapting(true);
      setAdaptResultMsg(null);
      const plans = await studyPlanService.getPlans();
      const activePlan = plans?.find((p: any) => p.status === 'active') || plans?.[0];

      if (!activePlan?._id) {
        // Automatically generate a new schedule for active exam instead of dead-ending!
        await handleAutoGeneratePlan();
        return;
      }

      const res = await studyPlanService.adaptPlan(activePlan._id, {
        prioritizeWeakTopics: true,
      });

      const msg = res?.data?.message || res?.message || 'Plan dynamically adapted based on actual vs planned study gap!';
      setAdaptResultMsg(`✓ ${msg}`);
      await fetchPlannerItems();
    } catch (err: any) {
      setAdaptResultMsg(err.response?.data?.message || 'Failed to run adaptive planning.');
    } finally {
      setIsAdapting(false);
    }
  };

  const groupedItems = useMemo(() => {
    return items.reduce((acc: any, item) => {
      const dateKey = new Date(item.date).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(item);
      return acc;
    }, {});
  }, [items]);

  const getPriorityBadge = (p: string) => {
    if (p === 'high') return 'sg-badge-red';
    if (p === 'medium') return 'sg-badge-amber';
    return 'sg-badge-teal';
  };

  const getStatusBadge = (s: string) => {
    if (s === 'completed') return 'sg-badge-teal';
    if (s === 'in_progress') return 'sg-badge-indigo';
    if (s === 'partially_completed') return 'sg-badge-amber';
    if (s === 'missed') return 'sg-badge-red';
    return 'bg-slate-100 text-slate-700 border border-slate-200';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[5px] border border-[#E2DECE] shadow-sm mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#DCE9E1] text-[#183D35] rounded-[5px] text-xs font-semibold mb-2">
            <span>📅</span> Dynamic Schedule
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#252B28] tracking-tight">
            Study Planner
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Planned vs Actual tracking, automatic schedule rebalancing, and daily focus blocks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsGenerateModalOpen(true)}
            className="sg-btn-secondary text-xs sm:text-sm py-2 px-3.5 rounded-[5px]"
          >
            ✨ New Schedule
          </button>
          <button
            onClick={handleTriggerAdaptation}
            disabled={isAdapting || isGenerating}
            className="sg-btn-primary text-xs sm:text-sm py-2 px-4 rounded-[5px] shadow-sm"
          >
            {isAdapting || isGenerating ? 'Recalculating...' : '🔄 Adapt Study Plan'}
          </button>
        </div>
      </div>

      {adaptResultMsg && (
        <div className="mb-6 p-4 bg-[#DCE9E1] border border-[#183D35]/20 rounded-[5px] text-sm font-semibold text-[#183D35] flex justify-between items-center">
          <span>{adaptResultMsg}</span>
          <button onClick={() => setAdaptResultMsg(null)} className="text-xs hover:underline font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-white rounded-[5px] border border-[#E2DECE] p-1 w-full max-w-sm mb-6 shadow-sm">
        {(['today', 'week', 'upcoming'] as ViewMode[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setViewMode(tab)}
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-[4px] capitalize transition-colors ${
              viewMode === tab
                ? 'bg-[#183D35] text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 flex justify-center items-center gap-3">
          <div className="w-6 h-6 border-4 border-[#DCE9E1] border-t-[#183D35] rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-slate-600">Loading study schedule...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-[5px] border border-[#E2DECE] shadow-sm p-8">
          <div className="text-4xl mb-3">📅</div>
          <h3 className="text-lg font-bold text-[#252B28]">No study tasks scheduled for {viewMode}</h3>
          <p className="text-slate-600 text-sm mt-1 max-w-md mx-auto">
            Generate or adapt study blocks across your daily hours based on syllabus priorities, target exam date, and preparation level.
          </p>
          <div className="flex flex-wrap justify-center items-center gap-3 mt-6">
            <button
              onClick={() => handleAutoGeneratePlan()}
              disabled={isGenerating}
              className="sg-btn-primary text-sm py-2.5 px-5 rounded-[5px] shadow-sm"
            >
              {isGenerating ? 'Generating...' : '🚀 Auto-Generate Schedule for Active Exam'}
            </button>
            <button
              onClick={() => setIsGenerateModalOpen(true)}
              className="sg-btn-secondary text-sm py-2.5 px-4 rounded-[5px]"
            >
              ⚙️ Customize Schedule
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.keys(groupedItems).map((dateKey) => (
            <div
              key={dateKey}
              className="bg-white rounded-[5px] border border-[#E2DECE] shadow-sm overflow-hidden"
            >
              <div className="bg-[#FAF8F3] px-6 py-3.5 border-b border-[#E2DECE] flex justify-between items-center">
                <h3 className="font-extrabold text-[#252B28] text-base">{dateKey}</h3>
                <span className="text-xs font-semibold text-slate-500">
                  {groupedItems[dateKey].length} study block{groupedItems[dateKey].length > 1 ? 's' : ''}
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {groupedItems[dateKey].map((item: any) => (
                  <div
                    key={item._id}
                    className={`p-6 flex flex-col md:flex-row gap-6 items-start transition-colors ${
                      item.status === 'completed' ? 'bg-[#F4FAF6]' : 'hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex-1 w-full">
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className={`sg-badge ${getPriorityBadge(item.priority)}`}>
                          {item.priority} Priority
                        </span>
                        <span className={`sg-badge ${getStatusBadge(item.status)}`}>
                          {item.status.replace('_', ' ')}
                        </span>
                        <span className="text-xs px-2.5 py-0.5 rounded-[4px] border border-[#E2DECE] text-slate-700 bg-white font-semibold capitalize">
                          {item.activityType}
                        </span>
                      </div>

                      <h4
                        className={`text-lg font-bold text-[#252B28] mb-1 ${
                          item.status === 'completed' ? 'line-through text-slate-400' : ''
                        }`}
                      >
                        {item.title}
                      </h4>

                      <div className="flex flex-wrap gap-4 text-xs text-slate-600 mb-3">
                        {item.subjectId?.name && (
                          <span>
                            <strong className="text-[#252B28]">Subject:</strong> {item.subjectId.name}
                          </span>
                        )}
                        {item.topicId?.name && (
                          <span>
                            <strong className="text-[#252B28]">Topic:</strong> {item.topicId.name}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-6 p-3 bg-[#FAF8F3] rounded-[5px] border border-[#E2DECE] text-xs">
                        <div>
                          <span className="text-slate-500 font-semibold uppercase">Planned:</span>{' '}
                          <strong className="text-[#252B28]">{item.plannedDuration} mins</strong>
                        </div>
                        <div className="w-px h-4 bg-slate-300"></div>
                        <div>
                          <span className="text-slate-500 font-semibold uppercase">Actual:</span>{' '}
                          <strong className={item.actualDuration > 0 ? 'text-[#183D35] font-bold' : 'text-slate-500'}>
                            {item.actualDuration > 0 ? `${item.actualDuration} mins` : '—'}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap sm:flex-nowrap md:flex-col gap-2 w-full md:w-44">
                      {item.status !== 'completed' && item.status !== 'cancelled' && (
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setEditDuration(item.plannedDuration);
                          }}
                          className="sg-btn-primary text-xs py-2 w-full rounded-[4px]"
                        >
                          ✓ Mark Done
                        </button>
                      )}
                      {item.status !== 'partially_completed' &&
                        item.status !== 'completed' &&
                        item.status !== 'cancelled' && (
                          <button
                            onClick={() => {
                              setEditingItem({ ...item, isPartial: true } as any);
                              setEditDuration(Math.floor(item.plannedDuration / 2));
                            }}
                            className="sg-btn-secondary text-xs py-2 w-full rounded-[4px]"
                          >
                            Partially Done
                          </button>
                        )}
                      {item.status !== 'cancelled' && item.status !== 'completed' && (
                        <button
                          onClick={() => handleUpdateStatus(item._id, 'rescheduled')}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-[4px] border border-[#E2DECE]"
                        >
                          Reschedule
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Completion Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-[5px] w-full max-w-sm border border-[#E2DECE] shadow-xl p-6">
            <h3 className="text-lg font-bold text-[#252B28] mb-1">
              {(editingItem as any).isPartial ? 'Partially Complete Task' : 'Complete Study Task'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">{editingItem.title}</p>

            <div className="mb-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Minutes Actually Spent:
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={editDuration}
                  onChange={(e) => setEditDuration(Number(e.target.value))}
                  className="w-full px-4 py-2.5 border border-[#E2DECE] rounded-[5px] font-bold text-[#252B28] outline-none focus:border-[#183D35]"
                />
                <span className="absolute right-4 top-2.5 text-xs text-slate-400 font-semibold">
                  mins
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Planned: {editingItem.plannedDuration} mins
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setEditingItem(null)}
                className="sg-btn-secondary flex-1 text-xs py-2 rounded-[4px]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleUpdateStatus(
                    editingItem._id!,
                    (editingItem as any).isPartial ? 'partially_completed' : 'completed',
                    editDuration
                  );
                }}
                disabled={isUpdating}
                className="sg-btn-primary flex-1 text-xs py-2 disabled:opacity-50 rounded-[4px]"
              >
                {isUpdating ? 'Saving...' : 'Save & Record'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customize Plan Modal */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-[5px] w-full max-w-md border border-[#E2DECE] shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xl">✨</span>
                <h3 className="text-lg font-extrabold text-[#252B28]">
                  Generate Adaptive Study Schedule
                </h3>
              </div>
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              StudyGauge distributes all syllabus topics across your available study hours, prioritizing high-weightage sections and scheduling spaced retention breaks.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Target Exam:
                </label>
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#E2DECE] rounded-[5px] text-sm font-semibold text-[#252B28] outline-none focus:border-[#183D35] bg-white"
                >
                  {availableExams.map((ex) => (
                    <option key={ex._id} value={ex._id}>
                      {ex.name} {ex.isActive ? '(Active)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Daily Study Hours:
                  </label>
                  <select
                    value={dailyHours}
                    onChange={(e) => setDailyHours(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#E2DECE] rounded-[5px] text-sm font-semibold text-[#252B28] outline-none focus:border-[#183D35] bg-white"
                  >
                    <option value={2}>2 Hours / Day</option>
                    <option value={3}>3 Hours / Day</option>
                    <option value={4}>4 Hours / Day (Optimal)</option>
                    <option value={6}>6 Hours / Day (Intensive)</option>
                    <option value={8}>8 Hours / Day (Full-Time)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Schedule Duration:
                  </label>
                  <select
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#E2DECE] rounded-[5px] text-sm font-semibold text-[#252B28] outline-none focus:border-[#183D35] bg-white"
                  >
                    <option value={30}>30 Days (Sprint)</option>
                    <option value={60}>60 Days (Standard)</option>
                    <option value={90}>90 Days (Quarterly)</option>
                    <option value={180}>180 Days (6 Months)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Preparation Level:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['beginner', 'intermediate', 'advanced'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setPrepLevel(lvl)}
                      className={`py-2 px-3 text-xs font-bold rounded-[4px] capitalize border transition-colors ${
                        prepLevel === lvl
                          ? 'bg-[#183D35] text-white border-[#183D35]'
                          : 'bg-white text-slate-700 border-[#E2DECE] hover:bg-slate-50'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {prepLevel === 'beginner' && 'Allocates 120 mins per topic with thorough concept coverage.'}
                  {prepLevel === 'intermediate' && 'Allocates 90 mins per topic with balanced theory and problem solving.'}
                  {prepLevel === 'advanced' && 'Allocates 60 mins per topic focusing on speed and high-difficulty questions.'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsGenerateModalOpen(false)}
                className="sg-btn-secondary text-xs py-2 px-4 rounded-[4px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleAutoGeneratePlan(selectedExamId)}
                disabled={isGenerating}
                className="sg-btn-primary text-xs py-2 px-5 rounded-[4px] shadow-sm disabled:opacity-50"
              >
                {isGenerating ? 'Generating Schedule...' : '🚀 Generate Adaptive Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Planner;
