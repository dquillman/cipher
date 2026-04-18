import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useMarketingData } from '../../hooks/useMarketingData.ts';
import { addUser, deleteUser } from '../../services/usersService.ts';
import { DataEntryModal } from '../ui/DataEntryModal.tsx';
import { Card } from '../ui/Card.tsx';
import { ProgressBar } from '../ui/ProgressBar.tsx';
import { StatusBadge } from '../ui/StatusBadge.tsx';
import { DashboardGrid } from '../layout/DashboardGrid.tsx';
import { ProgressDonut } from '../charts/ProgressDonut.tsx';
import { EXAM_TARGETS, SOURCE_LABELS, type First100User } from '../../types/users.ts';
import { today } from '../../lib/dateUtils.ts';

type UserSource = First100User['source'];
type UserExam = First100User['exam'];

export function First100Users() {
  const { users, metrics } = useMarketingData();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<Omit<First100User, 'id'>>({
    source: 'reddit',
    exam: 'PMP',
    activated: false,
    notes: '',
    addedAt: today(),
  });

  const handleAdd = async () => {
    await addUser({ ...form, addedAt: new Date().toISOString() });
    setModalOpen(false);
    setForm({ source: 'reddit', exam: 'PMP', activated: false, notes: '', addedAt: today() });
  };

  // Per-exam breakdown
  const exams = (Object.keys(EXAM_TARGETS) as UserExam[]);
  const examCounts = exams.map((e) => ({
    exam: e,
    count: users.filter((u) => u.exam === e).length,
    target: EXAM_TARGETS[e],
    activated: users.filter((u) => u.exam === e && u.activated).length,
  }));

  // Per-source breakdown
  const sources = (Object.keys(SOURCE_LABELS) as UserSource[]);
  const sourceCounts = sources.map((s) => ({
    source: s,
    label: SOURCE_LABELS[s],
    count: users.filter((u) => u.source === s).length,
    activated: users.filter((u) => u.source === s && u.activated).length,
  })).filter((s) => s.count > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display font-bold">First 100 Users Tracker</h2>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      <DashboardGrid columns={3}>
        <Card className="flex items-center justify-center">
          <ProgressDonut value={metrics.first100Count} max={100} label="Total Users" />
        </Card>
        <Card>
          <h3 className="font-display font-semibold mb-3 text-sm">By Exam</h3>
          <div className="space-y-3">
            {examCounts.map((e) => (
              <div key={e.exam}>
                <ProgressBar value={e.count} max={e.target} label={e.exam} color="bg-brand-500" />
                <p className="text-xs text-slate-500 mt-0.5">{e.activated} activated ({e.count > 0 ? ((e.activated/e.count)*100).toFixed(0) : 0}%)</p>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h3 className="font-display font-semibold mb-3 text-sm">By Source</h3>
          <div className="space-y-3">
            {sourceCounts.map((s) => (
              <div key={s.source} className="flex items-center justify-between text-sm">
                <span className="text-slate-300">{s.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-200 font-medium">{s.count}</span>
                  <StatusBadge variant={s.activated / Math.max(s.count, 1) >= 0.3 ? 'green' : 'amber'}>
                    {((s.activated / Math.max(s.count, 1)) * 100).toFixed(0)}% act.
                  </StatusBadge>
                </div>
              </div>
            ))}
            {sourceCounts.length === 0 && <p className="text-sm text-slate-500">No users yet</p>}
          </div>
        </Card>
      </DashboardGrid>

      {/* User list */}
      <Card>
        <h3 className="font-display font-semibold mb-3">Recent Users</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-700">
                <th className="pb-2 pr-4">Source</th>
                <th className="pb-2 pr-4">Exam</th>
                <th className="pb-2 pr-4">Activated</th>
                <th className="pb-2 pr-4">Notes</th>
                <th className="pb-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {users.slice(0, 20).map((u) => (
                <tr key={u.id} className="border-b border-slate-700/50">
                  <td className="py-2 pr-4 text-slate-300">{SOURCE_LABELS[u.source]}</td>
                  <td className="py-2 pr-4">{u.exam}</td>
                  <td className="py-2 pr-4">
                    <StatusBadge variant={u.activated ? 'green' : 'gray'}>
                      {u.activated ? 'Yes' : 'No'}
                    </StatusBadge>
                  </td>
                  <td className="py-2 pr-4 text-slate-400 truncate max-w-xs">{u.notes || '—'}</td>
                  <td className="py-2">
                    <button onClick={() => deleteUser(u.id)} className="p-1 text-slate-500 hover:text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <DataEntryModal open={modalOpen} onClose={() => setModalOpen(false)} title="Add User">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Source</label>
            <select
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value as UserSource })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm"
            >
              {(Object.keys(SOURCE_LABELS) as UserSource[]).map((s) => (
                <option key={s} value={s}>{SOURCE_LABELS[s]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Exam</label>
            <select
              value={form.exam}
              onChange={(e) => setForm({ ...form, exam: e.target.value as UserExam })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm"
            >
              {exams.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.activated}
              onChange={(e) => setForm({ ...form, activated: e.target.checked })}
              className="rounded"
            />
            <span className="text-slate-300">Activated (answered 10 questions)</span>
          </label>
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
            Add User
          </button>
        </div>
      </DataEntryModal>
    </div>
  );
}
