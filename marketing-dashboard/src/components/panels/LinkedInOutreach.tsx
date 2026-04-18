import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useCollection } from '../../hooks/useCollection.ts';
import { addProspect, updateProspect, deleteProspect } from '../../services/linkedinService.ts';
import { DataEntryModal } from '../ui/DataEntryModal.tsx';
import { Card } from '../ui/Card.tsx';
import { StatusBadge } from '../ui/StatusBadge.tsx';
import { DashboardGrid } from '../layout/DashboardGrid.tsx';
import { today } from '../../lib/dateUtils.ts';
import {
  LINKEDIN_EXAMS, LINKEDIN_STATUSES, STATUS_LABELS, STATUS_VARIANT,
  type LinkedInProspect,
} from '../../types/linkedin.ts';

type ProspectExam = LinkedInProspect['exam'];
type ProspectStatus = LinkedInProspect['status'];

const DAILY_LIMIT = 15;

export function LinkedInOutreach() {
  const { data: prospects } = useCollection<LinkedInProspect>('marketing_linkedin_outreach');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<Omit<LinkedInProspect, 'id'>>({
    name: '',
    linkedinUrl: '',
    exam: 'PMP',
    status: 'identified',
    notes: '',
    dateAdded: today(),
  });

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    await addProspect({ ...form, dateAdded: new Date().toISOString() });
    setModalOpen(false);
    setForm({ name: '', linkedinUrl: '', exam: 'PMP', status: 'identified', notes: '', dateAdded: today() });
  };

  // Stats
  const total = prospects.length;
  const connected = prospects.filter((p) => ['connected', 'messaged', 'responded', 'signed_up'].includes(p.status)).length;
  const responded = prospects.filter((p) => ['responded', 'signed_up'].includes(p.status)).length;
  const signedUp = prospects.filter((p) => p.status === 'signed_up').length;
  const connectionRate = total > 0 ? ((connected / total) * 100).toFixed(0) : '0';
  const responseRate = total > 0 ? ((responded / total) * 100).toFixed(0) : '0';
  const signupRate = total > 0 ? ((signedUp / total) * 100).toFixed(0) : '0';

  // Daily message count
  const todayStr = today();
  const messagedToday = prospects.filter(
    (p) => p.status === 'messaged' && p.dateAdded.slice(0, 10) === todayStr
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display font-bold">LinkedIn Outreach Tracker</h2>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Prospect
        </button>
      </div>

      <DashboardGrid columns={3}>
        <Card>
          <h3 className="font-display font-semibold mb-3 text-sm">Pipeline Stats</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Total Prospects</span>
              <span className="text-slate-200 font-medium">{total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Connection Rate</span>
              <StatusBadge variant={Number(connectionRate) >= 30 ? 'green' : 'amber'}>{connectionRate}%</StatusBadge>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Response Rate</span>
              <StatusBadge variant={Number(responseRate) >= 20 ? 'green' : 'amber'}>{responseRate}%</StatusBadge>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Signup Rate</span>
              <StatusBadge variant={Number(signupRate) >= 10 ? 'green' : 'gray'}>{signupRate}%</StatusBadge>
            </div>
          </div>
        </Card>
        <Card>
          <h3 className="font-display font-semibold mb-3 text-sm">By Status</h3>
          <div className="space-y-2 text-sm">
            {LINKEDIN_STATUSES.map((s) => {
              const count = prospects.filter((p) => p.status === s).length;
              return (
                <div key={s} className="flex items-center justify-between">
                  <StatusBadge variant={STATUS_VARIANT[s]}>{STATUS_LABELS[s]}</StatusBadge>
                  <span className="text-slate-200 font-medium">{count}</span>
                </div>
              );
            })}
          </div>
        </Card>
        <Card>
          <h3 className="font-display font-semibold mb-3 text-sm">Daily Limit</h3>
          <div className="flex flex-col items-center justify-center h-24">
            <span className={`text-3xl font-bold ${messagedToday >= DAILY_LIMIT ? 'text-red-400' : 'text-brand-300'}`}>
              {messagedToday} / {DAILY_LIMIT}
            </span>
            <span className="text-xs text-slate-400 mt-1">Messages sent today</span>
            {messagedToday >= DAILY_LIMIT && (
              <StatusBadge variant="red">Limit reached</StatusBadge>
            )}
          </div>
        </Card>
      </DashboardGrid>

      {/* Prospect list */}
      <Card>
        <h3 className="font-display font-semibold mb-3">Prospects</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-700">
                <th className="pb-2 pr-4">Name</th>
                <th className="pb-2 pr-4">Exam</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2 pr-4">Notes</th>
                <th className="pb-2 pr-4">Date</th>
                <th className="pb-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {prospects.map((p) => (
                <tr key={p.id} className="border-b border-slate-700/50">
                  <td className="py-2 pr-4">
                    {p.linkedinUrl ? (
                      <a
                        href={p.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-400 hover:underline"
                      >
                        {p.name}
                      </a>
                    ) : (
                      <span className="text-slate-200">{p.name}</span>
                    )}
                  </td>
                  <td className="py-2 pr-4 text-slate-300">{p.exam}</td>
                  <td className="py-2 pr-4">
                    <select
                      value={p.status}
                      onChange={(e) => updateProspect(p.id, { status: e.target.value as ProspectStatus })}
                      className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs"
                    >
                      {LINKEDIN_STATUSES.map((s) => (
                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 pr-4 text-slate-400 truncate max-w-xs">{p.notes || '—'}</td>
                  <td className="py-2 pr-4 text-slate-500 text-xs whitespace-nowrap">
                    {p.dateAdded.slice(0, 10)}
                  </td>
                  <td className="py-2">
                    <button onClick={() => deleteProspect(p.id)} className="p-1 text-slate-500 hover:text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {prospects.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-slate-500">No prospects yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <DataEntryModal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Prospect">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm"
              placeholder="Prospect name"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">LinkedIn URL</label>
            <input
              type="url"
              value={form.linkedinUrl}
              onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm"
              placeholder="https://linkedin.com/in/..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Exam</label>
              <select
                value={form.exam}
                onChange={(e) => setForm({ ...form, exam: e.target.value as ProspectExam })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm"
              >
                {LINKEDIN_EXAMS.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as ProspectStatus })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm"
              >
                {LINKEDIN_STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm"
              rows={2}
            />
          </div>
          <button
            onClick={handleAdd}
            className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 rounded-lg font-medium transition-colors"
          >
            Add Prospect
          </button>
        </div>
      </DataEntryModal>
    </div>
  );
}
