import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getGroupCalendarEvents } from "@/utils/firebase";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const events = await getGroupCalendarEvents(session.user.email);
    return Response.json(events);
  } catch (error) {
    console.error('Group Calendar API Error:', error);
    return Response.json({ error: 'Failed to fetch group calendar events' }, { status: 500 });
  }
} 