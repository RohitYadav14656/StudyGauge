import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  activityTimelineService,
  TimelineActivity,
  TimelineFilterParams,
  ActivityType,
} from '../../services/activityTimelineService';
import './ActivityTimeline.css';

// ─── Constants ─────────────────────────────────────────────

const TYPE_CONFIG: Record<
  ActivityType,
  { icon: string; label: string; color: string }
> = {
  study_session: { icon: '📖', label: 'Study Session', color: '#3b82f6' },
  mock_test:     { icon: '📝', label: 'Mock Test',     color: '#f59e0b' },
  pyq_attempt:   { icon: '🎯', label: 'PYQ Attempt',   color: '#10b981' },
  revision:      { icon: '🔄', label: 'Revision',      color: '#8b5cf6' },
  planner_item:  { icon: '✅', label: 'Planner Item',  color: '#ec4899' },
};

const ALL_TYPES: ActivityType[] = Object.keys(TYPE_CONFIG) as ActivityType[];

const DATE_PRESETS = [
  { id: '7d',  label: '7 Days' },
  { id: '30d', label: '30 Days' },
  { id: '90d', label: '90 Days' },
  { id: 'all', label: 'All Time' },
  { id: 'custom', label: 'Custom' },
];

const ITEMS_PER_PAGE = 20;

// ─── Helpers ───────────────────────────────────────────────

const subtractDays = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
};

const formatTime = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

const formatDayLabel = (dateKey: string): string => {
  try {
    const d = new Date(dateKey + 'T00:00:00');
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return '🟢 Today';
    if (d.toDateString() === yesterday.toDateString()) return '🔵 Yesterday';

    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
  } catch {
    return dateKey;
  }
};

const groupByDay = (activities: TimelineActivity[]): Map<string, TimelineActivity[]> => {
  const groups = new Map<string, TimelineActivity[]>();
  for (const activity of activities) {
    const dayKey = new Date(activity.date).toISOString().split('T')[0];
    if (!groups.has(dayKey)) groups.set(dayKey, []);
    groups.get(dayKey)!.push(activity);
  }
  return groups;
};

// ─── Component ─────────────────────────────────────────────

