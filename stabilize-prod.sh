#!/usr/bin/env bash
set -e

echo "🔒 Stabilizing Exam Coach Pro AI (Production)"

# 1. Verify we are in a git repo
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "❌ Not inside a git repository. Aborting."
  exit 1
fi

# 2. Backup Firestore rules (golden copy)
if [ -f firestore.rules ]; then
  cp firestore.rules firestore.rules.golden
  echo "✅ firestore.rules backed up to firestore.rules.golden"
else
  echo "❌ firestore.rules not found. Aborting."
  exit 1
fi

# 3. Create production checklist (idempotent)
CHECKLIST="PROD_CHECKLIST.md"
if [ ! -f "$CHECKLIST" ]; then
  cat <<EOF > $CHECKLIST
# Production Firestore Checklist

After ANY Firestore rule change:

- [ ] Deploy Firestore rules
- [ ] Log out of app
- [ ] Clear browser storage (IndexedDB, LocalStorage)
- [ ] Log back in
- [ ] Load exams
- [ ] Create & save study plan
- [ ] Verify Admin Core access

EOF
  echo "✅ Created PROD_CHECKLIST.md"
else
  echo "ℹ️ PROD_CHECKLIST.md already exists"
fi

# 4. Commit stabilized state
git add firestore.rules firestore.rules.golden $CHECKLIST
git commit -m "Stabilize production: Firestore permissions + study plans" || {
  echo "ℹ️ No changes to commit"
}

# 5. Tag production-stable release
TAG="v1.0-prod-stable"
if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "ℹ️ Tag $TAG already exists"
else
  git tag -a "$TAG" -m "Production stable: Firestore permissions verified"
  echo "🏷️ Tagged release: $TAG"
fi

echo "✅ Production stabilization complete."
echo "🚀 You now have a rollback-safe, known-good state."
