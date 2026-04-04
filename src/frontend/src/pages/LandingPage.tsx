/**
 * Public marketing / citizen-facing entry for SCEMAS — no operator login required.
 * Optional live zone status when VITE_PUBLIC_DEMO_API_KEY matches the backend demo key.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PublicLandingMap from '../components/PublicLandingMap';
import {
  fetchPublicZones,
  isPublicApiConfigured,
  type PublicZoneSummary,
} from '../api/publicZones';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
const DOCS_URL = `${API_BASE.replace(/\/$/, '')}/docs`;

const PUBLIC_ENDPOINTS = [
  {
    method: 'GET',
    path: '/public/zones',
    summary: 'List all zones with latest aggregated metrics and high-level status (normal vs alerting).',
  },
  {
    method: 'GET',
    path: '/public/zones/{zone}',
    summary: 'Same summary for a single zone — useful for signage or kiosks.',
  },
] as const;

export default function LandingPage() {
  const [publicZones, setPublicZones] = useState<PublicZoneSummary[] | null>(null);
  const [liveAttempted, setLiveAttempted] = useState(false);

  useEffect(() => {
    if (!isPublicApiConfigured()) {
      setLiveAttempted(true);
      return;
    }
    let cancelled = false;
    void (async () => {
      const data = await fetchPublicZones();
      if (!cancelled) {
        setPublicZones(data ?? null);
        setLiveAttempted(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const liveLabel = !isPublicApiConfigured()
    ? 'Configure VITE_PUBLIC_DEMO_API_KEY (same value as DEMO_PUBLIC_API_KEY) for live status colours.'
    : !liveAttempted
      ? 'Loading public summaries…'
      : publicZones && publicZones.length > 0
        ? 'Live data from the public API.'
        : 'Public API unreachable — showing monitoring coverage only.';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-brand-50/30 text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-teal-600 shadow-md ring-1 ring-black/5">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <span className="truncate font-bold tracking-tight text-slate-900">SCEMAS</span>
          </div>
          <nav className="flex items-center gap-2 sm:gap-3 shrink-0">
            <a
              href={DOCS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 sm:inline-block"
            >
              API docs
            </a>
            <a
              href="#public-api"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
            >
              Public API
            </a>
            <Link
              to="/login"
              className="rounded-lg bg-gradient-to-br from-brand-600 to-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-brand-500 hover:to-teal-600"
            >
              Operator login
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="text-sm font-bold uppercase tracking-widest text-brand-700">Smart Campus Environmental Monitoring</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            City-wide environmental awareness — built for operators, open to the public.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-600">
            SCEMAS ingests sensor telemetry, validates it, and publishes zone-level summaries. Residents and partners see
            the big picture; authorized staff sign in to manage thresholds and respond to alerts.
          </p>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-5 lg:items-start">
            <div className="lg:col-span-3">
              <h2 className="text-lg font-bold text-slate-900">Monitoring coverage</h2>
              <p className="mt-1 text-sm text-slate-500">{liveLabel}</p>
              <div className="mt-4 overflow-hidden border border-slate-200/80 bg-white shadow-card ring-1 ring-slate-900/[0.04]">
                <PublicLandingMap zones={publicZones} />
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Map centred on Hamilton / McMaster. Teal markers = normal summary; amber/red = active public alert hint.
                Grey = coverage only (no live feed).
              </p>
            </div>
            <aside className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card lg:col-span-2">
              <h3 className="font-bold text-slate-900">At a glance</h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                  Four campus zones with aggregated air quality, temperature, humidity, and noise-style metrics.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                  Thresholds and alerts are managed by operators after secure login.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                  Third parties can pull read-only zone JSON with an API key (rate limited).
                </li>
              </ul>
              <Link
                to="/login"
                className="mt-6 flex w-full items-center justify-center rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                Go to operator console
              </Link>
            </aside>
          </div>
        </section>

        <section id="public-api" className="border-t border-slate-200/80 bg-slate-50/80 py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-2xl font-bold text-slate-900">Public API</h2>
            <p className="mt-2 max-w-3xl text-slate-600">
              Read-only REST endpoints for signage, research, and integrations. Authenticate with{' '}
              <code className="rounded bg-slate-200/60 px-1.5 py-0.5 text-xs font-mono text-slate-800">Authorization: Bearer &lt;api_key&gt;</code>
              . Responses are rate limited per key.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {PUBLIC_ENDPOINTS.map(ep => (
                <div
                  key={ep.path}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ring-1 ring-slate-900/[0.03]"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-900">{ep.method}</span>
                    <code className="text-sm font-mono font-semibold text-slate-800">{ep.path}</code>
                  </div>
                  <p className="mt-3 text-sm text-slate-600 leading-relaxed">{ep.summary}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={DOCS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                Open full Swagger UI
              </a>
              <span className="self-center text-sm text-slate-500">Includes operator routes (JWT) and all subsystems.</span>
            </div>
          </div>
        </section>

        <footer className="border-t border-slate-200 bg-white py-8">
          <div className="mx-auto max-w-6xl px-4 text-center text-xs text-slate-500 sm:px-6">
            SCEMAS · McMaster Software Design III · Group 6 Tutorial 01 · Zone summaries only; no raw sensor PII in public views.
          </div>
        </footer>
      </main>
    </div>
  );
}
