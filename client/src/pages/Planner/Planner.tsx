import { useState, useEffect, useMemo } from 'react';
import { plannerService } from '../../services/plannerService';
import { studyPlanService, StudyPlanItemData } from '../../services/studyPlanService';

type ViewMode = 'today' | 'week' | 'upcoming';

const Planner = () => {
  const [items, setItems] = useState<StudyPlanItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('today');
  const [isAdapting, setIsAdapting] = useState(false);
  const [adaptResultMsg, setAdaptResultMsg] = useState<string | null>(null);

  const [editingItem, setEditingItem] = useState<StudyPlanItemData | null>(null);
  const [editDuration, setEditDuration] = useState<number>(0);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchPlannerItems();
  }, [viewMode]);

  const fetchPlannerItems = async () => {
    try {
      setLoading(true);
      const today = new Date();
      let startStr = '';
      let endStr = '';

      if (viewMode === 'today') {
        startStr = today.toISOString().split('T')[0];
        endStr = startStr;
      } else if (viewMode === 'week') {
        const start = new Date(today);
        start.setDate(today.getDate() - today.getDay());
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        startStr = start.toISOString().split('T')[0];
        endStr = end.toISOString().split('T')[0];
      } else if (viewMode === 'upcoming') {
        const start = new Date(today);
        start.setDate(today.getDate() + 1);
        const end = new Date(today);
        end.setMonth(today.getMonth() + 3);
        startStr = start.toISOString().split('T')[0];
        endStr = end.toISOString().split('T')[0];
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

  const handleTriggerAdaptation = async () => {
    try {
      setIsAdapting(true);
      setAdaptResultMsg(null);
      const plans = await studyPlanService.getPlans();
      const activePlan = plans?.find((p: any) => p.status === 'active') || plans?.[0];

      if (!activePlan?._id) {
        setAdaptResultMsg('No active study plan found. Please generate an initial plan in My Exams.');
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
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200  mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-semibold mb-2">
            <span>📅</span> Dynamic Schedule
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Study Planner
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Planned vs Actual tracking, automatic schedule rebalancing, and daily focus blocks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleTriggerAdaptation}
            disabled={isAdapting}
            className="sg-btn-primary text-sm "
          >
            {isAdapting ? 'Recalculating...' : '🔄 Adapt Study Plan'}
          </button>
        </div>
      </div>

      {adaptResultMsg && (
        <div className="mb-6 p-4 bg-teal-50 border border-teal-200 rounded-xl text-sm font-semibold text-teal-800 flex justify-between items-center">
          <span>{adaptResultMsg}</span>
          <button onClick={() => setAdaptResultMsg(null)} className="text-xs hover:underline">
            ✕
          </button>
        </div>
      )}

      <div className="flex bg-white rounded-xl  border border-slate-200 p-1 w-full max-w-sm mb-6">
        {(['today', 'week', 'upcoming'] as ViewMode[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setViewMode(tab)}
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg capitalize  ${
              viewMode === tab
                ? 'bg-indigo-600 text-white '
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 flex justify-center items-center gap-3">
          <div className="w-6 h-6 border-4 border-slate-200 border-t-indigo-600 rounded-xl "></div>
          <span className="text-sm font-medium">Loading planner items...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-xl border border-slate-200  p-8">
          <div className="text-4xl mb-3">📅</div>
          <h3 className="text-lg font-bold text-slate-800">No study tasks scheduled for {viewMode}</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
            Click Adapt Study Plan to automatically generate and distribute study blocks across your available daily hours.
          </p>
          <button onClick={handleTriggerAdaptation} className="sg-btn-primary mt-6 text-sm">
            Generate Adapted Tasks
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.keys(groupedItems).map((dateKey) => (
            <div
              key={dateKey}
              className="bg-white rounded-xl  border border-slate-200 overflow-hidden"
            >
              <div className="bg-slate-50 px-6 py-3.5 border-b border-slate-200">
                <h3 className="font-extrabold text-slate-800 text-base">{dateKey}</h3>
              </div>

              <div className="divide-y divide-slate-100">
                {groupedItems[dateKey].map((item: any) => (
                  <div
                    key={item._id}
                    className={`p-6 flex flex-col md:flex-row gap-6 items-start  ${
                      item.status === 'completed' ? 'bg-teal-50/30' : 'hover:bg-slate-50/50'
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
                        <span className="text-xs px-2.5 py-0.5 rounded-xl border border-slate-200 text-slate-600 bg-slate-50 font-semibold capitalize">
                          {item.activityType}
                        </span>
                      </div>

                      <h4
                        className={`text-lg font-bold text-slate-900 mb-1 ${
                          item.status === 'completed' ? 'line-through text-slate-400' : ''
                        }`}
                      >
                        {item.title}
                      </h4>

                      <div className="flex flex-wrap gap-4 text-xs text-slate-500 mb-3">
                        {item.subjectId?.name && (
                          <span>
                            <strong className="text-slate-700">Subject:</strong> {item.subjectId.name}
                          </span>
                        )}
                        {item.topicId?.name && (
                          <span>
                            <strong className="text-slate-700">Topic:</strong> {item.topicId.name}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-6 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                        <div>
                          <span className="text-slate-400 font-semibold uppercase">Planned:</span>{' '}
                          <strong className="text-slate-800">{item.plannedDuration} mins</strong>
                        </div>
                        <div className="w-px h-4 bg-slate-200"></div>
                        <div>
                          <span className="text-slate-400 font-semibold uppercase">Actual:</span>{' '}
                          <strong className={item.actualDuration > 0 ? 'text-teal-700 font-bold' : 'text-slate-500'}>
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
                          className="sg-btn-primary text-xs py-2 w-full"
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
                            className="sg-btn-secondary text-xs py-2 w-full"
                          >
                            Partially Done
                          </button>
                        )}
                      {item.status !== 'cancelled' && item.status !== 'completed' && (
                        <button
                          onClick={() => handleUpdateStatus(item._id, 'rescheduled')}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200"
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

      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-sm border border-slate-200  p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {(editingItem as any).isPartial ? 'Partially Complete Task' : 'Complete Study Task'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">{editingItem.title}</p>

            <div className="mb-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Minutes Actually Spent:
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={editDuration}
                  onChange={(e) => setEditDuration(Number(e.target.value))}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none focus:border-indigo-600"
                />
                <span className="absolute right-4 top-2.5 text-xs text-slate-400 font-semibold">
                  mins
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Planned: {editingItem.plannedDuration} mins
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setEditingItem(null)}
                className="sg-btn-secondary flex-1 text-xs py-2"
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
                className="sg-btn-primary flex-1 text-xs py-2 disabled:opacity-50"
              >
                {isUpdating ? 'Saving...' : 'Save & Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Planner;
