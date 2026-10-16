import { useState, useEffect, useMemo } from 'react';
import { plannerService } from '../../services/plannerService';
import { StudyPlanItemData } from '../../services/studyPlanService';

type ViewMode = 'today' | 'week' | 'upcoming';

const Planner = () => {
  const [items, setItems] = useState<StudyPlanItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('today');
  
  // Edit/Duration Modal
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
        end.setMonth(today.getMonth() + 3); // next 3 months
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

  const handleUpdateStatus = async (itemId: string, status: StudyPlanItemData['status'], actualDuration?: number) => {
    try {
      setIsUpdating(true);
      await plannerService.updateItemStatus(itemId, { 
        status, 
        ...(actualDuration !== undefined && { actualDuration }) 
      });
      await fetchPlannerItems();
      setEditingItem(null);
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const groupedItems = useMemo(() => {
    const grouped = items.reduce((acc: any, item) => {
      const dateKey = new Date(item.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(item);
      return acc;
    }, {});
    return grouped;
  }, [items]);

  const getPriorityColor = (p: string) => {
    if (p === 'high') return 'text-rose-300 bg-rose-500/15 border-rose-500/30';
    if (p === 'medium') return 'text-amber-300 bg-amber-500/15 border-amber-500/30';
    return 'text-sky-300 bg-sky-500/15 border-sky-500/30';
  };

  const getStatusColor = (s: string) => {
    if (s === 'completed') return 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30';
    if (s === 'in_progress') return 'text-sky-300 bg-sky-500/15 border-sky-500/30';
    if (s === 'partially_completed') return 'text-amber-300 bg-amber-500/15 border-amber-500/30';
    if (s === 'missed') return 'text-rose-300 bg-rose-500/15 border-rose-500/30';
    if (s === 'rescheduled') return 'text-purple-300 bg-purple-500/15 border-purple-500/30';
    if (s === 'cancelled') return 'text-slate-400 bg-slate-800/50 border-slate-700';
    return 'text-slate-300 bg-slate-800/40 border-slate-700';
  };

  const getDurationColor = (planned: number, actual: number, status: string) => {
      if (status === 'completed' || status === 'partially_completed') {
          if (actual > planned) return 'text-amber-400 font-semibold'; // took longer
          if (actual < planned) return 'text-emerald-400 font-semibold'; // finished early
          return 'text-sky-400 font-semibold'; // exactly on time
      }
      return 'text-slate-400 font-medium';
  };

  return (
    <div className="min-h-screen bg-slate-950/40 text-slate-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 backdrop-blur-xl shadow-xl">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              Study Planner
            </h1>
            <p className="text-slate-400 text-sm mt-1">Track and manage your daily preparation tasks.</p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex bg-slate-900/80 rounded-xl shadow-lg border border-slate-800 p-1 w-full max-w-sm">
          {(['today', 'week', 'upcoming'] as ViewMode[]).map(tab => (
            <button
              key={tab}
              onClick={() => setViewMode(tab)}
              className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg capitalize transition-all ${
                viewMode === tab ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Planner Board */}
        {loading ? (
          <div className="py-20 text-center text-slate-400 flex justify-center items-center gap-3">
              <div className="w-5 h-5 border-4 border-blue-400 border-t-blue-600 rounded-full animate-spin"></div>
              Loading planner...
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center bg-slate-900/60 rounded-2xl border border-slate-800/80 shadow-xl backdrop-blur-xl">
            <p className="text-slate-400 text-base sm:text-lg">No study items scheduled for {viewMode}.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.keys(groupedItems).map(dateKey => (
              <div key={dateKey} className="bg-slate-900/60 rounded-2xl shadow-xl border border-slate-800/80 backdrop-blur-xl overflow-hidden">
                <div className="bg-slate-950/60 px-6 py-4 border-b border-slate-800/80">
                  <h3 className="font-bold text-slate-200 text-lg">{dateKey}</h3>
                </div>
                <div className="divide-y divide-slate-800/60">
                  {groupedItems[dateKey].map((item: any) => (
                    <div key={item._id} className={`p-6 flex flex-col md:flex-row gap-6 items-start transition-colors ${item.status === 'completed' ? 'bg-emerald-950/20' : 'hover:bg-slate-800/20'}`}>
                      <div className="flex-1 w-full">
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className={`text-xs px-2.5 py-1 rounded-md border font-bold uppercase tracking-wide shadow-sm ${getPriorityColor(item.priority)}`}>
                            {item.priority}
                          </span>
                          <span className={`text-xs px-2.5 py-1 rounded-md border font-semibold capitalize shadow-sm ${getStatusColor(item.status)}`}>
                            {item.status.replace('_', ' ')}
                          </span>
                          <span className="text-xs px-2.5 py-1 rounded-md border border-slate-700 text-slate-300 bg-slate-950 font-medium capitalize shadow-sm">
                            {item.activityType}
                          </span>
                        </div>
                        <h4 className={`text-lg sm:text-xl font-bold text-slate-100 mb-2 ${item.status === 'completed' ? 'line-through opacity-70' : ''}`}>
                            {item.title}
                        </h4>
                        
                        <div className="flex flex-col gap-1 mb-4">
                            {item.subjectId && item.subjectId.name && (
                                <p className="text-xs sm:text-sm text-slate-400 flex items-center gap-2">
                                    <span className="font-medium text-slate-300">Subject:</span> {item.subjectId.name}
                                </p>
                            )}
                            {item.topicId && item.topicId.name && (
                                <p className="text-xs sm:text-sm text-slate-400 flex items-center gap-2">
                                    <span className="font-medium text-slate-300">Topic:</span> {item.topicId.name}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-6 p-3 bg-slate-950/60 rounded-xl border border-slate-800 mt-2">
                          <div className="flex flex-col">
                              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Planned Duration</span>
                              <span className="text-sm font-semibold text-slate-200">{item.plannedDuration} mins</span>
                          </div>
                          
                          <div className="w-px bg-slate-800"></div>
                          
                          <div className="flex flex-col">
                              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Actual Duration</span>
                              <span className={`text-sm ${getDurationColor(item.plannedDuration, item.actualDuration, item.status)}`}>
                                  {item.actualDuration > 0 ? `${item.actualDuration} mins` : '—'}
                              </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap sm:flex-nowrap md:flex-col gap-2 w-full md:w-48 self-stretch justify-start">
                        {item.status !== 'completed' && item.status !== 'cancelled' && (
                          <button 
                            onClick={() => { setEditingItem(item); setEditDuration(item.plannedDuration); }}
                            className="px-4 py-2 text-xs sm:text-sm bg-emerald-600 text-white hover:bg-emerald-500 rounded-xl font-semibold transition-colors text-center flex-1 md:w-full shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2"
                          >
                            ✓ Mark Done
                          </button>
                        )}
                        {item.status !== 'partially_completed' && item.status !== 'completed' && item.status !== 'cancelled' && (
                           <button 
                             onClick={() => { setEditingItem({...item, isPartial: true} as any); setEditDuration(Math.floor(item.plannedDuration / 2)); }}
                             className="px-4 py-2 text-xs sm:text-sm bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 rounded-xl font-semibold transition-colors text-center flex-1 md:w-full active:scale-95"
                           >
                             Partially Complete
                           </button>
                        )}
                        {item.status !== 'cancelled' && item.status !== 'completed' && (
                            <button 
                                onClick={() => handleUpdateStatus(item._id, 'rescheduled')}
                                className="px-4 py-2 text-xs sm:text-sm bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 rounded-xl font-semibold transition-colors text-center flex-1 md:w-full active:scale-95"
                            >
                                Reschedule
                            </button>
                        )}
                        {item.status !== 'missed' && (
                            <button 
                                onClick={() => handleUpdateStatus(item._id, 'missed')}
                                className="px-4 py-2 text-xs sm:text-sm bg-rose-950/30 text-rose-400 hover:bg-rose-900/40 border border-rose-800/50 rounded-xl font-semibold transition-colors text-center flex-1 md:w-full active:scale-95 md:mt-auto"
                            >
                                Cancel Task
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
      </div>

      {/* Actual Duration Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 rounded-2xl w-full max-w-sm border border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
              <h3 className="text-lg font-bold text-slate-100">
                  {/* @ts-ignore */}
                  {editingItem.isPartial ? 'Partially Complete' : 'Complete Task'}
              </h3>
              <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-slate-200 rounded-lg p-1 hover:bg-slate-800 transition-colors">
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                  <p className="text-sm font-semibold text-slate-200 mb-4">{editingItem.title}</p>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">How many minutes did you spend?</label>
                  <div className="relative">
                      <input 
                          type="number" 
                          min="0"
                          value={editDuration}
                          onChange={e => setEditDuration(Number(e.target.value))}
                          className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:border-blue-500 outline-none text-lg font-bold text-slate-100"
                      />
                      <span className="absolute right-4 top-3 text-slate-400 font-semibold text-sm">mins</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Planned: {editingItem.plannedDuration} mins</p>
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  onClick={() => setEditingItem(null)}
                  className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl hover:bg-slate-700 font-semibold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                      // @ts-ignore
                      handleUpdateStatus(editingItem._id!, editingItem.isPartial ? 'partially_completed' : 'completed', editDuration)
                  }}
                  disabled={isUpdating}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 font-semibold text-sm shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center"
                >
                  {isUpdating ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Planner;
