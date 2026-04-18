# Admin Security Implementation - Deployment Guide

## Summary

This implementation adds comprehensive admin role-based access control to the adaptigrowth-marketing application across three layers:

1. **Frontend Route Guards** - Admin app pages verify admin role before rendering
2. **Firestore Security Rules** - Database enforces admin-only access to sensitive collections
3. **Cloud Functions** - Server-side admin verification for privileged operations

---

## What Was Changed

### 1. User Profile System

**File**: `functions/src/index.ts`

- Added `createUserProfile` Cloud Function trigger (auto-creates profile on signup with `role: 'user'`)

**New Scripts**:

- `scripts/backfillProfiles.js` - Creates profiles for existing users
- `scripts/makeAdmin.js` - Promotes users to admin role

### 2. Frontend Admin Guards

**File**: `admin/src/components/ProtectedRoute.tsx`

- Updated to check `role` field from Firestore
- Shows "Access Denied" screen for non-admins
- Auto-signs out non-admin users

**Protected Routes** (all in admin app):

- `/issues` - Issue management
- `/testers` - Tester management
- `/users` - User management
- `/exams` - Exam health monitoring
- `/analytics` - Analytics dashboard
- All other admin routes

### 3. Firestore Security Rules

**File**: `firestore.rules`

- Added `isAdmin()` helper function
- **Admin-only collections**: `issues`, `testers`, `examHealth`, `system_metrics`, `exam_update_sources`
- **User profiles**: Users can read/update own profile, only admins can change `role` field
- **Public collections**: `questions`, `exams` (read-only for users)

### 4. Cloud Functions Security

**File**: `functions/src/index.ts`

- Added `requireAdmin()` helper function
- Secured functions:
  - `getAdminUserList` - Lists all users (admin only)
  - `getGlobalStats` - Analytics data (admin only)
  - `deleteExamQuestions` - Bulk delete (admin only)

---

## Deployment Steps

### Step 1: Deploy Cloud Functions

```bash
cd functions
npm install
firebase deploy --only functions
```

This deploys:

- `createUserProfile` trigger (auto-creates profiles for new signups)
- Updated admin functions with security checks

### Step 2: Backfill Existing Users

```bash
cd scripts
node backfillProfiles.js
```

This creates user profiles for all existing Firebase Auth users with default `role: 'user'`.

### Step 3: Promote First Admin

```bash
node scripts/makeAdmin.js your-email@example.com
```

Replace `your-email@example.com` with your actual admin email.

### Step 4: Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

This enforces admin-only access at the database level.

### Step 5: Deploy Admin App

```bash
cd admin
npm install
npm run build
firebase deploy --only hosting:admin
```

(Adjust hosting target name if different in your `firebase.json`)

---

## Verification Tests

### Test 1: Normal User Cannot Access Admin

1. Create a test user account (or use existing non-admin)
2. Try to access `https://your-admin-app.web.app/issues`
3. **Expected**: "Access Denied" screen, user is signed out

### Test 2: Normal User Cannot Read Admin Collections

1. Sign in as normal user
2. Open browser console
3. Try: `firebase.firestore().collection('testers').get()`
4. **Expected**: Permission denied error

### Test 3: Normal User Cannot Call Admin Functions

1. Sign in as normal user
2. Try calling `getAdminUserList` function
3. **Expected**: `permission-denied` error

### Test 4: Admin Can Access Everything

1. Sign in with admin account (promoted via `makeAdmin.js`)
2. Navigate to `/issues`, `/testers`, `/users`
3. **Expected**: All pages load successfully
4. Try calling `getAdminUserList` function
5. **Expected**: Returns user list

---

## How to Make More Admins

```bash
node scripts/makeAdmin.js new-admin@example.com
```

---

## Rollback Plan

If issues arise:

1. **Revert Firestore Rules**:

   ```bash
   git checkout HEAD~1 firestore.rules
   firebase deploy --only firestore:rules
   ```

2. **Revert Cloud Functions**:

   ```bash
   git checkout HEAD~1 functions/src/index.ts
   cd functions && firebase deploy --only functions
   ```

3. **Revert Admin App**:

   ```bash
   git checkout HEAD~1 admin/src/components/ProtectedRoute.tsx
   cd admin && npm run build && firebase deploy --only hosting:admin
   ```

---

## Security Notes

- **Manual URL Entry Blocked**: Even if a non-admin knows the URL, they cannot access admin pages (frontend blocks + Firestore denies)
- **No Client Trust**: All security checks happen server-side (Firestore rules + Cloud Functions)
- **Role Changes**: Only admins can change user roles (enforced in Firestore rules)
- **Anonymous Issue Reporting**: Users can still create issues (bug reports) without authentication

---

## Files Modified

### New Files

- `functions/src/index.ts` (added `createUserProfile` trigger + `requireAdmin` helper)
- `admin/src/hooks/useAdminGuard.ts` (admin verification hook)
- `scripts/backfillProfiles.js`
- `scripts/makeAdmin.js`

### Modified Files

- `firestore.rules` (complete rewrite with admin checks)
- `admin/src/components/ProtectedRoute.tsx` (added admin role verification)

---

## Support

If you encounter issues:

1. Check Cloud Function logs: `firebase functions:log`
2. Check Firestore rules simulator in Firebase Console
3. Verify user profile exists: `firebase firestore:get users/{uid}`
4. Verify role field: Should be `'admin'` or `'user'`
