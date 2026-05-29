import { useState, type FormEvent } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";
import { trackCtaClick } from "../lib/ga4";

type Cluster = "pmp" | "security-plus" | "shrm-cp";

interface Props {
  cluster: Cluster;
  /** Per-cluster headline. Cap each at ~7 words. */
  headline: string;
  /** Per-cluster sub-headline. Cap each at ~14 words. */
  sub: string;
  /** UTM bag passed back to the Cloud Function for later drip-email attribution. */
  pageId: string;
}

/**
 * Lead-magnet email capture block. Drop into any LP between content and pricing.
 *
 * On submit: POSTs email + cluster + UTM to the `captureLead` Cloud Function,
 * which logs to Firestore and returns a download URL. The component then
 * renders an inline success state with the download button.
 *
 * Track separately from main CTA clicks via the `lead-magnet-{cluster}` GA4 event.
 */
export default function LeadMagnetCapture({ cluster, headline, sub, pageId }: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }
    setStatus("submitting");
    try {
      const params = new URLSearchParams(window.location.search);
      const utm = {
        source: params.get("utm_source"),
        campaign: params.get("utm_campaign"),
        content: params.get("utm_content"),
        medium: params.get("utm_medium"),
        term: params.get("utm_term"),
        lp: params.get("utm_lp") || pageId,
      };
      const captureLead = httpsCallable<{ email: string; cluster: string; utm: object; referrer: string }, { ok: boolean; downloadUrl: string }>(
        functions,
        "captureLead"
      );
      const res = await captureLead({
        email: email.trim(),
        cluster,
        utm,
        referrer: document.referrer || "",
      });
      trackCtaClick(`${pageId}-lead-magnet-success`);
      setDownloadUrl(res.data.downloadUrl);
      setStatus("success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Try again?";
      setError(msg);
      setStatus("error");
    }
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <div className="rounded-2xl border border-brand-500/30 bg-brand-500/5 px-6 py-8 sm:px-10 sm:py-10">
        {status === "success" && downloadUrl ? (
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-300">Check your email</p>
            <h3 className="mt-3 text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">
              You're in. Download below.
            </h3>
            <p className="mt-3 text-base text-slate-300">
              We've saved your email so you can get more reasoning content. The PDF is ready now.
            </p>
            <div className="mt-6 flex flex-col items-center gap-3">
              <a
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackCtaClick(`${pageId}-lead-magnet-download`)}
                className="inline-flex items-center rounded-md bg-brand-600 px-8 py-4 text-base font-semibold text-white shadow transition hover:bg-brand-500"
              >
                Download the PDF →
              </a>
              <p className="text-sm text-slate-400">
                Or skip the PDF —{" "}
                <a
                  href={`/login?exam=${cluster}&utm_lp=${pageId}&utm_content=lead_magnet_skip`}
                  className="text-brand-400 underline hover:text-brand-300"
                >
                  start your free trial instead
                </a>
                .
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-300">Free download · No trial required</p>
            <h3 className="mt-3 text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">{headline}</h3>
            <p className="mt-3 text-base text-slate-300">{sub}</p>

            <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-stretch sm:justify-center">
              <label htmlFor="lead-magnet-email" className="sr-only">
                Email address
              </label>
              <input
                id="lead-magnet-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@work.com"
                disabled={status === "submitting"}
                className="flex-1 rounded-md border border-slate-700 bg-slate-900/70 px-4 py-3 text-base text-slate-100 placeholder:text-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={status === "submitting"}
                className="inline-flex items-center justify-center rounded-md bg-brand-600 px-6 py-3 text-base font-semibold text-white shadow transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {status === "submitting" ? "Sending…" : "Get the cheat sheet"}
              </button>
            </form>

            {error && (
              <p className="mt-3 text-sm text-red-400" role="alert">
                {error}
              </p>
            )}

            <p className="mt-4 text-xs text-slate-500">
              We'll only email you about CipherExam. Unsubscribe anytime.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
