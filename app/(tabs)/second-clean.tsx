import { SafeAreaView, View, Text, TouchableOpacity, ScrollView, Modal, Platform, StatusBar, ActivityIndicator, Alert } from "react-native";
import { useState, useEffect } from "react";
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from "@react-native-community/datetimepicker";

// Import types
import { Task, EditInputs, ViewTaskType, EditTaskType } from './types/task';

// Import utilities
import { formatTime, formatDate, formatDateForDisplay, getTodayString } from '../utils/dateUtils';
import { getCurrentTimeRounded, parseTimeToDate } from '../utils/taskUtils';

// Import components
import { AppButton } from './components/common/AppButton';
import { FormInput } from './components/common/FormInput';
import { PickerField } from './components/common/PickerField';

// Import styles (reusing from third.tsx)
import { modalStyles } from "./styles/modalStyles";
import { layoutStyles } from "./styles/layoutStyles";
import { buttonStyles } from "./styles/buttonStyles";

// Import context
import { useAppContext } from '@/contexts/AppContext';
import { useTaskContext } from '@/contexts/TaskContext';
import { useMommyLevel } from '@/contexts/MommyLevelContext';
import { supabase } from '@/lib/supabase';
import { StandardHeader } from '../components/StandardHeader';

export default function TodoListScreen() {
    // Authentication context
    const { session, loggedIn } = useAppContext();
    
    // Task context
    const { 
        tasksList: tasks, 
        isLoading: contextIsLoading, 
        isTasksLoading,
        addTaskToState,
        updateTaskInState,
        removeTaskFromState,
        toggleTaskCompletionInState 
    } = useTaskContext();

    // Mommy level context
    const { mommyLevel: mommyLvl } = useMommyLevel();

    // Local state for UI
    const [taskInput, setTaskInput] = useState("");
    const [timeInput, setTimeInput] = useState("");
    const [dateInput, setDateInput] = useState(getTodayString());
    const [showAddModal, setShowAddModal] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [descriptionInput, setDescriptionInput] = useState("");
    const [viewTask, setViewTask] = useState<ViewTaskType | null>(null);
    const [editTaskState, setEditTaskState] = useState<EditTaskType | null>(null);
    const [editInputs, setEditInputs] = useState<EditInputs>({
        text: "",
        time: "",
        date: "",
        description: "",
    });
    const [localIsLoading, setLocalIsLoading] = useState(false);

    // For DateTimePicker
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showEditTimePicker, setShowEditTimePicker] = useState(false);
    const [showEditDatePicker, setShowEditDatePicker] = useState(false);
    
    // Store picker values
    const [pickerTimeValue, setPickerTimeValue] = useState<Date>(getCurrentTimeRounded());
    const [pickerDateValue, setPickerDateValue] = useState<Date>(new Date());
    const [editPickerTimeValue, setEditPickerTimeValue] = useState<Date>(getCurrentTimeRounded());
    const [editPickerDateValue, setEditPickerDateValue] = useState<Date>(new Date());

    // Combined loading state
    const isLoading = contextIsLoading || localIsLoading;

    // Filter state for task completion - default to active tasks
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');

    // Filter and sort tasks based on completion status and deadline proximity
    const filteredTasks = tasks.filter(task => {
        switch (filter) {
            case 'active':
                return !task.completed;
            case 'completed':
                return task.completed;
            default:
                return true;
        }
    }).sort((a, b) => {
        // If filtering by completed, keep completed tasks at the end
        if (filter === 'completed') return 0;
        
        // Completed tasks go to the end
        if (a.completed && !b.completed) return 1;
        if (!a.completed && b.completed) return -1;
        if (a.completed && b.completed) return 0;
        
        // For active tasks, sort by deadline proximity
        const now = new Date();
        const aDateTime = new Date(`${a.date}T${a.time}`);
        const bDateTime = new Date(`${b.date}T${b.time}`);
        
        // Calculate time differences
        const aDiff = aDateTime.getTime() - now.getTime();
        const bDiff = bDateTime.getTime() - now.getTime();
        
        // Overdue tasks first (most overdue first)
        if (aDiff < 0 && bDiff < 0) return aDiff - bDiff;
        if (aDiff < 0 && bDiff >= 0) return -1;
        if (aDiff >= 0 && bDiff < 0) return 1;
        
        // For future tasks, sort by earliest deadline first
        return aDiff - bDiff;
    });

    // Handle task completion toggle
    const handleToggleCompletion = async (task: Task) => {
        if (!task.id) return;
        await toggleTaskCompletionInState(task);
    };

    const handleAddTask = async () => {
        if (!taskInput.trim() || !timeInput.trim() || !dateInput.trim()) {
            setErrorMsg("Please enter a task name, time, and date");
            return;
        }

        if (!session?.user?.id) {
            setErrorMsg("Please log in to save tasks");
            return;
        }

        try {
            setLocalIsLoading(true);
            
            const newTask: Task = {
                text: taskInput.trim(),
                time: timeInput,
                date: dateInput,
                description: descriptionInput.trim()
            };

            // Use context to add task
            const savedTask = await addTaskToState(newTask);
            
            if (savedTask) {
                // Reset form
                setTaskInput("");
                setTimeInput("");
                setDateInput(getTodayString());
                setDescriptionInput("");
                setShowAddModal(false);
                setErrorMsg("");
                
                // Reset picker values
                setPickerTimeValue(getCurrentTimeRounded());
                setPickerDateValue(new Date());
            } else {
                setErrorMsg("Failed to save task. Please try again.");
            }
        } catch (error) {
            console.error('Error adding task:', error);
            setErrorMsg("Failed to save task. Please try again.");
        } finally {
            setLocalIsLoading(false);
        }
    };

    const handleRemoveTask = async (taskToRemove: Task) => {
        if (!session?.user?.id || !taskToRemove.id) {
            console.error('User not logged in or task has no ID');
            return;
        }

        try {
            setLocalIsLoading(true);
            
            // Use context to remove task
            const success = await removeTaskFromState(taskToRemove.id);
            
            if (!success) {
                console.error('Failed to delete task');
            }
            
            // Close any open modals after deletion
            if (viewTask) setViewTask(null);
        } catch (error) {
            console.error('Error removing task:', error);
        } finally {
            setLocalIsLoading(false);
        }
    };

    const handleEditTask = async () => {
        if (!editTaskState) return;
        const { text, time, date, description } = editInputs;

        if (!text.trim() || !time || !date) {
            setErrorMsg("Please fill in all required fields");
            return;
        }

        if (!session?.user?.id || !editTaskState.task.id) {
            setErrorMsg("Please log in to edit tasks");
            return;
        }

        try {
            setLocalIsLoading(true);
            
            const newTask: Task = {
                text: text.trim(),
                time: time,
                date: date,
                description: description.trim()
            };

            // Use context to update task
            const updatedTask = await updateTaskInState(editTaskState.task.id, newTask);
            
            if (updatedTask) {
                setEditTaskState(null);
                setEditInputs({ text: "", time: "", date: "", description: "" });
                setErrorMsg("");
                setViewTask(null);
                // Reset edit picker values
                setEditPickerTimeValue(getCurrentTimeRounded());
                setEditPickerDateValue(new Date());
            } else {
                setErrorMsg("Failed to update task. Please try again.");
            }
        } catch (error) {
            console.error('Error editing task:', error);
            setErrorMsg("Failed to update task. Please try again.");
        } finally {
            setLocalIsLoading(false);
        }
    };

    // Helper function to start editing a task
    const startEditTask = (task: Task, idx: number) => {
        setEditTaskState({
            task: task,
            idx: idx,
            date: task.date,
        });
        setEditInputs({
            text: task.text,
            time: task.time,
            date: task.date,
            description: task.description || "",
        });
        // Set picker values to current task values
        setEditPickerTimeValue(parseTimeToDate(task.time));
        setEditPickerDateValue(new Date(task.date));
        setErrorMsg("");
        setViewTask(null);
    };

    // Helper to open time picker with proper initial value
    const openTimePicker = () => {
        if (timeInput) {
            const timeDate = parseTimeToDate(timeInput);
            setPickerTimeValue(timeDate);
        } else {
            const currentTime = getCurrentTimeRounded();
            setPickerTimeValue(currentTime);
        }
        setShowTimePicker(true);
    };

    // Helper to open date picker with proper initial value
    const openDatePicker = () => {
        if (dateInput) {
            // Parse date components manually to avoid timezone issues
            const [year, month, day] = dateInput.split('-').map(Number);
            const dateDate = new Date(year, month - 1, day); // month is 0-indexed
            setPickerDateValue(dateDate);
        } else {
            const today = new Date();
            setPickerDateValue(today);
        }
        setShowDatePicker(true);
    };

    // Helper to open edit time picker with proper initial value
    const openEditTimePicker = () => {
        if (editInputs.time) {
            const timeDate = parseTimeToDate(editInputs.time);
            setEditPickerTimeValue(timeDate);
        } else {
            const currentTime = getCurrentTimeRounded();
            setEditPickerTimeValue(currentTime);
        }
        setShowEditTimePicker(true);
    };

    // Helper to open edit date picker with proper initial value
    const openEditDatePicker = () => {
        if (editInputs.date) {
            // Parse date components manually to avoid timezone issues
            const [year, month, day] = editInputs.date.split('-').map(Number);
            const dateDate = new Date(year, month - 1, day); // month is 0-indexed
            setEditPickerDateValue(dateDate);
        } else {
            const today = new Date();
            setEditPickerDateValue(today);
        }
        setShowEditDatePicker(true);
    };

    const getTaskStatus = (task: Task) => {
        // If task is completed, show as completed regardless of time
        if (task.completed) {
            return { 
                status: 'completed', 
                color: '#22c55e',
                bgColor: '#dcfce7',
                borderColor: '#22c55e'
            };
        }

        try {
            const now = new Date();
            
            // More robust date parsing - fix timezone issues
            let taskDateTime;
            
            // Try different date formats
            if (task.date && task.time) {
                // Parse date components manually to avoid timezone issues
                const [year, month, day] = task.date.split('-').map(Number);
                
                // Handle different time formats
                let adjustedHours = 0;
                let minutes = 0;
                
                // Check if time has AM/PM format (e.g., "4:33 PM")
                if (task.time.match(/[ap]m/i)) {
                    const [timeStr, period] = task.time.split(/([ap]m)/i);
                    const timeParts = timeStr.split(':').map(Number);
                    const hours = timeParts[0];
                    minutes = timeParts[1] || 0;
                    
                    adjustedHours = hours;
                    if (period && period.toLowerCase() === 'pm' && hours !== 12) {
                        adjustedHours += 12;
                    } else if (period && period.toLowerCase() === 'am' && hours === 12) {
                        adjustedHours = 0;
                    }
                } else {
                    // Handle 24-hour format or timestamp format (e.g., "16:33:03.85455")
                    const timeParts = task.time.split(':');
                    adjustedHours = parseInt(timeParts[0]) || 0;
                    minutes = parseInt(timeParts[1]) || 0;
                }
                
                // Create date with local timezone (month is 0-indexed)
                taskDateTime = new Date(year, month - 1, day, adjustedHours, minutes);
                
                // Fallback: try ISO format if manual parsing fails
                if (isNaN(taskDateTime.getTime())) {
                    taskDateTime = new Date(`${task.date}T${task.time}`);
                }
            }
            
            // If still invalid, return upcoming as fallback
            if (!taskDateTime || isNaN(taskDateTime.getTime())) {
                console.warn('Invalid task date/time:', task.date, task.time);
                return { 
                    status: 'upcoming', 
                    color: '#10b981',
                    bgColor: '#f0fdf4',
                    borderColor: '#10b981'
                };
            }

            const diffMs = taskDateTime.getTime() - now.getTime();
            const diffMinutes = diffMs / (1000 * 60);
            const diffHours = diffMs / (1000 * 60 * 60);

            // 💀 MOMMY MULTIPLIER SYSTEM 💀
            // Only applies to critical, urgent, and upcoming
            // Overdue is always overdue regardless of mommy level
            
            // Multiplier: 1.0 (sweet mommy) to 5.0 (alpha mommy)
            // Formula: 1 + (mommyLvl / 9) * 4
            const mommyMultiplier = 1 + (mommyLvl / 9) * 4;

            // Debug logging
            console.log('🔥 Task:', task.text);
            console.log('🔥 Mommy Level:', mommyLvl, 'Multiplier:', mommyMultiplier.toFixed(2));
            console.log('⏰ Original time:', diffHours.toFixed(2), 'hours');

            if (diffMs < 0) {
                console.log('⚠️ Status: OVERDUE (no multiplier)');
                return { 
                    status: 'overdue', 
                    color: '#dc2626',
                    bgColor: '#fef2f2',
                    borderColor: '#dc2626'
                };
            }

            // Apply multiplier to make time thresholds stricter for these categories
            const adjustedDiffMinutes = diffMinutes / mommyMultiplier;
            const adjustedDiffHours = diffHours / mommyMultiplier;
            
            console.log('💥 Adjusted time:', adjustedDiffHours.toFixed(2), 'hours');
            
            // Use adjusted time for urgency calculations
            if (adjustedDiffHours <= 2) {
                console.log('🔥 Status: CRITICAL');
                return { 
                    status: 'critical', 
                    color: '#dc2626',
                    bgColor: '#fef2f2',
                    borderColor: '#dc2626'
                };
            }
            if (adjustedDiffHours <= 12) {
                console.log('⚡ Status: URGENT');
                return { 
                    status: 'urgent', 
                    color: '#ea580c',
                    bgColor: '#fff7ed',
                    borderColor: '#ea580c'
                };
            }
            
            console.log('🌿 Status: UPCOMING');
            return { 
                status: 'upcoming', 
                color: '#10b981',
                bgColor: '#f0fdf4',
                borderColor: '#10b981'
            };
        } catch (error) {
            console.error('Error calculating task status:', error, 'Task:', task);
            // Fallback to upcoming if there's any error
            return { 
                status: 'upcoming', 
                color: '#10b981',
                bgColor: '#f0fdf4',
                borderColor: '#10b981'
            };
        }
    };

    return (
        <SafeAreaView style={layoutStyles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#6366f1" />
            
            <ScrollView style={{ flex: 1, backgroundColor: '#f1f5f9' }}>
                {/* Header */}
                <StandardHeader
                    title="Task Manager"
                    subtitle="Stay organized and productive"
                    icon="checkmark-circle-outline"
                    rightComponent={
                        <View style={{
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 20,
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}>
                            <Ionicons 
                                name={mommyLvl <= 2 ? "heart" : mommyLvl <= 4 ? "happy" : mommyLvl <= 6 ? "business" : "flash"} 
                                size={14} 
                                color="#fff" 
                                style={{ marginRight: 4 }}
                            />
                            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
                                Mommy Lvl {mommyLvl}
                            </Text>
                        </View>
                    }
                />

                {/* Add Task Button */}
                <View style={{ padding: 20 }}>
                    <AppButton
                        title="Add New Task"
                        onPress={() => setShowAddModal(true)}
                        color="#10b981"
                        style={{ width: '100%' }}
                        icon={<Ionicons name="add-circle-outline" size={20} color="#fff" />}
                    />
                </View>

                {/* Tasks List */}
                <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
                    {/* Filter Buttons */}
                    <View style={{
                        flexDirection: 'row',
                        backgroundColor: '#ffffff',
                        borderRadius: 16,
                        padding: 6,
                        marginBottom: 20,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.05,
                        shadowRadius: 4,
                        elevation: 2,
                    }}>
                        <TouchableOpacity
                            onPress={() => setFilter('all')}
                            style={{
                                flex: 1,
                                paddingVertical: 12,
                                paddingHorizontal: 16,
                                borderRadius: 12,
                                backgroundColor: filter === 'all' ? '#6366f1' : 'transparent',
                            }}
                        >
                            <Text style={{
                                textAlign: 'center',
                                fontWeight: '600',
                                color: filter === 'all' ? '#fff' : '#64748b',
                            }}>
                                All ({tasks.length})
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setFilter('active')}
                            style={{
                                flex: 1,
                                paddingVertical: 12,
                                paddingHorizontal: 16,
                                borderRadius: 12,
                                backgroundColor: filter === 'active' ? '#6366f1' : 'transparent',
                            }}
                        >
                            <Text style={{
                                textAlign: 'center',
                                fontWeight: '600',
                                color: filter === 'active' ? '#fff' : '#64748b',
                            }}>
                                Active ({tasks.filter(t => !t.completed).length})
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setFilter('completed')}
                            style={{
                                flex: 1,
                                paddingVertical: 12,
                                paddingHorizontal: 16,
                                borderRadius: 12,
                                backgroundColor: filter === 'completed' ? '#6366f1' : 'transparent',
                            }}
                        >
                            <Text style={{
                                textAlign: 'center',
                                fontWeight: '600',
                                color: filter === 'completed' ? '#fff' : '#64748b',
                            }}>
                                Completed ({tasks.filter(t => t.completed).length})
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {isTasksLoading ? (
                        <View style={{
                            justifyContent: 'center',
                            alignItems: 'center',
                            paddingVertical: 40,
                        }}>
                            <ActivityIndicator size="large" color="#2563eb" />
                            <Text style={{ color: '#666', marginTop: 8 }}>Loading tasks...</Text>
                        </View>
                    ) : filteredTasks.length === 0 ? (
                        <View style={{
                            justifyContent: 'center',
                            alignItems: 'center',
                            paddingVertical: 60,
                        }}>
                            <Ionicons name="clipboard-outline" size={60} color="#cbd5e1" />
                            <Text style={{ 
                                color: '#94a3b8', 
                                fontSize: 16, 
                                marginTop: 16,
                                textAlign: 'center' 
                            }}>
                                No tasks yet. Add your first task to get started!
                            </Text>
                        </View>
                    ) : (
                        <View style={{
                            flexDirection: 'row',
                            flexWrap: 'wrap',
                            justifyContent: 'space-between',
                        }}>
                            {filteredTasks.map((task, index) => {
                                const status = getTaskStatus(task);
                                return (
                                    <TouchableOpacity
                                        key={task.id || index}
                                        style={{
                                            width: '48%',
                                            backgroundColor: task.completed ? '#fff' : status.bgColor,
                                            borderRadius: 12,
                                            padding: 12,
                                            marginBottom: 12,
                                            borderWidth: 1.5,
                                            borderColor: status.borderColor,
                                            borderLeftWidth: 4,
                                            borderLeftColor: status.color,
                                            opacity: task.completed ? 0.7 : 1,
                                            shadowColor: '#000',
                                            shadowOffset: { width: 0, height: 1 },
                                            shadowOpacity: 0.05,
                                            shadowRadius: 2,
                                            elevation: 2,
                                        }}
                                        onPress={() => setViewTask({ task, idx: index })}
                                        activeOpacity={0.8}
                                    >
                                        {/* Header Row */}
                                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
                                            {/* Checkbox */}
                                            <TouchableOpacity
                                                onPress={(e) => {
                                                    e.stopPropagation();
                                                    handleToggleCompletion(task);
                                                }}
                                                style={{
                                                    width: 18,
                                                    height: 18,
                                                    borderRadius: 4,
                                                    borderWidth: 1.5,
                                                    borderColor: task.completed ? '#22c55e' : '#d1d5db',
                                                    backgroundColor: task.completed ? '#22c55e' : '#fff',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    marginRight: 8,
                                                    marginTop: 1,
                                                }}
                                            >
                                                {task.completed && (
                                                    <Ionicons name="checkmark" size={12} color="#fff" />
                                                )}
                                            </TouchableOpacity>

                                            {/* Task Title */}
                                            <Text 
                                                style={{
                                                    flex: 1,
                                                    fontSize: 14,
                                                    fontWeight: '600',
                                                    color: task.completed ? '#9ca3af' : '#222',
                                                    textDecorationLine: task.completed ? 'line-through' : 'none',
                                                    lineHeight: 18,
                                                }}
                                                numberOfLines={2}
                                            >
                                                {task.text}
                                            </Text>

                                            {/* Delete Button */}
                                            <TouchableOpacity
                                                onPress={(e) => {
                                                    e.stopPropagation();
                                                    Alert.alert(
                                                        "Delete Task",
                                                        "Are you sure you want to delete this task?",
                                                        [
                                                            { text: "Cancel", style: "cancel" },
                                                            { 
                                                                text: "Delete", 
                                                                style: "destructive",
                                                                onPress: () => handleRemoveTask(task)
                                                            }
                                                        ]
                                                    );
                                                }}
                                                style={{ padding: 4 }}
                                            >
                                                <Ionicons name="trash-outline" size={14} color="#ef4444" />
                                            </TouchableOpacity>
                                        </View>

                                        {/* Time Row */}
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                                            <Ionicons name="time-outline" size={12} color="#666" />
                                            <Text style={{ 
                                                color: task.completed ? '#9ca3af' : '#666', 
                                                marginLeft: 4, 
                                                fontSize: 11,
                                                textDecorationLine: task.completed ? 'line-through' : 'none',
                                            }}>
                                                {formatDateForDisplay(task.date)} {task.time}
                                            </Text>
                                        </View>

                                        {/* Description (if exists) */}
                                        {task.description && (
                                            <Text style={{
                                                color: task.completed ? '#9ca3af' : '#888',
                                                fontSize: 11,
                                                fontStyle: 'italic',
                                                marginBottom: 6,
                                                textDecorationLine: task.completed ? 'line-through' : 'none',
                                            }}
                                            numberOfLines={1}
                                            >
                                                {task.description.length > 40 
                                                    ? task.description.substring(0, 40) + "..." 
                                                    : task.description}
                                            </Text>
                                        )}

                                        {/* Status Tag */}
                                        <View style={{
                                            backgroundColor: status.color,
                                            paddingHorizontal: 6,
                                            paddingVertical: 2,
                                            borderRadius: 8,
                                            alignSelf: 'flex-start',
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                        }}>
                                            {(status.status === 'overdue' || status.status === 'critical') && (
                                                <Ionicons name="alert-circle" size={10} color="#fff" style={{ marginRight: 2 }} />
                                            )}
                                            {status.status === 'urgent' && (
                                                <Ionicons name="warning" size={10} color="#fff" style={{ marginRight: 2 }} />
                                            )}
                                            <Text style={{ 
                                                color: '#fff', 
                                                fontSize: 9, 
                                                fontWeight: '700',
                                                letterSpacing: 0.3
                                            }}>
                                                {status.status.toUpperCase()}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                </View>

                {/* Add Task Modal */}
                <Modal
                    visible={showAddModal}
                    transparent
                    animationType="slide"
                    onRequestClose={() => {
                        setShowAddModal(false);
                        setErrorMsg("");
                    }}
                >
                    <View style={modalStyles.modalOverlay}>
                        <View style={modalStyles.modalContainer}>
                            <View style={modalStyles.modalHeader}>
                                <Ionicons name="add-circle" size={26} color="#2563eb" style={buttonStyles.iconMarginRightLarge} />
                                <Text style={modalStyles.modalTitle}>Add New Task</Text>
                            </View>
                            
                            <FormInput 
                                placeholder="Task Name"
                                value={taskInput}
                                onChangeText={setTaskInput}
                            />
                            
                            {/* Date Picker */}
                            <PickerField 
                                value={dateInput ? formatDateForDisplay(dateInput) : ""}
                                placeholder="Select Date"
                                onPress={openDatePicker}
                                icon={<Ionicons name="calendar" size={20} color="#4f8cff" />}
                            />
                            
                            {showDatePicker && (
                                <View style={modalStyles.dateTimePickerContainer}>
                                    <DateTimePicker
                                        value={pickerDateValue}
                                        mode="date"
                                        display={Platform.OS === "ios" ? "compact" : "default"}
                                        onChange={(event, selectedDate) => {
                                            if (Platform.OS === "android") {
                                                setShowDatePicker(false);
                                            }
                                            if (event.type === "set" && selectedDate) {
                                                const formattedDate = formatDate(selectedDate);
                                                setDateInput(formattedDate);
                                                setPickerDateValue(selectedDate);
                                                if (Platform.OS === "ios") {
                                                    setShowDatePicker(false);
                                                }
                                            } else if (event.type === "dismissed") {
                                                setShowDatePicker(false);
                                            }
                                        }}
                                        textColor={Platform.OS === "ios" ? "#222" : undefined}
                                        style={Platform.OS === "ios" ? modalStyles.dateTimePickerIOSStyle : modalStyles.dateTimePickerStyle}
                                        minimumDate={new Date()}
                                    />
                                    {Platform.OS === "ios" && (
                                        <View style={modalStyles.dateTimePickerControls}>
                                            <TouchableOpacity onPress={() => setShowDatePicker(false)} style={modalStyles.dateTimePickerButton}>
                                                <Text style={modalStyles.dateTimePickerCancelText}>Cancel</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => {
                                                    setDateInput(formatDate(pickerDateValue));
                                                    setShowDatePicker(false);
                                                }}
                                                style={modalStyles.dateTimePickerButton}
                                            >
                                                <Text style={modalStyles.dateTimePickerDoneText}>Done</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            )}
                            
                            {/* Time Picker */}
                            <PickerField 
                                value={timeInput}
                                placeholder="Select Time"
                                onPress={openTimePicker}
                                icon={<Ionicons name="time" size={20} color="#4f8cff" />}
                            />
                            
                            {showTimePicker && (
                                <View style={modalStyles.dateTimePickerContainer}>
                                    <DateTimePicker
                                        value={pickerTimeValue}
                                        mode="time"
                                        is24Hour={false}
                                        display={Platform.OS === "ios" ? "compact" : "default"}
                                        timeZoneOffsetInMinutes={480} // Singapore time (UTC+8)
                                        onChange={(event, selectedTime) => {
                                            if (Platform.OS === "android") {
                                                setShowTimePicker(false);
                                            }
                                            if (event.type === "set" && selectedTime) {
                                                const formattedTime = formatTime(selectedTime);
                                                setTimeInput(formattedTime);
                                                setPickerTimeValue(selectedTime);
                                                if (Platform.OS === "ios") {
                                                    setShowTimePicker(false);
                                                }
                                            } else if (event.type === "dismissed") {
                                                setShowTimePicker(false);
                                            }
                                        }}
                                        textColor={Platform.OS === "ios" ? "#222" : undefined}
                                        style={Platform.OS === "ios" ? modalStyles.dateTimePickerIOSStyle : modalStyles.dateTimePickerStyle}
                                        minuteInterval={5}
                                    />
                                    {Platform.OS === "ios" && (
                                        <View style={modalStyles.dateTimePickerControls}>
                                            <TouchableOpacity onPress={() => setShowTimePicker(false)} style={modalStyles.dateTimePickerButton}>
                                                <Text style={modalStyles.dateTimePickerCancelText}>Cancel</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => {
                                                    setTimeInput(formatTime(pickerTimeValue));
                                                    setShowTimePicker(false);
                                                }}
                                                style={modalStyles.dateTimePickerButton}
                                            >
                                                <Text style={modalStyles.dateTimePickerDoneText}>Done</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            )}
                            
                            <FormInput 
                                placeholder="Description (optional)"
                                value={descriptionInput}
                                onChangeText={setDescriptionInput}
                                multiline={true}
                                numberOfLines={3}
                            />
                            
                            {errorMsg ? (
                                <Text style={modalStyles.errorText}>{errorMsg}</Text>
                            ) : null}
                            
                            <View style={buttonStyles.modalButtonRow}>
                                <TouchableOpacity
                                    onPress={() => {
                                        setShowAddModal(false);
                                        setErrorMsg("");
                                    }}
                                    style={buttonStyles.cancelButton}
                                >
                                    <Text style={buttonStyles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    onPress={handleAddTask} 
                                    style={[buttonStyles.primaryButton, isLoading && { opacity: 0.6 }]}
                                    disabled={isLoading}
                                >
                                    <Text style={buttonStyles.primaryButtonText}>
                                        {isLoading ? "Adding..." : "Add Task"}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* View Task Details Modal */}
                <Modal
                    visible={!!viewTask}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setViewTask(null)}
                >
                    <View style={modalStyles.modalOverlay}>
                        <View style={modalStyles.viewTaskModalContainer}>
                            <View style={modalStyles.taskDetailIcon}>
                                <Ionicons name="clipboard-outline" size={30} color="#2563eb" />
                            </View>
                            
                            <Text style={modalStyles.taskDetailTitle}>
                                {viewTask?.task.text}
                            </Text>
                            
                            <View style={modalStyles.taskDetailInfoRow}>
                                <View style={modalStyles.taskDetailInfoColumn}>
                                    <Ionicons name="time-outline" size={22} color="#4f8cff" style={buttonStyles.iconMarginBottom} />
                                    <Text style={modalStyles.taskDetailInfoText}>{viewTask?.task.time}</Text>
                                </View>
                                <View style={modalStyles.taskDetailInfoColumn}>
                                    <Ionicons name="calendar-outline" size={22} color="#4f8cff" style={buttonStyles.iconMarginBottom} />
                                    <Text style={modalStyles.taskDetailInfoText}>
                                        {viewTask?.task.date ? formatDateForDisplay(viewTask.task.date) : ""}
                                    </Text>
                                </View>
                            </View>
                            
                            <View style={modalStyles.taskDetailDescription}>
                                <Text style={modalStyles.taskDetailDescriptionText}>
                                    {viewTask?.task.description || "No description provided."}
                                </Text>
                            </View>
                            
                            <View style={buttonStyles.modalButtonRowCentered}>
                                <TouchableOpacity 
                                    onPress={() => viewTask && startEditTask(viewTask.task, viewTask.idx)} 
                                    style={buttonStyles.primaryButton}
                                >
                                    <Ionicons name="create-outline" size={16} color="#fff" style={buttonStyles.iconMarginRight} />
                                    <Text style={buttonStyles.primaryButtonText}>Edit</Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity 
                                    onPress={() => setViewTask(null)} 
                                    style={buttonStyles.cancelButton}
                                >
                                    <Text style={buttonStyles.cancelButtonText}>Close</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Edit Task Modal */}
                <Modal
                    visible={!!editTaskState}
                    transparent
                    animationType="slide"
                    onRequestClose={() => {
                        setEditTaskState(null);
                        setErrorMsg("");
                    }}
                >
                    <View style={modalStyles.modalOverlay}>
                        <View style={modalStyles.modalContainer}>
                            <View style={modalStyles.modalHeader}>
                                <Ionicons name="create" size={26} color="#2563eb" style={buttonStyles.iconMarginRightLarge} />
                                <Text style={modalStyles.modalTitle}>Edit Task</Text>
                            </View>
                            
                            <FormInput 
                                placeholder="Task Name"
                                value={editInputs.text}
                                onChangeText={text => setEditInputs(inputs => ({ ...inputs, text }))}
                            />
                            
                            <PickerField 
                                value={editInputs.date ? formatDateForDisplay(editInputs.date) : ""}
                                placeholder="Select Date"
                                onPress={openEditDatePicker}
                                icon={<Ionicons name="calendar" size={20} color="#4f8cff" />}
                            />
                            
                            {showEditDatePicker && (
                                <View style={modalStyles.dateTimePickerContainer}>
                                    <DateTimePicker
                                        value={editPickerDateValue}
                                        mode="date"
                                        display={Platform.OS === "ios" ? "compact" : "default"}
                                        onChange={(event, selectedDate) => {
                                            if (Platform.OS === "android") {
                                                setShowEditDatePicker(false);
                                            }
                                            if (event.type === "set" && selectedDate) {
                                                const formattedDate = formatDate(selectedDate);
                                                setEditInputs(inputs => ({ ...inputs, date: formattedDate }));
                                                setEditPickerDateValue(selectedDate);
                                                if (Platform.OS === "ios") {
                                                    setShowEditDatePicker(false);
                                                }
                                            } else if (event.type === "dismissed") {
                                                setShowEditDatePicker(false);
                                            }
                                        }}
                                        textColor={Platform.OS === "ios" ? "#222" : undefined}
                                        style={Platform.OS === "ios" ? modalStyles.dateTimePickerIOSStyle : modalStyles.dateTimePickerStyle}
                                        minimumDate={new Date()}
                                    />
                                    {Platform.OS === "ios" && (
                                        <View style={modalStyles.dateTimePickerControls}>
                                            <TouchableOpacity onPress={() => setShowEditDatePicker(false)} style={modalStyles.dateTimePickerButton}>
                                                <Text style={modalStyles.dateTimePickerCancelText}>Cancel</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => {
                                                    setEditInputs(inputs => ({ ...inputs, date: formatDate(editPickerDateValue) }));
                                                    setShowEditDatePicker(false);
                                                }}
                                                style={modalStyles.dateTimePickerButton}
                                            >
                                                <Text style={modalStyles.dateTimePickerDoneText}>Done</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            )}
                            
                            <PickerField 
                                value={editInputs.time}
                                placeholder="Select Time"
                                onPress={openEditTimePicker}
                                icon={<Ionicons name="time" size={20} color="#4f8cff" />}
                            />
                            
                            {showEditTimePicker && (
                                <View style={modalStyles.dateTimePickerContainer}>
                                    <DateTimePicker
                                        value={editPickerTimeValue}
                                        mode="time"
                                        is24Hour={false}
                                        display={Platform.OS === "ios" ? "compact" : "default"}
                                        onChange={(event, selectedTime) => {
                                            if (Platform.OS === "android") {
                                                setShowEditTimePicker(false);
                                            }
                                            if (event.type === "set" && selectedTime) {
                                                const formattedTime = formatTime(selectedTime);
                                                setEditInputs(inputs => ({ ...inputs, time: formattedTime }));
                                                setEditPickerTimeValue(selectedTime);
                                                if (Platform.OS === "ios") {
                                                    setShowEditTimePicker(false);
                                                }
                                            } else if (event.type === "dismissed") {
                                                setShowEditTimePicker(false);
                                            }
                                        }}
                                        textColor={Platform.OS === "ios" ? "#222" : undefined}
                                        style={Platform.OS === "ios" ? modalStyles.dateTimePickerIOSStyle : modalStyles.dateTimePickerStyle}
                                        minuteInterval={5}
                                    />
                                    {Platform.OS === "ios" && (
                                        <View style={modalStyles.dateTimePickerControls}>
                                            <TouchableOpacity onPress={() => setShowEditTimePicker(false)} style={modalStyles.dateTimePickerButton}>
                                                <Text style={modalStyles.dateTimePickerCancelText}>Cancel</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => {
                                                    setEditInputs(inputs => ({ ...inputs, time: formatTime(editPickerTimeValue) }));
                                                    setShowEditTimePicker(false);
                                                }}
                                                style={modalStyles.dateTimePickerButton}
                                            >
                                                <Text style={modalStyles.dateTimePickerDoneText}>Done</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            )}
                            
                            <FormInput 
                                placeholder="Description (optional)"
                                value={editInputs.description}
                                onChangeText={description => setEditInputs(inputs => ({ ...inputs, description }))}
                                multiline={true}
                                numberOfLines={3}
                            />
                            
                            {errorMsg ? (
                                <Text style={modalStyles.errorText}>{errorMsg}</Text>
                            ) : null}
                            
                            <View style={buttonStyles.modalButtonRow}>
                                <TouchableOpacity
                                    onPress={() => {
                                        setEditTaskState(null);
                                        setErrorMsg("");
                                    }}
                                    style={buttonStyles.cancelButton}
                                >
                                    <Text style={buttonStyles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    onPress={handleEditTask} 
                                    style={[buttonStyles.primaryButton, isLoading && { opacity: 0.6 }]}
                                    disabled={isLoading}
                                >
                                    <Text style={buttonStyles.primaryButtonText}>
                                        {isLoading ? "Saving..." : "Save Changes"}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

            </ScrollView>
        </SafeAreaView>
    );
}
