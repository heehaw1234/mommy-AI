import { StyleSheet } from "react-native";
import { Theme } from "react-native-calendars/src/types";

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "flex-start",
        alignItems: "center",
        backgroundColor: "#f8fafc", // Updated to match new design system
        paddingBottom: 32,
        paddingTop: 32,
    },
    title: {
        fontSize: 30,
        fontWeight: "700",
        marginBottom: 18,
        color: "#1f2937",
        letterSpacing: 1,
        textShadowColor: "#e5e7eb",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    calendar: {
        marginTop: 10,
        width: 370,
        borderRadius: 20,
        overflow: "hidden",
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        backgroundColor: "#fff",
        borderWidth: 0,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        alignItems: "center",
    },
    addModalContainer: {
        backgroundColor: "#fff",
        padding: 28,
        borderRadius: 24,
        width: 350,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.20,
        shadowRadius: 12,
        elevation: 10,
    },
    addModalTitle: {
        fontSize: 22,
        marginBottom: 18,
        color: "#222",
        fontWeight: "700",
        letterSpacing: 1,
    },
    input: {
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        padding: 16,
        width: "100%",
        marginBottom: 18,
        backgroundColor: "#fff",
        fontSize: 17,
        color: "#222",
    },
    pickerButton: {
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        padding: 16,
        width: "100%",
        marginBottom: 18,
        backgroundColor: "#fff",
        fontSize: 17,
        color: "#222",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    pickerButtonText: {
        color: "#222",
        fontSize: 17,
    },
    pickerPlaceholder: {
        color: "#b6c3d1",
        fontSize: 17,
    },
    addButton: {
        backgroundColor: "#007aff",
        paddingVertical: 13,
        paddingHorizontal: 32,
        borderRadius: 12,
        marginTop: 10,
        shadowColor: "#007aff",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 5,
        elevation: 2,
    },
    addButtonText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 17,
        letterSpacing: 0.5,
    },
    cancelButton: {
        backgroundColor: "#f3f4f6",
        paddingVertical: 13,
        paddingHorizontal: 32,
        borderRadius: 12,
        marginRight: 10,
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    cancelButtonText: {
        color: "#222",
        fontWeight: "bold",
        fontSize: 17,
    },
    modalButtonRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        marginTop: 10,
    },
    tasksModalContainer: {
        backgroundColor: "#fff",
        padding: 28,
        borderRadius: 24,
        width: 370,
        maxHeight: 440,
        alignItems: "center",
        shadowColor: "#222",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.20,
        shadowRadius: 12,
        elevation: 10,
    },
    tasksModalTitle: {
        fontSize: 21,
        fontWeight: "bold",
        color: "#222",
        marginBottom: 18,
        letterSpacing: 0.5,
    },
    taskCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f3f4f6",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#222",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 1,
        width: "100%",
    },
    taskCardTitle: {
        fontWeight: "bold",
        fontSize: 17,
        color: "#222",
        letterSpacing: 0.2,
    },
    taskCardSubtitle: {
        color: "#555",
        fontSize: 14,
        marginTop: 2,
    },
    removeButtonText: {
        color: "#e75480",
        marginLeft: 18,
        fontWeight: "bold",
        fontSize: 15,
    },
    closeButton: {
        marginTop: 18,
        backgroundColor: "#007aff",
        paddingVertical: 13,
        paddingHorizontal: 38,
        borderRadius: 12,
        shadowColor: "#007aff",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 5,
        elevation: 2,
    },
    closeButtonText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 17,
        letterSpacing: 0.5,
    },
});

export const calendarTheme: Theme = {
    backgroundColor: "#f8fafc",
    calendarBackground: "#fff",
    selectedDayBackgroundColor: "#6366f1",
    selectedDayTextColor: "#fff",
    todayTextColor: "#6366f1",
    dayTextColor: "#1f2937",
    arrowColor: "#6366f1",
    monthTextColor: "#1f2937",
    textMonthFontWeight: "bold",
    textDayFontWeight: "500",
    textDayHeaderFontWeight: "bold",
    textSectionTitleColor: "#6b7280",
    textDayFontSize: 17,
    textMonthFontSize: 20,
    textDayHeaderFontSize: 15,
    dotColor: "#6366f1",
    selectedDotColor: "#fff",
    disabledArrowColor: "#d1d5db",
    indicatorColor: "#6366f1",
    textDisabledColor: "#d1d5db",
};