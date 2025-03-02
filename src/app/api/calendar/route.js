import { getServerSession } from "next-auth";
import { google } from 'googleapis';
import { authOptions } from "../auth/[...nextauth]/route";
import { saveCalendarEvents } from '@/utils/firebase';
import { db } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's groups
    const groupsRef = collection(db, "groups");
    const q = query(groupsRef, where("members", "array-contains", session.user.email));
    const groupsSnapshot = await getDocs(q);
    const groupIds = groupsSnapshot.docs.map(doc => doc.id);

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXTAUTH_URL
    );

    oauth2Client.setCredentials({
      access_token: session.accessToken,
      scope: "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events.readonly"
    });

    const calendar = google.calendar({ 
      version: 'v3', 
      auth: oauth2Client,
      timeout: 10000 // 10 second timeout
    });
    
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    });

    if (!response.data.items) {
      console.error('No events found in response:', response);
      return Response.json({ error: 'No events found' }, { status: 404 });
    }

    // Save events to Firebase with group information
    await saveCalendarEvents(session.user.email, response.data.items, groupIds);

    return Response.json(response.data.items);
  } catch (error) {
    console.error('Calendar API Error:', error);
    if (error.message.includes('invalid_grant')) {
      return Response.json({ error: 'Session expired, please sign in again' }, { status: 401 });
    }
    return Response.json({ error: 'Failed to fetch calendar events' }, { status: 500 });
  }
} 