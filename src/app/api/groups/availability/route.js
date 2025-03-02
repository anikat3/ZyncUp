import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { db } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { findAvailableSlots } from '@/utils/availability';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { groupId, duration = 60 } = body;

    // Get group details
    const groupRef = doc(db, "groups", groupId);
    const groupDoc = await getDoc(groupRef);

    if (!groupDoc.exists()) {
      return Response.json({ error: 'Group not found' }, { status: 404 });
    }

    const members = groupDoc.data().members;

    // Get calendar events for all members
    const memberEvents = await Promise.all(
      members.map(async (memberEmail) => {
        const eventRef = doc(db, 'calendar_events', memberEmail);
        const eventDoc = await getDoc(eventRef);
        return eventDoc.exists() ? eventDoc.data().events || [] : [];
      })
    );

    // Combine all events
    const allEvents = memberEvents.flat();

    // Find available slots
    const availableSlots = findAvailableSlots(allEvents, duration);

    // Format slots for response
    const formattedSlots = availableSlots.map(slot => ({
      start: slot.start.toISOString(),
      end: slot.end.toISOString(),
      duration: duration
    }));

    return Response.json({ 
      slots: formattedSlots,
      groupName: groupDoc.data().group_name,
      memberCount: members.length
    });

  } catch (error) {
    console.error('Availability calculation error:', error);
    return Response.json({ error: 'Failed to calculate availability' }, { status: 500 });
  }
} 