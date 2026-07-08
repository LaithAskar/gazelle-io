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
            .sheet(item: Binding(
                get: { model.celebration },
                set: { if $0 == nil { model.celebration = nil } }
            )) { celebration in
                CelebrationView(celebration: celebration)
            }
        }
    }
}

struct TutorSessionView: View {
    @EnvironmentObject private var model: AppViewModel
    @State private var answer = ""

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
                        Button("Next question") {
                            answer = ""
                            Task { await model.nextQuestion() }
                        }
                        .primaryGazelleButton()
                        Button("Finish session") {
                            Task { await model.endTutorSession() }
                        }
                        .frame(maxWidth: .infinity)
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
        }
    }
}

/// End-of-session reward screen: stars for accuracy, flame for the day streak.
struct CelebrationView: View {
    let celebration: SessionCelebration
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(spacing: 24) {
            Text("Session complete!")
                .font(.largeTitle.bold())
                .padding(.top, 40)

            HStack(spacing: 12) {
                ForEach(0..<3, id: \.self) { index in
                    Image(systemName: index < celebration.stars ? "star.fill" : "star")
                        .font(.system(size: 44))
                        .foregroundStyle(index < celebration.stars ? Color.yellow : Color.secondary.opacity(0.4))
                }
            }

            Text("\(celebration.correctCount) of \(celebration.questionsAnswered) correct")
                .font(.title3)

            if celebration.streakDays > 1 {
                Label("\(celebration.streakDays)-day practice streak!", systemImage: "flame.fill")
                    .font(.headline)
                    .foregroundStyle(.orange)
            } else {
                Text("Come back tomorrow to start a streak! 🔥")
                    .foregroundStyle(.secondary)
            }

            Text("Practice helps your brain grow.")
                .foregroundStyle(.secondary)

            Button("Back home") { dismiss() }
                .primaryGazelleButton()
                .padding(.top, 8)

            Spacer()
        }
        .padding()
    }
}
