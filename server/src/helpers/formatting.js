// Format date to relative time
export function formatRelativeDate(date) {
    const parsedDate = new Date(date);
    return Number.isNaN(parsedDate.getTime()) ? '' : parsedDate.toLocaleString();
}

// Format date to ISO string
export function formatToISO(date) {
    return new Date(date).toISOString();
}

// Format date to short format (MM/DD/YYYY)
export function formatToShortDate(date) {
    const d = new Date(date);
    return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
}

// Get current timestamp
export function getCurrentTimestamp() {
    return new Date();
}

// Format duration in minutes to readable format (e.g., "1h 30m")
export function formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
}

// Truncate string to length with ellipsis
export function truncateString(str, length) {
    return str.length > length ? str.substring(0, length) + '...' : str;
}
