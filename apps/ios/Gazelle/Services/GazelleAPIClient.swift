import Foundation

final class GazelleAPIClient {
    private let tokenStore: TokenStore
    private let session: URLSession
    private let decoder: JSONDecoder

    init(tokenStore: TokenStore, session: URLSession = .shared) {
        self.tokenStore = tokenStore
        self.session = session
        self.decoder = JSONDecoder()
    }

    func currentParent() async throws -> (user: AuthUser, parent: ParentProfile?) {
        let response: CurrentParentResponse = try await request(path: "/api/parent/profile", method: "GET", body: Optional<String>.none)
        return (response.user, response.parent)
    }

    func upsertParent(name: String) async throws -> ParentProfile {
        let response: ParentResponse = try await request(path: "/api/parent/profile", method: "POST", body: ParentRequest(name: name))
        return response.parent
    }

    func loadStudents() async throws -> [StudentProfile] {
        let response: StudentsResponse = try await request(path: "/api/students", method: "GET", body: Optional<String>.none)
        return response.students
    }

    func createStudent(_ draft: StudentDraft) async throws -> StudentProfile {
        let response: StudentResponse = try await request(path: "/api/students", method: "POST", body: draft)
        return response.student
    }

    func updateStudent(id: String, draft: StudentDraft) async throws -> StudentProfile {
        let response: StudentResponse = try await request(path: "/api/students/\(id)", method: "PATCH", body: draft)
        return response.student
    }

    func deleteStudent(id: String) async throws {
        let _: OKResponse = try await request(path: "/api/students/\(id)", method: "DELETE", body: Optional<String>.none)
    }

    func loadSessions(studentId: String? = nil) async throws -> [TutorSession] {
        var path = "/api/sessions"
        if let studentId, studentId.isEmpty == false {
            path += "?studentId=\(studentId.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? studentId)"
        }
        let response: SessionsResponse = try await request(path: path, method: "GET", body: Optional<String>.none)
        return response.sessions
    }

    func startSession(studentId: String) async throws -> TutorSessionStart {
        try await request(path: "/api/sessions/start", method: "POST", body: StartSessionRequest(studentId: studentId))
    }

    func submitResponse(sessionId: String, studentId: String, questionId: String, studentAnswer: String) async throws -> TutorResponseResult {
        try await request(path: "/api/sessions/respond", method: "POST", body: SubmitResponseRequest(
            sessionId: sessionId,
            studentId: studentId,
            questionId: questionId,
            studentAnswer: studentAnswer
        ))
    }

    func endSession(sessionId: String) async throws -> TutorSession {
        let response: EndSessionResponse = try await request(path: "/api/sessions/end", method: "POST", body: EndSessionRequest(sessionId: sessionId))
        return response.session
    }

    private func request<Response: Decodable, Body: Encodable>(path: String, method: String, body: Body?) async throws -> Response {
        guard let url = URL(string: path, relativeTo: AppConfig.apiBaseURL) else { throw NetworkError.invalidURL }
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        if let token = tokenStore.accessToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        if let body {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try JSONEncoder().encode(body)
        }

        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw NetworkError.server("No HTTP response") }
        guard (200..<300).contains(http.statusCode) else {
            if let apiError = try? JSONDecoder().decode(APIErrorResponse.self, from: data) {
                throw http.statusCode == 401 ? NetworkError.unauthorized : NetworkError.server(apiError.error)
            }
            throw http.statusCode == 401 ? NetworkError.unauthorized : NetworkError.server("Request failed with status \(http.statusCode)")
        }
        guard let decoded = try? decoder.decode(Response.self, from: data) else { throw NetworkError.decoding }
        return decoded
    }
}

struct CurrentParentResponse: Codable { let user: AuthUser; let parent: ParentProfile? }
struct ParentRequest: Codable { let name: String }
struct ParentResponse: Codable { let parent: ParentProfile }
struct StudentsResponse: Codable { let students: [StudentProfile] }
struct StudentResponse: Codable { let student: StudentProfile }
struct SessionsResponse: Codable { let sessions: [TutorSession] }
struct OKResponse: Codable { let ok: Bool }

struct StudentDraft: Codable {
    var name: String
    var grade: Int
    var age: Int?
    var pace: String
    var strengthSubjects: [String]
    var struggleSubjects: [String]

    enum CodingKeys: String, CodingKey {
        case name, grade, age, pace
        case strengthSubjects = "strength_subjects"
        case struggleSubjects = "struggle_subjects"
    }
}

struct StartSessionRequest: Codable { let studentId: String }
struct SubmitResponseRequest: Codable { let sessionId: String; let studentId: String; let questionId: String; let studentAnswer: String }
struct EndSessionRequest: Codable { let sessionId: String }
struct EndSessionResponse: Codable { let session: TutorSession }
