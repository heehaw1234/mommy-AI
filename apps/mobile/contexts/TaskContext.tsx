import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Task } from '@/app/(tabs)/types/task';
import { 
    createTask, 
    updateTask, 
    deleteTask, 
    fetchUserTasks, 
    supabaseToTask,
    groupSupabaseTasksByDate,
    toggleTaskCompletion 
} from '@/app/utils/supabaseTaskService';
import { useAppContext } from './AppContext';

interface TaskContextType {
    // State
    tasks: { [date: string]: Task[] }; // Grouped by date for calendar
    tasksList: Task[]; // Flat list for todo
    isLoading: boolean;
    isTasksLoading: boolean;
    
    // Actions
    addTaskToState: (task: Task) => Promise<Task | null>;
    updateTaskInState: (taskId: number, updatedTask: Task) => Promise<Task | null>;
    removeTaskFromState: (taskId: number) => Promise<boolean>;
    toggleTaskCompletionInState: (task: Task) => Promise<Task | null>;
    refreshTasks: () => Promise<void>;
}

const TaskContext = createContext<TaskContextType>({
    tasks: {},
    tasksList: [],
    isLoading: false,
    isTasksLoading: true,
    addTaskToState: async () => null,
    updateTaskInState: async () => null,
    removeTaskFromState: async () => false,
    toggleTaskCompletionInState: async () => null,
    refreshTasks: async () => {},
});

