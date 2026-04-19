# Group Test: Sankalpa Activity Gym Goal

Run deterministic verification with the `verification` reasoning profile.

## Commands

Start with focused tests added or touched by the bundles. Then run:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

If backend Sankalpa API, persistence, migrations, or generated contracts changed, also run:

```bash
./scripts/pipeline.sh verify
```

## Manual Browser Checks

When the app can run locally, verify the Goals screen at phone and desktop widths:

- Create a gym observance sankalpa for 5 times per week for 4 weeks.
- Confirm the generated details are editable before save.
- Confirm active sankalpa tracking shows observed, missed, and pending evidence without dense dashboard clutter.
- Confirm future dates cannot be edited.
- Confirm offline or backend-unavailable copy remains calm if sync is unavailable.

If any command fails, switch back to a high-effort diagnosis/fix step before rerunning verification.
