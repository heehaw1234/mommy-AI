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

    // Filter state for task completion
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

    // Filter tasks based on completion status
    const filteredTasks = tasks.filter(task => {
        switch (filter) {
            case 'active':
                return !task.completed;
            case 'completed':
                return task.completed;
            default:
                return true;
        }
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
            setPickerTimeValue(parseTimeToDate(timeInput));
        } else {
            setPickerTimeValue(getCurrentTimeRounded());
        }
        setShowTimePicker(true);
    };

    // Helper to open date picker with proper initial value
    const openDatePicker = () => {
        if (dateInput) {
            setPickerDateValue(new Date(dateInput));
        } else {
            setPickerDateValue(new Date());
        }
        setShowDatePicker(true);
    };

    // Helper to open edit time picker with proper initial value
    const openEditTimePicker = () => {
        if (editInputs.time) {
            setEditPickerTimeValue(parseTimeToDate(editInputs.time));
        } else {
            setEditPickerTimeValue(getCurrentTimeRounded());
        }
        setShowEditTimePicker(true);
    };

    // Helper to open edit date picker with proper initial value
    const openEditDatePicker = () => {
        if (editInputs.date) {
            setEditPickerDateValue(new Date(editInputs.date));
        } else {
            setEditPickerDateValue(new Date());
        }
        setShowEditDatePicker(true);
    };

    const getTaskStatus = (task: Task) => {
        // If task is completed, show as completed regardless of time
        if (task.completed) {
            return { status: 'completed', color: '#22c55e' };
        }

        const now = new Date();
        const taskDateTime = new Date(`${task.date}T${task.time}`);
        const diffMs = taskDateTime.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffMs < 0) return { status: 'overdue', color: '#ef4444' };
        if (diffHours < 1) return { status: 'urgent', color: '#f97316' };
        if (diffHours < 24) return { status: 'today', color: '#eab308' };
        return { status: 'upcoming', color: '#22c55e' };
    };

    return (
        <SafeAreaView style={layoutStyles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#6366f1" />
            <ScrollView style={{ flex: 1, backgroundColor: '#f1f5f9' }}>
                {/* Header */}
                <View style={layoutStyles.header}>
                    <Text style={layoutStyles.headerTitle}>✅ Task Manager</Text>
                    <Text style={layoutStyles.headerSubtitle}>Stay organized and productive</Text>
                </View>

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
                        filteredTasks.map((task, index) => {
                            const status = getTaskStatus(task);
                            return (
                                <View
                                    key={task.id || index}
                                    style={{
                                        backgroundColor: '#fff',
                                        borderRadius: 16,
                                        padding: 20,
                                        marginBottom: 16,
                                        shadowColor: '#000',
                                        shadowOffset: { width: 0, height: 3 },
                                        shadowOpacity: 0.08,
                                        shadowRadius: 6,
                                        elevation: 4,
                                        borderLeftWidth: 4,
                                        borderLeftColor: status.color,
                                        opacity: task.completed ? 0.7 : 1,
                                    }}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                                        {/* Checkbox */}
                                        <TouchableOpacity
                                            onPress={() => handleToggleCompletion(task)}
                                            style={{
                                                width: 24,
                                                height: 24,
                                                borderRadius: 6,
                                                borderWidth: 2,
                                                borderColor: task.completed ? '#22c55e' : '#d1d5db',
                                                backgroundColor: task.completed ? '#22c55e' : '#fff',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                marginRight: 12,
                                                marginTop: 2,
                                            }}
                                        >
                                            {task.completed && (
                                                <Ionicons name="checkmark" size={16} color="#fff" />
                                            )}
                                        </TouchableOpacity>

                                        {/* Task Content */}
                                        <TouchableOpacity 
                                            style={{ flex: 1 }}
                                            onPress={() => setViewTask({ task, idx: index })}
                                        >
                                            <Text style={{
                                                fontSize: 16,
                                                fontWeight: 'bold',
                                                color: task.completed ? '#9ca3af' : '#222',
                                                marginBottom: 4,
                                                textDecorationLine: task.completed ? 'line-through' : 'none',
                                            }}>
                                                {task.text}
                                            </Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                                <Ionicons name="time-outline" size={16} color="#666" />
                                                <Text style={{ 
                                                    color: task.completed ? '#9ca3af' : '#666', 
                                                    marginLeft: 4, 
                                                    fontSize: 14,
                                                    textDecorationLine: task.completed ? 'line-through' : 'none',
                                                }}>
                                                    {formatDateForDisplay(task.date)} at {task.time}
                                                </Text>
                                            </View>
                                            {task.description && (
                                                <Text style={{
                                                    color: task.completed ? '#9ca3af' : '#888',
                                                    fontSize: 14,
                                                    fontStyle: 'italic',
                                                    marginTop: 4,
                                                    textDecorationLine: task.completed ? 'line-through' : 'none',
                                                }}>
                                                    {task.description.length > 60 
                                                        ? task.description.substring(0, 60) + "..." 
                                                        : task.description}
                                                </Text>
                                            )}
                                            <View style={{
                                                backgroundColor: status.color,
                                                paddingHorizontal: 8,
                                                paddingVertical: 2,
                                                borderRadius: 12,
                                                alignSelf: 'flex-start',
                                                marginTop: 8,
                                            }}>
                                                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '500' }}>
                                                    {status.status.toUpperCase()}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>

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
                                            style={{ padding: 8 }}
                                        >
                                            <Ionicons name="trash-outline" size={20} color="#ef4444" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        })
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
                                        onChange={(event, date) => {
                                            if (Platform.OS === "android") {
                                                setShowDatePicker(false);
                                            }
                                            if (event.type === "set" && date) {
                                                setDateInput(formatDate(date));
                                                setPickerDateValue(date);
                                                if (Platform.OS === "ios") {
                                                    setShowDatePicker(false);
                                                }
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
                                        is24Hour={true}
                                        display={Platform.OS === "ios" ? "compact" : "default"}
                                        onChange={(event, date) => {
                                            if (Platform.OS === "android") {
                                                setShowTimePicker(false);
                                            }
                                            if (event.type === "set" && date) {
                                                setTimeInput(formatTime(date));
                                                setPickerTimeValue(date);
                                                if (Platform.OS === "ios") {
                                                    setShowTimePicker(false);
                                                }
                                            }
                                        }}
                                        textColor={Platform.OS === "ios" ? "#222" : undefined}
                                        style={Platform.OS === "ios" ? modalStyles.dateTimePickerIOSStyle : modalStyles.dateTimePickerStyle}
                                        minuteInterval={15}
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
                                        {isLoading ? "Saving..." : "Add Task"}
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
                                    <Text style={modalStyles.taskDetailInfoText}>
                                        {viewTask?.task.time}
                                    </Text>
                                </View>
                                <View style={modalStyles.taskDetailInfoColumn}>
                                    <Ionicons name="calendar-outline" size={22} color="#4f8cff" style={buttonStyles.iconMarginBottom} />
                                    <Text style={modalStyles.taskDetailInfoText}>
                                        {viewTask?.task.date ? formatDateForDisplay(viewTask.task.date) : ""}
                                    </Text>
                                </View>
                            </View>
                            
                            <View style={modalStyles.taskDetailDescription}>
                                <Text style={viewTask?.task.description ? modalStyles.taskDetailDescriptionText : modalStyles.taskDetailDescriptionTextItalic}>
                                    {viewTask?.task.description || "No description added."}
                                </Text>
                            </View>
                            
                            <View style={buttonStyles.modalButtonRowCentered}>
                                <TouchableOpacity
                                    onPress={() => {
                                        if (viewTask) {
                                            startEditTask(viewTask.task, viewTask.idx);
                                        }
                                    }}
                                    style={buttonStyles.editButton}
                                >
                                    <Ionicons name="create-outline" size={20} color="#2563eb" style={buttonStyles.iconMarginRight} />
                                    <Text style={buttonStyles.editButtonText}>Edit</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setViewTask(null)}
                                    style={buttonStyles.primaryButton}
                                >
                                    <Text style={buttonStyles.primaryButtonText}>Close</Text>
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
                            
                            {/* Edit Date Picker */}
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
                                        onChange={(event, date) => {
                                            if (Platform.OS === "android") {
                                                setShowEditDatePicker(false);
                                            }
                                            if (event.type === "set" && date) {
                                                setEditInputs(inputs => ({ ...inputs, date: formatDate(date) }));
                                                setEditPickerDateValue(date);
                                                if (Platform.OS === "ios") {
                                                    setShowEditDatePicker(false);
                                                }
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
                            
                            {/* Edit Time Picker */}
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
                                        is24Hour={true}
                                        display={Platform.OS === "ios" ? "compact" : "default"}
                                        onChange={(event, date) => {
                                            if (Platform.OS === "android") {
                                                setShowEditTimePicker(false);
                                            }
                                            if (event.type === "set" && date) {
                                                setEditInputs(inputs => ({ ...inputs, time: formatTime(date) }));
                                                setEditPickerTimeValue(date);
                                                if (Platform.OS === "ios") {
                                                    setShowEditTimePicker(false);
                                                }
                                            }
                                        }}
                                        textColor={Platform.OS === "ios" ? "#222" : undefined}
                                        style={Platform.OS === "ios" ? modalStyles.dateTimePickerIOSStyle : modalStyles.dateTimePickerStyle}
                                        minuteInterval={15}
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