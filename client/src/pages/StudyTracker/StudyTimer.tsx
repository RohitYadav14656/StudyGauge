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
  
  // Form state for saving
  const [studyType, setStudyType] = useState<'Lecture' | 'Reading' | 'Practice' | 'PYQ' | 'Mock Test' | 'Revision'>('Lecture');
  const [notes, setNotes] = useState('');

  // Load from local storage on mount
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

  // Save to local storage whenever status or events change
  useEffect(() => {
    localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify({ status, events }));
  }, [status, events]);

  // Update elapsed time
  useEffect(() => {
    const calculateElapsed = () => {
      let elapsed = 0;
      let lastStart: number | null = null;
      events.forEach(e => {
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

    let interval: any = null;
    if (status === 'running') {
      interval = setInterval(() => {
        setElapsedMs(calculateElapsed());
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status, events]);

  const handleStart = () => {
    const now = new Date().toISOString();
    setStatus('running');
    setEvents([{ type: 'start', time: now }]);
  };

  const handlePause = () => {
    const now = new Date().toISOString();
    setStatus('paused');
    setEvents(prev => [...prev, { type: 'pause', time: now }]);
  };

  const handleResume = () => {
    const now = new Date().toISOString();
    setStatus('running');
    setEvents(prev => [...prev, { type: 'resume', time: now }]);
  };

  const handleStop = () => {
    const now = new Date().toISOString();
    setStatus('stopped');
    setEvents(prev => [...prev, { type: 'stop', time: now }]);
  };

  const handleDiscard = () => {
    setStatus('idle');
    setEvents([]);
    setElapsedMs(0);
    localStorage.removeItem(TIMER_STORAGE_KEY);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    
    try {
      setIsSaving(true);
      
      const sessionData: StudySessionData = {
        date: events[0] ? new Date(events[0].time).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        startTime: events[0] ? events[0].time : new Date().toISOString(),
        studyType,
        notes,
        timerEvents: events,
      };

      await studySessionService.create(sessionData);
      
      // Reset timer
      setStatus('idle');
      setEvents([]);
      setStudyType('Lecture');
      setNotes('');
      setElapsedMs(0);
      localStorage.removeItem(TIMER_STORAGE_KEY);
      
      // Notify parent to refresh list
      onSessionSaved();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save session');
    } finally {
      setIsSaving(false);
    }
  };

  // Format MM:SS or HH:MM:SS
  const formatTime = (ms: number) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (num: number) => num.toString().padStart(2, '0');
    
    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-6 backdrop-blur-xl shadow-xl">
      <div className="flex justify-between items-center pb-5 border-b border-slate-800/80 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-xl">
            ⏱️
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Active Focus Timer</h2>
            <p className="text-xs text-slate-400">Real-time study block stopwatch with activity logging</p>
          </div>
        </div>

        {status !== 'idle' && status !== 'stopped' && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/70 border border-slate-800">
            <div className={`w-2 h-2 rounded-full ${status === 'running' ? 'bg-cyan-400 animate-ping' : 'bg-amber-400'}`}></div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">{status}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center">
        {/* Glow Digit Display */}
        <div className="my-4 text-center">
          <div className="text-6xl sm:text-7xl font-extrabold font-mono tracking-tight bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(56,189,248,0.25)]">
            {formatTime(elapsedMs)}
          </div>
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-500 mt-2 block">
            {status === 'running' ? 'Session In Progress' : status === 'paused' ? 'Paused' : 'Ready to Focus'}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap justify-center gap-3 mt-4">
          {status === 'idle' && (
            <button 
              onClick={handleStart}
              className="px-7 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-sky-500/25 transition-all active:scale-95 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4l12 6-12 6z" /></svg>
              Start Focus Session
            </button>
          )}

          {status === 'running' && (
            <>
              <button 
                onClick={handlePause}
                className="px-6 py-2.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-semibold rounded-xl transition-all active:scale-95 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4h3v12H5V4zm7 0h3v12h-3V4z" /></svg>
                Pause
              </button>
              <button 
                onClick={handleStop}
                className="px-6 py-2.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 font-semibold rounded-xl transition-all active:scale-95 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4h12v12H4z" /></svg>
                Complete & Log
              </button>
            </>
          )}

          {status === 'paused' && (
            <>
              <button 
                onClick={handleResume}
                className="px-6 py-2.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-semibold rounded-xl transition-all active:scale-95 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4l12 6-12 6z" /></svg>
                Resume
              </button>
              <button 
                onClick={handleStop}
                className="px-6 py-2.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 font-semibold rounded-xl transition-all active:scale-95 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4h12v12H4z" /></svg>
                Complete & Log
              </button>
            </>
          )}
        </div>
      </div>

      {status === 'stopped' && (
        <div className="mt-8 border-t border-slate-800/80 pt-6 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white text-base">Save Completed Session ({Math.round(elapsedMs / 60000)} minutes)</h3>
            <span className="text-xs text-sky-400 font-mono">Streak Eligible</span>
          </div>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">Study Type</label>
                <select 
                  required
                  value={studyType}
                  onChange={e => setStudyType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-200 focus:border-sky-500 outline-none font-medium"
                >
                  <option value="Lecture">Lecture</option>
                  <option value="Reading">Reading</option>
                  <option value="Practice">Practice</option>
                  <option value="PYQ">PYQ</option>
                  <option value="Mock Test">Mock Test</option>
                  <option value="Revision">Revision</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">Session Highlights / Notes</label>
                <input 
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Solved Thermodynamics formulas, 25 MCQs"
                  className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-200 focus:border-sky-500 outline-none font-medium"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button 
                type="button" 
                onClick={handleDiscard}
                disabled={isSaving}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-colors disabled:opacity-50 text-sm"
              >
                Discard
              </button>
              <button 
                type="submit" 
                disabled={isSaving}
                className="px-6 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white rounded-xl font-semibold transition-all shadow-md shadow-sky-500/20 disabled:opacity-50 text-sm"
              >
                {isSaving ? 'Saving to Tracker...' : 'Save to Study History'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default StudyTimer;
