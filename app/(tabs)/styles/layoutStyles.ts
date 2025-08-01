import { StyleSheet } from 'react-native';

export const layoutStyles = StyleSheet.create({
  // Main Container
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  // Header
  header: {
    backgroundColor: "#6366f1",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingTop: 36,
    paddingBottom: 24,
    paddingHorizontal: 24,
    marginBottom: 16,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },

  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 1,
    textAlign: "center",
    marginBottom: 6,
  },

  headerSubtitle: {
    fontSize: 16,
    color: "#c7d2fe",
    textAlign: "center",
    marginBottom: 0,
  },

  // Today Button Container
  todayButtonContainer: {
    alignItems: "center",
    marginBottom: 12,
  },

  // Calendar Container
  calendarContainer: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  calendarStyle: {
    borderRadius: 20,
    padding: 10,
  },

  // Action Buttons Container
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
    marginHorizontal: 16,
  },

  actionButtonStyle: {
    flex: 1,
    marginHorizontal: 6,
  },

  // View Tasks Button Container
  viewTasksButtonContainer: {
    alignItems: "center",
    marginBottom: 16,
  },

  // Container Utilities
  row: {
    flexDirection: "row",
    alignItems: "center",
  },

  spaceBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  centered: {
    alignItems: "center",
    justifyContent: "center",
  },

  flex1: {
    flex: 1,
  },

  fullWidth: {
    width: "100%",
  },
});