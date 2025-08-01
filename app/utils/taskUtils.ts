// filepath: c:\school\negroni\stuHACK\app\utils\taskUtils.ts
import { Task } from '../(tabs)/types/task';

// Helper to group and sort all tasks by date
export const getAllTasksGrouped = (tasks: { [date: string]: Task[] }) => {
    const sortedDates = Object.keys(tasks).sort();
    return sortedDates.map(date => ({
        date,
        tasks: tasks[date]
            .filter(task => !task.completed) // Filter out completed tasks for calendar view
            .slice()
            .sort((a, b) => a.time.localeCompare(b.time)),
    })).filter(group => group.tasks.length > 0); // Remove dates with no active tasks
};

// Sort tasks chronologically
export const sortTasksChronologically = (tasks: { [date: string]: Task[] }): Task[] => {
    return Object.entries(tasks)
        .flatMap(([date, taskArr]) =>
            taskArr.map((task) => ({
                ...task,
                sortKey: `${task.date}T${task.time.padStart(5, "0")}`,
            }))
        )
        .sort((a, b) => a.sortKey.localeCompare(b.sortKey));
};

// Add a new task
export const addTask = (
    tasks: { [date: string]: Task[] },
    newTask: Task
): { [date: string]: Task[] } => {
    return {
        ...tasks,
        [newTask.date]: [
            ...(tasks[newTask.date] || []),
            newTask
        ]
    };
};

// Remove a task
export const removeTask = (
    tasks: { [date: string]: Task[] },
    date: string,
    taskId?: number,
    index?: number
): { [date: string]: Task[] } => {
    const updated = { ...tasks };
    
    if (taskId !== undefined) {
        // Remove by task ID (for Supabase tasks)
        updated[date] = updated[date].filter(task => task.id !== taskId);
    } else if (index !== undefined) {
        // Remove by index (for local tasks)
        updated[date] = updated[date].filter((_, i) => i !== index);
    }
    
    if (updated[date].length === 0) delete updated[date];
    return updated;
};

// Edit a task
export const editTask = (
    tasks: { [date: string]: Task[] },
    oldDate: string,
    oldTaskId: number | undefined,
    oldIndex: number,
    newTask: Task
): { [date: string]: Task[] } => {
    let updated = { ...tasks };
    
    if (oldTaskId !== undefined) {
        // Remove by task ID (for Supabase tasks)
        updated[oldDate] = updated[oldDate].filter(task => task.id !== oldTaskId);
    } else {
        // Remove by index (for local tasks)
        updated[oldDate] = updated[oldDate].filter((_, i) => i !== oldIndex);
    }
    
    if (updated[oldDate].length === 0) delete updated[oldDate];
    
    // Add to new location
    updated[newTask.date] = [
        ...(updated[newTask.date] || []),
        newTask
    ];
    
    return updated;
};

// Helper function to get current time rounded to nearest 5 minutes (Singapore time)
export const getCurrentTimeRounded = (): Date => {
    // Create date in Singapore timezone (UTC+8)
    const now = new Date();
    const singaporeTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
    
    const minutes = singaporeTime.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 5) * 5;
    
    if (roundedMinutes === 60) {
        singaporeTime.setHours(singaporeTime.getHours() + 1);
        singaporeTime.setMinutes(0);
    } else {
        singaporeTime.setMinutes(roundedMinutes);
    }
    
    singaporeTime.setSeconds(0);
    singaporeTime.setMilliseconds(0);
    return singaporeTime;
};

// Helper function to parse time string to Date object (handles am/pm format)
export const parseTimeToDate = (timeString: string): Date => {
    const date = new Date();
    
    // Handle am/pm format
    const [timeStr, period] = timeString.split(/([ap]m)/i);
    const [hours, minutes] = timeStr.split(':').map(Number);
    
    let adjustedHours = hours || 0;
    if (period && period.toLowerCase() === 'pm' && hours !== 12) {
        adjustedHours += 12;
    } else if (period && period.toLowerCase() === 'am' && hours === 12) {
        adjustedHours = 0;
    }
    
    date.setHours(adjustedHours);
    date.setMinutes(minutes || 0);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date;
};