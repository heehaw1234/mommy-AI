// Helper for formatting time
export function formatTime(date: Date): string {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')}${ampm}`;
}

// Helper for formatting date - fix timezone issue
export function formatDate(date: Date): string {
    // Use local timezone to prevent date shifting
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, "0");
    const d = date.getDate().toString().padStart(2, "0");
    return `${y}-${m}-${d}`;
}

// Format date for display - fix timezone issue
export const formatDateForDisplay = (dateStr: string): string => {
    if (!dateStr) return "";
    // Parse date components manually to avoid timezone issues
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
};

// Get today's date in YYYY-MM-DD format - fix timezone issue
export const getTodayString = (): string => {
    const today = new Date();
    // Use local date components to avoid timezone shifts
    return `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}`;
};