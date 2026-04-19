# Group Build: Sankalpa Activity Gym Goal

Run build verification with the `verification` reasoning profile.

## Required Build

```bash
npm run build
```

If the group changed backend Java, migrations, generated contracts, or repo scripts, prefer the full pipeline:

```bash
./scripts/pipeline.sh verify
```

Record the commands run and the outcome in the group closeout. Do not continue to closeout with an unexplained failing build.
