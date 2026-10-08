'use client';

import React, { useState, useEffect } from 'react';
import { 
  Video, 
  Lock, 
  ShieldCheck, 
  Clock, 
  Users, 
  Calendar, 
  Plus, 
  CheckCircle2, 
  FileText,
  Smartphone,
  Key
} from 'lucide-react';
import { Meeting } from '@/types';

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [scheduledFor, setScheduledFor] = useState('2026-10-15T14:00');
  const [participantsText, setParticipantsText] = useState('ciso@security.org, lead.arch@realityvault.ai');
  const [enforceDevice, setEnforceDevice] = useState(true);
  const [enforceOtp, setEnforceOtp] = useState(true);

  const fetchMeetings = async () => {
    try {
      const res = await fetch('/api/meetings');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setMeetings(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch('/api/meetings');
        const data = await res.json();
        if (!ignore && data.success && Array.isArray(data.data)) {
          setMeetings(data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const participants = participantsText
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          scheduledFor: new Date(scheduledFor).toISOString(),
          participants,
          enforceDevice,
          enforceOtp,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        setTitle('');
        fetchMeetings();
      } else {
        alert(data.error || 'Failed to create meeting');
      }
    } catch {
      alert('Error creating meeting');
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <Video className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Secure Meetings MVP</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Zero-Trust verified participant lobby, hardware enforcement, and encrypted document sharing.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Secure Meeting</span>
        </button>
      </div>

      {/* Meetings Grid */}
      {loading ? (
        <div className="py-12 text-center text-sm text-slate-400">Loading secure meetings...</div>
      ) : meetings.length === 0 ? (
        <div className="glass-panel p-12 border-slate-800 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-cyan-950/50 border border-cyan-800/60 text-cyan-400 flex items-center justify-center mx-auto">
            <Video className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">No Secure Meetings Scheduled</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Create an encrypted briefing lobby with enforced OTP and device requirements.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-cyan-600 text-white text-xs font-bold"
          >
            Schedule Briefing Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {meetings.map((meeting) => (
            <div key={meeting.id} className="glass-panel p-6 border-slate-800 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-white">{meeting.title}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                      SECURITY LOCK ACTIVE
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(meeting.scheduledFor).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Policy Badges */}
              <div className="flex flex-wrap gap-2 text-[11px] font-mono">
                <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-emerald-400 flex items-center gap-1">
                  <Smartphone className="w-3 h-3" />
                  <span>Device Verified</span>
                </span>
                <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-cyan-400 flex items-center gap-1">
                  <Key className="w-3 h-3" />
                  <span>OTP Enforced</span>
                </span>
                <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-indigo-400 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{meeting.participants.length} Participants</span>
                </span>
              </div>

              {/* Participants list */}
              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-1 text-xs">
                <div className="text-[11px] font-semibold text-slate-400">Invited Authorized Attendees:</div>
                <div className="space-y-1">
                  {meeting.participants.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-slate-300 font-mono text-[11px]">
                      <span>{p.email}</span>
                      <span className="text-emerald-400 text-[10px]">VERIFIED CHALLENGE</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel p-6 sm:p-8 max-w-md w-full border-cyan-500/40 space-y-5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Video className="w-5 h-5 text-cyan-400" />
              <span>Schedule Zero-Trust Briefing</span>
            </h3>

            <form onSubmit={handleCreateMeeting} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Briefing Subject</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Q4 Executive Acquisition Briefing"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Schedule Time</label>
                <input
                  type="datetime-local"
                  required
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Invited Emails (comma separated)</label>
                <input
                  type="text"
                  value={participantsText}
                  onChange={(e) => setParticipantsText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 font-mono"
                />
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-2">
                <label className="flex items-center gap-2 text-slate-300">
                  <input
                    type="checkbox"
                    checked={enforceDevice}
                    onChange={(e) => setEnforceDevice(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-800 text-cyan-500"
                  />
                  <span>Enforce Registered Hardware Verification</span>
                </label>
                <label className="flex items-center gap-2 text-slate-300">
                  <input
                    type="checkbox"
                    checked={enforceOtp}
                    onChange={(e) => setEnforceOtp(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-800 text-cyan-500"
                  />
                  <span>Enforce Individual Participant OTP Verification</span>
                </label>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                >
                  Create Briefing Lobby
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
