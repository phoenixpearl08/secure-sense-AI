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
  Key,
  Trash2,
  Share2,
  X
} from 'lucide-react';
import { Meeting } from '@/types';

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showShareDocModal, setShowShareDocModal] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [scheduledFor, setScheduledFor] = useState('2026-10-15T14:00');
  const [participantsText, setParticipantsText] = useState('ciso@security.org, lead.arch@realityvault.ai');
  const [enforceDevice, setEnforceDevice] = useState(true);
  const [enforceOtp, setEnforceOtp] = useState(true);

  // Share Doc Form State
  const [shareDocTitle, setShareDocTitle] = useState('Q4_Executive_Acquisition_Term_Sheet.pdf');
  const [shareDocExpiry, setShareDocExpiry] = useState(5);

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

  const handleToggleLock = async (meetingId: string) => {
    try {
      const res = await fetch('/api/meetings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId, action: 'TOGGLE_LOCK' }),
      });
      const data = await res.json();
      if (data.success) fetchMeetings();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEndMeeting = async (meetingId: string) => {
    if (!confirm('End meeting? All active shared documents and temporary participant tokens will be permanently purged.')) return;
    try {
      const res = await fetch('/api/meetings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId, action: 'END_MEETING' }),
      });
      const data = await res.json();
      if (data.success) fetchMeetings();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveParticipant = async (meetingId: string, participantId: string) => {
    try {
      const res = await fetch('/api/meetings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingId, action: 'REMOVE', participantId }),
      });
      const data = await res.json();
      if (data.success) fetchMeetings();
    } catch (err) {
      console.error(err);
    }
  };

  const handleShareDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showShareDocModal || !shareDocTitle) return;

    try {
      const res = await fetch('/api/meetings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingId: showShareDocModal,
          action: 'SHARE_DOCUMENT',
          documentShare: {
            documentId: `doc-${Date.now()}`,
            title: shareDocTitle,
            sharedBy: 'Host (Verified CISO)',
            sharedAt: new Date().toISOString(),
            expiresInMinutes: shareDocExpiry,
            downloadAllowed: false,
            accessCount: 0,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowShareDocModal(null);
        fetchMeetings();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <Video className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Zero-Trust Secure Meetings</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Pre-meeting verification gate, hardware enforcement, policy-controlled document sharing, and end-of-meeting cleanup.
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

      {loading ? (
        <div className="py-24 text-center text-sm font-mono text-slate-400">Loading secure briefing rooms...</div>
      ) : meetings.length === 0 ? (
        <div className="glass-panel p-12 border-slate-800 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-cyan-950/40 border border-cyan-800/60 text-cyan-400 flex items-center justify-center mx-auto">
            <Video className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">No Briefings Scheduled</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Schedule a high-assurance meeting with mandatory OTP, hardware verification, and zero-persistence document sharing.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {meetings.map((meeting) => (
            <div key={meeting.id} className="glass-panel p-6 border-slate-800 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400 flex-shrink-0">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-white">{meeting.title}</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                          meeting.status === 'CONCLUDED'
                            ? 'bg-slate-800 text-slate-400 border border-slate-700'
                            : meeting.securityLock
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        }`}
                      >
                        {meeting.status === 'CONCLUDED'
                          ? 'CONCLUDED'
                          : meeting.securityLock
                          ? 'LOCK ACTIVE (GATE CLOSED)'
                          : 'GATE OPEN'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(meeting.scheduledFor).toLocaleString()}</span>
                      <span>&bull;</span>
                      <span>Host: {meeting.hostName}</span>
                    </div>
                  </div>
                </div>

                {/* Host Controls */}
                {meeting.status !== 'CONCLUDED' && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handleToggleLock(meeting.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition ${
                        meeting.securityLock
                          ? 'bg-rose-950/60 hover:bg-rose-900 text-rose-300 border-rose-800'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>{meeting.securityLock ? 'Unlock Gate' : 'Lock Gate'}</span>
                    </button>

                    <button
                      onClick={() => setShowShareDocModal(meeting.id)}
                      className="px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share In-Meeting Doc</span>
                    </button>

                    <button
                      onClick={() => handleEndMeeting(meeting.id)}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow"
                    >
                      <span>End & Purge</span>
                    </button>
                  </div>
                )}
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
                  <span>{meeting.participants.length} Active Participants</span>
                </span>
              </div>

              {/* In-Meeting Shared Documents */}
              {meeting.sharedDocuments && meeting.sharedDocuments.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/30 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-cyan-400 font-bold">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4" />
                      <span>Active In-Meeting Encrypted Documents</span>
                    </div>
                    <span className="text-[10px] font-mono text-amber-400">POLICY INHERITANCE: 5m EXPIRY</span>
                  </div>
                  <div className="space-y-1.5">
                    {meeting.sharedDocuments.map((doc, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <span className="text-white font-mono text-xs">{doc.title}</span>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                          <span>View-Only (No Download)</span>
                          <span>&bull;</span>
                          <span className="text-emerald-400">Protected</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Participants list */}
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-2 text-xs">
                <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                  <span>Verified Participants & Gate Authorization:</span>
                  <span className="font-mono text-emerald-400">Zero-Trust Pre-Screening Passed</span>
                </div>
                <div className="space-y-1.5">
                  {meeting.participants.map((p) => (
                    <div key={p.id} className="p-2 rounded-lg bg-slate-950 border border-slate-800/60 flex items-center justify-between text-slate-300 font-mono text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{p.name || p.email}</span>
                        <span className="text-slate-500">({p.role})</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-emerald-400 text-[10px] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>CHALLENGE VERIFIED</span>
                        </span>
                        {p.role !== 'HOST' && meeting.status !== 'CONCLUDED' && (
                          <button
                            onClick={() => handleRemoveParticipant(meeting.id, p.id)}
                            className="text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-slate-800 transition"
                            title="Remove participant"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
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
                <label className="font-semibold text-slate-300">Invited Attendees (Comma-Separated Emails)</label>
                <textarea
                  rows={3}
                  value={participantsText}
                  onChange={(e) => setParticipantsText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 font-mono text-[11px]"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enforceDevice}
                    onChange={(e) => setEnforceDevice(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-cyan-500"
                  />
                  <span className="text-slate-300">Enforce Trusted Device Challenge</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enforceOtp}
                    onChange={(e) => setEnforceOtp(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-cyan-500"
                  />
                  <span className="text-slate-300">Enforce Out-of-Band OTP Challenge</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold shadow"
                >
                  Confirm & Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SHARE IN-MEETING DOC MODAL */}
      {showShareDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel p-6 max-w-md w-full border-cyan-500/40 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-base">Share Document During Briefing</h3>
              </div>
              <button onClick={() => setShowShareDocModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleShareDocSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Document Name / Title</label>
                <input
                  type="text"
                  required
                  value={shareDocTitle}
                  onChange={(e) => setShareDocTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Access Window Expiration (Minutes)</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={shareDocExpiry}
                  onChange={(e) => setShareDocExpiry(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-400 text-[11px] space-y-1">
                <p className="font-semibold text-slate-300">Policy Inheritance:</p>
                <p>&bull; Only admitted meeting attendees can view this document.</p>
                <p>&bull; Download is strictly disabled (In-Browser Controlled View).</p>
                <p>&bull; Automatically destroyed when the meeting ends or timeout elapses.</p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowShareDocModal(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow"
                >
                  Share With Attendees
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
