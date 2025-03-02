'use client'

import { useState, useEffect } from 'react';
import { db } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Link from 'next/link';

export default function GroupList({ session }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [deletingGroup, setDeletingGroup] = useState(false);

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

  const toggleGroup = (groupId) => {
    setExpandedGroup(expandedGroup === groupId ? null : groupId);
  };

  const handleAddMember = async (groupId) => {
    setAddingMember(true);
    setUpdateError('');
    setUpdateSuccess('');

    try {
      const response = await fetch('/api/groups/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupId,
          newMembers: [newMemberEmail]
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to add member');
      }

      // Update local state
      setGroups(groups.map(group => {
        if (group.id === groupId) {
          return {
            ...group,
            members: [...group.members, newMemberEmail]
          };
        }
        return group;
      }));

      setNewMemberEmail('');
      setUpdateSuccess('Member added successfully!');
    } catch (error) {
      console.error('Add member error:', error);
      setUpdateError(error.message || 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      return;
    }

    setDeletingGroup(true);
    setUpdateError('');
    setUpdateSuccess('');

    try {
      const response = await fetch('/api/groups/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ groupId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to delete group');
      }

      // Remove the group from local state
      setGroups(groups.filter(group => group.id !== groupId));
      setUpdateSuccess('Group deleted successfully!');
      setExpandedGroup(null);
    } catch (error) {
      console.error('Delete group error:', error);
      setUpdateError(error.message || 'Failed to delete group');
    } finally {
      setDeletingGroup(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading groups...</div>;
  }

  if (error) {
    return <div className="text-red-600 text-center py-4">{error}</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Your Groups</h2>
      {groups.length > 0 ? (
        <div className="space-y-4">
          {groups.map((group) => (
            <div 
              key={group.id} 
              className="bg-white rounded-lg shadow-md p-4 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div 
                  className="flex-grow cursor-pointer"
                  onClick={() => toggleGroup(group.id)}
                >
                  <h3 className="text-lg font-semibold">{group.group_name}</h3>
                  <p className="text-sm text-gray-500">
                    Created by: {group.created_by}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">
                    {group.members.length} members
                  </span>
                  {group.created_by === session.user.email && (
                    <>
                      <Link
                        href={`/groups/${group.id}/availability`}
                        className="px-3 py-1 text-sm text-white bg-green-600 rounded-md hover:bg-green-700"
                      >
                        Find Times
                      </Link>
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent triggering toggleGroup
                          handleDeleteGroup(group.id);
                        }}
                        disabled={deletingGroup}
                        className="px-3 py-1 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                      >
                        {deletingGroup ? 'Deleting...' : 'Delete'}
                      </button>
                    </>
                  )}
                  <span className="text-xl text-gray-500">
                    {expandedGroup === group.id ? '▼' : '▶'}
                  </span>
                </div>
              </div>
              
              {expandedGroup === group.id && (
                <div className="mt-4 pl-4 border-l-2 border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Members:</h4>
                  <ul className="space-y-2 mb-4">
                    {group.members.map((member, index) => (
                      <li 
                        key={index} 
                        className="text-sm text-gray-600 flex items-center space-x-2"
                      >
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span>{member}</span>
                        {member === group.created_by && (
                          <span className="text-xs text-blue-600">(Creator)</span>
                        )}
                      </li>
                    ))}
                  </ul>

                  {/* Add member form */}
                  <div className="mt-4 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                        placeholder="Enter email to add member"
                        className="flex-1 text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => handleAddMember(group.id)}
                        disabled={addingMember || !newMemberEmail}
                        className="px-3 py-1 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        {addingMember ? 'Adding...' : 'Add'}
                      </button>
                    </div>
                    {updateError && (
                      <p className="text-sm text-red-600">{updateError}</p>
                    )}
                    {updateSuccess && (
                      <p className="text-sm text-green-600">{updateSuccess}</p>
                    )}
                  </div>
                </div>
              )}
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