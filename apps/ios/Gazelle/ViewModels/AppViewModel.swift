import Foundation
import SwiftUI

@MainActor
final class AppViewModel: ObservableObject {
    enum AuthState: Equatable {
        case loading
        case signedOut
        case needsParentProfile
        case ready
    }

    @Published var authState: AuthState = .loading
    @Published var parent: ParentProfile?
    @Published var students: [StudentProfile] = []
    @Published var selectedStudent: StudentProfile?
    @Published var sessions: [TutorSession] = []
    @Published var activeSession: TutorSessionStart?
    @Published var lastTutorResult: TutorResponseResult?
    @Published var isBusy = false
    @Published var errorMessage: String?

    private let tokenStore = TokenStore()
    private lazy var authClient = SupabaseAuthClient(tokenStore: tokenStore)
    private lazy var apiClient = GazelleAPIClient(tokenStore: tokenStore)

    func bootstrap() async {
        guard tokenStore.accessToken != nil else {
            authState = .signedOut
            return
        }
        await refreshProfile()
    }

    func signIn(email: String, password: String) async {
        await runBusy {
            try await authClient.signIn(email: email, password: password)
            await refreshProfile()
        }
    }

    func signUp(email: String, password: String) async {
        await runBusy {
            try await authClient.signUp(email: email, password: password)
            if tokenStore.accessToken == nil {
                authState = .signedOut
                errorMessage = "Check your email to confirm the account, then sign in."
            } else {
                await refreshProfile()
            }
        }
    }

    func signOut() {
        authClient.signOut()
        parent = nil
        students = []
        selectedStudent = nil
        sessions = []
        activeSession = nil
        lastTutorResult = nil
        authState = .signedOut
    }

    func refreshProfile() async {
        await runBusy {
            let profile = try await apiClient.currentParent()
            parent = profile.parent
            if profile.parent == nil {
                authState = .needsParentProfile
                return
            }
            try await refreshStudentsAndSessions()
            authState = .ready
        }
    }

    func saveParent(name: String) async {
        await runBusy {
            parent = try await apiClient.upsertParent(name: name)
            try await refreshStudentsAndSessions()
            authState = .ready
        }
    }

    func createStudent(draft: StudentDraft) async {
        await runBusy {
            let student = try await apiClient.createStudent(draft)
            students.append(student)
            selectedStudent = student
            authState = .ready
        }
    }

    func deleteStudent(_ student: StudentProfile) async {
        await runBusy {
            try await apiClient.deleteStudent(id: student.id)
            students.removeAll { $0.id == student.id }
            if selectedStudent?.id == student.id { selectedStudent = students.first }
            sessions.removeAll { $0.studentId == student.id }
        }
    }

    func refreshStudentsAndSessions() async throws {
        let loadedStudents = try await apiClient.loadStudents()
        students = loadedStudents
        if selectedStudent == nil || loadedStudents.contains(where: { $0.id == selectedStudent?.id }) == false {
            selectedStudent = loadedStudents.first
        }
        sessions = try await apiClient.loadSessions()
    }

    func startTutorSession() async {
        guard let student = selectedStudent else { return }
        await runBusy {
            activeSession = try await apiClient.startSession(studentId: student.id)
            lastTutorResult = nil
        }
    }

    func submitAnswer(_ answer: String) async {
        guard let student = selectedStudent, let session = activeSession else { return }
        await runBusy {
            lastTutorResult = try await apiClient.submitResponse(
                sessionId: session.sessionId,
                studentId: student.id,
                questionId: session.questionId,
                studentAnswer: answer
            )
        }
    }

    func endTutorSession() async {
        guard let session = activeSession else { return }
        await runBusy {
            _ = try await apiClient.endSession(sessionId: session.sessionId)
            activeSession = nil
            lastTutorResult = nil
            sessions = try await apiClient.loadSessions()
        }
    }

    private func runBusy(_ operation: @escaping () async throws -> Void) async {
        isBusy = true
        errorMessage = nil
        do {
            try await operation()
        } catch NetworkError.unauthorized {
            signOut()
            errorMessage = NetworkError.unauthorized.localizedDescription
        } catch {
            errorMessage = error.localizedDescription
        }
        isBusy = false
    }
}
