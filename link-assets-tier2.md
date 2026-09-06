# Tier 2 link assets — ready to paste

Companion to `link-assets-tier1.md` (GitHub PR + AlternativeTo). This covers the
next four moves. Everything technical below was measured on cipherexam.com and
is currently live — do not soften the numbers, and do not inflate them.

**Order to do them in:** 1 (write once, reuse everywhere) → 2 (free, 5 min) →
4 (slow burn, start now) → 3 (only after 1 is published and got any traction).

---

## 1. Second dev.to post — the highest-value asset here

Your first post was about React 19 head hoisting. This one is a harder,
more linkable story because it has before/after numbers and a non-obvious
root cause. Full draft below — paste as-is.

**Tags:** `webperf`, `react`, `firebase`, `javascript`
**Canonical:** leave blank (dev.to should be the canonical for this one)
**Cover image:** a screenshot of the chunk list, before and after, side by side

---

### TITLE

```
Firebase was 40% of my landing page's JavaScript. Removing it took five separate fixes.
```

### BODY

````markdown
My marketing pages were shipping the Firestore client to people who had never
signed in and never would. 344 KB of it — 107 KB gzipped — on a landing page
whose job is to render a headline and a button.

The frustrating part: everything was already code-split. `React.lazy` on every
route, `manualChunks` in the Vite config, a clean-looking bundle report. The
Firestore chunk was a separate file. It was just also *always downloaded*.

Here's what was actually pulling it in, and how I found it.

## First: measure the graph, not the bundle report

A bundler's chunk list tells you how bytes were grouped. It does not tell you
which chunks a given page actually pulls. Those are different questions, and
only the second one matters.

So walk it yourself. Start from the HTML the browser gets, collect every script
it references, then follow the static imports:

```python
import re, os

d = 'dist'
html = open(f'{d}/index.html').read()
queue = list(set(re.findall(r'(?:src|href)="(/assets/[^"]+\.js)"', html)))
seen = set()

while queue:
    f = queue.pop()
    if f in seen:
        continue
    seen.add(f)
    p = d + f
    if not os.path.exists(p):
        continue
    src = open(p, errors='ignore').read()
    for m in re.findall(r'from"(\./[^"]+\.js)"', src):
        queue.append('/assets/' + m[2:])

total = sum(os.path.getsize(d + f) for f in seen if os.path.exists(d + f))
print(f'{total // 1024} KB across {len(seen)} chunks')
print('firestore present:', any('fb-firestore' in f for f in seen))
```

That printed `874 KB across 31 chunks` and `firestore present: True`.

Pair it with a Lighthouse run and check `network-requests` for what was *really*
requested — static graph and runtime requests are also different questions, and
I got burned by that too (see the last fix).

## The five causes

### 1. One module-scope call poisoned every import of the file

```ts
// firebase.ts
import { initializeApp } from 'firebase/app'
import { initializeFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const app  = initializeApp(config)
const db   = initializeFirestore(app, { /* ... */ })   // <-- runs at import
const auth = getAuth(app)

export { db, auth }
```

`App.tsx` imported `auth` from this file. That's all it wanted. But the module
body runs on import, so `firebase/firestore` came along, and because `App.tsx`
is the entry, Firestore landed in the entry chunk for every page on the site.

The fix is boring and it is the whole ballgame:

```ts
// firebase-app.ts — no Firestore import anywhere in this file
export const app  = initializeApp(config)
export const auth = getAuth(app)

// firebase.ts — Firestore lives here, and re-exports the rest
import { app, auth } from './firebase-app'
export const db = initializeFirestore(app, { /* ... */ })
export { auth }
```

Every existing consumer kept importing `./firebase` and needed no change. Only
the entry moved to `./firebase-app`.

**The general rule:** a module's cost is its entire transitive import graph, not
the part of it you destructured.

### 2. Context providers wrapping routes that don't use them

```tsx
<ExamProvider>          {/* imports Firestore */}
  <SubscriptionProvider>  {/* imports Firestore */}
    <Routes>
      <Route path="/"     element={<Landing />} />   {/* uses neither */}
      <Route path="/blog" element={<Blog />} />      {/* uses neither */}
      <Route path="/app/*" element={<RequireAuth />}>{/* uses both */}
```

Before moving them I checked whether any public page actually consumed them —
grep for `useExam()` and `useSubscription()` across the tree. All 30 call sites
were under `/app/*`. So the providers moved into a lazy component mounted on
that route:

```tsx
const AppScope = lazy(() => import('./AppScope'))

<Route path="/app/*" element={<AppScope />}>
  <Route element={<RequireAuth />}>
```

Do the grep first. If one marketing page had called `useSubscription()`, this
would have been a very different afternoon.

