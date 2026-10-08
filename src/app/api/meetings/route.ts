import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { authService } from '@/services/auth/authService';
import { Meeting } from '@/types';
import { jsonResponse } from '@/lib/security/headers';


export async function GET(req: NextRequest) {
  const meetings = await db.listMeetings();
  return jsonResponse({ success: true, data: meetings }, 200);
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('rv_session')?.value;
    const user = await authService.getCurrentUser(token);

    const body = await req.json();
    const { title, scheduledFor, participants, enforceDevice, enforceOtp, allowRecording, attachedDocumentIds } = body;

    if (!title || !scheduledFor) {
      return jsonResponse({ success: false, error: 'Meeting title and schedule time are required' }, 400);
    }

    const meetingId = crypto.randomUUID();
    const hostId = user ? user.id : 'demo-host-id';
    const hostName = user ? user.name : 'Authorized Host';

    const parsedParticipants = Array.isArray(participants)
      ? participants.map((p) => ({
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
      participants: parsedParticipants,
      enforceDevice: enforceDevice !== false,
      enforceOtp: enforceOtp !== false,
      allowRecording: Boolean(allowRecording),
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
        participantCount: parsedParticipants.length,
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
