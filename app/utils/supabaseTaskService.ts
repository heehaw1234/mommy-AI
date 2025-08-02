// Task service for Supabase operations
import { supabase } from '@/lib/supabase';
import { Task } from '../(tabs)/types/task';

export interface SupabaseTask {
    id: number;
    created_at: string;
    due_at: string;
    title: string;
    user_id: string;
    description: string | null;
    completed: boolean;
}

// Helper function to convert AM/PM time to 24-hour format
const convertTo24Hour = (timeString: string): string => {
    if (timeString === 'no time specified') {
        return '12:00';
    }
    
    const cleanTime = timeString.trim().toLowerCase().replace(/\s+/g, '');
    
    // Handle AM/PM format
    const ampmMatch = cleanTime.match(/^(\d{1,2}):?(\d{0,2})\s*(am|pm)$/);
    if (ampmMatch) {
        let hours = parseInt(ampmMatch[1]);
        const minutes = parseInt(ampmMatch[2] || '0');
        const isPM = ampmMatch[3] === 'pm';
        
        if (hours === 12 && !isPM) hours = 0; // 12 AM = 0 hours
        if (hours !== 12 && isPM) hours += 12; // PM hours (except 12 PM)
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    
    // Handle 24-hour format (already valid)
    const timeMatch = cleanTime.match(/^(\d{1,2}):?(\d{0,2})$/);
    if (timeMatch) {
        const hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2] || '0');
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    
    // Fallback to current time
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
};

// Convert local Task to Supabase format
export const taskToSupabase = (task: Task, userId: string): Omit<SupabaseTask, 'id' | 'created_at'> => {
    // Convert time to 24-hour format and combine with date
    const time24Hour = convertTo24Hour(task.time);
    const dueAt = new Date(`${task.date}T${time24Hour}:00`);
    
    return {
        due_at: dueAt.toISOString(),
        title: task.text,
        user_id: userId,
        description: task.description || null,
        completed: task.completed || false,
    };
};

// Convert Supabase task to local Task format
export const supabaseToTask = (supabaseTask: SupabaseTask): Task => {
    const dueDate = new Date(supabaseTask.due_at);
    
    // Convert to AM/PM format
    const hours = dueDate.getHours();
    const minutes = dueDate.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    const displayHours = hours % 12 || 12;
    const formattedTime = `${displayHours}:${minutes.toString().padStart(2, '0')}${ampm}`;
    
    return {
        id: supabaseTask.id,
        text: supabaseTask.title,
        time: formattedTime,
        date: dueDate.toISOString().split('T')[0], // YYYY-MM-DD format
        description: supabaseTask.description || undefined,
        completed: supabaseTask.completed || false,
    };
};

// Create a new task in Supabase
export const createTask = async (task: Task, userId: string): Promise<SupabaseTask | null> => {
    try {
        const supabaseTask = taskToSupabase(task, userId);
        
        const { data, error } = await supabase
            .from('Tasks')
            .insert(supabaseTask)
            .select()
            .single();

        if (error) {
            console.error('Error creating task:', error);
            throw error;
        }

        console.log('✅ Task created successfully:', data);
        return data;
    } catch (error) {
        console.error('❌ Failed to create task:', error);
        return null;
    }
};

// Update a task in Supabase
export const updateTask = async (taskId: number, task: Task, userId: string): Promise<SupabaseTask | null> => {
    try {
        const supabaseTask = taskToSupabase(task, userId);
        
        const { data, error } = await supabase
            .from('Tasks')
            .update(supabaseTask)
            .eq('id', taskId)
            .eq('user_id', userId) // Ensure user can only update their own tasks
            .select()
            .single();

        if (error) {
            console.error('Error updating task:', error);
            throw error;
        }

        console.log('✅ Task updated successfully:', data);
        return data;
    } catch (error) {
        console.error('❌ Failed to update task:', error);
        return null;
    }
};

// Delete a task from Supabase
export const deleteTask = async (taskId: number, userId: string): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('Tasks')
            .delete()
            .eq('id', taskId)
            .eq('user_id', userId); // Ensure user can only delete their own tasks

        if (error) {
            console.error('Error deleting task:', error);
            throw error;
        }

        console.log('✅ Task deleted successfully');
        return true;
    } catch (error) {
        console.error('❌ Failed to delete task:', error);
        return false;
    }
};

// Fetch all tasks for a user
export const fetchUserTasks = async (userId: string): Promise<SupabaseTask[]> => {
    try {
        const { data, error } = await supabase
            .from('Tasks')
            .select('*')
            .eq('user_id', userId)
            .order('due_at', { ascending: true });

        if (error) {
            console.error('Error fetching tasks:', error);
            throw error;
        }

        console.log(`✅ Fetched ${data?.length || 0} tasks for user`);
        return data || [];
    } catch (error) {
        console.error('❌ Failed to fetch tasks:', error);
        return [];
    }
};

// Convert array of Supabase tasks to local task format grouped by date
export const groupSupabaseTasksByDate = (supabaseTasks: SupabaseTask[]): { [date: string]: Task[] } => {
    const grouped: { [date: string]: Task[] } = {};
    
    supabaseTasks.forEach(supabaseTask => {
        const task = supabaseToTask(supabaseTask);
        if (!grouped[task.date]) {
            grouped[task.date] = [];
        }
        grouped[task.date].push(task);
    });
    
    return grouped;
};

// Toggle task completion status
export const toggleTaskCompletion = async (taskId: number, userId: string): Promise<SupabaseTask | null> => {
    try {
        // First fetch the current task to get its current completion status
        const { data: currentTask, error: fetchError } = await supabase
            .from('Tasks')
            .select('completed')
            .eq('id', taskId)
            .eq('user_id', userId)
            .single();

        if (fetchError || !currentTask) {
            console.error('Error fetching current task:', fetchError);
            return null;
        }

        // Toggle the completion status
        const newCompletedStatus = !currentTask.completed;

        const { data, error } = await supabase
            .from('Tasks')
            .update({ completed: newCompletedStatus })
            .eq('id', taskId)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) {
            console.error('Error toggling task completion:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Error in toggleTaskCompletion:', error);
        return null;
    }
};
