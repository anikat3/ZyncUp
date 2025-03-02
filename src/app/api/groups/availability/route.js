import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { db } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { findAvailableSlots } from '@/utils/availability';
import { filterTimeSlotsByTimezoneAvailability } from '@/utils/timezones';
import { format } from 'date-fns-tz';
import { getUserDetails } from '@/utils/firebase';

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

    // Combine all events and convert to UTC
    const allEvents = memberEvents.flat().map(event => {
      const startDateTime = event.start.dateTime || event.start.date;
      const endDateTime = event.end.dateTime || event.end.date;

      return {
        ...event,
        start: {
          ...event.start,
          dateTime: format(new Date(startDateTime), 'yyyy-MM-dd\'T\'HH:mm:ssXXX', { timeZone: 'UTC' }),
        },
        end: {
          ...event.end,
          dateTime: format(new Date(endDateTime), 'yyyy-MM-dd\'T\'HH:mm:ssXXX', { timeZone: 'UTC' }),
        },
      };
    });

    // Find available slots
    const availableSlots = findAvailableSlots(allEvents, duration);

    // Get member timezones
    const memberTimezones = await Promise.all(members.map(async (memberEmail) => {
      const userDetails = await getUserDetails(memberEmail);
      return userDetails?.timezone || 'UTC';
    }));

    // Filter slots based on availability windows
    const filteredSlots = filterTimeSlotsByTimezoneAvailability(availableSlots, memberTimezones);

    // Get user's timezone
    const userTimezone = session.user.timezone || 'UTC';

    // Format slots for response in user's timezone
    const formattedSlots = filteredSlots.map(slot => ({
      start: format(slot.start, 'yyyy-MM-dd\'T\'HH:mm:ssXXX', { timeZone: userTimezone }),
      end: format(slot.end, 'yyyy-MM-dd\'T\'HH:mm:ssXXX', { timeZone: userTimezone }),
      duration: duration
    }));

    return Response.json({ 
      slots: formattedSlots,
      groupName: groupDoc.data().group_name,
      memberCount: members.length
    });

  } catch (error) {
    console.error('Availability calculation error:', error);
    return Response.json({ error: 'Failed to calculate availability', details: error.message }, { status: 500 });
  }
} 