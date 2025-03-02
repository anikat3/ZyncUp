'use client'

import React from 'react';
import { format } from 'date-fns-tz';

const CalendarView = ({ slots, userTimezone }) => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Available Time Slots</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {slots.map((slot, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-4">
            <p className="text-lg font-semibold">
              {format(new Date(slot.start), 'eeee, MMMM d, yyyy h:mm a', { timeZone: userTimezone })}
            </p>
            <p className="text-sm text-gray-500">
              to {format(new Date(slot.end), 'h:mm a', { timeZone: userTimezone })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarView; 