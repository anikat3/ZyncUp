'use client'

import { useState } from 'react';

export default function GroupManager({ session }) {
  const [groupName, setGroupName] = useState('');
  const [memberEmails, setMemberEmails] = useState(['']);
  const [inviteLink, setInviteLink] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddEmail = () => {
    setMemberEmails([...memberEmails, '']);
  };

  const handleEmailChange = (index, value) => {
    const newEmails = [...memberEmails];
    newEmails[index] = value;
    setMemberEmails(newEmails);
  };

  const handleRemoveEmail = (index) => {
    if (memberEmails.length > 1) {
      const newEmails = memberEmails.filter((_, i) => i !== index);
      setMemberEmails(newEmails);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Filter out empty emails and add the creator's email
    const validEmails = [
      session.user.email,
      ...memberEmails.filter(email => email.trim() !== '')
    ];
    
    try {
      const response = await fetch('/api/groups/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          groupName,
          members: validEmails
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to create group');
      }

      const link = `${window.location.origin}/join?token=${data.inviteToken}`;
      setInviteLink(link);
      setGroupName('');
      setMemberEmails(['']);
    } catch (error) {
      console.error('Create group error:', error);
      setError(error.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl bg-white rounded-lg shadow p-6 mt-8">
      <h2 className="text-2xl font-semibold mb-6">Create a Group</h2>
      
      <form onSubmit={handleCreateGroup} className="space-y-4">
        <div>
          <label htmlFor="groupName" className="block text-sm font-medium text-gray-700">
            Group Name
          </label>
          <input
            type="text"
            id="groupName"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
            required
          />
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Member Emails
          </label>
          {memberEmails.map((email, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => handleEmailChange(index, e.target.value)}
                placeholder="member@example.com"
                className="flex-1 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
              />
              {memberEmails.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveEmail(index)}
                  className="px-3 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddEmail}
            className="text-blue-500 hover:text-blue-600 text-sm font-medium"
          >
            + Add another member
          </button>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className={`px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Creating...' : 'Create Group'}
        </button>
      </form>

      {error && (
        <div className="mt-4 text-red-500">
          {error}
        </div>
      )}

      {inviteLink && (
        <div className="mt-4">
          <h3 className="text-lg font-medium mb-2">Invite Link:</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={inviteLink}
              readOnly
              className="flex-1 p-2 border rounded"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(inviteLink);
                alert('Link copied to clipboard!');
              }}
              className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
            >
              Copy
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 