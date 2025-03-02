import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { db } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import crypto from 'crypto';
import { validateEmails } from '@/utils/firebase';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { groupName, members } = body;

    // Validate all members at once
    const { validEmails, invalidEmails } = await validateEmails([...members, session.user.email]);

    if (invalidEmails.length > 0) {
      return Response.json({ 
        error: 'Some members are not registered',
        invalidMembers: invalidEmails
      }, { status: 400 });
    }

    if (validEmails.length === 0) {
      return Response.json({ error: 'No valid members found' }, { status: 400 });
    }

    // Create unique invite token
    const inviteToken = crypto.randomBytes(32).toString('hex');

    // Add group to Firestore
    const groupsRef = collection(db, "groups");
    const newGroup = await addDoc(groupsRef, {
      group_name: groupName,
      members: validEmails,
      created_at: serverTimestamp(),
      created_by: session.user.email,
      invite_token: inviteToken,
      updated_at: serverTimestamp()
    });

    return Response.json({ 
      groupId: newGroup.id,
      inviteToken: inviteToken,
      members: validEmails
    });

  } catch (error) {
    console.error('Create group error:', error);
    return Response.json({ 
      error: 'Failed to create group',
      details: error.message 
    }, { status: 500 });
  }
} 