import React, { useState } from 'react';
import { PlayerProfile, MessageRequest, GuardianConsent } from '../types';
import { ShieldCheck, Smartphone, CheckCircle, MessageSquare, AlertCircle, Lock, RefreshCw, Sparkles, Send } from 'lucide-react';

interface ParentPortalProps {
  player: PlayerProfile;
  messages: MessageRequest[];
  consent: GuardianConsent;
  onApproveMessage: (msgId: string) => void;
  onDeclineMessage: (msgId: string) => void;
  onVerifyParentOtp: (phone: string, code: string) => Promise<boolean>;
}

export const ParentPortal: React.FC<ParentPortalProps> = ({
  player,
  messages,
  consent,
  onApproveMessage,
  onDeclineMessage,
  onVerifyParentOtp
}) => {
  const [parentPhone, setParentPhone] = useState(player.guardianPhone || '+91 94470 11982');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [simulatedReceivedCode, setSimulatedReceivedCode] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccessMsg, setOtpSuccessMsg] = useState('');

  const handleSendWhatsAppOtp = async () => {
    setOtpLoading(true);
    setOtpError('');
    try {
      const resp = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: parentPhone, purpose: 'Under-18 Parental Consent Verification' })
      });
      const data = await resp.json();
      if (data.success) {
        setOtpSent(true);
        setSimulatedReceivedCode(data.simulatedCode);
        setOtpSuccessMsg(`WhatsApp OTP message dispatched to ${parentPhone}`);
      }
    } catch (err) {
      setOtpError('Failed to send WhatsApp OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpLoading(true);
    setOtpError('');
    try {
      const success = await onVerifyParentOtp(parentPhone, otpCode);
      if (success) {
        setOtpSuccessMsg('Parental consent successfully signed and verified!');
      } else {
        setOtpError('Invalid OTP code. Enter 123456 or the code shown.');
      }
    } catch (err) {
      setOtpError('Error verifying OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Guardian Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950 p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-extrabold text-white">Parent / Guardian Safety Center</h2>
          </div>
          <p className="text-xs text-slate-400">
            Digital Scout India enforces strict under-18 parental consent, WhatsApp OTP verification, and a zero open-DM policy.
          </p>
        </div>

        <div className="bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl text-xs flex items-center gap-2">
          <span className="text-slate-400">Child:</span>
          <span className="font-bold text-white">{player.name} (U{player.age})</span>
        </div>
      </div>

      {/* WhatsApp OTP Verification Box */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                WhatsApp Parental Consent Status
                {consent.consentGiven ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                    Verified Active
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-500/40">
                    Pending Verification
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                Guardian Phone: <span className="text-slate-200 font-semibold">{parentPhone}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Verification Form */}
        {!consent.consentGiven ? (
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                type="text"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                placeholder="+91 98000 00000"
                className="bg-slate-900 border border-slate-700 text-white p-2.5 rounded-xl font-mono text-xs focus:border-emerald-500 focus:outline-none flex-1"
              />
              <button
                onClick={handleSendWhatsAppOtp}
                disabled={otpLoading}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Send WhatsApp OTP
              </button>
            </div>

            {otpSent && (
              <form onSubmit={handleVerifyOtp} className="space-y-3 pt-2 border-t border-slate-800">
                {simulatedReceivedCode && (
                  <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-mono text-[11px] flex items-center justify-between">
                    <span>Simulated WhatsApp Received Message:</span>
                    <strong className="text-white bg-slate-900 px-2 py-0.5 rounded">
                      OTP: {simulatedReceivedCode}
                    </strong>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Enter 6-digit OTP (e.g. 123456)"
                    className="bg-slate-900 border border-slate-700 text-white p-2.5 rounded-xl font-mono text-xs focus:border-emerald-500 focus:outline-none flex-1"
                    maxLength={6}
                  />
                  <button
                    type="submit"
                    disabled={otpLoading}
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl cursor-pointer"
                  >
                    Verify & Sign Consent
                  </button>
                </div>
              </form>
            )}

            {otpError && <p className="text-red-400 text-xs font-semibold">{otpError}</p>}
            {otpSuccessMsg && <p className="text-emerald-400 text-xs font-semibold">{otpSuccessMsg}</p>}
          </div>
        ) : (
          <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-xs text-emerald-200 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white">Parental Consent Signed & Active</p>
              <p className="text-slate-300 mt-0.5">
                Guardian <strong className="text-emerald-300">{consent.guardianName}</strong> verified phone {consent.guardianPhone}. All official scout invitations will be delivered directly to parent review first.
              </p>
            </div>
          </div>
        )}

        {/* Auditable Consent Log Trail */}
        <div className="space-y-2 pt-2">
          <h4 className="text-xs font-bold text-slate-300">Auditable Consent Log Trail:</h4>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-400 space-y-1">
            {consent.auditTrail?.map((log, idx) => (
              <p key={idx}>{log}</p>
            ))}
          </div>
        </div>

      </div>

      {/* Monitored Scout Contact Requests Queue */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-emerald-400" />
          Monitored Scout Communication Requests ({messages.length})
        </h3>
        <p className="text-xs text-slate-400">
          Clubs cannot contact under-18 players directly. Every invitation requires explicit parent approval.
        </p>

        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 bg-slate-950 rounded-xl border border-slate-800">
              No scout contact requests pending at this time.
            </div>
          ) : (
            messages.map(msg => (
              <div
                key={msg.id}
                className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm">{msg.subject}</h4>
                    <p className="text-xs text-slate-400">
                      From: <strong className="text-emerald-400">{msg.scoutName}</strong> ({msg.clubName}) • {msg.timestamp}
                    </p>
                  </div>

                  <span className={`px-2.5 py-1 rounded text-[10px] font-bold border ${
                    msg.status === 'APPROVED' ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40' :
                    msg.status === 'DECLINED' ? 'bg-red-950 text-red-400 border-red-500/40' :
                    'bg-amber-950 text-amber-400 border-amber-500/40'
                  }`}>
                    {msg.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <p className="text-xs text-slate-200 bg-slate-900 p-3 rounded-lg border border-slate-800">
                  "{msg.message}"
                </p>

                {msg.status === 'PENDING_GUARDIAN_APPROVAL' && (
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      onClick={() => onDeclineMessage(msg.id)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-lg"
                    >
                      Decline Request
                    </button>
                    <button
                      onClick={() => onApproveMessage(msg.id)}
                      className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Approve & Grant Communication Access
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

      </div>

    </div>
  );
};
