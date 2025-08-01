import { StyleSheet } from 'react-native';

export const buttonStyles = StyleSheet.create({
  // Modal Button Rows
  modalButtonRow: {
    flexDirection: "row",
    marginTop: 8,
    width: "100%",
    justifyContent: "space-between",
  },

  modalButtonRowCentered: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
  },

  // Cancel Buttons
  cancelButton: {
    backgroundColor: "#f1f5f9",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: "48%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },

  cancelButtonText: {
    color: "#64748b",
    fontWeight: "bold",
    fontSize: 16,
  },

  // Primary Action Buttons
  primaryButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: "48%",
    alignItems: "center",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },

  primaryButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  // Full Width Primary Button
  primaryButtonFull: {
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },

  // Edit Button (in view task modal)
  editButton: {
    backgroundColor: "#f1f5f9",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: "48%",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },

  editButtonText: {
    color: "#2563eb",
    fontWeight: "bold",
    fontSize: 16,
  },

  // Add Task Button (empty state)
  addTaskButton: {
    marginTop: 16,
    backgroundColor: "#22c55e",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  addTaskButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },

  // Trash Button
  trashButton: {
    padding: 8,
  },

  // Icon Margins
  iconMarginRight: {
    marginRight: 6,
  },

  iconMarginLeft: {
    marginLeft: 6,
  },

  iconMarginRightLarge: {
    marginRight: 10,
  },

  iconMarginBottom: {
    marginBottom: 4,
  },
});