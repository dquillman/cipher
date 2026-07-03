# Firestore Rules Ownership

**Firestore security rules for this project are owned and deployed by the
sibling `Admin-Core` repo — NOT from Cipher.**

- The active `firebase.json` in this repo deliberately has **no `firestore`
  section**, so `firebase deploy` from Cipher never touches rules or indexes.
- The canonical rules live at `G:\Users\daveq\Admin-Core\firestore.rules` and
  are deployed from there against the shared `exam-coach-ai-platform` project.
- Cipher and `migraine-tracker` both read/write this shared database, so a
  rules change affects all of them. Coordinate any change through Admin-Core.

## Why there is no `firestore.rules` here anymore

A stale copy of `firestore.rules` used to live in this repo. It had drifted
from the Admin-Core version and contained several overly-permissive rules
(e.g. `users`/`userMastery` readable/writable by any authenticated user,
unauthenticated `analytics`/`usage_events` writes, `subscriptions` created
client-side with no field validation). Because a few `firebase.json.bak*`
files still pointed a `firestore` section at that stale file, one accidental
`firebase deploy` could have overwritten Admin-Core's hardened rules with the
wide-open version.

The stale `firestore.rules` and all `firebase.json.bak*` files have been
removed to eliminate that landmine.

## If Cipher needs a new collection or rule change

1. Edit `G:\Users\daveq\Admin-Core\firestore.rules`.
2. Run the Admin-Core rules tests / preflight.
3. Deploy from Admin-Core: `firebase deploy --only firestore:rules`.
4. Note the change in the Admin-Core git history.

Do **not** re-add a `firestore` section to Cipher's `firebase.json`.
