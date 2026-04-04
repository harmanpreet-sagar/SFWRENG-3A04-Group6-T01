import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  listThresholds, createThreshold, updateThreshold,
  activateThreshold, deactivateThreshold, deleteThreshold,
} from '../api/thresholds';
import { useAuth } from '../context/AuthContext';
import type { Threshold, ThresholdCreate } from '../types';
import ThresholdTable from '../components/ThresholdTable';
import ThresholdFormModal from '../components/ThresholdFormModal';
import SeverityChart from '../components/SeverityChart';
import ZoneMap from '../components/ZoneMap';

type Filter = { zone: string; metric: string; status: 'all' | 'active' | 'inactive' };

export default function ThresholdsPage() {
  const { account, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const [thresholds, setThresholds] = useState<Threshold[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [filter, setFilter] = useState<Filter>({ zone: '', metric: '', status: 'all' });
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  const [showForm,   setShowForm]   = useState(false);
  const [editTarget, setEditTarget] = useState<Threshold | null>(null);

  // ── Load thresholds ──────────────────────────────────────────────────────────
  const reload = useCallback(async () => {
    setFetchError(null);
    try {
      const data = await listThresholds();
      setThresholds(data);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      if ((err as { response?: { status?: number } })?.response?.status === 401) {
        signOut();
        navigate('/login', { replace: true });
        return;
      }
      setFetchError(detail ?? 'Failed to load thresholds.');
    } finally {
      setLoading(false);
    }
  }, [signOut, navigate]);

  useEffect(() => { void reload(); }, [reload]);

  // ── CRUD handlers ────────────────────────────────────────────────────────────
  async function handleSave(data: ThresholdCreate) {
    if (editTarget) {
      const { is_active: _ia, ...changes } = data;
      const updated = await updateThreshold(editTarget.id, changes);
      setThresholds(prev => prev.map(t => t.id === updated.id ? updated : t));
    } else {
      const created = await createThreshold(data);
      setThresholds(prev => [...prev, created]);
    }
  }

  async function handleToggle(t: Threshold) {
    const updated = t.is_active
      ? await deactivateThreshold(t.id)
      : await activateThreshold(t.id);
    setThresholds(prev => prev.map(r => r.id === updated.id ? updated : r));
  }

  async function handleDelete(id: number) {
    await deleteThreshold(id);
    setThresholds(prev => prev.filter(t => t.id !== id));
  }

  function openEdit(t: Threshold) {
    setEditTarget(t);
    setShowForm(true);
  }

  function openCreate() {
    setEditTarget(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditTarget(null);
  }

  // ── Zone-map click syncs with table filter ───────────────────────────────────
  function handleZoneClick(zone: string) {
    setSelectedZone(zone || null);
    setFilter(f => ({ ...f, zone: zone }));
  }

  // ── Derived filtered list ────────────────────────────────────────────────────
  const visible = thresholds.filter(t => {
    if (filter.zone   && t.zone   !== filter.zone)   return false;
    if (filter.metric && t.metric !== filter.metric)  return false;
    if (filter.status === 'active'   && !t.is_active)  return false;
    if (filter.status === 'inactive' &&  t.is_active)  return false;
    return true;
  });

  // ── Stats ────────────────────────────────────────────────────────────────────
  const totalActive   = thresholds.filter(t => t.is_active).length;
  const totalCritical = thresholds.filter(t => t.severity === 'critical').length;

  const uniqueZones   = [...new Set(thresholds.map(t => t.zone))].sort();
  const uniqueMetrics = [...new Set(thresholds.map(t => t.metric))].sort();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ── Top nav ─────────────────────────────────────────────────────────── */}
      <header className="bg-slate-900 text-white shadow-md">
        <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <span className="font-semibold tracking-tight text-lg">SCEMAS</span>
            <span className="hidden sm:block text-slate-400 text-sm ml-2">Threshold Management</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-slate-300">
              {account?.name}
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full font-medium
                ${isAdmin ? 'bg-blue-700 text-blue-100' : 'bg-slate-700 text-slate-300'}`}>
                {account?.clearance}
              </span>
            </span>
            <button
              onClick={() => { signOut(); navigate('/login', { replace: true }); }}
              className="btn-ghost text-slate-300 hover:text-white hover:bg-slate-700 text-sm"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-screen-xl mx-auto w-full px-6 py-6 space-y-6">

        {/* ── ADMIN gate banner ──────────────────────────────────────────────── */}
        {!isAdmin && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 flex items-center gap-3 text-sm text-amber-800">
            <svg className="w-5 h-5 text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <span>You are logged in as <strong>OPERATOR</strong>. You can view thresholds but cannot create, edit, or delete them.</span>
          </div>
        )}

        {/* ── Stats row ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Rules',    value: thresholds.length, colour: 'text-blue-600',  bg: 'bg-blue-50'  },
            { label: 'Active',         value: totalActive,        colour: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Critical Rules', value: totalCritical,      colour: 'text-red-600',   bg: 'bg-red-50'   },
            { label: 'Zones Covered',  value: uniqueZones.length, colour: 'text-purple-600',bg: 'bg-purple-50'},
          ].map(({ label, value, colour, bg }) => (
            <div key={label} className={`card p-4 ${bg}`}>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
              <p className={`text-3xl font-bold mt-1 ${colour}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* ── Map + Chart row ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card overflow-hidden isolate">
            <div className="px-4 pt-4 pb-2">
              <h2 className="text-sm font-semibold text-gray-700">Zone Map</h2>
              <p className="text-xs text-gray-400 mt-0.5">Click a zone to filter the table</p>
            </div>
            <div className="h-60">
              <ZoneMap
                thresholds={thresholds}
                selectedZone={selectedZone}
                onZoneClick={handleZoneClick}
              />
            </div>
          </div>

          <div className="card p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-1">Active Thresholds by Severity</h2>
            <p className="text-xs text-gray-400 mb-3">Stacked count per metric</p>
            <div className="h-52">
              <SeverityChart thresholds={thresholds} />
            </div>
          </div>
        </div>

        {/* ── Table card ──────────────────────────────────────────────────────── */}
        <div className="card">
          {/* Card header */}
          <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center gap-3 justify-between">
            <h2 className="font-semibold text-gray-800">
              Threshold Rules
              <span className="ml-2 text-sm font-normal text-gray-400">{visible.length} shown</span>
            </h2>

            <div className="flex flex-wrap items-center gap-2">
              {/* Zone filter */}
              <select
                value={filter.zone}
                onChange={e => { setFilter(f => ({ ...f, zone: e.target.value })); setSelectedZone(e.target.value || null); }}
                className="input !py-1.5 !text-xs w-32"
              >
                <option value="">All zones</option>
                {uniqueZones.map(z => <option key={z} value={z}>{z}</option>)}
              </select>

              {/* Metric filter */}
              <select
                value={filter.metric}
                onChange={e => setFilter(f => ({ ...f, metric: e.target.value }))}
                className="input !py-1.5 !text-xs w-36"
              >
                <option value="">All metrics</option>
                {uniqueMetrics.map(m => <option key={m} value={m}>{m}</option>)}
              </select>

              {/* Status filter */}
              <select
                value={filter.status}
                onChange={e => setFilter(f => ({ ...f, status: e.target.value as Filter['status'] }))}
                className="input !py-1.5 !text-xs w-28"
              >
                <option value="all">All status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              {/* Clear filters */}
              {(filter.zone || filter.metric || filter.status !== 'all') && (
                <button
                  onClick={() => { setFilter({ zone: '', metric: '', status: 'all' }); setSelectedZone(null); }}
                  className="btn-ghost !text-xs text-gray-400"
                >
                  Clear
                </button>
              )}

              {/* Reload */}
              <button
                onClick={() => void reload()}
                className="btn-ghost p-1.5"
                title="Refresh"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              </button>

              {/* Create button — admin only */}
              {isAdmin && (
                <button onClick={openCreate} className="btn-primary">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  New rule
                </button>
              )}
            </div>
          </div>

          {/* Error / loading / table */}
          {loading && (
            <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Loading thresholds…
            </div>
          )}

          {!loading && fetchError && (
            <div className="px-4 py-4 text-sm text-red-600 bg-red-50 border-t border-red-100">
              {fetchError}
              <button onClick={() => void reload()} className="ml-2 underline">Retry</button>
            </div>
          )}

          {!loading && !fetchError && (
            <ThresholdTable
              thresholds={visible}
              isAdmin={isAdmin}
              onEdit={openEdit}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          )}
        </div>
      </main>

      {/* Form modal */}
      {showForm && (
        <ThresholdFormModal
          initial={editTarget}
          onSave={handleSave}
          onClose={closeForm}
        />
      )}
    </div>
  );
}
