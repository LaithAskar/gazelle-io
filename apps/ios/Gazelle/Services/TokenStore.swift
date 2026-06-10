import Foundation

final class TokenStore {
    private let accessTokenKey = "gazelle.accessToken"
    private let refreshTokenKey = "gazelle.refreshToken"

    var accessToken: String? {
        UserDefaults.standard.string(forKey: accessTokenKey)
    }

    var refreshToken: String? {
        UserDefaults.standard.string(forKey: refreshTokenKey)
    }

    func save(accessToken: String, refreshToken: String?) {
        UserDefaults.standard.set(accessToken, forKey: accessTokenKey)
        if let refreshToken {
            UserDefaults.standard.set(refreshToken, forKey: refreshTokenKey)
        }
    }

    func clear() {
        UserDefaults.standard.removeObject(forKey: accessTokenKey)
        UserDefaults.standard.removeObject(forKey: refreshTokenKey)
    }
}

enum NetworkError: LocalizedError {
    case invalidURL
    case unauthorized
    case server(String)
    case decoding

    var errorDescription: String? {
        switch self {
        case .invalidURL: return "Invalid URL."
        case .unauthorized: return "Please sign in again."
        case .server(let message): return message
        case .decoding: return "The server returned an unexpected response."
        }
    }
}
