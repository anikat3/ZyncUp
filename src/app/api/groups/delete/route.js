import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { db } from '@/firebase';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { groupId } = body;

    // Check if user is the creator of the group
    const groupRef = doc(db, "groups", groupId);
    const groupDoc = await getDoc(groupRef);

    if (!groupDoc.exists()) {
      return Response.json({ error: 'Group not found' }, { status: 404 });
    }

    if (groupDoc.data().created_by !== session.user.email) {
      return Response.json({ error: 'Only the group creator can delete the group' }, { status: 403 });
    }

    // Delete the group
    await deleteDoc(groupRef);

    return Response.json({ success: true });

  } catch (error) {
    console.error('Delete group error:', error);
    return Response.json({ 
      error: 'Failed to delete group',
      details: error.message 
    }, { status: 500 });
  }
} 