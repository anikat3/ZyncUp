'use client'

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import CalendarView from '@/components/CalendarView';

export default function GroupAvailability() {
  const { id } = useParams();
  const { data: session } = useSession();
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [groupName, setGroupName] = useState('');
  const [duration, setDuration] = useState(60);
  const [showCalendar, setShowCalendar] = useState(false);
  const [settingMeeting, setSettingMeeting] = useState(null);
  const [scheduledMeetings, setScheduledMeetings] = useState({});

  const fetchAvailability = async (selectedDuration = duration) => {
    if (!session?.user?.email) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/groups/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          groupId: id,
          duration: selectedDuration 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch availability');
      }

      setAvailableSlots(data.slots || []);
      setGroupName(data.groupName || '');
    } catch (error) {
      console.error('Fetch availability error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleCalendar = () => {
    setShowCalendar(!showCalendar);
  };

  const handleSetMeeting = async (slot) => {
    setSettingMeeting(slot);
    try {
      const response = await fetch('/api/meetings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupId: id,
          startTime: slot.start,
          endTime: slot.end,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setScheduledMeetings(prev => ({
        ...prev,
        [slot.start]: true
      }));
    } catch (error) {
      console.error('Set meeting error:', error);
      alert('Failed to set meeting: ' + error.message);
    } finally {
      setSettingMeeting(null);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, [id, session]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
      day: date.toLocaleDateString('en-US', { day: 'numeric' }),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      weekday: date.toLocaleDateString('en-US', { weekday: 'short' })
    };
  };

  const formatDateTime = (date) => {
    return new Date(date).toLocaleString('en-US', {
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
    <div className="min-h-screen bg-gradient-to-br from-red-100 via-red-200 to-red-300 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">
          {groupName ? `Available Times for ${groupName}` : 'Available Meeting Times'}
        </h1>

        {/* Availability Calendar */}
        <div className="w-full bg-[#F5F3E3] rounded-lg shadow p-6 mb-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : availableSlots.length > 0 ? (
            <div className="overflow-x-auto">
              <div className="flex gap-4 min-w-max pb-4">
                {/* Group available slots by date and create columns */}
                {Array.from(new Set(availableSlots.map(slot => new Date(slot.start).toDateString()))).map((dateStr) => {
                  const daySlots = availableSlots.filter(slot => new Date(slot.start).toDateString() === dateStr);

                  const date = new Date(dateStr);
                  const dateFormat = formatDate(date.toISOString());

                  return (
                    <div key={dateStr} className="flex-none w-64">
                      {/* Date Header */}
                      <div className="text-center p-4 bg-white rounded-t-lg border border-gray-200">
                        <div className="text-sm text-gray-600">{dateFormat.weekday}</div>
                        <div className="text-2xl font-bold">{dateFormat.day}</div>
                        <div className="text-sm text-gray-600">{dateFormat.month}</div>
                      </div>

                      {/* Slots Container */}
                      <div className="min-h-[200px] bg-white border border-t-0 border-gray-200 rounded-b-lg p-2 space-y-2">
                        {daySlots.map((slot, index) => (
                          <div 
                            key={index} 
                            className={`p-2 rounded ${
                              scheduledMeetings[slot.start] 
                                ? 'bg-[#B5C9B7] text-white' 
                                : 'bg-green-50 border border-green-100'
                            } hover:border-green-300 transition-colors`}
                          >
                            <div className="font-medium text-sm truncate">
                              {formatDateTime(slot.start)} - {formatDateTime(slot.end)}
                            </div>
                            {!scheduledMeetings[slot.start] && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSetMeeting(slot);
                                }}
                                disabled={settingMeeting === slot}
                                className="mt-2 w-full px-2 py-1 text-xs bg-[#B5C9B7] text-white rounded hover:bg-[#9DB7A0] transition-colors disabled:opacity-50"
                              >
                                {settingMeeting === slot ? 'Setting...' : 'Set Meeting'}
                              </button>
                            )}
                            {scheduledMeetings[slot.start] && (
                              <div className="mt-1 text-xs text-white/90">
                                ✓ Meeting scheduled
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p>No available times found</p>
            </div>
          )}
        </div>

        <div className="mb-6">
          <select
            className="border rounded px-3 py-2"
            value={duration}
            onChange={(e) => {
              const newDuration = Number(e.target.value);
              setDuration(newDuration);
              fetchAvailability(newDuration);
            }}
          >
            <option value={30}>30 minutes</option>
            <option value={60}>1 hour</option>
            <option value={90}>1.5 hours</option>
            <option value={120}>2 hours</option>
          </select>
        </div>
      </div>
    </div>
  );
} 