import { useEffect, useState } from 'react';
import type { Condition, Severity, Threshold, ThresholdCreate } from '../types';
import { CONDITIONS, KNOWN_METRICS, KNOWN_ZONES, SEVERITIES } from '../types';

interface Props {
  initial?: Threshold | null;
  onSave: (data: ThresholdCreate) => Promise<void>;
  onClose: () => void;
}

const EMPTY: ThresholdCreate = {
  zone:            '',
  metric:          '',
  condition:       'gt',
  threshold_value: 0,
  severity:        'medium',
  is_active:       true,
};

export default function ThresholdFormModal({ initial, onSave, onClose }: Props) {
  const isEdit = !!initial;

  const [form,    setForm]    = useState<ThresholdCreate>(EMPTY);
  const [error,   setError]   = useState<string | null>(null);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    if (initial) {
      setForm({
        zone:            initial.zone,
        metric:          initial.metric,
        condition:       initial.condition,
        threshold_value: initial.threshold_value,
        severity:        initial.severity,
        is_active:       initial.is_active,
      });
    } else {
      setForm(EMPTY);
    }
  }, [initial]);

  function set<K extends keyof ThresholdCreate>(key: K, value: ThresholdCreate[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.zone.trim() || !form.metric.trim()) {
      setError('Zone and metric are required.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Save failed. Check your input.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit Threshold' : 'New Threshold'}
          </h2>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form id="threshold-form" onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-5 flex-1">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Zone */}
          <div>
            <label className="label" htmlFor="zone">Zone</label>
            <select
              id="zone"
              className="input"
              value={form.zone}
              onChange={e => set('zone', e.target.value)}
              required
            >
              <option value="">Select zone…</option>
              {KNOWN_ZONES.map(z => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
          </div>

          {/* Metric */}
          <div>
            <label className="label" htmlFor="metric">Metric</label>
            <select
              id="metric"
              className="input"
              value={form.metric}
              onChange={e => set('metric', e.target.value)}
              required
            >
              <option value="">Select metric…</option>
              {KNOWN_METRICS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Condition + Value */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="condition">Condition</label>
              <select
                id="condition"
                className="input"
                value={form.condition}
                onChange={e => set('condition', e.target.value as Condition)}
                required
              >
                {CONDITIONS.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label" htmlFor="threshold_value">Threshold Value</label>
              <input
                id="threshold_value"
                type="number"
                step="any"
                className="input"
                value={form.threshold_value}
                onChange={e => set('threshold_value', parseFloat(e.target.value))}
                required
              />
            </div>
          </div>

          {/* Severity */}
          <div>
            <label className="label">Severity</label>
            <div className="flex gap-2 flex-wrap">
              {SEVERITIES.map(s => {
                const ACTIVE_STYLES: Record<Severity, string> = {
                  low:      'bg-green-600  border-green-600  text-white',
                  medium:   'bg-yellow-500 border-yellow-500 text-white',
                  high:     'bg-orange-500 border-orange-500 text-white',
                  critical: 'bg-red-600    border-red-600    text-white',
                };
                const selected = form.severity === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set('severity', s as Severity)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors capitalize
                      ${selected ? ACTIVE_STYLES[s] : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={form.is_active}
              onClick={() => set('is_active', !form.is_active)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent
                transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                ${form.is_active ? 'bg-blue-600' : 'bg-gray-300'}`}
            >
              <span
                className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200
                  ${form.is_active ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
            <span className="text-sm font-medium text-gray-700">
              {form.is_active ? 'Active (evaluator will check this rule)' : 'Inactive (rule is paused)'}
            </span>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            type="submit"
            form="threshold-form"
            disabled={saving}
            className="btn-primary"
          >
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create threshold'}
          </button>
        </div>
      </div>
    </div>
  );
}
