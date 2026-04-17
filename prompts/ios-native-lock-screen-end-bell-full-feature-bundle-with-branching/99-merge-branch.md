# 99 Merge Branch

Finish the native lock-screen end-bell completion slice.

Steps:
1. Review changed files and confirm no unrelated edits were introduced.
2. Ensure required docs were updated:
   - `docs/ios-native/README.md`
   - `requirements/session-handoff.md`
   - `requirements/decisions.md` if needed
   - slice-specific execplan/review/test docs
3. Run final relevant verification if anything changed after the last test pass.
4. Create a clear commit message, such as:
   - `fix(ios-native): complete lock-screen timer end-bell behavior`
5. Merge using the repo’s normal non-interactive workflow.

Close-out summary should state:
- what is now guaranteed
- what is best-effort
- what remains iOS-limited
