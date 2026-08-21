import React, { useState, useEffect } from 'react';
import { Role } from '../types';
import { Trophy, ArrowRight, CheckCircle2, Sparkles, X, ShieldCheck, UserCheck, RefreshCw, AlertCircle } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { logAuditTransaction } from '../lib/auditLogger';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (
    role: Role,
    phoneOrEmail: string,
    userDetails?: any
  ) => void;
  onStartQualification?: () => void;
  intendedActionNotice?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onStartQualification,
  intendedActionNotice
}) => {
  const [step, setStep] = useState<'PHONE' | 'OTP' | 'PROFILE' | 'WELCOME'>('PHONE');
  
  // Registration Form State
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('2006-08-15');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [city, setCity] = useState('Kochi');
  const [state, setState] = useState('Kerala');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Resend Timer & Failed Attempt Counter (US-003, US-020)
  const [resendCountdown, setResendCountdown] = useState<number>(30);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'OTP' && resendCountdown > 0) {
      timer = setInterval(() => setResendCountdown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, resendCountdown]);

  if (!isOpen) return null;

  // Helper to query Firestore /users collection for an existing phone match
  const findUserByPhone = async (inputPhone: string) => {
    try {
      const cleanInput = inputPhone.replace(/\D/g, '');
      const last10 = cleanInput.slice(-10);
      if (!last10) return null;

      const usersSnap = await getDocs(collection(db, 'users'));
      let foundUser: any = null;

      usersSnap.forEach((docSnap) => {
        const uData = docSnap.data();
        if (uData && uData.phone) {
          const docPhoneDigits = String(uData.phone).replace(/\D/g, '');
          if (docPhoneDigits.endsWith(last10) || last10.endsWith(docPhoneDigits)) {
            foundUser = uData;
          }
        }
      });

      return foundUser;
    } catch (err) {
      console.warn("User lookup by phone note:", err);
      return null;
    }
  };

  // Step 1: Send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!phone.trim()) return;
    setIsLoading(true);
    setErrorMsg('');
    setResendCountdown(30);

    try {
      const response = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, purpose: 'Registration' })
      });
      if (!response.ok) throw new Error('OTP request failed');
      setIsLoading(false);
      setStep('OTP');
    } catch (err) {
      setIsLoading(false);
      setErrorMsg('Unable to send the OTP. Please try again.');
    }
  };

  // Step 2: Verify OTP & Restore User Context from Firestore if Existing User
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const resp = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: otpCode })
      });
      const data = await resp.json();

      if (resp.ok && data.verified) {
        // Query Firestore /users collection to check if user already registered
        const existingUser = await findUserByPhone(phone || '+91 98765 43210');
        setIsLoading(false);

        if (existingUser) {
          console.log("[AuthModal] User found in Firestore, restoring context:", existingUser);

          // Audit Log user login
          await logAuditTransaction(
            existingUser.id,
            existingUser.displayName || 'Registered User',
            existingUser.role || 'USER',
            'USER_LOGIN',
            `User logged back in via WhatsApp mobile OTP verification (+91 ${phone})`,
            { phone, role: existingUser.role, qualificationStatus: existingUser.qualificationStatus }
          );

          // Restore exact user context without forcing re-registration
          onLoginSuccess(existingUser.role || 'USER', existingUser.phone || phone, existingUser);
          onClose();
          return;
        }

        // If new user, move to profile setup
        setStep('PROFILE');
      } else {
        setIsLoading(false);
        setErrorMsg(data.error || 'Invalid OTP code. Try 123456.');
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMsg('Unable to verify the OTP. Please try again.');
    }
  };

  // Step 3: Complete Profile & Register Account (FORCED 'USER' ROLE)
  const handleRegisterProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) return;
    setIsLoading(true);

    const calculatedName = `${firstName} ${lastName || ''}`.trim();

    try {
      const resp = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone || '+91 98765 43210',
          firstName,
          lastName,
          dob,
          gender,
          city,
          state
        })
      });
      const data = await resp.json();
      setIsLoading(false);

      const finalDisplayName = data.user?.displayName || calculatedName;
      const userId = data.user?.id || `usr-${Date.now()}`;

      // Persist directly into Firestore /users collection
      try {
        await setDoc(doc(db, 'users', userId), {
          id: userId,
          phone: phone || '+91 98765 43210',
          role: 'USER',
          status: 'ACTIVE',
          displayName: finalDisplayName,
          firstName,
          lastName: lastName || '',
          dob,
          gender: gender || 'Male',
          city: city || 'Kochi',
          state: state || 'Kerala',
          country: 'India',
          profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
          qualificationStatus: 'NOT_STARTED',
          createdAt: new Date().toISOString()
        });
        console.log(`[Firebase Firestore] User ${userId} saved to /users collection!`);

        // Audit Log registration
        await logAuditTransaction(
          userId,
          finalDisplayName,
          'USER',
          'USER_REGISTER',
          `New user registered with mobile ${phone || '+91 98765 43210'} in ${city || 'Kochi'}, ${state || 'Kerala'}`,
          { phone, city, state, dob }
        );
      } catch (fErr) {
        console.warn("Firestore client write note:", fErr);
      }

      onLoginSuccess('USER', phone || '+91 98765 43210', {
        firstName,
        lastName,
        displayName: finalDisplayName
      });

      setStep('WELCOME');
    } catch (err) {
      setIsLoading(false);
      onLoginSuccess('USER', phone || '+91 98765 43210', {
        firstName,
        lastName,
        displayName: calculatedName
      });
      setStep('WELCOME');
    }
  };

  // Final Action: Enter as Normal User
  const handleEnterPlatform = () => {
    onLoginSuccess('USER', phone || '+91 98765 43210', {
      firstName,
      lastName,
      displayName: `${firstName} ${lastName || ''}`.trim()
    });
    onClose();
  };

  // Final Action: Start Player Qualification Assessment
  const handleStartPlayerUpgrade = () => {
    onLoginSuccess('USER', phone || '+91 98765 43210', {
      firstName,
      lastName,
      displayName: `${firstName} ${lastName || ''}`.trim()
    });
    onClose();
    if (onStartQualification) {
      onStartQualification();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 my-8 space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/30">
            <Trophy className="w-6 h-6 text-slate-950 font-bold" />
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">DIGITAL SCOUT INDIA</h2>
          <p className="text-xs text-slate-400">
            {step === 'PHONE' && 'Enter mobile number for WhatsApp verification'}
            {step === 'OTP' && 'Enter 6-digit WhatsApp OTP code'}
            {step === 'PROFILE' && 'Welcome to Digital Scout! Complete your basic profile'}
            {step === 'WELCOME' && 'Your Digital Scout account is created'}
          </p>

          {intendedActionNotice && (
            <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold flex items-center justify-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>{intendedActionNotice}</span>
            </div>
          )}
        </div>

        {/* STEP 1: PHONE INPUT */}
        {step === 'PHONE' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Mobile Number / WhatsApp</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-xs font-bold text-slate-400">+91</span>
                <input
                  type="tel"
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white pl-12 pr-4 py-3 rounded-xl text-xs font-semibold focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <span>{isLoading ? 'Sending OTP...' : 'Continue with Mobile OTP'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="relative flex items-center justify-center py-1">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-slate-900 px-3 text-[10px] text-slate-500 font-bold uppercase tracking-wider">Or</span>
            </div>

            <button
              type="button"
              onClick={() => setStep('PROFILE')}
              className="w-full py-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>Continue with Google</span>
            </button>
          </form>
        )}

        {/* STEP 2: OTP VERIFICATION */}
        {step === 'OTP' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs font-bold">
                <label className="text-slate-300">Enter WhatsApp OTP</label>
                <span className="text-slate-400 text-[10px]">+91 {phone || '98765 43210'}</span>
              </div>
              <input
                type="text"
                placeholder="6-digit code (Use 123456 for test)"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white px-4 py-3 rounded-xl text-xs font-mono font-bold tracking-widest text-center focus:border-emerald-500 focus:outline-none"
                required
              />
              {errorMsg && <p className="text-[11px] text-red-400 font-semibold mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errorMsg}</p>}
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Didn't receive code?</span>
              <button
                type="button"
                onClick={() => handleSendOtp()}
                disabled={resendCountdown > 0 || isLoading}
                className="text-emerald-400 font-bold hover:underline disabled:opacity-40 disabled:no-underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>{resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend WhatsApp OTP'}</span>
              </button>
            </div>

            <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-[11px] text-emerald-300">
              💡 <strong>Developer Note:</strong> Enter <strong>123456</strong> for instant testing verification.
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              Verify OTP & Continue
            </button>
          </form>
        )}

        {/* STEP 3: PROFILE ONBOARDING (BASIC USER REGISTRATION) */}
        {step === 'PROFILE' && (
          <form onSubmit={handleRegisterProfile} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">First Name</label>
                <input
                  type="text"
                  placeholder="Rahul"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white p-2.5 rounded-xl text-xs"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Last Name</label>
                <input
                  type="text"
                  placeholder="Kumar"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white p-2.5 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Date of Birth</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white p-2.5 rounded-xl text-xs"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 text-white p-2.5 rounded-xl text-xs"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">City</label>
                <input
                  type="text"
                  placeholder="Kochi"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white p-2.5 rounded-xl text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">State</label>
                <input
                  type="text"
                  placeholder="Kerala"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white p-2.5 rounded-xl text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 mt-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 font-black text-xs cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              Create Account
            </button>
          </form>
        )}

        {/* STEP 4: POST-SIGNUP WELCOME & ASPIRATIONAL UPGRADE CTA */}
        {step === 'WELCOME' && (
          <div className="space-y-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
              <UserCheck className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-white">Welcome to Digital Scout, {firstName || 'Member'} 👋</h3>
              <p className="text-xs text-slate-300">Your account is ready! Registered Role: <strong>Normal User</strong>.</p>
            </div>

            <div className="p-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-emerald-500/40 rounded-2xl space-y-3 text-left">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Want to get discovered as a football player?</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Pass the <strong>Basic Football Assessment</strong> to earn your official Player ID, AI Scorecard, and national rank!
              </p>
              <button
                type="button"
                onClick={handleStartPlayerUpgrade}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-500/20"
              >
                <span>Become a Player</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleEnterPlatform}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
            >
              Explore Community Feed First
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
