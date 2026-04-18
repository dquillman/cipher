#!/bin/bash
# Safe deploy script — always deploys hosting + firestore rules together
# Usage: bash deploy-web.sh [staging|prod|both]

set -e

TARGET=${1:-both}

echo "Building web app..."
cd web && npx vite build && cd ..

if [ "$TARGET" = "staging" ]; then
  echo "Deploying to STAGING + Firestore rules..."
  firebase deploy --only hosting:staging,firestore:rules
elif [ "$TARGET" = "prod" ]; then
  echo "Deploying to PRODUCTION + Firestore rules..."
  firebase deploy --only hosting:production,firestore:rules
else
  echo "Deploying to STAGING + PRODUCTION + Firestore rules..."
  firebase deploy --only hosting:staging,hosting:production,firestore:rules
fi

echo "Deploy complete. Rules are safe."
