'use client'

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';

export default function GroupAvailability() {
  const { id } = useParams();
  const { data: session } = useSession();
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [groupName, setGroupName] = useState('');

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!session?.user?.email) return;

      try {
        const response = await fetch('/api/groups/availability', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ groupId: id }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch availability');
        }

        setAvailableSlots(data.availableSlots);
      } catch (error) {
        console.error('Fetch availability error:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [id, session]);

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-600 text-center py-4">{error}</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Available Meeting Times</h1>
      {availableSlots.length > 0 ? (
        <div className="space-y-4">
          {availableSlots.map((slot, index) => (
            <div 
              key={index}
              className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-lg font-semibold">
                    {formatDateTime(slot.start)}
                  </p>
                  <p className="text-sm text-gray-500">
                    to {formatDateTime(slot.end)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 py-4">
          No available time slots found for all members.
        </p>
      )}
    </div>
  );
} 