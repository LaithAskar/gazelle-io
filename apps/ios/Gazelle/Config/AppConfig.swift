import Foundation

enum AppConfig {
    static var apiBaseURL: URL {
        url(for: "GAZELLE_API_BASE_URL", fallback: "http://localhost:3000")
    }

    static var supabaseURL: URL {
        url(for: "SUPABASE_URL", fallback: "https://example.supabase.co")
    }

    static var supabaseAnonKey: String {
        string(for: "SUPABASE_ANON_KEY", fallback: "YOUR_SUPABASE_ANON_KEY")
    }

    private static func string(for key: String, fallback: String) -> String {
        guard let value = Bundle.main.object(forInfoDictionaryKey: key) as? String,
              value.isEmpty == false,
              value.contains("YOUR_") == false else {
            return fallback
        }
        return value
    }

    private static func url(for key: String, fallback: String) -> URL {
        let rawValue = string(for: key, fallback: fallback)
        guard let url = URL(string: rawValue) else {
            return URL(string: fallback)!
        }
        return url
    }
}
