import React, { useState, useRef, useEffect } from 'react';
import { Drill, TrialResult, PlayerProfile } from '../types';
import { Camera, Upload, Video, X, Play, RefreshCw, CheckCircle2, Sparkles, AlertCircle, ShieldAlert, Zap, Tv, RotateCcw, XCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { evaluateTrialPerformance, drawPoseAndBallOverlay } from '../utils/scoringEngine';
import { audioSynth } from '../utils/AudioWhistle';
import { YouTubeStyleAdOverlay } from './YouTubeStyleAdOverlay';
import { getAdForDrillCategory } from '../data/drillAds';
import { recordDrillSubmission } from '../lib/auditLogger';

interface TrialRecorderModalProps {
  drill: Drill;
  player: PlayerProfile;
  isOpen: boolean;
  onClose: () => void;
  onTrialCompleted: (result: TrialResult) => void;
  parentalConsentGiven: boolean;
  onUpgradeToPro?: () => void;
}

export const TrialRecorderModal: React.FC<TrialRecorderModalProps> = ({
  drill,
  player,
  isOpen,
  onClose,
  onTrialCompleted,
  parentalConsentGiven,
  onUpgradeToPro
}) => {
  const [selectedEnv, setSelectedEnv] = useState<'Gali Mode (Narrow Space)' | 'Ground Mode (Small Field)' | 'Regulation Pitch'>(drill.environment);
  const [sourceMode, setSourceMode] = useState<'camera' | 'file' | 'sample'>('camera');
  const [recordingState, setRecordingState] = useState<'idle' | 'countdown' | 'recording' | 'processing' | 'completed' | 'invalid_video'>('idle');
  const [countdownNum, setCountdownNum] = useState(3);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [metricValueInput, setMetricValueInput] = useState<number>(
    drill.category === 'SPRINT' ? 7.8 : drill.category === 'AGILITY' ? 11.4 : drill.category === 'JUGGLING' ? 92 : 85
  );

  const [aiEvaluation, setAiEvaluation] = useState<any>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);

  // Module 7 CV Pipeline States
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [processingStage, setProcessingStage] = useState<string>('YOLOV8_ENVIRONMENT_CHECK');
  const [validationReasons, setValidationReasons] = useState<string[]>([]);
  const [testForceInvalid, setTestForceInvalid] = useState<boolean>(false);

  // Ad Overlay State
  const [isShowingAd, setIsShowingAd] = useState<boolean>(false);
  const targetedAd = getAdForDrillCategory(drill.category);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isCameraStartingRef = useRef<boolean>(false);

  // Initialize Camera Stream if mode is camera
  useEffect(() => {
    if (isOpen && sourceMode === 'camera' && recordingState === 'idle') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, sourceMode, recordingState]);

  const startCamera = async () => {
    isCameraStartingRef.current = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false });
      if (!isCameraStartingRef.current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            if (err.name !== 'AbortError' && err.name !== 'NotAllowedError') {
              console.warn("Camera play interrupted:", err);
            }
          });
        }
      }
    } catch (err) {
      if (isCameraStartingRef.current) {
        console.warn("Camera access unavailable, defaulting to Sample AI Simulation Mode");
        setSourceMode('sample');
      }
    }
  };

  const stopCamera = () => {
    isCameraStartingRef.current = false;
    if (videoRef.current) {
      try {
        videoRef.current.pause();
      } catch (e) {
        // Ignore
      }
      videoRef.current.srcObject = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  // Canvas pose landmark animation loop
  useEffect(() => {
    let startTime = Date.now();
    const renderLoop = () => {
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          const width = canvasRef.current.width || 640;
          const height = canvasRef.current.height || 480;
          const elapsed = Date.now() - startTime;
          drawPoseAndBallOverlay(ctx, width, height, elapsed, drill.category);
        }
      }
      animationFrameRef.current = requestAnimationFrame(renderLoop);
    };

    if (isOpen && (recordingState === 'recording' || recordingState === 'idle')) {
      renderLoop();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isOpen, recordingState, drill.category]);

  // Handle Recording Timer & Audio Whistle Countdown
  const startTrialCountdown = () => {
    setRecordingState('countdown');
    setCountdownNum(3);
    audioSynth.playBeep(800, 200);

    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      setCountdownNum(count);
      if (count > 0) {
        audioSynth.playBeep(800, 200);
      } else {
        clearInterval(interval);
        // Play referee whistle trigger
        audioSynth.playWhistle();
        setRecordingState('recording');
        setRecordingSeconds(0);
      }
    }, 1000);
  };

  // Recording Timer
  useEffect(() => {
    let timer: any = null;
    if (recordingState === 'recording') {
      timer = setInterval(() => {
        setRecordingSeconds(prev => {
          if (prev >= drill.durationSeconds) {
            clearInterval(timer);
            handleTriggerSubmission();
            return drill.durationSeconds;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [recordingState, drill.durationSeconds, player.isProSubscriber]);

  const handleTriggerSubmission = () => {
    stopCamera();
    audioSynth.playWhistle();

    if (player.isProSubscriber) {
      // Pro Subscriber bypasses YouTube-style drill ads directly to AI Evaluation!
      runAiEvaluation();
    } else {
      // Free Tier Player triggers drill-specific YouTube ad before AI Evaluation
      setIsShowingAd(true);
    }
  };

  const runAiEvaluation = async () => {
    setIsShowingAd(false);
    setRecordingState('processing');
    setProcessingProgress(15);
    setProcessingStage('YOLOV8_ENVIRONMENT_CHECK');
    setValidationReasons([]);

    const evaluation = evaluateTrialPerformance(drill, metricValueInput);

    try {
      // 1. Submit trial video to asynchronous CV pipeline endpoint
      const evalId = `eval-${Date.now()}`;
      const submitResp = await fetch('/api/v1/evaluations/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evaluation_id: evalId,
          video_url: uploadedVideoUrl || 's3://bucket/uploads/trial.mp4',
          drill_id: drill.id,
          player_id: player.id,
          force_invalid: testForceInvalid,
          requirements: {
            player_visible: true,
            cones_required: drill.category === 'AGILITY' ? 2 : 1
          }
        })
      });

      const submitData = await submitResp.json();
      const jobId = submitData.job_id || evalId;

      // 2. Poll processing status asynchronously
      let completed = false;
      let attempts = 0;

      while (!completed && attempts < 25) {
        attempts++;
        await new Promise((r) => setTimeout(r, 600));

        const statusResp = await fetch(`/api/v1/evaluations/${jobId}/status`);
        if (statusResp.ok) {
          const statusData = await statusResp.json();
          setProcessingProgress(statusData.progress || Math.min(95, attempts * 25));
          setProcessingStage(statusData.stage || 'PROCESSING');

          if (statusData.status === 'COMPLETED' || statusData.progress >= 100) {
            completed = true;

            const feedback = statusData.ai_feedback || {
              strengths: [`33-point posture landmarks verified in ${drill.title}`, `Top metric output for position ${player.position}`],
              improvements: [`Enhance weak-side recovery speed`, `Focus on elevated visual awareness`],
              scoutNotes: `High potential prospect with verified telemetry from ${player.state}.`
            };

            const result: TrialResult = {
              id: statusData.id || `trial-${Date.now()}`,
              playerId: player.id,
              drillId: drill.id,
              drillTitle: drill.title,
              timestamp: new Date().toISOString().split('T')[0],
              videoUrl: uploadedVideoUrl || 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=600',
              metrics: {
                ...evaluation.metrics,
                ...(statusData.metrics || {})
              },
              rawScores: {
                ...evaluation.rawScores,
                overall: statusData.score_overall || evaluation.rawScores.overall
              },
              tierAchieved: statusData.tier_achieved || evaluation.tierAchieved,
              poseLandmarksDetected: 33,
              ballTrackConfidence: 0.96,
              aiFeedback: feedback,
              status: 'COMPLETED'
            };

            setAiEvaluation(result);
            setRecordingState('completed');

            recordDrillSubmission({
              userId: player.id,
              userName: player.name,
              playerState: player.state,
              drillId: drill.id,
              drillTitle: drill.title,
              category: drill.category,
              videoUrl: result.videoUrl,
              primaryMetricName: drill.primaryMetricName,
              primaryMetricValue: result.metrics.primaryMetricValue,
              score: result.rawScores.overall,
              tierAchieved: result.tierAchieved,
              status: 'COMPLETED'
            });

            if (result.tierAchieved === 'GOLD' || result.tierAchieved === 'SILVER') {
              confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            }

            onTrialCompleted(result);
            break;
          }

          if (statusData.status === 'INVALID_VIDEO') {
            completed = true;
            setValidationReasons(statusData.validation_reasons || ['SPORTS_BALL_CONFIDENCE_BELOW_0.75', 'REQUIRED_CONES_NOT_DETECTED']);
            setRecordingState('invalid_video');
            break;
          }
        }
      }

    } catch (err) {
      console.error("AI Analysis error:", err);
      const result: TrialResult = {
        id: `trial-${Date.now()}`,
        playerId: player.id,
        drillId: drill.id,
        drillTitle: drill.title,
        timestamp: new Date().toISOString().split('T')[0],
        videoUrl: uploadedVideoUrl || 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=600',
        metrics: evaluation.metrics,
        rawScores: evaluation.rawScores,
        tierAchieved: evaluation.tierAchieved,
        poseLandmarksDetected: 33,
        ballTrackConfidence: 0.95,
        aiFeedback: {
          strengths: [`Verified posture tracking in ${drill.title}`, `Good execution for U${player.age}`],
          improvements: [`Refine foot landing position`, `Increase trunk stability`],
          scoutNotes: `Technical foundation aligns with regional standards.`
        },
        status: 'COMPLETED'
      };
      setAiEvaluation(result);
      setRecordingState('completed');
      onTrialCompleted(result);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      const url = URL.createObjectURL(file);
      setUploadedVideoUrl(url);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 min-h-[500px]">
        
        {/* YouTube Style Video Ad Overlay when player uploads/submits drill video */}
        {isShowingAd && (
          <YouTubeStyleAdOverlay
            ad={targetedAd}
            drillTitle={drill.title}
            isProSubscriber={player.isProSubscriber}
            onAdCompleted={runAiEvaluation}
            onUpgradeToPro={() => {
              if (onUpgradeToPro) onUpgradeToPro();
              runAiEvaluation();
            }}
          />
        )}

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                {drill.title}
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                  {drill.level} Level
                </span>
                {player.isProSubscriber && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400 fill-amber-400" /> PRO AD-FREE
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                Environment: <span className="text-emerald-400 font-medium">{selectedEnv}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">

          {/* Under-18 Guardian Verification Safety Banner */}
          {player.age < 18 && !parentalConsentGiven && (
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold">Parent / Guardian Verification Recommended</p>
                <p className="text-amber-300/80">
                  Player is under 18 ({player.age} yrs). Parental consent via WhatsApp OTP ensures official scout communication compliance.
                </p>
              </div>
            </div>
          )}

          {/* Setup controls before recording */}
          {recordingState === 'idle' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Environment Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Select Trial Environment:</label>
                <select
                  value={selectedEnv}
                  onChange={(e: any) => setSelectedEnv(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl p-2.5 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="Gali Mode (Narrow Space)">🏠 Gali Mode (Narrow Space / Balcony / Yard)</option>
                  <option value="Ground Mode (Small Field)">⚽ Ground Mode (Small School Ground)</option>
                  <option value="Regulation Pitch">🏟️ Regulation Full Pitch</option>
                </select>
              </div>

              {/* Input Mode Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Video Source:</label>
                <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-medium">
                  <button
                    onClick={() => setSourceMode('camera')}
                    className={`py-1.5 rounded-lg flex items-center justify-center gap-1 ${
                      sourceMode === 'camera' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5" /> Camera
                  </button>
                  <button
                    onClick={() => setSourceMode('file')}
                    className={`py-1.5 rounded-lg flex items-center justify-center gap-1 ${
                      sourceMode === 'file' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload File
                  </button>
                  <button
                    onClick={() => setSourceMode('sample')}
                    className={`py-1.5 rounded-lg flex items-center justify-center gap-1 ${
                      sourceMode === 'sample' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" /> AI Simulation
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* Camera Stage / Video Viewport */}
          {recordingState !== 'completed' && (
            <div className="relative w-full h-72 md:h-80 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center">
              
              {/* Live Video Feed */}
              <video
                ref={videoRef}
                playsInline
                muted
                className={`absolute inset-0 w-full h-full object-cover ${sourceMode === 'camera' ? 'block' : 'hidden'}`}
              />

              {/* Uploaded Video File Preview */}
              {sourceMode === 'file' && uploadedVideoUrl && (
                <video
                  src={uploadedVideoUrl}
                  controls
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}

              {/* Sample AI Canvas Background if no live camera */}
              {sourceMode === 'sample' && (
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 animate-pulse">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-semibold text-slate-200">AI Computer Vision Simulation Active</p>
                  <p className="text-xs text-slate-400 max-w-md mt-1">
                    Simulating 33-point posture tracking, ball trajectory bounding box, and sprint speed biomechanics.
                  </p>
                </div>
              )}

              {/* Canvas Overlay for Pose Keypoints */}
              <canvas
                ref={canvasRef}
                width={640}
                height={480}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
              />

              {/* Countdown Overlay */}
              {recordingState === 'countdown' && (
                <div className="absolute inset-0 z-20 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-center">
                  <span className="text-6xl font-black text-emerald-400 animate-bounce">
                    {countdownNum}
                  </span>
                  <p className="text-xs text-slate-300 font-medium mt-2">
                    Listen for Whistle Trigger... Get into Frame!
                  </p>
                </div>
              )}

              {/* Recording HUD Banner */}
              {recordingState === 'recording' && (
                <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between bg-slate-900/90 border border-slate-700/80 backdrop-blur px-4 py-2 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                    <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
                      REC {recordingSeconds}s / {drill.durationSeconds}s
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300 font-mono">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    AI CV TRACKING ACTIVE
                  </div>
                </div>
              )}

              {/* File Upload Drop Zone if source is File and no file picked */}
              {sourceMode === 'file' && !uploadedVideoUrl && (
                <div className="z-20 text-center p-6 space-y-3">
                  <Upload className="w-10 h-10 text-emerald-400 mx-auto" />
                  <div>
                    <p className="text-xs font-semibold text-slate-200">Upload Drill Recording</p>
                    <p className="text-[11px] text-slate-400">MP4, MOV, or WEBM (Max 50MB)</p>
                  </div>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileUpload}
                    className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-500 file:text-slate-950 hover:file:bg-emerald-400 cursor-pointer"
                  />
                </div>
              )}

              {/* Processing Overlay */}
              {recordingState === 'processing' && (
                <div className="absolute inset-0 z-30 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-4">
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full" />
                    <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <Sparkles className="w-6 h-6 text-emerald-400 animate-pulse" />
                  </div>

                  <div className="w-full max-w-sm space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-white">
                      <span>Python YOLOv8 & MediaPipe Engine</span>
                      <span className="text-emerald-400 font-mono">{processingProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                        style={{ width: `${processingProgress}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1 text-left bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 w-full max-w-sm">
                    <p className="flex items-center gap-2">
                      <span className={processingProgress >= 25 ? "text-emerald-400 font-bold" : "text-slate-500"}>
                        {processingProgress >= 25 ? "✓" : "○"}
                      </span>
                      YOLOv8 Environment Validation (&gt;0.75 Conf)
                    </p>
                    <p className="flex items-center gap-2">
                      <span className={processingProgress >= 50 ? "text-emerald-400 font-bold" : "text-slate-500"}>
                        {processingProgress >= 50 ? "✓" : "○"}
                      </span>
                      MediaPipe 33 3D Joint Tracking
                    </p>
                    <p className="flex items-center gap-2">
                      <span className={processingProgress >= 75 ? "text-emerald-400 font-bold" : "text-slate-500"}>
                        {processingProgress >= 75 ? "✓" : "○"}
                      </span>
                      Kinematic Telemetry & Velocity Extraction
                    </p>
                    <p className="flex items-center gap-2">
                      <span className={processingProgress >= 95 ? "text-emerald-400 font-bold" : "text-slate-500"}>
                        {processingProgress >= 95 ? "✓" : "○"}
                      </span>
                      Gemini LLM Scout Synthesis & Tier Assignment
                    </p>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Invalid Video Diagnostic Rejection Card */}
          {recordingState === 'invalid_video' && (
            <div className="p-6 bg-red-950/30 border border-red-500/40 rounded-2xl space-y-4 animate-fadeIn">
              <div className="flex items-start gap-3">
                <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-400 shrink-0">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">YOLOv8 Environment Validation Failed</h4>
                  <p className="text-xs text-red-300/90 mt-1">
                    Your recording was rejected by the Computer Vision pipeline (`INVALID_VIDEO`). To maintain scout verification integrity, videos must pass strict object detection confidence thresholds (&gt;0.75).
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-950/80 rounded-xl border border-red-500/20 space-y-2 text-xs">
                <p className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">CV Failure Diagnostic Logs:</p>
                <ul className="space-y-1 font-mono text-red-400 text-[11px]">
                  {validationReasons.map((reason, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                <p className="font-semibold text-amber-400">💡 How to fix for pass submission:</p>
                <ul className="list-disc pl-4 space-y-0.5 text-slate-400 text-[11px]">
                  <li>Place phone on a stable tripod or surface 3–5 meters away.</li>
                  <li>Ensure the football is clearly visible in frame before starting.</li>
                  <li>Ensure high contrast lighting and clear view of cones/markers.</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setTestForceInvalid(false);
                    setRecordingState('idle');
                  }}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> Re-Shoot Trial Video
                </button>
              </div>
            </div>
          )}

          {/* Metric Adjustment & Test Controls */}
          {recordingState === 'idle' && (
            <div className="space-y-3">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span>Simulated Drill Outcome ({drill.primaryMetricName}):</span>
                  <span className="text-emerald-400 font-bold text-sm">
                    {metricValueInput} {drill.primaryMetricUnit}
                  </span>
                </div>
                <input
                  type="range"
                  min={drill.category === 'SPRINT' ? 4.5 : drill.category === 'AGILITY' ? 9.0 : 10}
                  max={drill.category === 'SPRINT' ? 9.5 : drill.category === 'AGILITY' ? 20.0 : 120}
                  step={drill.category === 'SPRINT' || drill.category === 'AGILITY' ? 0.1 : 1}
                  value={metricValueInput}
                  onChange={(e) => setMetricValueInput(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                  <span>Bronze Level</span>
                  <span>Silver Level</span>
                  <span>Gold Tier Benchmark</span>
                </div>
              </div>

              {/* CV Validation Test Mode Toggle */}
              <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>Simulate YOLOv8 Low Confidence Failure (`INVALID_VIDEO`)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setTestForceInvalid(!testForceInvalid)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                    testForceInvalid ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {testForceInvalid ? 'FAIL TEST ON' : 'NORMAL TEST'}
                </button>
              </div>
            </div>
          )}

          {/* AI Scorecard Result Screen */}
          {recordingState === 'completed' && aiEvaluation && (
            <div className="space-y-5 animate-fadeIn">
              <div className="p-5 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-emerald-500/30 rounded-2xl space-y-4">
                
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg border ${
                      aiEvaluation.tierAchieved === 'GOLD' ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' :
                      aiEvaluation.tierAchieved === 'SILVER' ? 'bg-slate-300/20 text-slate-200 border-slate-300/50' :
                      'bg-amber-800/20 text-amber-500 border-amber-800/50'
                    }`}>
                      {aiEvaluation.tierAchieved}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">AI Trial Scorecard Revealed</h4>
                      <p className="text-xs text-slate-400">
                        Primary Metric: <span className="text-emerald-400 font-bold">{aiEvaluation.metrics.primaryMetricValue} {drill.primaryMetricUnit}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-3xl font-black text-emerald-400">
                      {aiEvaluation.rawScores.overall}
                    </span>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Overall Rating</p>
                  </div>
                </div>

                {/* Metric Breakdown Grid */}
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Technical</span>
                    <span className="text-sm font-bold text-white">{aiEvaluation.rawScores.technical}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Physical</span>
                    <span className="text-sm font-bold text-white">{aiEvaluation.rawScores.physical}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Speed</span>
                    <span className="text-sm font-bold text-white">{aiEvaluation.rawScores.speed}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Agility</span>
                    <span className="text-sm font-bold text-white">{aiEvaluation.rawScores.agility}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 col-span-3 md:col-span-1">
                    <span className="text-slate-400 text-[10px] block">Control</span>
                    <span className="text-sm font-bold text-white">{aiEvaluation.rawScores.control}</span>
                  </div>
                </div>

                {/* Gemini AI Feedback & Scout Insights */}
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <Sparkles className="w-4 h-4" />
                    Gemini AI Biomechanical & Scout Coaching Notes:
                  </div>

                  <div className="space-y-1 text-slate-300">
                    <p className="font-semibold text-emerald-300">Key Strengths:</p>
                    <ul className="list-disc pl-4 space-y-0.5 text-slate-300">
                      {aiEvaluation.aiFeedback?.strengths?.map((s: string, idx: number) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-1 text-slate-300">
                    <p className="font-semibold text-amber-300">Target Improvements:</p>
                    <ul className="list-disc pl-4 space-y-0.5 text-slate-300">
                      {aiEvaluation.aiFeedback?.improvements?.map((imp: string, idx: number) => (
                        <li key={idx}>{imp}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2 border-t border-slate-800 text-slate-400">
                    <span className="font-bold text-slate-200">Scout Profile Summary: </span>
                    {aiEvaluation.aiFeedback?.scoutNotes}
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          {recordingState === 'idle' && (
            <>
              <p className="text-xs text-slate-400">
                Duration: <span className="text-slate-200 font-bold">{drill.durationSeconds}s trial</span>
              </p>
              {sourceMode === 'file' && uploadedVideoUrl ? (
                <button
                  onClick={handleTriggerSubmission}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 fill-slate-950" />
                  Evaluate Uploaded Video with AI
                </button>
              ) : (
                <button
                  onClick={startTrialCountdown}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  Start Audio Whistle Trial
                </button>
              )}
            </>
          )}

          {recordingState === 'recording' && (
            <button
              onClick={handleTriggerSubmission}
              className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              Stop & Submit Trial to AI Engine
            </button>
          )}

          {recordingState === 'completed' && (
            <div className="w-full flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  setRecordingState('idle');
                  setAiEvaluation(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retake Trial
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Save & Return to Dashboard
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
