# 02 Review Native Lock-Screen End-Bell Completion

Review the implementation with a code-review mindset.

Primary focus:
- find behavioral regressions
- find duplicate-completion or duplicate-log risks
- find audio-session or background-handling mistakes
- check whether UX copy overclaims lock-screen guarantees
- check whether notification fallback and app-driven completion paths can conflict

Review requirements:
- Findings first, ordered by severity.
- Reference exact files and lines.
- Keep summary brief after findings.
- If no significant issues remain, say so explicitly and call out any residual manual-device QA risk.

Review scope:
- native timer completion
- audio-session policy
- scene-phase handling
- notification fallback
- focused test coverage
- docs updated for truthful platform behavior

When review is complete, continue with `03-test-ios-native-lock-screen-end-bell-full.md`.
