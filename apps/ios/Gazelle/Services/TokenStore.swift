import Foundation
import Security

/// Persists Supabase auth tokens in the iOS Keychain.
///
/// Tokens grant access to a family's account and children's data, so they belong
/// in the Keychain (encrypted at rest, excluded from backups by accessibility
/// class) — never in UserDefaults, which is a plain, unencrypted plist.
final class TokenStore {
    private let accessTokenKey = "gazelle.accessToken"
    private let refreshTokenKey = "gazelle.refreshToken"
    private let service = "io.gazelle.app.auth"

    var accessToken: String? { read(accessTokenKey) }
    var refreshToken: String? { read(refreshTokenKey) }

    func save(accessToken: String, refreshToken: String?) {
        write(accessToken, for: accessTokenKey)
        if let refreshToken {
            write(refreshToken, for: refreshTokenKey)
        }
        migrateFromUserDefaultsIfNeeded()
    }

    func clear() {
        delete(accessTokenKey)
        delete(refreshTokenKey)
    }

    // MARK: - Keychain primitives

    private func baseQuery(for key: String) -> [String: Any] {
        [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
        ]
    }

    private func read(_ key: String) -> String? {
        var query = baseQuery(for: key)
        query[kSecReturnData as String] = true
        query[kSecMatchLimit as String] = kSecMatchLimitOne

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        guard status == errSecSuccess,
              let data = result as? Data,
              let value = String(data: data, encoding: .utf8) else {
            // One-time migration path: fall back to any token left in
            // UserDefaults by earlier builds, then move it into the Keychain.
            return migrateLegacyValue(for: key)
        }
        return value
    }

    private func write(_ value: String, for key: String) {
        guard let data = value.data(using: .utf8) else { return }
        let query = baseQuery(for: key)
        let attributes: [String: Any] = [
            kSecValueData as String: data,
            // Available after first unlock, this-device only (not backed up).
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly,
        ]

        let updateStatus = SecItemUpdate(query as CFDictionary, [kSecValueData as String: data] as CFDictionary)
        if updateStatus == errSecItemNotFound {
            var addQuery = query
            attributes.forEach { addQuery[$0.key] = $0.value }
            SecItemAdd(addQuery as CFDictionary, nil)
        }
    }

    private func delete(_ key: String) {
        SecItemDelete(baseQuery(for: key) as CFDictionary)
    }

    // MARK: - UserDefaults migration (pre-Keychain builds)

    private func migrateLegacyValue(for key: String) -> String? {
        guard let legacy = UserDefaults.standard.string(forKey: key) else { return nil }
        write(legacy, for: key)
        UserDefaults.standard.removeObject(forKey: key)
        return legacy
    }

    private func migrateFromUserDefaultsIfNeeded() {
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
