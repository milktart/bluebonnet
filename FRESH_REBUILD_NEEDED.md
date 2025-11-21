# Bundle Files Missing - Fresh Rebuild Required

## The Problem

Your `manifest.json` points to bundle files that don't exist on your host:
- `manifest.json` exists ✅
- `public/dist/*.js` files **DO NOT exist** ❌

This happened because bundles were built inside the container before volume mounts were enabled.

## The Solution

I've removed the stale `manifest.json`. Now restart containers with volume mounts enabled:

```bash
docker-compose down
docker-compose up
```

The entrypoint script will:
1. Run `npm run build-js`
2. Create NEW bundle files with NEW hashes
3. Write them to `public/dist/` on your HOST (via volume mount)
4. Create fresh `manifest.json`

## Verify It Worked

After containers start, check:

```bash
# Should see multiple .js files with new hashes
ls -lh public/dist/*.js

# Should see updated manifest with new hashes
cat public/dist/manifest.json
```

Then hard-refresh browser (`Ctrl+Shift+R`) and test the Settings tab!

## Why This Happened

1. First build: No volume mounts → bundles stayed in container
2. Manifest somehow got copied to host → pointed to non-existent files
3. Volume mounts enabled → need fresh rebuild to write files to host

After this rebuild, future changes will work smoothly with volume mounts.
