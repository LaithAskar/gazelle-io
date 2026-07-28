# iOS demo notes

These notes capture the parent/student frontend polish pass without changing backend contracts.

## Demo positioning

- Lead with the parent-owned account model: parents sign in, students do not need accounts or email addresses.
- Use first-name-only learner profiles in demos to keep the COPPA/privacy story simple.
- Set expectations that a practice flow is short, calm, and adaptive rather than a scored test.
- Emphasize that tutor outputs are filtered server-side before student display and that answer keys/private agent metadata are not shown in iOS responses.

## Screen-by-screen talking points

- **Auth:** explains parent control, no student logins, scoped child data, and filtered tutor responses.
- **Parent profile:** frames setup as parent-owned data control before learner profiles are created.
- **Add student:** uses “learner” language, larger-friendly pace labels, and optional learning notes for personalized demos.
- **Home:** introduces a 3–5 minute low-pressure practice session with warm student copy and safety-by-design parent reassurance.
- **Tutor:** uses encouraging copy, large answer rows, and student-friendly difficulty labels instead of technical difficulty strings.
- **Progress:** includes helpful empty states so a fresh account still explains where summaries will appear.
- **Settings:** highlights no student accounts and parent-owned deletion behavior.

## Verification reminder

Run from the repository root before sharing a demo build:

```sh
pnpm verify:phase5
```

Xcode/manual validation is still required for simulator/device UI review; this polish pass intentionally did not perform signing, TestFlight, App Store, backend schema, or API contract work.
