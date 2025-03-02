'use client'

import { useState, useEffect } from 'react';
import { db } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Link from 'next/link';
import AvailabilityFinder from './AvailabilityFinder';

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
    <div className="max-w-2xl mx-auto">
      {groups.length > 0 ? (
        <div className="space-y-4">
          {groups.map((group) => (
            <div 
              key={group.id}
              onClick={() => toggleGroup(group.id)}
              className="bg-[#B5C9B7] text-white rounded-lg shadow-md p-4 hover:bg-[#9DB7A0] transition-colors cursor-pointer"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">{group.group_name}</h3>
              </div>
              
              <p className="text-white/90 mt-2">
                Created by: {group.created_by}
              </p>

              <div className="flex items-center space-x-4 mt-4">
                <span className="text-white/90">
                  {group.members.length} members
                </span>
                {group.created_by === session.user.email && (
                  <>
                    <Link
                      href={`/groups/${group.id}/availability`}
                      onClick={(e) => e.stopPropagation()}
                      className="px-3 py-1 text-sm bg-white text-[#B5C9B7] rounded-md hover:bg-gray-100"
                    >
                      Find Times
                    </Link>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteGroup(group.id);
                      }}
                      disabled={deletingGroup}
                      className="px-3 py-1 text-sm bg-gray-700 text-white rounded-md hover:bg-gray-800 disabled:opacity-50"
                    >
                      {deletingGroup ? 'Deleting...' : 'Delete'}
                    </button>
                  </>
                )}
                <span className="text-xl text-white">
                  {expandedGroup === group.id ? '▼' : '▶'}
                </span>
              </div>

              {expandedGroup === group.id && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-white/90 font-medium">Members:</h4>
                  <ul className="list-disc list-inside text-white/90">
                    {group.members.map((member) => (
                      <li key={member}>{member}</li>
                    ))}
                  </ul>

                  {group.created_by === session.user.email && (
                    <div className="mt-4">
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={newMemberEmail}
                          onChange={(e) => setNewMemberEmail(e.target.value)}
                          placeholder="Enter email to add member"
                          className="flex-1 px-3 py-1 text-sm text-gray-900 rounded-md border border-gray-300 focus:outline-none focus:border-[#9DB7A0]"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddMember(group.id);
                          }}
                          disabled={addingMember || !newMemberEmail}
                          className="px-3 py-1 text-sm bg-white text-[#B5C9B7] rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-white"
                        >
                          {addingMember ? 'Adding...' : 'Add'}
                        </button>
                      </div>
                      {updateError && (
                        <p className="text-red-500 text-sm mt-1">{updateError}</p>
                      )}
                      {updateSuccess && (
                        <p className="text-green-500 text-sm mt-1">{updateSuccess}</p>
                      )}
                    </div>
                  )}
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