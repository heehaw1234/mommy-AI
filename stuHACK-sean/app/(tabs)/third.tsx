import { SafeAreaView, View, Text, TouchableOpacity, ScrollView, Modal, Platform, StatusBar, ActivityIndicator } from "react-native";
import { useState, useCallback, useEffect } from "react";
import { Calendar } from "react-native-calendars";
import { styles, calendarTheme } from "./styles/thirdStyles";
import { modalStyles } from "./styles/modalStyles";
import { layoutStyles } from "./styles/layoutStyles";
import { buttonStyles } from "./styles/buttonStyles";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from '@expo/vector-icons';

// Import types
import { Task, EditInputs, ViewTaskType, EditTaskType } from './types/task';

// Import utilities
import { formatTime, formatDate, formatDateForDisplay, getTodayString } from '../utils/dateUtils';
import { getAllTasksGrouped, getCurrentTimeRounded, parseTimeToDate } from '../utils/taskUtils';
import { getMarkedDates } from '../utils/calendarUtils';

// Import components
import { AppButton } from './components/common/AppButton';
import { FormInput } from './components/common/FormInput';
import { PickerField } from './components/common/PickerField';

// Import context
import { useAppContext } from '@/contexts/AppContext';
import { useTaskContext } from '@/contexts/TaskContext';

