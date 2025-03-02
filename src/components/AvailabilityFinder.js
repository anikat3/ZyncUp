'use client'

import { useState } from 'react';

export default function AvailabilityFinder({ groupId }) {
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [duration, setDuration] = useState(60);

  const findAvailability = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/groups/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          groupId,
          duration 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch availability');
      }

      const data = await response.json();
      setAvailableSlots(data.slots);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
  };

  return (
    <div className="mt-4">
      <div className="flex gap-4 mb-4">
        <select
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="border rounded px-3 py-2"
        >
          <option value={30}>30 minutes</option>
          <option value={60}>1 hour</option>
          <option value={90}>1.5 hours</option>
          <option value={120}>2 hours</option>
        </select>
        <button
          onClick={findAvailability}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? 'Finding slots...' : 'Find Available Times'}
        </button>
      </div>

      {error && (
        <div className="text-red-500 mb-4">{error}</div>
      )}

      {availableSlots.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium">Available Slots:</h3>
          {availableSlots.map((slot, index) => (
            <div 
              key={index}
              className="p-3 border rounded hover:border-blue-300 cursor-pointer"
            >
              {formatDateTime(slot.start)} - {formatDateTime(slot.end)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 