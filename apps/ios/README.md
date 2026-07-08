# apps/ios — Gazelle Student / Parent App

Native SwiftUI app for Phase 5.

## Current scope

Implemented as an Xcode project:

- Parent sign up / sign in via Supabase Auth REST using the anon key only.
- Parent profile setup through the Next.js server API.
- Student profile creation/list/delete through the Next.js server API.
- Student home screen.
- Tutor session flow using server-owned `/api/sessions/*` routes.
- Session summary and parent progress dashboard.
- Settings/data deletion UI for student profile deletion.

## Security/COPPA boundaries

- No service-role key exists in iOS source/config.
- Students do not have auth accounts.
- iOS receives public Tutor questions only: prompt, choices, difficulty, and opaque `questionId`.
- `correctAnswer` stays server-side and is loaded only from approved `agent_logs` rows.
- Tutor feedback is generated/reviewed server-side before being returned.

## Local setup

1. Open `Gazelle.xcodeproj` in Xcode.
2. Copy `Config.local.xcconfig.example` to `Config.local.xcconfig` if you want private local overrides.
3. Fill these build settings in `Config.xcconfig` or local override:
   - `GAZELLE_API_BASE_URL`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `GAZELLE_PRODUCT_BUNDLE_IDENTIFIER`
   - `DEVELOPMENT_TEAM`
4. Build/run in Xcode on an iOS 17+ simulator.

Note: this machine currently has Command Line Tools selected, not full Xcode, so Hermes can create and statically parse Swift but cannot run `xcodebuild` until Xcode is installed/selected.
