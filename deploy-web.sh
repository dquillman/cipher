#!/bin/bash
# Cipher hosting deploy. Rules are NOT deployed from this repo —
# Admin-Core is the single owner of firestore.rules. Deploying rules
# from here would overwrite Admin-Core's tightened rules with this
# repo's stale copy.
# Usage: bash deploy-web.sh [staging|prod|both]

set -e

TARGET=${1:-both}

echo "Building web app..."
# `npm run build`, NOT `vite build`. The full build is
#   generate-sitemap -> tsc -b -> vite build -> prerender
# and prerender.mjs is the only thing that writes dist/_catchall.html, which is
# the rewrite destination for "**" on every hosting target. vite build alone,
# with emptyOutDir, deletes the previous _catchall.html and every prerendered
# route directory — so the deploy succeeds and every URL except / returns
# Firebase's 404. Running vite build here was doing exactly that.
npm --prefix web run build

# Fail loudly rather than shipping a dist that would 404 the whole site.
if [ ! -f web/dist/_catchall.html ]; then
  echo "ABORT: web/dist/_catchall.html is missing — prerender did not run." >&2
  echo "Every route except / would 404. Not deploying." >&2
  exit 1
fi

if [ "$TARGET" = "staging" ]; then
  echo "Deploying to STAGING (hosting only — rules owned by Admin-Core)..."
  firebase deploy --only hosting:staging
elif [ "$TARGET" = "prod" ]; then
  echo "Deploying to PRODUCTION (hosting only — rules owned by Admin-Core)..."
  firebase deploy --only hosting:production
else
  echo "Deploying to STAGING + PRODUCTION (hosting only — rules owned by Admin-Core)..."
  firebase deploy --only hosting:staging,hosting:production
fi

echo "Hosting deploy complete. Rules untouched (owned by Admin-Core)."

# Teach HAL what shipped (best-effort — the bridge always exits 0, so a memory
# failure can never fail this deploy). Version from web/package.json, changelog
# from the HEAD commit; writes the shared Second Brain and syncs to Firestore.
node "G:/Users/daveq/2nd Brain/teach-hal.mjs" cipher "$(pwd)/web" || true
