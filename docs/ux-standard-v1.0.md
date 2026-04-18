# ExamCoach Pro AI — UX Consistency Standard
**Version:** 1.0
**Status:** Active
**Scope:** All application screens under `/app/*` and all shared components

---

## 1. Standard Page Wrapper Layout

### 1.1 AppLayout

All authenticated routes under `/app/*` — except the Dashboard index at `/app` — must render inside `AppLayout`. `AppLayout` is defined in `App.tsx` and provides the sidebar, identity indicator, version label, and the main content column. Rendering a page outside `AppLayout` within the authenticated shell is not permitted.

**Dashboard (`/app`)** is the single approved exception. It manages its own sidebar instance and layout independently because it is the root shell destination, not a content page.

### 1.2 Main Content Column

`AppLayout` applies the following structure to the content column:

| Property | Value |
|---|---|
| Flex basis | `flex-1` |
| Left margin (expanded sidebar) | `ml-64` |
| Left margin (collapsed sidebar) | `ml-20` |
| Padding | `p-8` (2rem all sides) |
| Transition | `transition-all duration-300` |

Pages must not add a second wrapping `min-h-screen` or additional `p-8` inside the content column — the outer padding is already applied.

### 1.3 Background Color

The root background is `bg-slate-900` (#0f172a). No page within `AppLayout` may override the background with a different root color. The sidebar uses `bg-slate-950`. Cards use `bg-slate-800/50`. Modals use `bg-slate-800`.

### 1.4 Base Text Color

All pages default to `text-slate-100`. `text-slate-200` is acceptable as a secondary default on content-heavy pages. Do not set `text-white` as a page-level base class.

---

## 2. Max-Width Policy

### 2.1 Approved Values

| Token | Pixel Equivalent | Permitted Usage |
|---|---|---|
| `max-w-md` | 448px | Modals, confirmation dialogs, single-input overlays |
| `max-w-xl` | 576px | Narrow content wells (single-column forms) |
| `max-w-2xl` | 672px | Content body on information pages (Help, FAQ, onboarding copy) |
| `max-w-5xl` | 1024px | Sticky page headers, wide content panels |
| `max-w-7xl` | 1280px | Full-width data pages (ExamList, Stats, Planner) |

### 2.2 Rules

- These are the only permitted `max-w-*` values. Arbitrary Tailwind values such as `max-w-[900px]` or `max-w-[1400px]` are not permitted.
- Every max-width container must also include `mx-auto` to ensure center alignment.
- A single page may use different max-widths for its header and body sections (e.g., `max-w-5xl` header with `max-w-2xl` body column) provided the values are selected from the approved list above.
- Do not mix `max-w-7xl` on the outer wrapper and `max-w-5xl` on an inner section unless the inner section is a discrete sub-panel.

---

## 3. Primary CTA Definition

### 3.1 Visual Specification

| Property | Value |
|---|---|
| Background | `bg-brand-600` |
| Hover background | `hover:bg-brand-500` |
| Text color | `text-white` |
| Font weight | `font-bold` |
| Border radius | `rounded-xl` |
| Vertical padding | `py-3` |
| Horizontal padding | `px-8` |
| Shadow | `shadow-lg shadow-brand-500/25` |
| Transition | `transition-all` |

### 3.2 Usage Rules

- Exactly one primary CTA is permitted per page view or modal.
- The primary CTA is reserved for the single most important user action on any given screen (e.g., "Start Quiz", "Begin Simulation", "Refresh Now").
- The primary CTA must never appear in a destructive context (deletion, reset, cancellation). Destructive confirmation buttons use `bg-red-600 hover:bg-red-500`.

### 3.3 Prohibited Alternatives

The following are explicitly prohibited as substitutes for the primary CTA:

- Gradient backgrounds (`from-brand-500 to-brand-600`, `bg-gradient-to-r`, etc.) on action buttons
- Alternative brand colors (`bg-brand-500` as a static background without hover state)
- `bg-indigo-*`, `bg-violet-*`, `bg-blue-*`, or any other hue outside the `brand-*` scale
- `rounded-full` pill shape on primary action buttons

---

## 4. Secondary / Tertiary Button Rules

### 4.1 Visual Hierarchy

| Level | Style | Usage |
|---|---|---|
| Secondary | `bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg` | Supporting actions: Cancel, Go Back, secondary navigation |
| Tertiary / Ghost | `text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg` | Low-priority actions, sidebar nav items |
| Destructive | `bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg` | Irreversible actions: Reset, Delete |
| Locked / Disabled | `bg-slate-700/30 text-slate-600 cursor-not-allowed rounded-lg` | Conditionally unavailable actions |

### 4.2 Border Radius

- All buttons (primary, secondary, tertiary, destructive): `rounded-lg` or `rounded-xl`.
- `rounded-xl` is used for primary CTAs and modal-level buttons.
- `rounded-lg` is used for secondary and tertiary buttons.
- `rounded-full` is reserved for icon-only toggle controls (e.g., the sidebar collapse toggle) and badge/status indicators only. It must not be used for labeled action buttons.

### 4.3 Gradient Prohibition

Gradients are not permitted on any button element. This applies to background gradients, border gradients, and text gradients on interactive controls. The only approved gradient usage in the application is decorative backgrounds on static, non-interactive elements.

---

## 5. Back Navigation Standard

### 5.1 DashboardLink Component

All structural back navigation — navigation that returns a user from a content page to the main application shell — must use the `DashboardLink` component.

`DashboardLink` renders as:
- An `inline-flex` row with `gap-2`
- `ChevronLeft` icon at `w-4 h-4`
- Label: "Back to Dashboard"
- Text style: `text-sm text-slate-400 hover:text-white transition-colors`
- Bottom margin: `mb-6`
- Destination: `/app` — fixed, non-configurable

### 5.2 Placement

`DashboardLink` must appear at the top of the page content, before the page title, as the first element in the content well. It must not be placed inside a card, inside a header bar, or after the page title.

### 5.3 Destination Rule

`DashboardLink` must always navigate to `/app`. It must not be repurposed with custom destinations or renamed. If a contextual "back" action is needed within a multi-step flow (e.g., returning from Simulator results to SimulatorIntro), that action must use a separate button with explicit labeling (e.g., "Run Another Simulation"), not `DashboardLink`.

### 5.4 Session Exit vs. Structural Navigation

Session exits (e.g., quitting an active quiz session mid-run) are contextual exits, not structural navigation. They may use a separate inline button with an `ArrowLeft` icon and explicit label ("Exit Quiz", "Leave Session"). These do not replace `DashboardLink` and do not navigate to any destination other than the appropriate return point for that session context.

### 5.5 Sticky Header Interaction

Pages with a sticky header must not duplicate back navigation inside the sticky header. The sticky header is for page identity (title + icon) only. `DashboardLink` belongs in the scrollable content area below the sticky header.

---

## 6. Card Component Standard

### 6.1 Standard Card

| Property | Value |
|---|---|
| Border radius | `rounded-2xl` |
| Border | `border border-white/5` |
| Background | `bg-slate-800/50` |
| Backdrop blur | `backdrop-blur-xl` (permitted on cards) |
| Padding | `p-6` |
| Shadow | None by default |

### 6.2 Interactive Card (hoverable)

Standard card plus:

| Property | Value |
|---|---|
| Hover border | `hover:border-brand-500/30` |
| Hover shadow | `hover:shadow-lg hover:shadow-brand-500/10` |
| Transition | `transition-all` |

### 6.3 Elevated Card (modal-level)

Used for modal dialogs and confirmation panels:

| Property | Value |
|---|---|
| Background | `bg-slate-800` (no opacity) |
| Border radius | `rounded-2xl` |
| Border | `border border-slate-700` or context-specific (e.g., `border-red-900/50` for destructive) |
| Shadow | `shadow-2xl` |
| Padding | `p-6` |

### 6.4 Backdrop Blur

`backdrop-blur-xl` is permitted on standard cards inside the authenticated shell. `backdrop-blur-md` is permitted on sticky headers. Backdrop blur must not be applied to full-page backgrounds or inside modals.

### 6.5 Padding Scale

- Card body: `p-6`
- Compact card or sub-panel: `p-4`
- Large feature card: `p-8`
- Do not mix padding axes arbitrarily (e.g., `px-6 py-8` is only permitted when a specific horizontal/vertical split is required by the layout).

---

## 7. Typography System

### 7.1 Font Family

| Context | Class |
|---|---|
| Page and section titles | `font-display` |
| Body text, labels, descriptions | `font-sans` (default) |
| Version strings, code, confirmation inputs | `font-mono` |

`font-display` is mandatory on all page titles (`h1`) and major section titles (`h2`). It must not be applied to body text, labels, or captions.

### 7.2 Page Title

Every page must have exactly one `h1` element. It is the primary landmark for accessibility.

| Property | Value |
|---|---|
| Element | `h1` |
| Size | `text-3xl` |
| Weight | `font-bold` |
| Color | `text-white` |
| Font | `font-display` |
| Tracking | `tracking-tight` |

### 7.3 Section Title Scale

| Level | Size | Weight | Color | Font |
|---|---|---|---|---|
| `h2` (major section) | `text-2xl` | `font-bold` | `text-white` | `font-display` |
| `h3` (sub-section) | `text-lg` | `font-semibold` | `text-white` | `font-sans` |
| `h4` (label grouping) | `text-sm` | `font-semibold` | `text-slate-300` | `font-sans` |

### 7.4 Body Text

| Usage | Size | Color |
|---|---|---|
| Standard body | `text-sm` | `text-slate-300` or `text-slate-400` |
| Descriptive subtitle (below page title) | `text-base` | `text-slate-400` |
| Supporting detail / caption | `text-xs` | `text-slate-500` |

### 7.5 Prohibited Combinations

- `text-4xl` is permitted for hero/marketing contexts only. It must not be used as a page title inside `AppLayout`.
- `font-display` must not be combined with `text-xs` or `text-sm`.
- `font-bold` must not be applied to body paragraph text.
- Do not create custom font size stacks that fall between named scale steps (e.g., `text-[15px]`).

### 7.6 Semantic Heading Requirement

Every page rendered inside `AppLayout` must contain exactly one `h1`. Headings must not be used purely for visual sizing — use the heading level that reflects document structure, and apply size classes to achieve the correct visual appearance.

---

## 8. Spacing Scale

### 8.1 Approved Spacing Tokens

Only the following vertical and horizontal spacing values are permitted for layout-level spacing:

**Padding:**
`p-4`, `p-6`, `p-8`, `px-4`, `px-6`, `px-8`, `py-2`, `py-3`, `py-4`, `py-6`, `py-8`, `py-12`

**Margin:**
`mb-2`, `mb-3`, `mb-4`, `mb-6`, `mb-8`, `mb-12`, `mt-1`, `mt-2`, `mt-4`, `mt-6`

**Gap:**
`gap-2`, `gap-3`, `gap-4`, `gap-6`, `gap-8`

**Space-y:**
`space-y-1`, `space-y-1.5`, `space-y-2`, `space-y-4`, `space-y-6`, `space-y-8`

### 8.2 Prohibited Spacing

The following spacing values are not permitted at layout level:

- `py-20`, `py-24`, `py-32`, `pt-20`, `pb-20` — marketing-scale vertical spacing; these values are not appropriate for application screens inside `AppLayout`.
- Arbitrary spacing values: `p-[72px]`, `mb-[3.5rem]`, etc.
- Single-digit arbitrary pixel values as spacing overrides.

### 8.3 Vertical Rhythm

- Page title block (title + subtitle): `mb-6` to `mb-8` before the first section.
- Between major sections: `mb-8` or `space-y-8`.
- Between cards in a grid: `gap-6`.
- `DashboardLink` bottom margin: `mb-6` (fixed — do not override).
- Within a card body: `space-y-4` as the default inter-element rhythm.

---

## 9. Z-Index Policy

All z-index values must be drawn from the following defined layers. Arbitrary z-index values are not permitted.

| Layer | Value | Usage |
|---|---|---|
| Sidebar | `z-40` | Fixed sidebar navigation |
| Sticky headers / identity indicator | `z-50` | Page-level sticky headers, identity overlay |
| Modals and overlays | `z-50` | Dialog backgrounds and panels |
| System banners | `z-[9999]` | Version warn banner; reserved for system-level interrupts only |

### 9.1 Collision Prevention Rules

- The sidebar is `z-40`. Any page element that must appear above the sidebar (e.g., a dropdown or tooltip) must use `z-50` minimum.
- Modals use a full-screen `fixed inset-0` backdrop at `z-50` with `bg-black/60 backdrop-blur-sm`. The modal panel itself inherits the same stacking context and does not require an additional z-index.
- The system banner layer (`z-[9999]`) is reserved exclusively for the `VersionGate` warn state. No new component may claim this layer.
- Do not mix `position: relative` stacking contexts with high z-index values inside cards — this creates invisible clipping. Tooltips and dropdowns inside cards must use `position: fixed` or be portaled.

---

## 10. Change Control Rule

### 10.1 Zero One-Off Styling

No styling that deviates from this specification is permitted in production code. One-off class combinations introduced for a single screen are not acceptable. If a new pattern is needed, it must be proposed as a spec amendment before implementation.

### 10.2 Design Review Trigger

Any of the following require explicit design review before implementation:

- A new max-width value not listed in Section 2
- A button style not described in Sections 3 or 4
- A new z-index layer not defined in Section 9
- Any use of `rounded-full` on a labeled interactive element
- Any gradient applied to an interactive control
- Any `py-20` or larger spacing value on an application screen
- Introduction of a new card variant not covered by Section 6
- Any sticky or fixed element with a z-index not in the approved table

### 10.3 Enforcement

All pull requests that modify `.tsx` files under `web/src/pages/` or `web/src/components/` must be reviewed against this document before merge. The reviewer is responsible for flagging deviations. The author is responsible for correcting them before approval.

### 10.4 Amendment Process

Amendments to this document require:
1. A documented rationale (what gap in the current spec necessitates the change)
2. Review and approval before the change is implemented in code
3. Version bump of this document (e.g., v1.0 → v1.1)

---

*ExamCoach Pro AI — UX Standard v1.0*
*Effective from the date of adoption. Supersedes all prior informal style guidance.*
