import React, { useState, useEffect } from 'react';
import { studySessionService, StudySessionData } from '../../services/studySessionService';

interface TimerEvent {
  type: 'start' | 'pause' | 'resume' | 'stop';
  time: string;
}

interface StudyTimerProps {
  onSessionSaved: () => void;
}

const TIMER_STORAGE_KEY = 'study_gauge_timer_state';

const StudyTimer: React.FC<StudyTimerProps> = ({ onSessionSaved }) => {
  const [status, setStatus] = useState<'idle' | 'running' | 'paused' | 'stopped'>('idle');
  const [events, setEvents] = useState<TimerEvent[]>([]);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const [studyType, setStudyType] = useState<
    'Lecture' | 'Reading' | 'Practice' | 'PYQ' | 'Mock Test' | 'Revision'
  >('Lecture');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const savedState = localStorage.getItem(TIMER_STORAGE_KEY);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (parsed.status && parsed.events) {
          setStatus(parsed.status);
          setEvents(parsed.events);
        }
      } catch (e) {
        console.error('Failed to parse timer state', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify({ status, events }));
  }, [status, events]);

  useEffect(() => {
    const calculateElapsed = () => {
      let elapsed = 0;
      let lastStart: number | null = null;
      events.forEach((e) => {
        const time = new Date(e.time).getTime();
        if (e.type === 'start' || e.type === 'resume') {
          lastStart = time;
        } else if (e.type === 'pause' || e.type === 'stop') {
          if (lastStart) {
            elapsed += time - lastStart;
            lastStart = null;
          }
        }
      });
      if (lastStart && status === 'running') {
        elapsed += Date.now() - lastStart;
      }
      return elapsed;
    };

    setElapsedMs(calculateElapsed());

    let interval: ReturnType<typeof setInterval> | null = null;
    if (status === 'running') {
      interval = setInterval(() => {
        setElapsedMs(calculateElapsed());
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status, events]);

  const handleStart = () => {
    const now = new Date().toISOString();
    setEvents([{ type: 'start', time: now }]);
    setStatus('running');
  };

  const handlePause = () => {
    const now = new Date().toISOString();
    setEvents((prev) => [...prev, { type: 'pause', time: now }]);
    setStatus('paused');
  };

  const handleResume = () => {
    const now = new Date().toISOString();
    setEvents((prev) => [...prev, { type: 'resume', time: now }]);
    setStatus('running');
  };

  const handleStop = () => {
    const now = new Date().toISOString();
    setEvents((prev) => [...prev, { type: 'stop', time: now }]);
    setStatus('stopped');
  };

  const handleReset = () => {
    setStatus('idle');
    setEvents([]);
    setElapsedMs(0);
    setNotes('');
    localStorage.removeItem(TIMER_STORAGE_KEY);
  };

  const handleSaveSession = async () => {
    const durationMinutes = Math.round(elapsedMs / (1000 * 60));
    if (durationMinutes <= 0) {
      alert('Session duration is too short to log (less than 1 minute).');
      return;
    }

    const firstEvent = events[0];
    const lastEvent = events[events.length - 1];

    const sessionPayload: Partial<StudySessionData> = {
      startTime: firstEvent ? firstEvent.time : new Date().toISOString(),
      endTime: lastEvent ? lastEvent.time : new Date().toISOString(),
      durationMinutes,
      studyType,
      notes,
      date: firstEvent ? firstEvent.time.split('T')[0] : new Date().toISOString().split('T')[0],
    };

    try {
      setIsSaving(true);
      await studySessionService.create(sessionPayload as StudySessionData);
      handleReset();
      onSessionSaved();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error saving study session.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200  p-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-xl">
            ⏱️ Active Focus Stopwatch
          </span>
          <h3 className="text-xl font-bold text-slate-900 mt-2">Study Session Timer</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Log precise study intervals to build your consistency streak
          </p>
        </div>

        <div className="font-mono text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-wider bg-slate-50 px-6 py-3 rounded-xl border border-slate-200">
          {formatTime(elapsedMs)}
        </div>

        <div className="flex items-center gap-2">
          {status === 'idle' && (
            <button
              onClick={handleStart}
              className="sg-btn-primary px-6 py-2.5 text-sm font-bold "
            >
              ▶ Start Session
            </button>
          )}

          {status === 'running' && (
            <>
              <button
                onClick={handlePause}
                className="sg-btn-secondary px-5 py-2.5 text-sm font-bold"
              >
                ⏸ Pause
              </button>
              <button
                onClick={handleStop}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold  "
              >
                ⏹ Finish
              </button>
            </>
          )}

          {status === 'paused' && (
            <>
              <button
                onClick={handleResume}
                className="sg-btn-primary px-5 py-2.5 text-sm font-bold "
              >
                ▶ Resume
              </button>
              <button
                onClick={handleStop}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold  "
              >
                ⏹ Finish
              </button>
            </>
          )}

          {status === 'stopped' && (
            <button
              onClick={handleReset}
              className="sg-btn-secondary px-4 py-2.5 text-sm font-bold"
            >
              Discard
            </button>
          )}
        </div>
      </div>

      {status === 'stopped' && (
        <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Study Category
            </label>
            <select
              value={studyType}
              onChange={(e) => setStudyType(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 outline-none focus:border-indigo-600"
            >
              <option value="Lecture">Lecture</option>
              <option value="Reading">Reading</option>
              <option value="Practice">Practice</option>
              <option value="PYQ">PYQ</option>
              <option value="Mock Test">Mock Test</option>
              <option value="Revision">Revision</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Session Notes
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Mastered Dijkstra algorithm and 10 GATE questions..."
                className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-sm text-slate-900 outline-none focus:border-indigo-600"
              />
              <button
                onClick={handleSaveSession}
                disabled={isSaving}
                className="sg-btn-primary px-5 py-2 text-sm font-bold disabled:opacity-50"
              >
                {isSaving ? 'Logging...' : 'Save Session'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyTimer;
