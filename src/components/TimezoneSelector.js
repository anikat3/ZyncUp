'use client'

import { useState } from 'react';

const timezones = [
  { value: 'UTC-12:00', label: 'UTC -12:00' },
  { value: 'UTC-11:00', label: 'UTC -11:00' },
  { value: 'UTC-10:00', label: 'UTC -10:00' },
  { value: 'UTC-09:00', label: 'UTC -09:00' },
  { value: 'UTC-08:00', label: 'UTC -08:00' },
  { value: 'UTC-07:00', label: 'UTC -07:00' },
  { value: 'UTC-06:00', label: 'UTC -06:00' },
  { value: 'UTC-05:00', label: 'UTC -05:00' },
  { value: 'UTC-04:00', label: 'UTC -04:00' },
  { value: 'UTC-03:00', label: 'UTC -03:00' },
  { value: 'UTC-02:00', label: 'UTC -02:00' },
  { value: 'UTC-01:00', label: 'UTC -01:00' },
  { value: 'UTC+00:00', label: 'UTC +00:00' },
  { value: 'UTC+01:00', label: 'UTC +01:00' },
  { value: 'UTC+02:00', label: 'UTC +02:00' },
  { value: 'UTC+03:00', label: 'UTC +03:00' },
  { value: 'UTC+04:00', label: 'UTC +04:00' },
  { value: 'UTC+05:00', label: 'UTC +05:00' },
  { value: 'UTC+06:00', label: 'UTC +06:00' },
  { value: 'UTC+07:00', label: 'UTC +07:00' },
  { value: 'UTC+08:00', label: 'UTC +08:00' },
  { value: 'UTC+09:00', label: 'UTC +09:00' },
  { value: 'UTC+10:00', label: 'UTC +10:00' },
  { value: 'UTC+11:00', label: 'UTC +11:00' },
  { value: 'UTC+12:00', label: 'UTC +12:00' },
];

export default function TimezoneSelector({ onTimezoneSelect }) {
  const [selectedTimezone, setSelectedTimezone] = useState('');

  const handleChange = (event) => {
    setSelectedTimezone(event.target.value);
    onTimezoneSelect(event.target.value);
  };

  return (
    <div>
      <label htmlFor="timezone" className="block mb-2">Select your timezone:</label>
      <select
        id="timezone"
        value={selectedTimezone}
        onChange={handleChange}
        className="border rounded px-3 py-2"
      >
        <option value="">-- Select Timezone --</option>
        {timezones.map((tz) => (
          <option key={tz.value} value={tz.value}>{tz.label}</option>
        ))}
      </select>
    </div>
  );
} 