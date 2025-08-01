import { Task } from '../(tabs)/types/task';

// Mark dates with tasks on the calendar
export const getMarkedDates = (selected: string, tasks: { [date: string]: Task[] }) => {
    const markedDates: any = {
        [selected]: { selected: true, marked: true, selectedColor: "#2563eb" }
    };
    
    // Add dots for dates with active (non-completed) tasks
    Object.keys(tasks).forEach(date => {
        const activeTasks = tasks[date].filter(task => !task.completed);
        if (activeTasks.length > 0) {
            if (date === selected) {
                // Don't override the selected styling
                markedDates[date] = { 
                    ...markedDates[date],
                    dotColor: "#22c55e", 
                    marked: true 
                };
            } else {
                markedDates[date] = { 
                    marked: true, 
                    dotColor: "#22c55e" 
                };
            }
        }
    });
    
    return markedDates;
};