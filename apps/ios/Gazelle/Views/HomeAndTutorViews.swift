import SwiftUI

struct HomeView: View {
    @EnvironmentObject private var model: AppViewModel

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 18) {
                    Card {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Today’s practice")
                                .font(.title2.bold())
                            if model.students.count > 1 {
                                Picker("Student", selection: Binding(
                                    get: { model.selectedStudent?.id ?? "" },
                                    set: { id in model.selectedStudent = model.students.first { $0.id == id } }
                                )) {
                                    ForEach(model.students) { student in
                                        Text(student.name).tag(student.id)
                                    }
                                }
                            }
                            if let student = model.selectedStudent {
                                Text("Hi, \(student.name)! Ready for a short adaptive session?")
                                    .font(.title3)
                                Text(student.gradeLabel)
                                    .foregroundStyle(.secondary)
                            }
                            Button("Start tutor session") {
                                Task { await model.startTutorSession() }
                            }
                            .primaryGazelleButton()
                            .disabled(model.selectedStudent == nil)
                        }
                    }

                    Card {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Safety by design")
                                .font(.headline)
                            Text("Tutor messages are reviewed server-side before a student sees them. Students do not have login accounts.")
                                .foregroundStyle(.secondary)
                        }
                    }
                }
                .padding()
            }
            .navigationTitle("Home")
            .sheet(isPresented: Binding(
                get: { model.activeSession != nil },
                set: { if !$0 { Task { await model.endTutorSession() } } }
            )) {
                TutorSessionView()
                    .environmentObject(model)
            }
        }
    }
}

struct TutorSessionView: View {
    @EnvironmentObject private var model: AppViewModel
    @State private var answer = ""
    @State private var showSummary = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                if let session = model.activeSession {
                    Card {
                        VStack(alignment: .leading, spacing: 14) {
                            Text("Question")
                                .font(.caption.bold())
                                .foregroundStyle(.secondary)
                            Text(session.question.prompt)
                                .font(.title3.bold())
                            if let choices = session.question.choices, choices.isEmpty == false {
                                ForEach(choices, id: \.self) { choice in
                                    Button(choice) {
                                        answer = choice
                                    }
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .padding()
                                    .background(answer == choice ? Color.accentColor.opacity(0.15) : Color(.tertiarySystemBackground))
                                    .clipShape(RoundedRectangle(cornerRadius: 14))
                                }
                            } else {
                                TextField("Type your answer", text: $answer, axis: .vertical)
                                    .textFieldStyle(.roundedBorder)
                            }
                        }
                    }

                    if let result = model.lastTutorResult {
                        Card {
                            VStack(alignment: .leading, spacing: 10) {
                                Text(result.isCorrect ? "Nice work!" : "Good try")
                                    .font(.title3.bold())
                                Text(result.feedback)
                                Text("Next difficulty: \(result.nextDifficulty.capitalized)")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }

                    Spacer()

                    if model.lastTutorResult == nil {
                        Button("Submit answer") {
                            Task { await model.submitAnswer(answer) }
                        }
                        .primaryGazelleButton()
                        .disabled(answer.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                    } else {
                        Button("Finish session") {
                            showSummary = true
                        }
                        .primaryGazelleButton()
                    }
                } else {
                    ProgressView("Starting session…")
                }
            }
            .padding()
            .navigationTitle("Tutor")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("End") { Task { await model.endTutorSession() } }
                }
            }
            .sheet(isPresented: $showSummary) {
                SessionSummaryView()
                    .environmentObject(model)
            }
        }
    }
}

struct SessionSummaryView: View {
    @EnvironmentObject private var model: AppViewModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                Text("Session complete")
                    .font(.largeTitle.bold())
                if let result = model.lastTutorResult {
                    Text(result.feedback)
                        .font(.title3)
                        .multilineTextAlignment(.center)
                    Text(result.isCorrect ? "You’re building strong habits." : "Practice helps your brain grow.")
                        .foregroundStyle(.secondary)
                }
                Button("Back home") {
                    Task {
                        await model.endTutorSession()
                        dismiss()
                    }
                }
                .primaryGazelleButton()
                Spacer()
            }
            .padding()
        }
    }
}
