#!/bin/bash
# Cipher hosting deploy. Rules are NOT deployed from this repo —
# Admin-Core is the single owner of firestore.rules. Deploying rules
# from here would overwrite Admin-Core's tightened rules with this
# repo's stale copy.
# Usage: bash deploy-web.sh [staging|prod|both]

set -e

TARGET=${1:-both}

echo "Building web app..."
cd web && npx vite build && cd ..

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
