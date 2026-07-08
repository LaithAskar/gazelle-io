import Foundation

struct ParentProfile: Codable, Identifiable, Equatable {
    let id: String
    let userId: String
    var name: String
    let createdAt: String?

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case name
        case createdAt = "created_at"
    }
}

struct StudentProfile: Codable, Identifiable, Equatable {
    let id: String
    var parentId: String
    var teacherId: String?
    var name: String
    var grade: Int
    var age: Int?
    var pace: String?
    var strengthSubjects: [String]?
    var struggleSubjects: [String]?
    var createdAt: String?
    var updatedAt: String?

    enum CodingKeys: String, CodingKey {
        case id
        case parentId = "parent_id"
        case teacherId = "teacher_id"
        case name
        case grade
        case age
        case pace
        case strengthSubjects = "strength_subjects"
        case struggleSubjects = "struggle_subjects"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }

    var gradeLabel: String {
        grade == 0 ? "Kindergarten" : "Grade \(grade)"
    }
}

struct TutorQuestion: Codable, Equatable {
    let prompt: String
    let choices: [String]?
    let difficulty: String
}

struct TutorSessionStart: Codable {
    let sessionId: String
    let questionId: String
    let question: TutorQuestion
}

struct TutorResponseResult: Codable {
    let isCorrect: Bool
    let feedback: String
    let nextDifficulty: String
}

struct TutorSession: Codable, Identifiable, Equatable {
    let id: String
    let studentId: String
    let lessonPlanId: String?
    let status: String
    let summary: JSONValue?
    let startedAt: String?
    let endedAt: String?
    let createdAt: String?

    enum CodingKeys: String, CodingKey {
        case id
        case studentId = "student_id"
        case lessonPlanId = "lesson_plan_id"
        case status
        case summary
        case startedAt = "started_at"
        case endedAt = "ended_at"
        case createdAt = "created_at"
    }
}

enum JSONValue: Codable, Equatable {
    case string(String)
    case number(Double)
    case bool(Bool)
    case object([String: JSONValue])
    case array([JSONValue])
    case null

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if container.decodeNil() { self = .null }
        else if let value = try? container.decode(Bool.self) { self = .bool(value) }
        else if let value = try? container.decode(Double.self) { self = .number(value) }
        else if let value = try? container.decode(String.self) { self = .string(value) }
        else if let value = try? container.decode([String: JSONValue].self) { self = .object(value) }
        else if let value = try? container.decode([JSONValue].self) { self = .array(value) }
        else { self = .null }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .string(let value): try container.encode(value)
        case .number(let value): try container.encode(value)
        case .bool(let value): try container.encode(value)
        case .object(let value): try container.encode(value)
        case .array(let value): try container.encode(value)
        case .null: try container.encodeNil()
        }
    }
}

struct AuthUser: Codable, Equatable {
    let id: String
    let email: String?
}

struct APIErrorResponse: Codable {
    let error: String
}