### 3. The authenticated shell was defined in the entry file

`AppLayout` — sidebar, header, trial modal — lived in `App.tsx` alongside the
router. Being a component that only renders under `/app/*` doesn't help if its
*import* sits in the entry module. Moved to its own file, `React.lazy`'d.

That one change took the entry chunk from 80 KB to 27 KB.

### 4. A hook you can't lazy-load

```tsx
function AuthProvider({ children }) {
  const { closeSession } = useSessionTracker(user)   // imports Firestore
```

Hooks must be called unconditionally, so there is no `lazy()` for this. But the
hook does nothing at all without a signed-in user, and `logout()` needs the
`closeSession` it returns.

Turn it into a component that mounts only when there *is* a user, and hand the
callback upward through a ref:

```tsx
const SessionTracker = React.lazy(() => import('./components/SessionTracker'))

function AuthProvider({ children }) {
  const closeRef = useRef<() => Promise<void>>(async () => {})

  const logout = async () => {
    await closeRef.current()
    await signOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, logout }}>
      {user && (
        <Suspense fallback={null}>
          <SessionTracker user={user} closeRef={closeRef} />
        </Suspense>
      )}
      {children}
    </AuthContext.Provider>
  )
}
```

```tsx
// SessionTracker.tsx
export default function SessionTracker({ user, closeRef }) {
  const { closeSession } = useSessionTracker(user)
  useEffect(() => { closeRef.current = closeSession })
  return null
}
```

Watch for behaviour the hook used to perform in its *null-user* branch. Mine
cleared a `sessionStorage` key on sign-out; since the component no longer mounts
for signed-out visitors, that cleanup had to move up into the provider.

### 5. A 40-line component with a heavy grandchild

```tsx
export default function TestimonialPromptHost() {
  const { user } = useAuth()
  const [pending, setPending] = useState(null)
  // ...
  if (!pending) return null
  return <TestimonialPrompt {...pending} />   // -> TestimonialService -> Firestore
}
```

The host is trivial and renders `null` almost always. Its *import* was not
trivial. `React.lazy` on `TestimonialPrompt` — the thing behind the early
return — and the chunk goes with it.

**Pattern:** any component with an early `return null` and a static import of
something expensive is a lazy boundary you haven't drawn yet.

## The one that wasn't a bundling problem

After all five, the static graph was clean — and Firestore still downloaded on
the landing page. A `VersionGate` component was reading a single config document
through the Firestore SDK on mount. Code-split, dynamically imported, invisible
to the graph walk. Still 344 KB over the wire on every visit.

It's one public document. The REST API returns it with a `fetch`:

```
https://firestore.googleapis.com/v1/projects/{project}/databases/(default)/documents/app_config/version?key={apiKey}
```

```ts
const res = await fetch(VERSION_DOC_URL, { cache: 'no-store' })
if (res.status === 404) return setStatus('ok')
const fields = (await res.json()).fields ?? {}
const latest = fields.latest?.stringValue
```

Before switching I checked the security rules allowed it, by comparing status
codes: a rules denial returns **403**, a missing document returns **404**. A
document I knew was protected gave 403. This one gave 404.

Which meant the document didn't exist. Which meant the version gate had never
fired, in production, for its entire life. I would not have found that by
reading the code — the `catch` block fails open by design, exactly as it should,
and so the feature had been silently absent rather than broken.

I also moved the check to `requestIdleCallback`. It gates nothing and renders
its children while loading, so there was no reason for it to compete with LCP.

## Results

| | before | after |
|---|---|---|
| JS in the landing page's graph | 874 KB | **481 KB** |
| entry chunk | 80 KB | **27 KB** |
| `fb-firestore` requested | every page | **never, on any public route** |

Firebase Auth — another 134 KB — is still there. Removing it means auth
resolution becomes async, which means the route guards need a loading state or
a signed-in user gets bounced to `/login` on a slow connection. That's a real
risk for a subscription product and it deserves its own careful afternoon,
not a Friday-night refactor.

## What I'd tell past me

- **Code-split does not mean not-loaded.** Separate chunk, always downloaded, is
  the default failure mode and no bundle report will flag it.
- **Walk the graph from the HTML.** Thirty lines of Python beat any dashboard,
  because it answers the question you actually have.
- **Then check what was really requested.** The static graph missed a dynamic
  import that cost me the entire saving until I read a Lighthouse network log.
- **Grep before you move a provider.** One consumer on a public page invalidates
  the whole plan.
- **A heavy dependency behind `if (x) return null` is still a heavy dependency.**

## A bonus mistake, because it was a good one

Midway through, an accessibility fix of mine put a screen-reader copy of a word
next to the visible one:

