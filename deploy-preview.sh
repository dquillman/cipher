#!/bin/bash
# One-command preview deploy for testing on a real phone.
#
#   bash deploy-preview.sh              -> channel "mobile-fixes", expires in 7d
#   bash deploy-preview.sh myname 30d   -> custom channel + expiry
#
# Puts the current working tree on a temporary Firebase Hosting URL. It does
# NOT touch production or staging.
set -e

CHANNEL=${1:-mobile-fixes}
EXPIRES=${2:-7d}

echo "==> Building (full pipeline — sitemap, tsc, vite, prerender)"
# npm run build, NOT vite build. prerender.mjs is the only thing that writes
# dist/_catchall.html, the rewrite target for "**" on every hosting target.
# vite build alone deletes it and every route except / returns a 404.
npm --prefix web run build

if [ ! -f web/dist/_catchall.html ]; then
  echo "ABORT: web/dist/_catchall.html missing — prerender did not run." >&2
  echo "Every route except / would 404 on the preview. Not deploying." >&2
  exit 1
fi

echo
echo "==> Deploying to preview channel: $CHANNEL (expires in $EXPIRES)"
firebase hosting:channel:deploy "$CHANNEL" \
  --only production \
  --expires "$EXPIRES"

echo
echo "Open the Channel URL printed above on your phone."
echo "Production and staging are untouched."
echo
echo "To remove it later:  firebase hosting:channel:delete $CHANNEL"
