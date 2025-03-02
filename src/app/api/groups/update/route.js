import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { db } from '@/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { validateEmails } from '@/utils/firebase';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { groupId, newMembers } = body;

    // Validate new members
    const { validEmails, invalidEmails } = await validateEmails(newMembers);

    if (invalidEmails.length > 0) {
      return Response.json({ 
        error: 'Some members are not registered',
        invalidMembers: invalidEmails
      }, { status: 400 });
    }

    // Update group with new members
    const groupRef = doc(db, "groups", groupId);
    await updateDoc(groupRef, {
      members: arrayUnion(...validEmails),
      updated_at: new Date()
    });

    return Response.json({ 
      success: true,
      addedMembers: validEmails
    });

  } catch (error) {
    console.error('Update group error:', error);
    return Response.json({ 
      error: 'Failed to update group',
      details: error.message 
    }, { status: 500 });
  }
} 