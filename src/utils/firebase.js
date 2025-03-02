import { db } from '@/firebase';
import { doc, setDoc, getDoc, updateDoc, arrayUnion, collection, query, where, getDocs } from 'firebase/firestore';

export async function saveUserToDatabase(user) {
  if (!user?.email) return;
  
  try {
    const userRef = doc(db, 'users', user.email);
    const userDoc = await getDoc(userRef);

    const userData = {
      email: user.email,
      name: user.name,
      image: user.image,
      lastLogin: new Date(),
      updatedAt: new Date(),
    };

    if (!userDoc.exists()) {
      // Add creation date for new users
      userData.createdAt = new Date();
      userData.calendars = [];
      userData.groups = [];
      await setDoc(userRef, userData);
    } else {
      // Only update specific fields for existing users
      await updateDoc(userRef, userData);
    }
  } catch (error) {
    console.error('Error saving user to database:', error);
    throw error;
  }
}

export async function saveCalendarEvents(userEmail, events, groupIds = []) {
  try {
    if (!events || !userEmail) {
      console.error('Missing required parameters:', { events, userEmail });
      return;
    }

    const eventsRef = doc(db, 'calendar_events', userEmail);
    
    // Process events to include sharing information
    const processedEvents = events.map(event => ({
      id: event.id || '',
      summary: event.summary || '',
      description: event.description || '',
      start: {
        dateTime: event.start?.dateTime || event.start?.date || null,
        timeZone: event.start?.timeZone || null
      },
      end: {
        dateTime: event.end?.dateTime || event.end?.date || null,
        timeZone: event.end?.timeZone || null
      },
      updated: new Date().toISOString(),
      sharedWithGroups: groupIds || [],
      creator: {
        email: userEmail,
        displayName: event.creator?.displayName || '',
      },
    }));

    // Save events with proper data structure
    await setDoc(eventsRef, {
      events: processedEvents,
      lastUpdated: new Date().toISOString(),
      userId: userEmail
    });

    // Update user's calendars
    const userRef = doc(db, 'users', userEmail);
    await updateDoc(userRef, {
      calendars: arrayUnion('primary'),
      lastSync: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error saving calendar events:', error);
    throw error;
  }
}

export async function getGroupCalendarEvents(userEmail) {
  try {
    // Get user's groups
    const groupsRef = collection(db, "groups");
    const groupsQuery = query(groupsRef, where("members", "array-contains", userEmail));
    const groupsSnapshot = await getDocs(groupsQuery);
    
    // Get calendar events for each group member
    const eventsPromises = groupsSnapshot.docs.flatMap(groupDoc => {
      const members = groupDoc.data().members;
      return members.map(async memberEmail => {
        const eventRef = doc(db, 'calendar_events', memberEmail);
        const eventDoc = await getDoc(eventRef);
        if (eventDoc.exists()) {
          return eventDoc.data().events.filter(event => 
            event.sharedWithGroups?.includes(groupDoc.id)
          );
        }
        return [];
      });
    });

    const allEvents = await Promise.all(eventsPromises);
    return allEvents.flat();
  } catch (error) {
    console.error('Error fetching group calendar events:', error);
    throw error;
  }
}

// Add this new function to validate emails
export async function validateEmails(emails) {
  const validatedEmails = new Set();
  const invalidEmails = new Set();
  
  for (const email of emails) {
    if (!email || !email.trim()) continue;
    
    const trimmedEmail = email.trim();
    const userRef = doc(db, 'users', trimmedEmail);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      validatedEmails.add(trimmedEmail);
    } else {
      invalidEmails.add(trimmedEmail);
    }
  }
  
  return {
    validEmails: Array.from(validatedEmails),
    invalidEmails: Array.from(invalidEmails)
  };
}

// Add this function to get user details
export async function getUserDetails(email) {
  if (!email) return null;
  
  const userRef = doc(db, 'users', email);
  const userDoc = await getDoc(userRef);
  
  if (userDoc.exists()) {
    return {
      email: userDoc.data().email,
      name: userDoc.data().name,
      image: userDoc.data().image,
      groups: userDoc.data().groups || [],
      calendars: userDoc.data().calendars || []
    };
  }
  
  return null;
} 