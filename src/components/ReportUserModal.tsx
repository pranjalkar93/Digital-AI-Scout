import React, { useState } from 'react';
import { X, Flag, AlertTriangle, Check, ShieldAlert } from 'lucide-react';
import { logAuditTransaction } from '../lib/auditLogger';

interface ReportUserModalProps {
  targetUserId: string;
  targetUserName: string;
  currentUserId: string;
  currentUserName: string;
  currentUserRole: string;
  onClose: () => void;
}

const REPORT_REASONS = [
  'Inappropriate or offensive content in posts/bio',
  'Fake profile or impersonation of another player',
  'Fraudulent or falsified football statistics/CRS ID',
  'Spam, harassment, or abusive comments',
  'Underage account without guardian authorization',
  'Other safety or community guideline violation'
];

export const ReportUserModal: React.FC<ReportUserModalProps> = ({
  targetUserId,
  targetUserName,
  currentUserId,
  currentUserName,
  currentUserRole,
  onClose
}) => {
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch(`/api/v1/users/${targetUserId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUserId
        },
        body: JSON.stringify({
          reason,
          description
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit report.');
      }

      // Log Audit Transaction
      await logAuditTransaction(
        currentUserId,
        currentUserName,
        currentUserRole,
        'USER_PROFILE_REPORT',
        `Reported profile of ${targetUserName} (${targetUserId}): ${reason}`,
        { targetUserId, reason, description }
      );

      setSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'Error submitting report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            <h2 className="text-base font-black text-white">Report Profile</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white">Report Submitted</h3>
            <p className="text-xs text-slate-400">
              Thank you for keeping Digital Scout India safe. Our trust & safety team will review this report within 24 hours.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-red-300 font-medium">
                You are reporting <strong className="text-white">{targetUserName}</strong>. Reports are handled confidentially by Digital Scout India moderators.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-500/20 text-red-400 rounded-xl text-xs font-semibold">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Reason for Report</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-red-500"
              >
                {REPORT_REASONS.map((r, i) => (
                  <option key={i} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Additional Details (Optional)</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide links or specific descriptions of the violation..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 resize-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-red-500/20 disabled:opacity-50"
              >
                <Flag className="w-3.5 h-3.5" />
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