export const TaskProvider = ({ children }: { children: ReactNode }) => {
    const { session, loggedIn } = useAppContext();
    
    // State
    const [tasks, setTasks] = useState<{ [date: string]: Task[] }>({});
    const [tasksList, setTasksList] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isTasksLoading, setIsTasksLoading] = useState(true);

    // Convert grouped tasks to flat list for todo view
    const updateTasksList = (groupedTasks: { [date: string]: Task[] }) => {
        const flatList = Object.values(groupedTasks)
            .flat()
            .sort((a, b) => {
                const dateTimeA = new Date(`${a.date}T${a.time}`).getTime();
                const dateTimeB = new Date(`${b.date}T${b.time}`).getTime();
                return dateTimeA - dateTimeB;
            });
        setTasksList(flatList);
    };

    // Convert flat list to grouped tasks for calendar view
    const updateGroupedTasks = (flatList: Task[]) => {
        const grouped: { [date: string]: Task[] } = {};
        flatList.forEach(task => {
            if (!grouped[task.date]) {
                grouped[task.date] = [];
            }
            grouped[task.date].push(task);
        });
        
        // Sort tasks within each date
        Object.keys(grouped).forEach(date => {
            grouped[date].sort((a, b) => a.time.localeCompare(b.time));
        });
        
        setTasks(grouped);
    };

    // Load tasks from Supabase
    const refreshTasks = async () => {
        if (!session?.user?.id || !loggedIn) {
            setIsTasksLoading(false);
            return;
        }

        try {
            setIsTasksLoading(true);
            const supabaseTasks = await fetchUserTasks(session.user.id);
            const localTasks = supabaseTasks.map(supabaseToTask);
            
            // Update both formats
            const groupedTasks = groupSupabaseTasksByDate(supabaseTasks);
            setTasks(groupedTasks);
            updateTasksList(groupedTasks);
            
            console.log(`✅ TaskContext: Loaded ${localTasks.length} tasks`);
        } catch (error) {
            console.error('❌ TaskContext: Failed to load tasks:', error);
        } finally {
            setIsTasksLoading(false);
        }
    };

    // Add task to both state formats
    const addTaskToState = async (task: Task): Promise<Task | null> => {
        console.log('🔧 TaskContext: addTaskToState called with:', task);
        console.log('🔧 TaskContext: Session user ID:', session?.user?.id);
        
        if (!session?.user?.id) {
            console.error('❌ TaskContext: User not logged in');
            return null;
        }

        try {
            setIsLoading(true);
            console.log('🔧 TaskContext: Calling createTask with userId:', session.user.id);
            
            // Save to Supabase
            const savedTask = await createTask(task, session.user.id);
            console.log('🔧 TaskContext: createTask returned:', savedTask);
            
            if (savedTask) {
                // Convert back to local format with ID
                const taskWithId = supabaseToTask(savedTask);
                console.log('🔧 TaskContext: Converted task:', taskWithId);
                
                // Update grouped tasks (for calendar)
                setTasks(prev => {
                    const updated = { ...prev };
                    if (!updated[taskWithId.date]) {
                        updated[taskWithId.date] = [];
                    }
                    updated[taskWithId.date] = [...updated[taskWithId.date], taskWithId]
                        .sort((a, b) => a.time.localeCompare(b.time));
                    return updated;
                });
                
                // Update flat list (for todo)
                setTasksList(prev => {
                    const updated = [...prev, taskWithId].sort((a, b) => {
                        const dateTimeA = new Date(`${a.date}T${a.time}`).getTime();
                        const dateTimeB = new Date(`${b.date}T${b.time}`).getTime();
                        return dateTimeA - dateTimeB;
                    });
                    return updated;
                });
                
                console.log('✅ TaskContext: Task added successfully');
                return taskWithId;
            } else {
                console.error('❌ TaskContext: Failed to save task - createTask returned null');
                return null;
            }
        } catch (error) {
            console.error('❌ TaskContext: Error adding task:', error);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    // Update task in both state formats
    const updateTaskInState = async (taskId: number, updatedTask: Task): Promise<Task | null> => {
        if (!session?.user?.id) {
            console.error('❌ TaskContext: User not logged in');
            return null;
        }

        try {
            setIsLoading(true);
            
            // Update in Supabase
            const savedTask = await updateTask(taskId, updatedTask, session.user.id);
            
            if (savedTask) {
                // Convert back to local format with ID
                const taskWithId = supabaseToTask(savedTask);
                
                // Find and remove old task from grouped tasks
                setTasks(prev => {
                    const updated = { ...prev };
                    
                    // Remove from old date
                    Object.keys(updated).forEach(date => {
                        updated[date] = updated[date].filter(task => task.id !== taskId);
                        if (updated[date].length === 0) {
                            delete updated[date];
                        }
                    });
                    
                    // Add to new date
                    if (!updated[taskWithId.date]) {
                        updated[taskWithId.date] = [];
                    }
                    updated[taskWithId.date] = [...updated[taskWithId.date], taskWithId]
                        .sort((a, b) => a.time.localeCompare(b.time));
                    
                    return updated;
                });
                
                // Update flat list
                setTasksList(prev => {
                    const updated = prev.map(task => 
                        task.id === taskId ? taskWithId : task
                    ).sort((a, b) => {
                        const dateTimeA = new Date(`${a.date}T${a.time}`).getTime();
                        const dateTimeB = new Date(`${b.date}T${b.time}`).getTime();
                        return dateTimeA - dateTimeB;
                    });
                    return updated;
                });
                
                console.log('✅ TaskContext: Task updated successfully');
                return taskWithId;
            } else {
                console.error('❌ TaskContext: Failed to update task');
                return null;
            }
        } catch (error) {
            console.error('❌ TaskContext: Error updating task:', error);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    // Remove task from both state formats
    const removeTaskFromState = async (taskId: number): Promise<boolean> => {
        if (!session?.user?.id) {
            console.error('❌ TaskContext: User not logged in');
            return false;
        }

        try {
            setIsLoading(true);
            
            // Delete from Supabase
            const success = await deleteTask(taskId, session.user.id);
            
            if (success) {
                // Remove from grouped tasks
                setTasks(prev => {
                    const updated = { ...prev };
                    Object.keys(updated).forEach(date => {
                        updated[date] = updated[date].filter(task => task.id !== taskId);
                        if (updated[date].length === 0) {
                            delete updated[date];
                        }
                    });
                    return updated;
                });
                
                // Remove from flat list
                setTasksList(prev => prev.filter(task => task.id !== taskId));
                
                console.log('✅ TaskContext: Task deleted successfully');
                return true;
            } else {
                console.error('❌ TaskContext: Failed to delete task');
                return false;
            }
        } catch (error) {
            console.error('❌ TaskContext: Error deleting task:', error);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    // Toggle task completion status
    const toggleTaskCompletionInState = async (task: Task): Promise<Task | null> => {
        if (!session?.user?.id || !task.id) {
            console.error('❌ TaskContext: User not logged in or task has no ID');
            return null;
        }

        try {
            setIsLoading(true);
            
            // Toggle completion in Supabase
            const updatedSupabaseTask = await toggleTaskCompletion(task.id, session.user.id);
            
            if (updatedSupabaseTask) {
                // Convert back to local format
                const updatedTask = supabaseToTask(updatedSupabaseTask);
                
                // Update grouped tasks (for calendar)
                setTasks(prev => {
                    const updated = { ...prev };
                    Object.keys(updated).forEach(date => {
                        updated[date] = updated[date].map(t => 
                            t.id === task.id ? updatedTask : t
                        );
                    });
                    return updated;
                });
                
                // Update flat list (for todo)
                setTasksList(prev => 
                    prev.map(t => t.id === task.id ? updatedTask : t)
                );
                
                console.log('✅ TaskContext: Task completion toggled successfully');
                return updatedTask;
            } else {
                console.error('❌ TaskContext: Failed to toggle task completion');
                return null;
            }
        } catch (error) {
            console.error('❌ TaskContext: Error toggling task completion:', error);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    // Load tasks when component mounts or user changes
    useEffect(() => {
        refreshTasks();
    }, [session?.user?.id, loggedIn]);

    const contextValue = {
        tasks,
        tasksList,
        isLoading,
        isTasksLoading,
        addTaskToState,
        updateTaskInState,
        removeTaskFromState,
        toggleTaskCompletionInState,
        refreshTasks,
    };

    return (
        <TaskContext.Provider value={contextValue}>
            {children}
        </TaskContext.Provider>
    );
};

export const useTaskContext = () => {
    const context = useContext(TaskContext);
    if (!context) {
        throw new Error('useTaskContext must be used within a TaskProvider');
    }
    return context;
};
