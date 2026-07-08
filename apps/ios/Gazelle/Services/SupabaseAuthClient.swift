import Foundation

struct SupabaseAuthResponse: Codable {
    let accessToken: String?
    let refreshToken: String?
    let user: AuthUser?

    enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case refreshToken = "refresh_token"
        case user
    }
}

final class SupabaseAuthClient {
    private let tokenStore: TokenStore
    private let session: URLSession

    init(tokenStore: TokenStore, session: URLSession = .shared) {
        self.tokenStore = tokenStore
        self.session = session
    }

    var isSignedIn: Bool { tokenStore.accessToken != nil }
    var accessToken: String? { tokenStore.accessToken }

    func signUp(email: String, password: String) async throws {
        let response: SupabaseAuthResponse = try await authRequest(path: "/auth/v1/signup", body: [
            "email": email,
            "password": password
        ])
        if let token = response.accessToken, token.isEmpty == false {
            tokenStore.save(accessToken: token, refreshToken: response.refreshToken)
        }
    }

    func signIn(email: String, password: String) async throws {
        let response: SupabaseAuthResponse = try await authRequest(path: "/auth/v1/token?grant_type=password", body: [
            "email": email,
            "password": password
        ])
        guard let accessToken = response.accessToken else { throw NetworkError.unauthorized }
        tokenStore.save(accessToken: accessToken, refreshToken: response.refreshToken)
    }

    func signOut() {
        tokenStore.clear()
    }

    private func authRequest<T: Decodable>(path: String, body: [String: String]) async throws -> T {
        guard let url = URL(string: path, relativeTo: AppConfig.supabaseURL) else { throw NetworkError.invalidURL }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(AppConfig.supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(AppConfig.supabaseAnonKey)", forHTTPHeaderField: "Authorization")
        request.httpBody = try JSONEncoder().encode(body)

        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw NetworkError.server("No HTTP response") }
        guard (200..<300).contains(http.statusCode) else {
            if let apiError = try? JSONDecoder().decode(APIErrorResponse.self, from: data) {
                throw NetworkError.server(apiError.error)
            }
            throw http.statusCode == 401 ? NetworkError.unauthorized : NetworkError.server("Authentication failed")
        }
        guard let decoded = try? JSONDecoder().decode(T.self, from: data) else { throw NetworkError.decoding }
        return decoded
    }
}
