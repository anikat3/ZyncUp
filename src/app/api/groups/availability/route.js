import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { db } from '@/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { groupId } = body;

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
        if (eventDoc.exists()) {
          return eventDoc.data().events || [];
        }
        return [];
      })
    );

    // Find available time slots (9 AM to 5 PM for the next 7 days)
    const availableSlots = [];
    const now = new Date();
    const startHour = 9; // 9 AM
    const endHour = 17;  // 5 PM
    
    for (let day = 0; day < 7; day++) {
      const currentDate = new Date(now);
      currentDate.setDate(currentDate.getDate() + day);
      
      for (let hour = startHour; hour < endHour; hour++) {
        const slotStart = new Date(currentDate);
        slotStart.setHours(hour, 0, 0, 0);
        
        const slotEnd = new Date(slotStart);
        slotEnd.setHours(hour + 1);

        // Skip slots in the past
        if (slotStart < now) continue;

        // Check if any member has a meeting during this slot
        const isSlotAvailable = memberEvents.every(memberEventList => {
          return memberEventList.every(event => {
            const eventStart = new Date(event.start.dateTime || event.start.date);
            const eventEnd = new Date(event.end.dateTime || event.end.date);
            return slotEnd <= eventStart || slotStart >= eventEnd;
          });
        });

        if (isSlotAvailable) {
          availableSlots.push({
            start: slotStart.toISOString(),
            end: slotEnd.toISOString()
          });
        }
      }
    }

    return Response.json({ availableSlots });

  } catch (error) {
    console.error('Availability calculation error:', error);
    return Response.json({ 
      error: 'Failed to calculate availability',
      details: error.message 
    }, { status: 500 });
  }
} 