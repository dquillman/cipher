# ExamCoach — North-Star Event Definitions

> Canonical reference for the two events the entire marketing plan optimizes toward.
> Last updated: 2026-03-17

---

## 1. `signup_complete`

**What it means:** A new user has a confirmed account with a Firestore user document.

**Exact trigger:** The Firestore `setDoc()` call that creates the user document resolves successfully AND the user document did not previously exist (`!userDoc.exists()`).

**Where it fires:** `web/src/pages/Login.tsx` — two paths:
- **Google OAuth** (line ~49): after `signInWithPopup` → `getDoc` confirms new user → `setDoc` creates doc → event fires
- **Email/Password** (line ~89): after `createUserWithEmailAndPassword` → `setDoc` creates doc → event fires

**NOT triggered by:**
- Returning user sign-in (user doc already exists)
- Email verification (there is no email verification step)
- Page navigation (fires before redirect to `/app`)

**Properties sent:**

| Property | Type | Source | Example |
|----------|------|--------|---------|
| `method` | `'google' \| 'email'` | Auth flow used | `'google'` |
| `user_id` | string | `result.user.uid` | `'abc123xyz'` |
| `utm_source` | string (optional) | sessionStorage from landing | `'google_ads'` |
| `utm_medium` | string (optional) | sessionStorage from landing | `'cpc'` |
| `utm_campaign` | string (optional) | sessionStorage from landing | `'pmp_spring_2026'` |
| `utm_term` | string (optional) | sessionStorage from landing | `'pmp+exam+prep'` |
| `utm_content` | string (optional) | sessionStorage from landing | `'hero_cta'` |

**Also fires:**
- Google Ads conversion: `AW-926344271/i6QQCPSdrIocEM_I27kD`
- Meta Pixel: `CompleteRegistration` with `{ method }`

**Deduplication:** Inherent — `!userDoc.exists()` check means the event can only fire once per Firebase UID.

---

## 2. `activated_user`

**What it means:** A user has demonstrated real engagement — they signed up, selected an exam, and answered 10 practice questions.

**Exact trigger:** Inside `handleNext()` in Quiz.tsx, when `currentQuestionIndex === 9` (the user advances past their 10th question, 0-indexed).

**Where it fires:** `web/src/pages/Quiz.tsx` (line ~1095)

**Prerequisite chain:**
1. User completed signup (has Firebase Auth + Firestore user doc)
2. User selected an exam (via ExamContext — persisted in localStorage)
3. User entered a quiz session and answered 10 questions in sequence
4. User clicked "Next" after the 10th answer

**NOT triggered by:**
- Answering fewer than 10 questions
- Viewing explanations without answering
- Any specific quiz mode — fires in diagnostic, standard, smart, domain, trap modes

**Properties sent:**

| Property | Type | Source | Example |
|----------|------|--------|---------|
| `exam_id` | string | `selectedExamId` from ExamContext | `'pmp'` |
| `user_id` | string | `auth.currentUser.uid` | `'abc123xyz'` |
| `utm_source` | string (optional) | sessionStorage from landing | `'google_ads'` |
| `utm_medium` | string (optional) | sessionStorage from landing | `'cpc'` |
| `utm_campaign` | string (optional) | sessionStorage from landing | `'pmp_spring_2026'` |

**Deduplication:** localStorage key `ec_activated_{userId}` — fires exactly once per user, ever. Stores the ISO timestamp of first activation.

---

## UTM Parameter Capture

UTM params are captured once per session on Landing page load (`captureUtmParams()`) and stored in `sessionStorage` under the key `ec_utm`. Both north-star events read from this store, so UTMs survive in-app navigation between landing → signup → quiz.

**Capture point:** `web/src/pages/Landing.tsx` — `useEffect` on mount

**Supported params:** `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`

---

## Full GA4 Funnel (in order)

| # | Event | Trigger |
|---|-------|---------|
| 1 | `landing_page_view` | Landing page mounts |
| 2 | `cta_click` | User clicks any CTA button |
| 3 | `pricing_view` | Pricing page mounts |
| 4 | **`signup_complete`** | Firestore user doc created (new user) |
| 5 | `exam_selected` | User picks an exam |
| 6 | **`activated_user`** | 10th question answered (once per user) |
| 7 | `explanation_viewed` | User opens an AI explanation |

---

## Verification Checklist

- [ ] `signup_complete` fires in GA4 DebugView after new Google OAuth signup
- [ ] `signup_complete` fires in GA4 DebugView after new email/password signup
- [ ] `signup_complete` does NOT fire on returning user login
- [ ] Google Ads conversion appears in Ads dashboard after signup
- [ ] Meta Pixel `CompleteRegistration` appears in Events Manager after signup
- [ ] `activated_user` fires after answering 10th question
- [ ] `activated_user` does NOT fire again on subsequent sessions (localStorage dedup)
- [ ] Both events include `user_id` in GA4 event params
- [ ] Both events include UTM params when user arrived from an ad campaign