const ActivityTimeline: React.FC = () => {
  // State
  const [activities, setActivities] = useState<TimelineActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [_totalCount, setTotalCount] = useState(0);

  // Filters
  const [datePreset, setDatePreset] = useState('30d');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<Set<ActivityType>>(new Set(ALL_TYPES));

  // ─── Compute effective date range ────────────────────────

  const effectiveDates = useMemo(() => {
    if (datePreset === 'custom') {
      return { startDate: customStartDate || undefined, endDate: customEndDate || undefined };
    }
    if (datePreset === 'all') {
      return { startDate: undefined, endDate: undefined };
    }
    const days = parseInt(datePreset, 10);
    return { startDate: subtractDays(days), endDate: undefined };
  }, [datePreset, customStartDate, customEndDate]);

  // ─── Fetch activities ────────────────────────────────────

  const fetchActivities = useCallback(
    async (pageNum: number, append: boolean = false) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        const params: TimelineFilterParams = {
          page: pageNum,
          limit: ITEMS_PER_PAGE,
          ...(effectiveDates.startDate ? { startDate: effectiveDates.startDate } : {}),
          ...(effectiveDates.endDate ? { endDate: effectiveDates.endDate } : {}),
        };

        // Only send types filter if not all selected
        if (selectedTypes.size < ALL_TYPES.length && selectedTypes.size > 0) {
          params.types = Array.from(selectedTypes).join(',');
        }

        const response = await activityTimelineService.getTimeline(params);

        if (append) {
          setActivities((prev) => [...prev, ...response.data]);
        } else {
          setActivities(response.data);
        }

        setHasMore(response.pagination.hasMore);
        setTotalCount(response.pagination.total);
        setPage(pageNum);
      } catch (err) {
        console.error('Failed to fetch timeline:', err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [effectiveDates, selectedTypes]
  );

  // Re-fetch when filters change
  useEffect(() => {
    fetchActivities(1, false);
  }, [fetchActivities]);

  // ─── Event handlers ──────────────────────────────────────

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchActivities(page + 1, true);
    }
  };

  const handleRefresh = () => {
    fetchActivities(1, false);
  };

  const toggleType = (type: ActivityType) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        // Don't allow deselecting all
        if (next.size === 1) return prev;
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const clearFilters = () => {
    setDatePreset('30d');
    setCustomStartDate('');
    setCustomEndDate('');
    setSelectedTypes(new Set(ALL_TYPES));
  };

  const hasActiveFilters =
    datePreset !== '30d' ||
    selectedTypes.size < ALL_TYPES.length;

  // ─── Grouped data ────────────────────────────────────────

  const groupedActivities = useMemo(() => groupByDay(activities), [activities]);

  // Summary stats
  const stats = useMemo(() => {
    const totalDuration = activities.reduce((sum, a) => sum + (a.durationMinutes || 0), 0);
    const typeCounts: Partial<Record<ActivityType, number>> = {};
    for (const a of activities) {
      typeCounts[a.type] = (typeCounts[a.type] || 0) + 1;
    }
    return { totalActivities: activities.length, totalDuration, typeCounts, daysCount: groupedActivities.size };
  }, [activities, groupedActivities]);

  // ─── Render helpers ──────────────────────────────────────

  const renderMetaChips = (activity: TimelineActivity) => {
    const chips: React.ReactNode[] = [];
    const { metadata, durationMinutes, type } = activity;

    if (durationMinutes) {
      chips.push(
        <span key="dur" className="meta-chip duration">
          ⏱ {durationMinutes}m
        </span>
      );
    }

    if (type === 'mock_test' && metadata.scorePercentage != null) {
      chips.push(
        <span key="score" className="meta-chip score">
          🏆 {metadata.scorePercentage}%
        </span>
      );
    }

    if (type === 'pyq_attempt') {
      chips.push(
        <span key="result" className={`meta-chip ${metadata.isCorrect ? 'correct' : 'incorrect'}`}>
          {metadata.isCorrect ? '✓ Correct' : '✗ Incorrect'}
        </span>
      );
      if (metadata.difficulty) {
        chips.push(
          <span key="diff" className="meta-chip">
            {metadata.difficulty.toUpperCase()}
          </span>
        );
      }
    }

    if (type === 'revision' && metadata.revisionCount != null) {
      chips.push(
        <span key="rev" className="meta-chip">
          #{metadata.revisionCount} revision
        </span>
      );
    }

    if (type === 'planner_item' && metadata.completion != null) {
      chips.push(
        <span key="comp" className="meta-chip">
          {metadata.completion}% done
        </span>
      );
    }

    const subjectName = metadata.subjectName;
    const topicName = metadata.topicName;

    if (subjectName) {
      chips.push(
        <span key="sub" className="meta-chip subject">
          📚 {subjectName}
        </span>
      );
    }
    if (topicName) {
      chips.push(
        <span key="topic" className="meta-chip topic">
          {topicName}
        </span>
      );
    }

    return chips;
  };

  // ─── Skeleton loader ─────────────────────────────────────

  const renderSkeletons = () => (
    <>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="skeleton-card" style={{ animationDelay: `${i * 0.1}s` }}>
          <div className="skeleton-line short" />
          <div className="skeleton-line long" />
          <div className="skeleton-line medium" />
        </div>
      ))}
    </>
  );

  // ─── Render ──────────────────────────────────────────────

  return (
    <div className="activity-timeline-page">
      <div className="timeline-container">
        {/* Header */}
        <div className="timeline-header">
          <div className="timeline-header-left">
            <h1>Activity Timeline</h1>
            <p>Your unified study activity feed — study sessions, tests, revisions & more</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="timeline-header-badge">
              <span style={{ fontSize: '0.75rem' }}>⚡</span> Real-time
            </span>
            <button className="timeline-refresh-btn" onClick={handleRefresh}>
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="timeline-filters">
          {/* Date row */}
          <div className="timeline-filters-row">
            <span className="filter-label">📅 Date</span>
            <div className="date-preset-group">
              {DATE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  className={`date-preset-btn ${datePreset === preset.id ? 'active' : ''}`}
                  onClick={() => setDatePreset(preset.id)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            {datePreset === 'custom' && (
              <>
                <input
                  type="date"
                  className="date-input"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  placeholder="Start date"
                />
                <span style={{ color: '#475569', fontSize: '0.75rem' }}>→</span>
                <input
                  type="date"
                  className="date-input"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  placeholder="End date"
                />
              </>
            )}
          </div>

          {/* Type row */}
          <div className="timeline-filters-row">
            <span className="filter-label">🏷️ Type</span>
            {ALL_TYPES.map((type) => {
              const config = TYPE_CONFIG[type];
              return (
                <button
                  key={type}
                  className={`type-pill ${selectedTypes.has(type) ? 'active' : ''}`}
                  data-type={type}
                  onClick={() => toggleType(type)}
                >
                  <span
                    className="type-pill-dot"
                    style={{ backgroundColor: config.color }}
                  />
                  {config.label}
                </button>
              );
            })}
            {hasActiveFilters && (
              <button className="clear-filters-btn" onClick={clearFilters}>
                ✕ Reset
              </button>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        {!loading && activities.length > 0 && (
          <div className="timeline-stats">
            <div className="timeline-stat-card">
              <div className="timeline-stat-value">{stats.totalActivities}</div>
              <div className="timeline-stat-label">Activities</div>
            </div>
            <div className="timeline-stat-card">
              <div className="timeline-stat-value">{stats.daysCount}</div>
              <div className="timeline-stat-label">Active Days</div>
            </div>
            <div className="timeline-stat-card">
              <div className="timeline-stat-value" style={{ color: '#60a5fa' }}>
                {stats.totalDuration > 60
                  ? `${(stats.totalDuration / 60).toFixed(1)}h`
                  : `${stats.totalDuration}m`}
              </div>
              <div className="timeline-stat-label">Total Time</div>
            </div>
            {Object.entries(stats.typeCounts).slice(0, 3).map(([type, count]) => (
              <div key={type} className="timeline-stat-card">
                <div
                  className="timeline-stat-value"
                  style={{ color: TYPE_CONFIG[type as ActivityType]?.color }}
                >
                  {count}
                </div>
                <div className="timeline-stat-label">
                  {TYPE_CONFIG[type as ActivityType]?.label || type}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Timeline Feed */}
        {loading ? (
          <div className="timeline-feed">
            {renderSkeletons()}
          </div>
        ) : activities.length === 0 ? (
          <div className="timeline-empty">
            <div className="timeline-empty-icon">📭</div>
            <h3>No Activities Found</h3>
            <p>
              {hasActiveFilters
                ? 'Try adjusting your filters or expanding the date range to see more activities.'
                : 'Start studying, taking tests, or completing tasks to see your activity here!'}
            </p>
          </div>
        ) : (
          <div className="timeline-feed">
            {Array.from(groupedActivities.entries()).map(([dayKey, dayActivities]) => (
              <div key={dayKey} className="timeline-day-group">
                {/* Day label */}
                <div className="timeline-day-label">
                  <span className="timeline-day-label-dot" />
                  {formatDayLabel(dayKey)}
                  <span className="timeline-day-count">
                    {dayActivities.length} {dayActivities.length === 1 ? 'activity' : 'activities'}
                  </span>
                </div>

                {/* Activity cards for this day */}
                {dayActivities.map((activity, idx) => {
                  const config = TYPE_CONFIG[activity.type];
                  return (
                    <div
                      key={activity.id}
                      className="timeline-card"
                      style={{ animationDelay: `${idx * 0.05}s` }}
                    >
                      <div className="timeline-card-top">
                        <div className={`timeline-card-icon ${activity.type}`}>
                          {config?.icon || '📌'}
                        </div>
                        <div className="timeline-card-body">
                          <h4 className="timeline-card-title">{activity.title}</h4>
                          <p className="timeline-card-desc">{activity.description}</p>
                          <span className={`timeline-type-badge ${activity.type}`}>
                            {config?.label || activity.type}
                          </span>
                        </div>
                        <span className="timeline-card-time">
                          {formatTime(activity.date)}
                        </span>
                      </div>
                      <div className="timeline-card-meta">
                        {renderMetaChips(activity)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Load More / End marker */}
            <div className="timeline-load-more">
              {hasMore ? (
                <button
                  className="load-more-btn"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <>
                      <span className="timeline-spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px', display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />
                      Loading…
                    </>
                  ) : (
                    'Load More Activities'
                  )}
                </button>
              ) : (
                <div className="timeline-end-marker">
                  ── You've reached the end ──
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityTimeline;