```jsx
<span className="sr-only">{text}</span>
<span aria-hidden>{display}</span>
```

Both are text nodes. `sr-only` hides an element visually; it does not remove it
from the accessibility tree or from the element's text content. So the `<h1>`
read `Learn How Certification Exams ThinkThink` — in the prerendered HTML, which
is exactly what a crawler reads.

Swap, don't stack:

```jsx
const scrambling = display !== text
<>
  {scrambling && <span className="sr-only">{text}</span>}
  <span aria-hidden={scrambling || undefined}>{display}</span>
</>
```

I found it because a Playwright script printed the `h1` text while I was
testing something unrelated. Print your headings in your smoke tests.
````

---

## 2. Peerlist / SaaSHub / Openalternative — 5 minutes each, free

Reuse the AlternativeTo description from `link-assets-tier1.md` verbatim. These
are low-authority but they are free, instant, and they diversify the anchor-text
profile away from three dev.to links.

- **SaaSHub** — https://www.saashub.com/submit — no account gate beyond signup
- **Peerlist Project** — needs your Peerlist profile; the project card links out
- **Openalternative** — https://openalternative.co/submit — only if you'd list
  as an alternative to a named commercial tool

Lead with the method, never with "AI." Same rule as AlternativeTo.

---

## 3. Hacker News — submit the article, NOT the product

**Do not post `Show HN: CipherExam`.** A paid certification-prep SaaS as a Show
HN will get a thread about pricing and AI-generated questions, not about the
product. That is a bad first impression on a site with long memory.

Submit the **dev.to article** as a normal link post instead:

```
Title: Firebase was 40% of my landing page's JavaScript
URL:   <your dev.to permalink>
```

Rules that matter:
- Submit once. No resubmitting, no asking anyone to upvote — both are bannable.
- Best window is roughly 8–10am ET on a weekday.
- If it gets comments, answer them technically and fast. The traffic is the
  comments, not the upvotes.
- Your HN profile should have your real name and cipherexam.com in it. That link
  is `nofollow`, but the profile is what people click when the post does well.
- Most submissions get nothing. That is the normal outcome, not a failure.

**Lobsters** is the better-fit sister site for this specific article, but it is
invite-only. Skip unless you already have an account.

---

## 4. Reddit — a slow burn, and the fastest way to get banned

r/PMP (~180k) and r/CompTIA (~250k) are where your buyers are. Both will nuke a
link drop and may ban the domain, which is worse than doing nothing.

**The only approach that works:**

1. **Two weeks of pure answering.** No links, ever. Sort by New, find questions
   you can answer from what you actually know from building the banks —
   PMP situational-judgment framing, why Network+ questions want you to locate
   the fault before fixing it, Bloom's-level reasoning. Ten to fifteen genuinely
   useful comments.
2. **Then, only when directly on point,** mention the tool once, disclosed:
   "I build a practice tool for this so I'm biased, but —". Never as the whole
   comment. Never twice in a thread.
3. **Read each subreddit's self-promo rule first** — several require a flair or
   a minimum account age, and r/CompTIA has periodically banned prep-tool links
   outright.

**A worked example** of the kind of comment that earns credibility, for the very
common "I keep failing practice questions but I know the material" post:

> Worth separating two different failure modes, because they need opposite
> fixes. If you're missing questions where you didn't know the fact, that's a
> content gap and more reading helps. If you knew every fact in the question and
> still picked wrong, that's a reasoning gap and more reading does nothing —
> you need to practise choosing between two answers that are both technically
> correct, which is what the exam is actually testing.
>
> Concrete way to tell them apart: after each miss, write down whether you could
> have answered it if someone had handed you the right page of the book. If yes,
> it's reasoning. Most people who "know the material but fail practice" are
> almost entirely in that bucket, and they respond by re-reading, which is why
> the score doesn't move.

Note what that does: it is useful on its own, it demonstrates the exact thesis
your product is built on, and it contains no link. Do that fifteen times and the
sixteenth comment can mention the tool without anyone minding.

**Expected value, honestly:** Reddit links are `nofollow` and pass no ranking
signal directly. You do this for referral traffic and for the brand-name
searches that follow, which *do* help. Don't expect it to move indexing.

---

## What this is and isn't

None of this is a ranking hack. The reason your pages sit in "Discovered –
currently not indexed" is that almost nothing on the web points at your domain,
so Google has no reason to spend crawl budget. The fix is a slow accumulation of
places a real person would plausibly link from.

Ten to fifteen of these gets you out of the hole. Three does not. The dev.to
article is the one with the highest ceiling — it can earn links you didn't
place yourself, which is the only kind that compounds.
