'use client'

import { useState, useEffect } from 'react';
import { db } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function GroupList({ session }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGroups = async () => {
      if (!session?.user?.email) return;

      try {
        const q = query(
          collection(db, "groups"),
          where("members", "array-contains", session.user.email)
        );

        const querySnapshot = await getDocs(q);
        const groupsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          created_at: doc.data().created_at?.toDate() // Convert Firestore Timestamp to Date
        }));

        setGroups(groupsData);
      } catch (error) {
        console.error("Error fetching groups:", error);
        // Add user-friendly error message
        setError("Failed to load groups. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [session]);

  if (loading) {
    return <div className="text-center py-4">Loading groups...</div>;
  }

  return (
    <div className="w-full max-w-4xl bg-white rounded-lg shadow p-6 mt-8">
      <h2 className="text-2xl font-semibold mb-6">Your Groups</h2>
      
      {groups.length > 0 ? (
        <div className="space-y-4">
          {groups.map(group => (
            <div key={group.id} className="p-4 border rounded-lg hover:border-blue-300 transition-colors">
              <h3 className="text-lg font-medium">{group.group_name}</h3>
              <p className="text-sm text-gray-500 mt-1">
                Created {new Date(group.created_at?.seconds * 1000).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-500">
                Members: {group.members.length}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 py-4">
          You haven't joined any groups yet.
        </p>
      )}
    </div>
  );
} 