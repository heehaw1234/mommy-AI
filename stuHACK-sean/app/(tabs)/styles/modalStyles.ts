import { StyleSheet } from 'react-native';

export const modalStyles = StyleSheet.create({
  // Modal Overlays
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Modal Containers
  modalContainer: {
    backgroundColor: "#eef3fa",
    padding: 28,
    borderRadius: 24,
    width: 340,
    alignItems: "center",
    shadowColor: "#4f8cff",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },

  modalContainerWhite: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 20,
    width: 340,
    maxHeight: 500,
    alignItems: "center",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },

  modalContainerLarge: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 20,
    width: 350,
    maxHeight: 560,
    alignItems: "center",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },

  viewTaskModalContainer: {
    backgroundColor: "#fff",
    padding: 28,
    borderRadius: 20,
    width: 340,
    alignItems: "center",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },

  // Modal Headers
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    width: "100%",
    justifyContent: "center",
  },

  modalHeaderSimple: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    width: "100%",
  },

  modalTitle: {
    fontSize: 24,
    color: "#2563eb",
    fontWeight: "bold",
    letterSpacing: 0.5,
  },

  modalTitleMedium: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2563eb",
  },

  modalTitleSmall: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2563eb",
    flex: 1,
  },

  // Modal Content Areas
  modalScrollView: {
    width: "100%",
    maxHeight: 380,
  },

  modalScrollViewLarge: {
    width: "100%",
    maxHeight: 420,
    borderRadius: 14,
  },

  // Empty State
  emptyStateContainer: {
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyStateText: {
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 16,
    fontSize: 16,
  },

  // Task Items
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f7faff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#4f8cff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },

  taskItemContent: {
    flex: 1,
  },

  taskItemTitle: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#2563eb",
  },

  taskItemTime: {
    color: "#64748b",
    fontSize: 14,
    marginTop: 2,
  },

  taskItemDescription: {
    color: "#64748b",
    fontSize: 14,
    marginTop: 4,
    fontStyle: "italic",
  },

  taskItemIcon: {
    backgroundColor: "#eef2ff",
    padding: 10,
    borderRadius: 12,
    marginRight: 12,
  },

  // Date Time Picker
  dateTimePickerContainer: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 14,
  },

  dateTimePickerStyle: {
    backgroundColor: "#fff",
    width: "100%",
  },

  dateTimePickerIOSStyle: {
    backgroundColor: "#fff",
    width: "100%",
    height: 200,
  },

  dateTimePickerControls: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 10,
    backgroundColor: "#f8f9fa",
  },

  dateTimePickerButton: {
    padding: 10,
  },

  dateTimePickerCancelText: {
    color: "#6b7280",
    fontWeight: "600",
  },

  dateTimePickerDoneText: {
    color: "#2563eb",
    fontWeight: "600",
  },

  // Task Groups (for All Tasks modal)
  taskGroup: {
    marginBottom: 20,
  },

  taskGroupHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eef2ff",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 8,
  },

  taskGroupTitle: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#2563eb",
    marginLeft: 6,
  },

  taskGroupItem: {
    backgroundColor: "#f7faff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#4f8cff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },

  // View Task Details
  taskDetailIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  taskDetailTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2563eb",
    marginBottom: 12,
    textAlign: "center",
  },

  taskDetailInfoRow: {
    flexDirection: "row",
    marginBottom: 10,
    backgroundColor: "#f7faff",
    borderRadius: 12,
    padding: 12,
    width: "100%",
  },

  taskDetailInfoColumn: {
    alignItems: "center",
    width: "50%",
  },

  taskDetailInfoText: {
    color: "#64748b",
    fontSize: 15,
    fontWeight: "500",
  },

  taskDetailDescription: {
    backgroundColor: "#f7faff",
    padding: 16,
    borderRadius: 12,
    width: "100%",
    marginBottom: 20,
    minHeight: 100,
    justifyContent: "center",
  },

  taskDetailDescriptionText: {
    color: "#64748b",
    fontSize: 16,
    textAlign: "left",
  },

  taskDetailDescriptionTextItalic: {
    color: "#64748b",
    fontSize: 16,
    textAlign: "left",
    fontStyle: "italic",
  },

  // Modal Date Display
  modalDateText: {
    marginBottom: 16,
    color: "#2563eb",
    fontWeight: "500",
    fontSize: 15,
  },

  // Error Messages
  errorText: {
    color: "#e11d48",
    marginBottom: 10,
    fontWeight: "500",
  },
});