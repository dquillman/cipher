import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../App";
import {
  TestimonialService,
  type TestimonialDoc,
  type TestimonialStatus,
} from "../services/TestimonialService";

type Row = TestimonialDoc & { id: string };

/**
 * Admin-only moderation queue for user-submitted testimonials.
 *
 * Route: /app/testimonials. Flips `testimonials/{uid}.status` between
 * pending_review → approved (or rejected). Approved + consented testimonials
 * then surface on the Tier 1 landing pages via TestimonialsSection.
 */
export default function TestimonialModeration() {
  const { user } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [roleLoaded, setRoleLoaded] = useState(false);

  const [pending, setPending] = useState<Row[]>([]);
  const [approved, setApproved] = useState<Row[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "users", user.uid))
      .then((snap) => setRole(snap.exists() ? snap.data()?.role || "user" : "user"))
      .catch(() => setRole("user"))
      .finally(() => setRoleLoaded(true));
  }, [user]);

  const isAdmin = role?.toLowerCase() === "admin";

  useEffect(() => {
    if (!isAdmin) return;
    const unsubP = TestimonialService.subscribeByStatus(
      "pending_review",
      setPending,
      (e) => setError(e.message),
    );
    const unsubA = TestimonialService.subscribeByStatus(
      "approved",
      setApproved,
      (e) => setError(e.message),
    );
    return () => {
      unsubP();
      unsubA();
    };
  }, [isAdmin]);

  if (!user) return <Navigate to="/login" replace />;
  if (!roleLoaded) {
    return <div className="p-8 text-slate-400">Checking access…</div>;
  }
  if (!isAdmin) return <Navigate to="/app" replace />;

  const act = async (id: string, status: TestimonialStatus) => {
    setBusy(id);
    setError(null);
    try {
      await TestimonialService.setStatus(id, status, user.uid);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-50">Testimonial moderation</h1>
      <p className="mt-1 text-sm text-slate-400">
        Approve testimonials to surface them on the landing pages. Only approved
        testimonials with share-consent are displayed publicly.
      </p>

      {error && (
        <div className="mt-4 rounded-md border border-red-800 bg-red-950/40 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <Queue
        title={`Pending review (${pending.length})`}
        emptyText="No testimonials awaiting review."
        rows={pending}
        busy={busy}
        actions={(r) => [
          { label: "Approve", tone: "primary", onClick: () => act(r.id, "approved") },
          { label: "Reject", tone: "danger", onClick: () => act(r.id, "rejected") },
        ]}
      />

      <Queue
        title={`Approved (${approved.length})`}
        emptyText="Nothing approved yet."
        rows={approved}
        busy={busy}
        actions={(r) => [
          { label: "Unapprove", tone: "muted", onClick: () => act(r.id, "pending_review") },
        ]}
      />
    </div>
  );
}

type Action = { label: string; tone: "primary" | "danger" | "muted"; onClick: () => void };

function Queue({
  title,
  emptyText,
  rows,
  busy,
  actions,
}: {
  title: string;
  emptyText: string;
  rows: Row[];
  busy: string | null;
  actions: (r: Row) => Action[];
}) {
  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
        {title}
      </h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">{emptyText}</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {rows.map((r) => (
            <li
              key={r.id}
              className="rounded-xl border border-slate-800 bg-slate-900/50 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono">{r.examName || r.examId}</span>
                    <span>·</span>
                    <span>{"★".repeat(Math.max(0, Math.min(5, r.rating || 0)))}</span>
                    {!r.consentToShare && (
                      <span className="rounded bg-amber-900/50 px-1.5 py-0.5 text-amber-300">
                        no share-consent
                      </span>
                    )}
                  </div>
                  <blockquote className="mt-2 text-sm italic text-slate-300">
                    “{r.text || <span className="not-italic text-slate-600">(rating only, no text)</span>}”
                  </blockquote>
                  <div className="mt-1 text-xs text-slate-600">
                    {r.userDisplayName || r.userEmail || r.userId}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                  {actions(r).map((a) => (
                    <button
                      key={a.label}
                      disabled={busy === r.id}
                      onClick={a.onClick}
                      className={
                        "rounded-md px-3 py-1.5 text-xs font-semibold transition disabled:opacity-40 " +
                        (a.tone === "primary"
                          ? "bg-brand-600 text-white hover:bg-brand-700"
                          : a.tone === "danger"
                            ? "border border-red-800 text-red-300 hover:bg-red-950/40"
                            : "border border-slate-700 text-slate-300 hover:bg-slate-800")
                      }
                    >
                      {busy === r.id ? "…" : a.label}
                    </button>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
