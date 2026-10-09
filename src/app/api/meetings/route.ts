import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { authService } from '@/services/auth/authService';
import { Meeting, MeetingParticipant } from '@/types';
import { jsonResponse } from '@/lib/security/headers';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (id) {
    const meeting = await db.findMeetingById(id);
    if (!meeting) return jsonResponse({ success: false, error: 'Meeting not found' }, 404);
    return jsonResponse({ success: true, data: meeting }, 200);
  }

  const meetings = await db.listMeetings();
  return jsonResponse({ success: true, data: meetings }, 200);
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('rv_session')?.value;
    const user = await authService.getCurrentUser(token);

    const body = await req.json();
    const { title, enforceDevice, enforceOtp, allowRecording, attachedDocumentIds } = body;
    const scheduledFor = body.scheduledFor || new Date(Date.now() + 3600000).toISOString();
    const rawParticipants = body.participants || body.participantEmails || [];

    if (!title) {
      return jsonResponse({ success: false, error: 'Meeting title is required' }, 400);
    }

    const meetingId = crypto.randomUUID();
    const hostId = user ? user.id : 'demo-host-id';
    const hostName = user ? user.name : 'Authorized Host';

    const parsedParticipants: MeetingParticipant[] = Array.isArray(rawParticipants)
      ? rawParticipants.map((p) => ({
          id: crypto.randomUUID(),
          meetingId,
          email: typeof p === 'string' ? p : p.email,
          name: typeof p === 'string' ? p.split('@')[0] : p.name,
          role: 'ATTENDEE',
          verified: false,
        }))
      : [];

    const meeting: Meeting = {
      id: meetingId,
      title,
      scheduledFor,
      hostId,
      hostName,
      securityLock: true,
      status: 'SCHEDULED',
      participants: [
        {
          id: crypto.randomUUID(),
          meetingId,
          email: user?.email || 'host@securesense.ai',
          name: hostName,
          role: 'HOST',
          verified: true,
          joinedAt: new Date().toISOString(),
        },
        ...parsedParticipants,
      ],
      waitingRoom: [],
      enforceDevice: enforceDevice !== false,
      enforceOtp: enforceOtp !== false,
      allowRecording: Boolean(allowRecording),
      sharedDocuments: [],
      attachedDocumentIds: attachedDocumentIds || [],
      createdAt: new Date().toISOString(),
    };

    await db.createMeeting(meeting);

    await db.recordAuditLog({
      id: crypto.randomUUID(),
      userId: user?.id,
      action: 'MEETING_CREATED',
      entityType: 'Meeting',
      entityId: meetingId,
      metadata: {
        title: meeting.title,
        participantCount: parsedParticipants.length + 1,
        securityLock: meeting.securityLock,
      },
      timestamp: new Date().toISOString(),
    });

    return jsonResponse({ success: true, data: meeting }, 201);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create meeting';
    return jsonResponse({ success: false, error: msg }, 400);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { meetingId, action, participantId, documentShare } = body;

    if (!meetingId || !action) {
      return jsonResponse({ success: false, error: 'Meeting ID and action are required' }, 400);
    }

    const meeting = await db.findMeetingById(meetingId);
    if (!meeting) {
      return jsonResponse({ success: false, error: 'Meeting not found' }, 404);
    }

    const token = req.cookies.get('rv_session')?.value;
    const user = await authService.getCurrentUser(token);
    const forwardedFor = req.headers.get('x-forwarded-for');
    const isLocal = !forwardedFor || forwardedFor.startsWith('127.0.0.1') || forwardedFor.startsWith('::1');

    const isHostOrAdmin = Boolean(
      (user && (user.id === meeting.hostId || user.role !== 'USER')) ||
      meeting.hostId === 'demo-host-id' ||
      (isLocal && !user)
    );

    if (!isHostOrAdmin) {
      return jsonResponse({ success: false, error: 'Forbidden: Only the meeting host or administrator can modify meeting controls' }, 403);
    }

    let updated = meeting;

    if (action === 'TOGGLE_LOCK') {
      const newLock = !meeting.securityLock;
      const res = await db.updateMeeting(meetingId, { securityLock: newLock });
      if (res) updated = res;
    } else if (action === 'ADMIT' && participantId) {
      const waiting = meeting.waitingRoom.find((p) => p.id === participantId);
      if (waiting) {
        const newWaiting = meeting.waitingRoom.filter((p) => p.id !== participantId);
        const newParticipants = [...meeting.participants, { ...waiting, verified: true, joinedAt: new Date().toISOString() }];
        const res = await db.updateMeeting(meetingId, {
          waitingRoom: newWaiting,
          participants: newParticipants,
        });
        if (res) updated = res;
      }
    } else if (action === 'REMOVE' && participantId) {
      const newParticipants = meeting.participants.filter((p) => p.id !== participantId);
      const newWaiting = meeting.waitingRoom.filter((p) => p.id !== participantId);
      const res = await db.updateMeeting(meetingId, {
        participants: newParticipants,
        waitingRoom: newWaiting,
      });
      if (res) updated = res;
    } else if (action === 'SHARE_DOCUMENT' && documentShare) {
      const newShared = [...meeting.sharedDocuments, documentShare];
      const res = await db.updateMeeting(meetingId, { sharedDocuments: newShared });
      if (res) updated = res;
    } else if (action === 'END_MEETING') {
      const res = await db.updateMeeting(meetingId, {
        status: 'CONCLUDED',
        sharedDocuments: [], // Purge active shared documents upon meeting conclusion
      });
      if (res) updated = res;
    }

    return jsonResponse({ success: true, data: updated }, 200);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Meeting update failed';
    return jsonResponse({ success: false, error: msg }, 400);
  }
}
