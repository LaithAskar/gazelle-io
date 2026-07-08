import SwiftUI

struct ParentDashboardView: View {
    @EnvironmentObject private var model: AppViewModel

    var body: some View {
        NavigationStack {
            List {
                Section("Students") {
                    ForEach(model.students) { student in
                        VStack(alignment: .leading, spacing: 4) {
                            Text(student.name).font(.headline)
                            Text("\(student.gradeLabel) • \((student.pace ?? "steady").capitalized) pace")
                                .foregroundStyle(.secondary)
                        }
                    }
                }

                Section("Recent sessions") {
                    if model.sessions.isEmpty {
                        Text("No sessions yet. Start a tutor session from Home.")
                            .foregroundStyle(.secondary)
                    } else {
                        ForEach(model.sessions) { session in
                            VStack(alignment: .leading, spacing: 4) {
                                Text(session.status.capitalized)
                                    .font(.headline)
                                Text(studentName(for: session.studentId))
                                Text(session.createdAt ?? "No date")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                }
            }
            .navigationTitle("Progress")
            .toolbar {
                Button("Refresh") {
                    Task { try? await model.refreshStudentsAndSessions() }
                }
            }
        }
    }

    private func studentName(for id: String) -> String {
        model.students.first { $0.id == id }?.name ?? "Student"
    }
}

struct SettingsView: View {
    @EnvironmentObject private var model: AppViewModel
    @State private var showAddStudent = false
    @State private var studentToDelete: StudentProfile?
    @State private var studentToLink: StudentProfile?
    @State private var classCodeInput = ""

    var body: some View {
        NavigationStack {
            List {
                Section("Parent") {
                    Text(model.parent?.name ?? "Parent")
                    Button("Sign out", role: .destructive) { model.signOut() }
                }

                Section("Students") {
                    ForEach(model.students) { student in
                        VStack(alignment: .leading) {
                            Text(student.name).font(.headline)
                            Text(student.gradeLabel).foregroundStyle(.secondary)
                            Text(student.teacherId == nil ? "Not linked to a class" : "Linked to a class ✓")
                                .font(.caption)
                                .foregroundStyle(student.teacherId == nil ? .secondary : Color.green)
                        }
                        .swipeActions {
                            Button("Delete", role: .destructive) { studentToDelete = student }
                            Button("Class code") {
                                classCodeInput = ""
                                studentToLink = student
                            }
                            .tint(.blue)
                        }
                    }
                    Button("Add student") { showAddStudent = true }
                }

                Section("Data deletion") {
                    Text("Deleting a student profile removes that child’s records through the parent-owned cascade. Full parent account deletion should be handled through the approved backend/support process before shipping publicly.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }
            .navigationTitle("Settings")
            .sheet(isPresented: $showAddStudent) { StudentProfileView().environmentObject(model) }
            .alert(
                "Link to a class",
                isPresented: Binding(
                    get: { studentToLink != nil },
                    set: { if !$0 { studentToLink = nil } }
                ),
                presenting: studentToLink
            ) { student in
                TextField("Class code", text: $classCodeInput)
                    .textInputAutocapitalization(.characters)
                    .autocorrectionDisabled()
                Button("Link") {
                    let code = classCodeInput
                    Task { await model.linkStudentToClass(student, classCode: code) }
                    studentToLink = nil
                }
                Button("Cancel", role: .cancel) { studentToLink = nil }
            } message: { student in
                Text("Enter the class code from \(student.name)'s teacher.")
            }
            .confirmationDialog(
                "Delete student data?",
                isPresented: Binding(
                    get: { studentToDelete != nil },
                    set: { if !$0 { studentToDelete = nil } }
                ),
                titleVisibility: .visible
            ) {
                Button("Delete student", role: .destructive) {
                    if let student = studentToDelete {
                        Task { await model.deleteStudent(student) }
                    }
                    studentToDelete = nil
                }
                Button("Cancel", role: .cancel) { studentToDelete = nil }
            } message: {
                Text("This removes the selected child profile and associated records. This action cannot be undone.")
            }
        }
    }
}
