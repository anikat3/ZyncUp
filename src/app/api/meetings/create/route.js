import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { db } from '@/firebase';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { groupId, startTime, endTime } = await request.json();

    // Get group details to verify membership
    const groupRef = doc(db, "groups", groupId);
    const groupDoc = await getDoc(groupRef);
    
    if (!groupDoc.exists()) {
      return Response.json({ error: 'Group not found' }, { status: 404 });
    }

    const groupData = groupDoc.data();
    if (!groupData.members.includes(session.user.email)) {
      return Response.json({ error: 'Not a member of this group' }, { status: 403 });
    }

    // Create notification document
    const notificationRef = await addDoc(collection(db, "notifications"), {
      groupId,
      startTime,
      endTime,
      members: groupData.members,
      createdBy: session.user.email,
      createdAt: new Date(),
      notificationTime: new Date(new Date(startTime).getTime() - 30 * 60000), // 30 minutes before
      status: 'pending'
    });

    return Response.json({ 
      success: true, 
      notificationId: notificationRef.id 
    });

  } catch (error) {
    console.error('Create meeting error:', error);
    return Response.json({ error: 'Failed to create meeting' }, { status: 500 });
  }
} 