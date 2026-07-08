import SwiftUI

struct AuthView: View {
    @EnvironmentObject private var model: AppViewModel
    @State private var email = ""
    @State private var password = ""
    @State private var isCreatingAccount = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    VStack(spacing: 8) {
                        Text("Gazelle")
                            .font(.largeTitle.bold())
                        Text("Adaptive practice for curious K–6 learners.")
                            .font(.title3)
                            .multilineTextAlignment(.center)
                            .foregroundStyle(.secondary)
                    }
                    .padding(.top, 48)

                    Card {
                        VStack(alignment: .leading, spacing: 16) {
                            Text(isCreatingAccount ? "Create parent account" : "Parent sign in")
                                .font(.title2.bold())
                            Text("Students do not have accounts. A parent signs in and owns all student data.")
                                .foregroundStyle(.secondary)
                            TextField("Email", text: $email)
                                .textInputAutocapitalization(.never)
                                .keyboardType(.emailAddress)
                                .textFieldStyle(.roundedBorder)
                            SecureField("Password", text: $password)
                                .textFieldStyle(.roundedBorder)
                            Button(isCreatingAccount ? "Create account" : "Sign in") {
                                Task {
                                    if isCreatingAccount {
                                        await model.signUp(email: email, password: password)
                                    } else {
                                        await model.signIn(email: email, password: password)
                                    }
                                }
                            }
                            .primaryGazelleButton()
                            .disabled(email.isEmpty || password.count < 6)

                            Button(isCreatingAccount ? "Already have an account? Sign in" : "New to Gazelle? Create account") {
                                isCreatingAccount.toggle()
                            }
                            .frame(maxWidth: .infinity)
                        }
                    }
                }
                .padding()
            }
            .navigationTitle("Welcome")
        }
    }
}

struct ParentProfileView: View {
    @EnvironmentObject private var model: AppViewModel
    @State private var name = ""

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                Card {
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Parent profile")
                            .font(.title2.bold())
                        Text("Your profile owns student data and controls deletion.")
                            .foregroundStyle(.secondary)
                        TextField("Parent name", text: $name)
                            .textFieldStyle(.roundedBorder)
                        Button("Save profile") {
                            Task { await model.saveParent(name: name) }
                        }
                        .primaryGazelleButton()
                        .disabled(name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                    }
                }
                Spacer()
            }
            .padding()
            .navigationTitle("Setup")
        }
    }
}

struct StudentProfileView: View {
    @EnvironmentObject private var model: AppViewModel
    @State private var name = ""
    @State private var grade = 0
    @State private var age = ""
    @State private var pace = "steady"
    @State private var strengths = ""
    @State private var struggles = ""
    @State private var classCode = ""

    var body: some View {
        NavigationStack {
            Form {
                Section("Student") {
                    TextField("First name", text: $name)
                    Picker("Grade", selection: $grade) {
                        Text("Kindergarten").tag(0)
                        ForEach(1...6, id: \.self) { Text("Grade \($0)").tag($0) }
                    }
                    TextField("Age", text: $age)
                        .keyboardType(.numberPad)
                    Picker("Learning pace", selection: $pace) {
                        Text("Extra support").tag("slow")
                        Text("Steady").tag("steady")
                        Text("Fast").tag("fast")
                    }
                }
                Section("Optional") {
                    TextField("Strength subjects, comma-separated", text: $strengths)
                    TextField("Practice subjects, comma-separated", text: $struggles)
                }
                Section("Class") {
                    TextField("Class code from the teacher (optional)", text: $classCode)
                        .textInputAutocapitalization(.characters)
                        .autocorrectionDisabled()
                    Text("Linking to a class lets the tutor practice the teacher's current lesson.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
                Section {
                    Button("Create student profile") {
                        Task { await model.createStudent(draft: draft, classCode: classCode) }
                    }
                    .disabled(name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
            .navigationTitle("Add student")
        }
    }

    private var draft: StudentDraft {
        StudentDraft(
            name: name,
            grade: grade,
            age: Int(age),
            pace: pace,
            strengthSubjects: split(strengths),
            struggleSubjects: split(struggles)
        )
    }

    private func split(_ value: String) -> [String] {
        value.split(separator: ",").map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }.filter { !$0.isEmpty }
    }
}
