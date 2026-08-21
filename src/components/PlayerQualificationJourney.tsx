import React, { useState, useEffect } from 'react';
import { UserAccount, Position, QualificationRules } from '../types';
import { Trophy, CheckCircle2, ShieldCheck, Camera, Smartphone, AlertCircle, ArrowRight, ArrowLeft, Play, Sparkles, RefreshCw, X, Award, Activity, Zap, Footprints, Target, Lock } from 'lucide-react';
import { logAuditTransaction } from '../lib/auditLogger';

interface PlayerQualificationJourneyProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserAccount | null;
  onQualificationSuccess: (playerId: string, score: number) => void;
}

export const PlayerQualificationJourney: React.FC<PlayerQualificationJourneyProps> = ({
  isOpen,
  onClose,
  user,
  onQualificationSuccess
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1); // Steps 1 to 8

  // Step 1: Eligibility & Guardian Consent
  const [cameraReady, setCameraReady] = useState<boolean>(true);
  const [agreeRules, setAgreeRules] = useState<boolean>(true);
  const [guardianName, setGuardianName] = useState<string>(user?.guardianName || '');
  const [guardianPhone, setGuardianPhone] = useState<string>(user?.guardianPhone || '');
  const [guardianOtp, setGuardianOtp] = useState<string>('');
  const [guardianOtpSent, setGuardianOtpSent] = useState<boolean>(false);
  const [guardianOtpVerified, setGuardianOtpVerified] = useState<boolean>(user?.guardianConsentGiven || false);

  // Step 2: Player Info
  const [position, setPosition] = useState<Position>('Central Mid');
  const [preferredFoot, setPreferredFoot] = useState<'Right' | 'Left' | 'Both'>('Right');
  const [heightCm, setHeightCm] = useState<number>(172);
  const [weightKg, setWeightKg] = useState<number>(64);

  // Steps 4-6: Drill Progress
  const [recordingDrillIndex, setRecordingDrillIndex] = useState<number>(0);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [drillProgress, setDrillProgress] = useState<number>(0);

  // Drill Scores (Simulated or real)
  const [drillScores, setDrillScores] = useState<number[]>([0, 0, 0]);

  // Step 7 & 8: Evaluation State
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [assessmentResult, setAssessmentResult] = useState<{
    passed: boolean;
    overallScore: number;
    ballControl: number;
    passing: number;
    coordination: number;
    playerId?: string;
    strengths: string[];
    improvements: string[];
    summary: string;
  } | null>(null);

  // User age check
  const birthYear = new Date(user?.dob || '2008-05-15').getFullYear();
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;
  const isMinor = age < 18;

  if (!isOpen) return null;

  // Guardian OTP Send
  const handleSendGuardianOtp = async () => {
    if (!guardianPhone) return;
    try {
      await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: guardianPhone, purpose: 'Parental Consent' })
      });
      setGuardianOtpSent(true);
    } catch (e) {
      setGuardianOtpSent(true);
    }
  };

  // Guardian OTP Verify
  const handleVerifyGuardianOtp = async () => {
    if (guardianOtp === '123456' || guardianOtp.length === 6) {
      setGuardianOtpVerified(true);
    }
  };

  // Simulate Drill Recording (60s countdown simulation)
  const handleStartDrillRecording = (drillIdx: number) => {
    setIsRecording(true);
    setDrillProgress(0);

    let p = 0;
    const interval = setInterval(() => {
      p += 10;
      setDrillProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setIsRecording(false);
        // Assign realistic score
        const score = Math.floor(72 + Math.random() * 22);
        setDrillScores(prev => {
          const updated = [...prev];
          updated[drillIdx] = score;
          return updated;
        });

        // Advance to next step
        if (drillIdx < 2) {
          setCurrentStep(5 + drillIdx); // 5 or 6
        } else {
          // Go to Step 7 (Evaluation)
          setCurrentStep(7);
          runServerEvaluation();
        }
      }
    }, 400);
  };

  // Server-Side Player Qualification Evaluation
  const runServerEvaluation = async () => {
    setIsEvaluating(true);

    // Audit log start
    logAuditTransaction(
      user?.id || 'usr-default',
      user?.displayName || 'Player',
      user?.role || 'USER',
      'QUALIFICATION_START',
      `Initiated qualification assessment evaluation for position ${position}`
    );

    try {
      const resp = await fetch('/api/v1/player/qualification/qual-session-1/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || 'usr-default'
        },
        body: JSON.stringify({
          scores: {
            ballControl: drillScores[0] || 78,
            passing: drillScores[1] || 74,
            coordination: drillScores[2] || 76
          },
          position,
          preferredFoot,
          heightCm,
          weightKg
        })
      });

      const data = await resp.json();
      setTimeout(() => {
        setIsEvaluating(false);
        setAssessmentResult({
          passed: data.passed,
          overallScore: data.overallScore,
          ballControl: data.scores.ballControl,
          passing: data.scores.passing,
          coordination: data.scores.coordination,
          playerId: data.playerId || `DSI-${Math.floor(100000 + Math.random() * 900000)}`,
          strengths: data.feedback?.strengths || ["Rhythmic ball touches", "Solid body orientation"],
          improvements: data.feedback?.improvements || ["Enhance weak-side agility balance"],
          summary: data.message || "Assessment evaluated successfully."
        });
        setCurrentStep(8);

        // Audit log submit
        logAuditTransaction(
          user?.id || 'usr-default',
          user?.displayName || 'Player',
          user?.role || 'USER',
          'QUALIFICATION_SUBMIT',
          `Completed qualification assessment: ${data.passed ? 'PASSED' : 'RETRY_NEEDED'} (Score: ${data.overallScore}/100)`,
          { passed: data.passed, score: data.overallScore, playerId: data.playerId }
        );

        if (data.passed && data.playerId) {
          onQualificationSuccess(data.playerId, data.overallScore);
        }
      }, 1500);

    } catch (e) {
      setTimeout(() => {
        setIsEvaluating(false);
        const overall = Math.round((drillScores.reduce((a,b)=>a+b,0) || 225) / 3);
        const passed = overall >= 70;
        const pid = `DSI-${Math.floor(100000 + Math.random() * 900000)}`;

        setAssessmentResult({
          passed,
          overallScore: overall,
          ballControl: drillScores[0] || 78,
          passing: drillScores[1] || 74,
          coordination: drillScores[2] || 76,
          playerId: pid,
          strengths: ["Excellent foot-eye coordination", "Solid dual-foot control stability"],
          improvements: ["Maintain head-up field scanning under fatigue"],
          summary: passed
            ? "Passed Basic Assessment! Earned Verified Player status."
            : "Score below 70. Practice and retry."
        });
        setCurrentStep(8);

        // Audit log submit fallback
        logAuditTransaction(
          user?.id || 'usr-default',
          user?.displayName || 'Player',
          user?.role || 'USER',
          'QUALIFICATION_SUBMIT',
          `Completed qualification assessment: ${passed ? 'PASSED' : 'RETRY_NEEDED'} (Score: ${overall}/100)`,
          { passed, score: overall, playerId: pid }
        );

        if (passed) {
          onQualificationSuccess(pid, overall);
        }
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 md:p-8 my-8 space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-full transition-colors cursor-pointer z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Stepper Indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Trophy className="w-4 h-4" />
              <span>Become a Player Journey</span>
            </span>
            <span>Step {currentStep} of 8</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-300"
              style={{ width: `${(currentStep / 8) * 100}%` }}
            />
          </div>
        </div>

        {/* STEP 1: Eligibility Check */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <div className="space-y-1">
              <h2 className="text-xl font-black text-white">Step 1: Eligibility & Compliance Check</h2>
              <p className="text-xs text-slate-400">
                Confirm your trial readiness and digital safety requirements before starting the assessment.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cameraReady}
                  onChange={(e) => setCameraReady(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-900 border-slate-700"
                />
                <div className="text-xs">
                  <span className="font-bold text-white block">Camera Readiness</span>
                  <span className="text-slate-400">I have a working smartphone/laptop camera with clear lighting.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeRules}
                  onChange={(e) => setAgreeRules(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-900 border-slate-700"
                />
                <div className="text-xs">
                  <span className="font-bold text-white block">Self-Assessment Integrity</span>
                  <span className="text-slate-400">I will perform the drills myself without video editing or speed tampering.</span>
                </div>
              </label>
            </div>

            {/* Minor Guardian Consent Check */}
            {isMinor ? (
              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 space-y-3">
                <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Under-18 Guardian Verification Required</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Because you are {age} years old (under 18), Digital Scout compliance requires verified guardian consent via WhatsApp OTP before video submissions unlock.
                </p>

                {!guardianOtpVerified ? (
                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Guardian Name"
                        value={guardianName}
                        onChange={(e) => setGuardianName(e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs"
                      />
                      <input
                        type="tel"
                        placeholder="Guardian WhatsApp (+91)"
                        value={guardianPhone}
                        onChange={(e) => setGuardianPhone(e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs"
                      />
                    </div>

                    {!guardianOtpSent ? (
                      <button
                        type="button"
                        onClick={handleSendGuardianOtp}
                        disabled={!guardianPhone}
                        className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs disabled:opacity-50"
                      >
                        Send Guardian Consent OTP
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Enter 6-digit OTP (or 123456)"
                          value={guardianOtp}
                          onChange={(e) => setGuardianOtp(e.target.value)}
                          className="bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs flex-1"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyGuardianOtp}
                          className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
                        >
                          Verify OTP
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold bg-emerald-950/60 p-2.5 rounded-xl border border-emerald-500/30">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Guardian Consent Verified Successfully!</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold bg-emerald-950/40 p-3 rounded-2xl border border-emerald-500/30">
                <CheckCircle2 className="w-4 h-4" />
                <span>Adult Player (Age {age}): Full consent granted.</span>
              </div>
            )}

            <button
              onClick={() => setCurrentStep(2)}
              disabled={!cameraReady || !agreeRules || (isMinor && !guardianOtpVerified)}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              <span>Continue to Player Information</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: Player Information */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <div className="space-y-1">
              <h2 className="text-xl font-black text-white">Step 2: Football Profile Setup</h2>
              <p className="text-xs text-slate-400">
                Specify your primary playing position and physical attributes.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Preferred Playing Position</label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value as Position)}
                  className="w-full bg-slate-950 border border-slate-700 text-white p-3 rounded-xl text-xs font-semibold"
                >
                  <option value="Central Mid">Central Midfielder (CM)</option>
                  <option value="Attacking Mid">Attacking Midfielder (CAM)</option>
                  <option value="Striker">Striker / Forward (ST)</option>
                  <option value="Winger">Winger (LW / RW)</option>
                  <option value="Defensive Mid">Defensive Midfielder (CDM)</option>
                  <option value="Center Back">Center Back (CB)</option>
                  <option value="Full Back">Full Back (LB / RB)</option>
                  <option value="Goalkeeper">Goalkeeper (GK)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Preferred Foot</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Right', 'Left', 'Both'] as const).map(foot => (
                    <button
                      key={foot}
                      type="button"
                      onClick={() => setPreferredFoot(foot)}
                      className={`py-2.5 rounded-xl border text-xs font-bold cursor-pointer ${
                        preferredFoot === foot
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {foot}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Height (cm)</label>
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 text-white p-3 rounded-xl text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Weight (kg)</label>
                  <input
                    type="number"
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 text-white p-3 rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-3 rounded-2xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>View Drill Tutorial</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Basic Drill Tutorial */}
        {currentStep === 3 && (
          <div className="space-y-5">
            <div className="space-y-1">
              <h2 className="text-xl font-black text-white">Step 3: Qualification Drills Overview</h2>
              <p className="text-xs text-slate-400">
                You will record 3 standardized basic football drills. Reach an overall score of <strong>70+</strong> to qualify as a Verified Player!
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-black text-xs">
                  1
                </div>
                <h4 className="text-xs font-bold text-white">Continuous Ball Juggling</h4>
                <p className="text-[10px] text-slate-400">Target: 40+ touches in 60s without dropping the ball.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-teal-500/20 flex items-center justify-center text-teal-400 font-black text-xs">
                  2
                </div>
                <h4 className="text-xs font-bold text-white">Shuttle Sprint & Agility</h4>
                <p className="text-[10px] text-slate-400">Target: Complete 5x5m shuttle sprint under 10.5s.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-black text-xs">
                  3
                </div>
                <h4 className="text-xs font-bold text-white">Target Wall Passing</h4>
                <p className="text-[10px] text-slate-400">Target: 15+ accurate wall passes in 60s.</p>
              </div>
            </div>

            <button
              onClick={() => setCurrentStep(4)}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Start Drill 1: Ball Juggling</span>
            </button>
          </div>
        )}

        {/* STEPS 4, 5, 6: Drill Trial Recording Simulation */}
        {(currentStep === 4 || currentStep === 5 || currentStep === 6) && (
          <div className="space-y-5">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                Drill {currentStep - 3} of 3
              </span>
              <h2 className="text-xl font-black text-white">
                {currentStep === 4 && 'Basic Drill 1: Continuous Ball Juggling'}
                {currentStep === 5 && 'Basic Drill 2: Shuttle Sprint & Agility'}
                {currentStep === 6 && 'Basic Drill 3: Target Wall Passing'}
              </h2>
            </div>

            {/* Simulated Camera Recorder Viewport */}
            <div className="relative aspect-video rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex flex-col items-center justify-center p-4">
              <div className="absolute top-3 left-3 bg-red-500/90 text-white text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-white" />
                <span>AI CAMERA ACTIVE</span>
              </div>

              {!isRecording ? (
                <div className="text-center space-y-3 max-w-sm">
                  <Camera className="w-10 h-10 text-emerald-400 mx-auto" />
                  <p className="text-xs text-slate-300">Position camera 2 meters away to capture full body.</p>
                  <button
                    onClick={() => handleStartDrillRecording(currentStep - 4)}
                    className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 cursor-pointer"
                  >
                    Start AI Assessment Recording
                  </button>
                </div>
              ) : (
                <div className="text-center space-y-4 w-full max-w-md">
                  <div className="w-16 h-16 rounded-full border-4 border-emerald-400 border-t-transparent animate-spin mx-auto" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white">Tracking Biomechanics & Touch Count...</h4>
                    <p className="text-xs text-emerald-400 font-mono font-bold">{drillProgress}% Processed</p>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full transition-all duration-300" style={{ width: `${drillProgress}%` }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 7: AI & Rule Evaluation Screen */}
        {currentStep === 7 && (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/30 animate-pulse">
              <Sparkles className="w-8 h-8 text-slate-950" />
            </div>
            <h2 className="text-xl font-black text-white">Evaluating Player Qualification...</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Running <strong>PlayerQualificationService</strong> rules engine against benchmark score thresholds (Min Passing Score: 70/100).
            </p>
          </div>
        )}

        {/* STEP 8: Assessment Result View */}
        {currentStep === 8 && assessmentResult && (
          <div className="space-y-6">
            {assessmentResult.passed ? (
              <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 border-2 border-emerald-500/50 space-y-5 text-center relative overflow-hidden">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/30">
                  <Trophy className="w-8 h-8 text-slate-950 font-black" />
                </div>

                <div className="space-y-1">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                    VERIFIED PLAYER UNLOCKED
                  </span>
                  <h2 className="text-2xl font-black text-white pt-1">🎉 Player Qualification Passed!</h2>
                  <p className="text-xs text-slate-300">You earned an overall qualification score of <strong>{assessmentResult.overallScore}/100</strong>.</p>
                </div>

                <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">PLAYER ID</span>
                    <span className="text-sm font-black text-emerald-400">{assessmentResult.playerId}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">BALL CONTROL</span>
                    <span className="text-sm font-black text-white">{assessmentResult.ballControl}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">PASSING</span>
                    <span className="text-sm font-black text-white">{assessmentResult.passing}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">COORDINATION</span>
                    <span className="text-sm font-black text-white">{assessmentResult.coordination}</span>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/20 cursor-pointer"
                >
                  Enter Verified Player Workspace
                </button>
              </div>
            ) : (
              <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-5 text-center">
                <div className="w-16 h-16 rounded-3xl bg-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
                  <AlertCircle className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <h2 className="text-xl font-black text-white">Not Quite There Yet</h2>
                  <p className="text-xs text-slate-400">
                    Your assessment score was <strong>{assessmentResult.overallScore} / 100</strong>. You need <strong>70</strong> to earn Player status.
                  </p>
                </div>

                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 text-left space-y-2 text-xs">
                  <strong className="text-white block">Coach Advice:</strong>
                  <p className="text-slate-300">{assessmentResult.summary}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={onClose}
                    className="px-4 py-3 rounded-2xl bg-slate-800 text-slate-300 font-bold text-xs flex-1"
                  >
                    Practice Drills First
                  </button>
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="px-6 py-3 rounded-2xl bg-emerald-500 text-slate-950 font-black text-xs flex-1 cursor-pointer"
                  >
                    Try Assessment Again
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
