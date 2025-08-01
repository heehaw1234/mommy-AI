export type Task = { 
    id?: number; // Supabase task ID
    text: string; 
    time: string; 
    date: string; 
    description?: string;
    completed?: boolean; // Task completion status
};

export type EditInputs = {
    text: string;
    time: string;
    date: string;
    description: string;
};

export type ViewTaskType = {
    task: Task;
    idx: number;
};

export type EditTaskType = {
    task: Task;
    idx: number;
    date: string;
};