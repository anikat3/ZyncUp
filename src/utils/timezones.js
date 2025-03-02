import moment from 'moment-timezone';

// Get all IANA time zones
const timezones = moment.tz.names();

// Function to find valid time slots within availability windows of each timezone
export function filterTimeSlotsByTimezoneAvailability(freeSlots, memberTimezones) {
    const filteredSlots = [];

    freeSlots.forEach(slot => {
        const { start, end } = slot;

        const isValidForAllMembers = memberTimezones.every(timezone => {
            const startInTZ = moment.tz(start, timezone);
            const endInTZ = moment.tz(end, timezone);

            // Define availability window: 8 AM to 2 AM next day in each member's timezone
            const startOfDay = startInTZ.clone().startOf('day').add(8, 'hours');
            const endOfDay = startInTZ.clone().startOf('day').add(26, 'hours'); // 2 AM next day

            return startInTZ.isBetween(startOfDay, endOfDay, null, '[)') &&
                   endInTZ.isBetween(startOfDay, endOfDay, null, '[)');
        });

        if (isValidForAllMembers) {
            filteredSlots.push(slot);
        }
    });

    return filteredSlots;
}

// Export the timezones array
export default timezones; 