export default function CalendarScreen() {
    // Get today's date in YYYY-MM-DD
    const todayStr = getTodayString();

    // Authentication context
    const { session, loggedIn } = useAppContext();
    
    // Task context
    const { 
        tasks, 
        isLoading: contextIsLoading, 
        isTasksLoading,
        addTaskToState,
        updateTaskInState,
        removeTaskFromState 
    } = useTaskContext();

    // State variables
    const [selected, setSelected] = useState(todayStr);
    const [taskInput, setTaskInput] = useState("");
    const [timeInput, setTimeInput] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [modalDate, setModalDate] = useState(""); 
    const [showTasksModal, setShowTasksModal] = useState(false);
    const [tasksModalDate, setTasksModalDate] = useState<string | null>(null);
    const [showViewTasksButton, setShowViewTasksButton] = useState(false);
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
    const [showAllTasksModal, setShowAllTasksModal] = useState(false);
    const [calendarKey, setCalendarKey] = useState(0);
    const [localIsLoading, setLocalIsLoading] = useState(false);

    // For DateTimePicker - with better default values
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showEditTimePicker, setShowEditTimePicker] = useState(false);
    const [showEditDatePicker, setShowEditDatePicker] = useState(false);
    
    // Store picker values to avoid parsing issues
    const [pickerTimeValue, setPickerTimeValue] = useState<Date>(getCurrentTimeRounded());
    const [pickerDateValue, setPickerDateValue] = useState<Date>(new Date());
    const [editPickerTimeValue, setEditPickerTimeValue] = useState<Date>(getCurrentTimeRounded());
    const [editPickerDateValue, setEditPickerDateValue] = useState<Date>(new Date());

    // Combined loading state
    const isLoading = contextIsLoading || localIsLoading;

    // Mark dates with tasks on the calendar using utility function
    const markedDates = useCallback(() => getMarkedDates(selected, tasks), [selected, tasks]);

    const handleAddTask = async () => {
        const dateToUse = modalDate || selected;
        console.log('🔧 Third.tsx: Adding task with date:', dateToUse, 'modalDate:', modalDate, 'selected:', selected);
        console.log('🔧 Third.tsx: Task input:', taskInput, 'Time input:', timeInput);
        console.log('🔧 Third.tsx: Session user ID:', session?.user?.id);
        
        if (!dateToUse || !taskInput.trim() || !timeInput.trim()) {
            console.log('❌ Third.tsx: Validation failed - dateToUse:', dateToUse, 'taskInput:', taskInput, 'timeInput:', timeInput);
            setErrorMsg("Please enter a task name and select a time");
            return;
        }

        if (!session?.user?.id) {
            console.log('❌ Third.tsx: No user session');
            setErrorMsg("Please log in to save tasks");
            return;
        }

        try {
            setLocalIsLoading(true);
            
            const newTask: Task = {
                text: taskInput.trim(),
                time: timeInput,
                date: dateToUse,
                description: descriptionInput.trim()
            };

            console.log('🔧 Third.tsx: Created task object:', newTask);

            // Use context to add task
            const savedTask = await addTaskToState(newTask);
            console.log('🔧 Third.tsx: AddTaskToState returned:', savedTask);
            
            if (savedTask) {
                console.log('✅ Third.tsx: Task saved successfully');
                // Reset form
                setTaskInput("");
                setTimeInput("");
                setModalDate("");
                setDescriptionInput("");
                setShowAddModal(false);
                setErrorMsg("");
                
                // Reset picker values
                setPickerTimeValue(getCurrentTimeRounded());
                setPickerDateValue(new Date());
            } else {
                console.log('❌ Third.tsx: AddTaskToState returned null');
                setErrorMsg("Failed to save task. Please try again.");
            }
        } catch (error) {
            console.error('❌ Third.tsx: Error adding task:', error);
            setErrorMsg("Failed to save task. Please try again.");
        } finally {
            setLocalIsLoading(false);
        }
    };

    const handleRemoveTask = async (date: string, index: number, task?: Task) => {
        if (!session?.user?.id || !task?.id) {
            console.error('User not logged in or task has no ID');
            return;
        }

        try {
            setLocalIsLoading(true);
            
            // Use context to remove task
            const success = await removeTaskFromState(task.id);
            
            if (!success) {
                console.error('Failed to delete task');
            }
            
            // Close any open modals after deletion
            if (viewTask) setViewTask(null);
            if (showTasksModal && tasks[date] && tasks[date].length === 1) {
                setShowTasksModal(false);
            }
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
    const startEditTask = (task: Task, idx: number, originalDate: string) => {
        setEditTaskState({
            task: task,
            idx: idx,
            date: originalDate,
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
        // Close other modals
        setViewTask(null);
        setShowTasksModal(false);
        setShowAllTasksModal(false);
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
        if (modalDate) {
            setPickerDateValue(new Date(modalDate));
        } else if (selected) {
            setPickerDateValue(new Date(selected));
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

    // Helper to group and sort all tasks by date using utility function
    const groupedTasks = getAllTasksGrouped(tasks);

    return (
        <SafeAreaView style={layoutStyles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#2563eb" />
            <ScrollView contentContainerStyle={[styles.container, { padding: 0 }]}>
                {/* Header */}
                <View style={layoutStyles.header}>
                    <Text style={layoutStyles.headerTitle}>📅 My Calendar</Text>
                    <Text style={layoutStyles.headerSubtitle}>Organize your events and tasks</Text>
                </View>

                {/* Today Button */}
                <View style={layoutStyles.todayButtonContainer}>
                    <AppButton
                        title="Today"
                        onPress={() => {
                            setSelected(todayStr);
                            setTasksModalDate(todayStr);
                            setShowViewTasksButton(true);
                            setCalendarKey(prev => prev + 1);
                        }}
                        color="#4f8cff"
                        style={{ width: 140 }}
                        icon={<Ionicons name="today-outline" size={20} color="#fff" />}
                    />
                </View>

                {/* Calendar */}
                <View style={layoutStyles.calendarContainer}>
                    {isTasksLoading && (
                        <View style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                            justifyContent: 'center',
                            alignItems: 'center',
                            zIndex: 10,
                            borderRadius: 12,
                        }}>
                            <ActivityIndicator size="large" color="#2563eb" />
                            <Text style={{ color: '#666', marginTop: 8 }}>Loading tasks...</Text>
                        </View>
                    )}
                    <Calendar
                        key={calendarKey}
                        onDayPress={day => {
                            setSelected(day.dateString);
                            setTasksModalDate(day.dateString);
                            setShowViewTasksButton(true);
                        }}
                        markedDates={markedDates()}
                        style={layoutStyles.calendarStyle}
                        theme={{
                            ...calendarTheme,
                            backgroundColor: "#fff",
                            calendarBackground: "#fff",
                            selectedDayBackgroundColor: "#2563eb",
                            selectedDayTextColor: "#fff",
                            todayTextColor: "#4f8cff",
                            dayTextColor: "#222",
                            textDisabledColor: "#b6c3d1",
                            arrowColor: "#2563eb",
                            monthTextColor: "#2563eb",
                            textMonthFontWeight: "bold",
                            textMonthFontSize: 20,
                            textDayFontWeight: "600",
                            textDayFontSize: 16,
                            textSectionTitleColor: "#b6c3d1",
                        }}
                        current={selected}
                    />
                </View>

                {/* Action Buttons */}
                <View style={layoutStyles.actionButtonsContainer}>
                    <AppButton
                        title="Add Task"
                        onPress={() => setShowAddModal(true)}
                        color="#22c55e"
                        style={layoutStyles.actionButtonStyle}
                        icon={<Ionicons name="add-circle-outline" size={20} color="#fff" />}
                    />
                    <AppButton
                        title="View All Tasks"
                        onPress={() => setShowAllTasksModal(true)}
                        color="#6366f1"
                        style={layoutStyles.actionButtonStyle}
                        icon={<Ionicons name="list-outline" size={20} color="#fff" />}
                    />
                </View>

                {showViewTasksButton && selected && (
                    <View style={layoutStyles.viewTasksButtonContainer}>
                        <AppButton
                            title={`View Tasks for ${selected.split('-').slice(1).join('/')}` }
                            onPress={() => setShowTasksModal(true)}
                            color="#2563eb"
                            style={{ width: 260 }}
                            icon={<Ionicons name="calendar-outline" size={20} color="#fff" />}
                        />
                    </View>
                )}

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
                                <Text style={modalStyles.modalTitle}>Add a New Task</Text>
                            </View>
                            
                            <FormInput 
                                placeholder="Event Name"
                                value={taskInput}
                                onChangeText={setTaskInput}
                            />
                            
                            {/* Date Picker */}
                            <PickerField 
                                value={modalDate ? formatDateForDisplay(modalDate) : ""}
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
                                                setModalDate(formatDate(date));
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
                                                    setModalDate(formatDate(pickerDateValue));
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
                            
                            <Text style={modalStyles.modalDateText}>
                                {modalDate ? `Selected: ${formatDateForDisplay(modalDate)}` : 
                                  selected ? `Default: ${formatDateForDisplay(selected)}` : 
                                  "Please select a date"}
                            </Text>
                            
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
                                placeholder="Event Name"
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

                {/* Tasks for Selected Date Modal */}
                <Modal
                    visible={showTasksModal}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setShowTasksModal(false)}
                >
                    <View style={modalStyles.modalOverlay}>
                        <View style={modalStyles.modalContainerWhite}>
                            <View style={modalStyles.modalHeaderSimple}>
                                <Ionicons name="calendar" size={24} color="#2563eb" style={buttonStyles.iconMarginLeft} />
                                <Text style={modalStyles.modalTitleSmall}>
                                    {tasksModalDate ? formatDateForDisplay(tasksModalDate) : ""}
                                </Text>
                            </View>
                            
                            <ScrollView style={modalStyles.modalScrollView}>
                                {(tasksModalDate && tasks[tasksModalDate] && tasks[tasksModalDate].length > 0) ? (
                                    tasks[tasksModalDate]
                                        .slice()
                                        .sort((a, b) => a.time.localeCompare(b.time))
                                        .map((item, idx) => (
                                            <TouchableOpacity
                                                key={item.date + item.time + item.text + idx}
                                                onPress={() => {
                                                    setShowTasksModal(false);
                                                    setViewTask({ task: item, idx });
                                                }}
                                                style={modalStyles.taskItem}
                                            >
                                                <View style={modalStyles.taskItemIcon}>
                                                    <Ionicons name="time" size={20} color="#4f8cff" />
                                                </View>
                                                <View style={modalStyles.taskItemContent}>
                                                    <Text style={modalStyles.taskItemTitle}>{item.text}</Text>
                                                    <Text style={modalStyles.taskItemTime}>{item.time}</Text>
                                                    {item.description ? (
                                                        <Text style={modalStyles.taskItemDescription}>
                                                            {item.description.length > 30 
                                                                ? item.description.substring(0, 30) + "..." 
                                                                : item.description}
                                                        </Text>
                                                    ) : null}
                                                </View>
                                                <TouchableOpacity 
                                                    onPress={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveTask(item.date, idx, item);
                                                    }}
                                                    style={buttonStyles.trashButton}
                                                >
                                                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                                                </TouchableOpacity>
                                            </TouchableOpacity>
                                        ))
                                ) : (
                                    <View style={modalStyles.emptyStateContainer}>
                                        <Ionicons name="calendar-outline" size={50} color="#cbd5e1" />
                                        <Text style={modalStyles.emptyStateText}>
                                            No tasks scheduled for this date.
                                        </Text>
                                        <TouchableOpacity
                                            onPress={() => {
                                                setShowTasksModal(false);
                                                setShowAddModal(true);
                                                setModalDate(tasksModalDate || "");
                                            }}
                                            style={buttonStyles.addTaskButton}
                                        >
                                            <Ionicons name="add-circle-outline" size={20} color="#fff" style={buttonStyles.iconMarginRight} />
                                            <Text style={buttonStyles.addTaskButtonText}>Add a task</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </ScrollView>
                            
                            <TouchableOpacity
                                onPress={() => setShowTasksModal(false)}
                                style={[buttonStyles.primaryButtonFull, { marginTop: 16 }]}
                            >
                                <Text style={buttonStyles.primaryButtonText}>Close</Text>
                            </TouchableOpacity>
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
                                <Ionicons name="calendar-outline" size={30} color="#2563eb" />
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
                                        {viewTask?.task.date}
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
                                            startEditTask(viewTask.task, viewTask.idx, viewTask.task.date);
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

                {/* View All Tasks Modal */}
                <Modal
                    visible={showAllTasksModal}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setShowAllTasksModal(false)}
                >
                    <View style={modalStyles.modalOverlay}>
                        <View style={modalStyles.modalContainerLarge}>
                            <View style={modalStyles.modalHeaderSimple}>
                                <Ionicons name="list" size={24} color="#2563eb" style={buttonStyles.iconMarginLeft} />
                                <Text style={modalStyles.modalTitleMedium}>All Scheduled Tasks</Text>
                            </View>
                            
                            <ScrollView style={modalStyles.modalScrollViewLarge}>
                                {groupedTasks.length === 0 ? (
                                    <View style={modalStyles.emptyStateContainer}>
                                        <Ionicons name="calendar-outline" size={60} color="#cbd5e1" />
                                        <Text style={modalStyles.emptyStateText}>
                                            No tasks scheduled yet.
                                        </Text>
                                        <TouchableOpacity
                                            onPress={() => {
                                                setShowAllTasksModal(false);
                                                setShowAddModal(true);
                                            }}
                                            style={buttonStyles.addTaskButton}
                                        >
                                            <Ionicons name="add-circle-outline" size={20} color="#fff" style={buttonStyles.iconMarginRight} />
                                            <Text style={buttonStyles.addTaskButtonText}>Add your first task</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    groupedTasks.map(group => (
                                        <View key={group.date} style={modalStyles.taskGroup}>
                                            <View style={modalStyles.taskGroupHeader}>
                                                <Ionicons name="calendar" size={18} color="#4f8cff" />
                                                <Text style={modalStyles.taskGroupTitle}>
                                                    {formatDateForDisplay(group.date)}
                                                </Text>
                                            </View>
                                            
                                            {group.tasks.map((task, idx) => (
                                                <View
                                                    key={task.time + task.text + idx}
                                                    style={modalStyles.taskGroupItem}
                                                >
                                                    <View style={modalStyles.taskItemIcon}>
                                                        <Ionicons name="time" size={18} color="#4f8cff" />
                                                    </View>
                                                    <TouchableOpacity
                                                        style={modalStyles.taskItemContent}
                                                        onPress={() => {
                                                            setShowAllTasksModal(false);
                                                            setViewTask({ task, idx });
                                                        }}
                                                    >
                                                        <Text style={modalStyles.taskItemTitle}>{task.text}</Text>
                                                        <Text style={modalStyles.taskItemTime}>
                                                            {task.time}
                                                            {task.description ? 
                                                                task.description.length > 25 
                                                                    ? ` - ${task.description.substring(0, 25)}...` 
                                                                    : ` - ${task.description}` 
                                                                : ""}
                                                        </Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        onPress={() => handleRemoveTask(group.date, idx, task)}
                                                        style={buttonStyles.trashButton}
                                                    >
                                                        <Ionicons name="trash-outline" size={20} color="#ef4444" />
                                                    </TouchableOpacity>
                                                </View>
                                            ))}
                                        </View>
                                    ))
                                )}
                            </ScrollView>
                            
                            <TouchableOpacity
                                onPress={() => setShowAllTasksModal(false)}
                                style={[buttonStyles.primaryButtonFull, { marginTop: 16 }]}
                            >
                                <Text style={buttonStyles.primaryButtonText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

            </ScrollView>
        </SafeAreaView>
    );
}