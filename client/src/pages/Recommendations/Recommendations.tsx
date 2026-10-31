import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  recommendationService,
  RecommendationItem,
} from '../../services/recommendationService';

const Recommendations: React.FC = () => {
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableTime, setAvailableTime] = useState<number>(60);
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await recommendationService.getRecommendations({
        availableTime,
        limit: 15,
      });
      if (res.success && res.data) {
        setRecommendations(res.data.recommendations);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error loading recommendations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [availableTime]);

  const filteredRecs = recommendations.filter((rec) => {
    if (selectedLevel === 'ALL') return true;
    return rec.priority.level === selectedLevel;
  });

  const getBadgeClass = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'sg-badge-red';
      case 'HIGH':
        return 'sg-badge-amber';
      case 'MEDIUM':
        return 'sg-badge-teal';
      default:
        return 'sg-badge-indigo';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-semibold mb-2">
            <span>💡</span> Smart Recommendations
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Topic Recommendations
          </h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">
            Priority topics to review next based on test accuracy, syllabus gaps, and revision intervals.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 ">
            <span className="text-xs font-semibold text-slate-500">Available Time:</span>
            <select
              value={availableTime}
              onChange={(e) => setAvailableTime(Number(e.target.value))}
              className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
            >
              <option value={30}>30 mins</option>
              <option value={45}>45 mins</option>
              <option value={60}>60 mins</option>
              <option value={90}>90 mins</option>
              <option value={120}>2 hours</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 ">
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold  ${
                  selectedLevel === lvl
                    ? 'bg-indigo-600 text-white '
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-xl "></div>
          <p className="text-slate-500 text-sm font-medium">Loading recommendations...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-lg mx-auto">
          <p className="text-red-700 font-semibold">{error}</p>
          <button onClick={fetchRecommendations} className="sg-btn-primary mt-4">
            Retry
          </button>
        </div>
      ) : filteredRecs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center max-w-lg mx-auto ">
          <div className="text-4xl mb-3">🎉</div>
          <h3 className="text-lg font-bold text-slate-900">No Urgent Recommendations</h3>
          <p className="text-slate-500 text-sm mt-1">
            All your studied topics are currently up to date. Keep up the high accuracy or attempt fresh PYQs!
          </p>
          <Link to="/pyqs" className="sg-btn-primary mt-6 inline-block">
            Practice PYQs
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecs.map((rec, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-xl p-6  hover:  flex flex-col justify-between"
            >
              <div>
                
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`sg-badge ${getBadgeClass(rec.priority.level)}`}>
                    Priority: {rec.priority.level} ({rec.priority.score}/100)
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    ⏱️ {rec.recommendedAction.estimatedMinutes} mins
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                  {rec.topic.name}
                </h3>
                <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mt-0.5 mb-4">
                  {rec.topic.subjectName}
                </p>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-4">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    🎯 Prescribed Action
                  </div>
                  <div className="text-sm font-bold text-slate-800">
                    {rec.recommendedAction.title}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {rec.recommendedAction.description}
                  </p>
                </div>

                <div className="mb-4">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Why this is prioritized
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-600">
                    {rec.reasons.map((reason, rIdx) => (
                      <li key={rIdx} className="flex items-start gap-2">
                        <span className="text-indigo-500 mt-0.5">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-3 border-t border-slate-100 mb-6">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-50 p-2 rounded-lg">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Weakness</div>
                      <div className="text-xs font-bold text-slate-800">
                        {rec.priority.breakdown.weaknessFactor}
                      </div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Revision</div>
                      <div className="text-xs font-bold text-slate-800">
                        {rec.priority.breakdown.revisionFactor}
                      </div>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Exam Fit</div>
                      <div className="text-xs font-bold text-slate-800">
                        {rec.priority.breakdown.examFactor}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Link
                  to="/study-tracker"
                  className="sg-btn-primary flex-1 text-center py-2.5 text-xs"
                >
                  Start Study Session
                </Link>
                <Link
                  to="/pyqs"
                  className="sg-btn-secondary px-3 py-2.5 text-xs text-center"
                >
                  PYQs
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Recommendations;

