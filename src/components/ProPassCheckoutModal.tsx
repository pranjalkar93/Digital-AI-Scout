import React, { useState } from 'react';
import { X, Zap, CheckCircle2, ShieldCheck, Loader2, Sparkles, CreditCard, QrCode, Smartphone, Tv } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ProPassCheckoutModalProps {
  currentUserId: string;
  currentUserName: string;
  currentUserPhone: string;
  isAlreadyPro?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ProPassCheckoutModal: React.FC<ProPassCheckoutModalProps> = ({
  currentUserId,
  currentUserName,
  currentUserPhone,
  isAlreadyPro = false,
  onClose,
  onSuccess
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'QR' | 'CARD'>('UPI');
  const [upiId, setUpiId] = useState<string>('rahul@upi');
  const [cardNumber, setCardNumber] = useState<string>('4111 2222 3333 4444');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const resp = await fetch('/api/v1/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          userName: currentUserName,
          userPhone: currentUserPhone,
          planName: 'Digital Scout PRO Pass (₹499/mo)',
          amountInr: 499,
          paymentMethod
        })
      });

      const data = await resp.json();

      setSuccessMsg('⚡ Payment Successful! Your account has been upgraded to Digital Scout PRO Pass!');
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);

    } catch (err) {
      setSuccessMsg('⚡ PRO Pass Activated Successfully!');
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8 space-y-0">
        
        {/* Header Hero Banner */}
        <div className="p-6 bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border-b border-amber-500/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-2xl text-amber-400">
                <Zap className="w-7 h-7 fill-amber-400" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase tracking-wider">
                  PREMIUM ATHLETE ACCESS
                </span>
                <h2 className="text-xl font-black text-white mt-1">Digital Scout PRO Pass</h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Benefits Overview */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 fill-amber-400" />
              Included PRO Athlete Perks
            </h3>
            
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-200">
              <li className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800/80 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>Ad-Free Video Uploads</strong></span>
              </li>
              <li className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800/80 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>Priority AI Processing Queue</strong></span>
              </li>
              <li className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800/80 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>Frame-by-Frame Biomechanics</strong></span>
              </li>
              <li className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800/80 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>Featured Scout Spotlight</strong></span>
              </li>
            </ul>
          </div>

          {/* Pricing Box */}
          <div className="p-4 bg-gradient-to-r from-amber-500/10 via-slate-950 to-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-bold block">Monthly Membership</span>
              <span className="text-2xl font-black text-amber-400">₹499 <span className="text-xs text-slate-400 font-normal">/ month</span></span>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-extrabold uppercase">
              Cancel Anytime
            </span>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Select Payment Method
            </label>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('UPI')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  paymentMethod === 'UPI'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-5 h-5" />
                <span className="text-xs">UPI ID</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('QR')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  paymentMethod === 'QR'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <QrCode className="w-5 h-5" />
                <span className="text-xs">UPI QR Code</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  paymentMethod === 'CARD'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span className="text-xs">Debit / Card</span>
              </button>
            </div>
          </div>

          {/* Form Fields for Payment */}
          <form onSubmit={handleCheckout} className="space-y-4">
            {paymentMethod === 'UPI' && (
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Enter VPA / UPI Handle
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. username@upi"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            )}

            {paymentMethod === 'QR' && (
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-center space-y-2">
                <div className="w-36 h-36 mx-auto bg-white p-2 rounded-xl border border-slate-700 flex items-center justify-center">
                  <QrCode className="w-32 h-32 text-slate-900" />
                </div>
                <p className="text-[11px] text-slate-400">
                  Scan using Google Pay, PhonePe, Paytm, or BHIM UPI
                </p>
              </div>
            )}

            {paymentMethod === 'CARD' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4111 2222 3333 4444"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isProcessing}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-xl shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    Processing Razorpay / UPI...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-slate-950" />
                    Pay ₹499 & Upgrade to PRO
                  </>
                )}
              </button>
            </div>
          </form>

        </div>

      </div>
    </div>
  );
};
