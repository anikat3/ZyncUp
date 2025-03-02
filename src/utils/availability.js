export function findAvailableSlots(events, duration = 60, workingHours = { start: 9, end: 17 }) {
  // Convert duration to milliseconds
  const durationMs = duration * 60 * 1000;
  
  // Get next 7 days
  const slots = [];
  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + 7);

  // Sort events by start time
  const sortedEvents = events.sort((a, b) => {
    const aStart = new Date(a.start.dateTime || a.start.date);
    const bStart = new Date(b.start.dateTime || b.start.date);
    return aStart - bStart;
  });

  // Iterate through each day
  for (let date = new Date(now); date < endDate; date.setDate(date.getDate() + 1)) {
    let dayStart = new Date(date);
    dayStart.setHours(workingHours.start, 0, 0, 0);
    
    let dayEnd = new Date(date);
    dayEnd.setHours(workingHours.end, 0, 0, 0);

    // Skip if day has already passed
    if (dayStart < now) {
      dayStart = new Date(now);
    }

    // Get events for this day
    const dayEvents = sortedEvents.filter(event => {
      const eventStart = new Date(event.start.dateTime || event.start.date);
      const eventEnd = new Date(event.end.dateTime || event.end.date);
      return eventStart.toDateString() === date.toDateString();
    });

    let currentTime = dayStart;

    // Check each event and gaps between them
    for (let i = 0; i <= dayEvents.length; i++) {
      const nextEventStart = i < dayEvents.length ? 
        new Date(dayEvents[i].start.dateTime || dayEvents[i].start.date) : 
        dayEnd;

      if (nextEventStart - currentTime >= durationMs) {
        slots.push({
          start: new Date(currentTime),
          end: new Date(nextEventStart)
        });
      }

      if (i < dayEvents.length) {
        currentTime = new Date(dayEvents[i].end.dateTime || dayEvents[i].end.date);
      }
    }
  }

  return slots;
} 