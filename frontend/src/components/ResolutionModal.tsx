import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ShieldCheck, Check, AlertCircle } from 'lucide-react';
import { Vulnerability, VulnerabilityStatus } from '../types';
import { updateVulnerabilityStatus } from '../services/api';

interface ResolutionModalProps {
  vulnerability: Vulnerability;
  onClose: () => void;
  onSuccess: () => void;
}

export const ResolutionModal: React.FC<ResolutionModalProps> = ({ vulnerability, onClose, onSuccess }) => {
  const [status, setStatus] = useState<VulnerabilityStatus>(vulnerability.status);
  const [resolution, setResolution] = useState<string>(vulnerability.resolution || 'Fixed');
  const [note, setNote] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await updateVulnerabilityStatus(vulnerability.id, status, status === 'RESOLVED' ? resolution : undefined, note);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update vulnerability status');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md max-h-[90vh] rounded-xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck size={20} className="text-indigo-400 shrink-0" />
            <h3 className="font-semibold text-slate-100 text-sm truncate">Update Vulnerability Status</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1.5 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">Vulnerability State</label>
            <div className="grid grid-cols-3 gap-2">
              {(['OPEN', 'IN PROGRESS', 'RESOLVED'] as VulnerabilityStatus[]).map((st) => (
                <button
                  type="button"
                  key={st}
                  onClick={() => setStatus(st)}
                  className={`py-2.5 px-2 rounded-lg text-xs font-medium border transition-all min-h-[44px] ${
                    status === st
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {status === 'RESOLVED' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Resolution Classification</label>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 min-h-[44px]"
              >
                <option value="Fixed">Fixed (Remediated)</option>
                <option value="False Positive">False Positive</option>
                <option value="Ignored">Ignored / Risk Accepted</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Resolution Note / Audit Comment</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., Replaced raw dynamic SQL query with parameterized query statement."
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 placeholder:text-slate-600 resize-none"
            />
          </div>

          <div className="pt-3 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 min-h-[44px]"
            >
              {loading ? 'Saving...' : (
                <>
                  <Check size={14} />
                  <span>Update Status</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
