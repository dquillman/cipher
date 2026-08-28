/**
 * GA4 Event Verification Dashboard
 *
 * HOW TO USE:
 * 1. Open /verify-events in Tab 1
 * 2. Open the site in Tab 2 (same browser, same origin)
 * 3. Walk through the funnel in Tab 2
 * 4. Watch events light up in real-time in Tab 1
 *
 * Uses BroadcastChannel API — both tabs must be same origin.
 */
import { useEffect, useState, useRef } from 'react';

interface CapturedEvent {
  id: number;
  timestamp: string;
  type: 'ga4' | 'meta' | 'ads';
  name: string;
  params: Record<string, unknown>;
}

const EXPECTED_FUNNEL = [
  { name: 'landing_page_view', description: 'Load the landing page' },
  { name: 'pricing_view', description: 'Visit /pricing or scroll to comparison' },
  { name: 'cta_click', description: 'Click any "Start Free Trial" button' },
  { name: 'trial_start', description: 'Complete signup (fires with signup)' },
  { name: 'signup_complete', description: 'Complete signup (new user only)' },
  { name: 'exam_selected', description: 'Pick an exam from the dropdown' },
  { name: 'activated_user', description: 'Answer the 10th quiz question' },
  { name: 'explanation_viewed', description: 'View an AI explanation' },
];

const META_EXPECTED = [
  { name: 'CompleteRegistration', description: 'Meta Pixel — fires with signup' },
];

const ADS_EXPECTED = [
  { name: 'conversion', description: 'Google Ads conversion on signup' },
];

export default function EventVerifier() {
  const [events, setEvents] = useState<CapturedEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const counterRef = useRef(0);

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;

    const channel = new BroadcastChannel('ec_event_verify');
    setConnected(true);

    channel.onmessage = (e) => {
      const { type, name, params } = e.data as { type: string; name: string; params: Record<string, unknown> };
      counterRef.current++;
      const captured: CapturedEvent = {
        id: counterRef.current,
        timestamp: new Date().toLocaleTimeString(),
        type: type as CapturedEvent['type'],
        name,
        params,
      };
      setEvents(prev => [captured, ...prev]);
    };

    return () => channel.close();
  }, []);

  const firedNames = new Set(events.map(e => e.name));

  const allExpected = [...EXPECTED_FUNNEL, ...META_EXPECTED, ...ADS_EXPECTED];
  const passCount = allExpected.filter(e => firedNames.has(e.name)).length;
  const allPassed = passCount === allExpected.length;

  const renderChecklist = (
    label: string,
    expected: { name: string; description: string }[]
  ) => (
    <div className="mb-8">
      <h3 className="text-lg font-bold text-white mb-3">{label}</h3>
      <div className="space-y-2">
        {expected.map((evt) => {
          const fired = firedNames.has(evt.name);
          return (
            <div
              key={evt.name}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg border ${
                fired
                  ? 'bg-emerald-900/30 border-emerald-500/30'
                  : 'bg-slate-800/50 border-slate-700'
              }`}
            >
              <span className={`text-lg ${fired ? 'text-emerald-400' : 'text-slate-600'}`}>
                {fired ? '✓' : '○'}
              </span>
              <div>
                <code className={`text-sm font-mono ${fired ? 'text-emerald-300' : 'text-slate-400'}`}>
                  {evt.name}
                </code>
                <span className="text-xs text-slate-500 ml-2">— {evt.description}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-slate-900 text-slate-200 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white font-display">Event Verifier</h1>
            <p className="text-slate-400 text-sm mt-1">
              {connected
                ? 'Listening for events from other tabs on this domain.'
                : 'BroadcastChannel not supported in this browser.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${
              connected ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/30' : 'bg-red-900/30 text-red-400 border border-red-500/30'
            }`}>
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
              {connected ? 'LISTENING' : 'DISCONNECTED'}
            </div>
            <button
              onClick={() => { setEvents([]); counterRef.current = 0; }}
              className="px-4 py-2 rounded-lg bg-red-900/30 border border-red-500/30 text-red-300 text-sm hover:bg-red-900/50 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mb-8 bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <p className="text-sm text-slate-300 font-medium mb-2">How to test:</p>
          <ol className="text-sm text-slate-400 space-y-1 list-decimal list-inside">
            <li>Keep this tab open</li>
            <li>Open a <strong className="text-white">new tab</strong> to <code className="text-brand-300">cipherexam.com</code> (or staging)</li>
            <li>Walk through the funnel: Landing → Pricing → CTA → Signup → Select Exam → Answer 10 Qs → View Explanation</li>
            <li>Watch events light up here in real-time</li>
          </ol>
        </div>

        {/* Status banner */}
        {allPassed && (
          <div className="mb-8 bg-emerald-900/30 border border-emerald-500/30 rounded-xl p-4 text-center">
            <span className="text-emerald-300 font-bold text-lg">ALL {allExpected.length} EVENTS VERIFIED</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Checklist */}
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Checklist</h2>
            <div className="text-xs text-slate-500 mb-4">
              {passCount} / {allExpected.length} events detected
            </div>
            {renderChecklist('GA4 Funnel Events', EXPECTED_FUNNEL)}
            {renderChecklist('Meta Pixel', META_EXPECTED)}
            {renderChecklist('Google Ads', ADS_EXPECTED)}
          </div>

          {/* Live Feed */}
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Live Event Feed</h2>
            <div className="text-xs text-slate-500 mb-4">{events.length} events captured</div>
            {events.length === 0 ? (
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center text-slate-500">
                Waiting for events from another tab...
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {events.map((evt) => (
                  <div
                    key={evt.id}
                    className={`rounded-lg border p-3 ${
                      evt.type === 'ga4'
                        ? 'bg-brand-900/20 border-brand-500/20'
                        : evt.type === 'meta'
                        ? 'bg-blue-900/20 border-blue-500/20'
                        : 'bg-amber-900/20 border-amber-500/20'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        evt.type === 'ga4'
                          ? 'bg-brand-500/20 text-brand-300'
                          : evt.type === 'meta'
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {evt.type}
                      </span>
                      <code className="text-sm font-mono text-white font-bold">{evt.name}</code>
                      <span className="text-xs text-slate-500 ml-auto">{evt.timestamp}</span>
                    </div>
                    {Object.keys(evt.params).length > 0 && (
                      <pre className="text-xs text-slate-400 mt-1 overflow-x-auto">
                        {JSON.stringify(evt.params, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
