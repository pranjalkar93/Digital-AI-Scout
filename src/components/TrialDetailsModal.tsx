import React from 'react';
import { TrialResult } from '../types';
import { X, Sparkles, CheckCircle2, AlertTriangle, ShieldCheck, Play, Award, Zap, Activity, Repeat, Footprints, Clock, Video } from 'lucide-react';

interface TrialDetailsModalProps {
  trial: TrialResult;
  onClose: () => void;
  onReplayVideo?: (url: string) => void;
}

export const TrialDetailsModal: React.FC<TrialDetailsModalProps> = ({
  trial,
  onClose,
  onReplayVideo
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8 space-y-0">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                  trial.tierAchieved === 'GOLD' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                  trial.tierAchieved === 'SILVER' ? 'bg-slate-300/20 text-slate-200 border-slate-300/40' :
                  'bg-amber-800/20 text-amber-400 border-amber-800/40'
                }`}>
                  {trial.tierAchieved} TIER SCORECARD
                </span>
                <span className="text-xs text-slate-400 font-medium">{trial.timestamp}</span>
              </div>
              <h2 className="text-xl font-black text-white mt-0.5">{trial.drillTitle}</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Main Score & Primary Metric Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-center space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase block">Overall AI Score</span>
              <span className="text-3xl font-black text-white">{trial.rawScores.overall} <span className="text-sm font-normal text-slate-500">/ 100</span></span>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-center space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase block">Measured Performance</span>
              <span className="text-2xl font-black text-emerald-400">{trial.metrics.primaryMetricValue}</span>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-center space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase block">AI Computer Vision</span>
              <span className="text-xs font-bold text-slate-200 block mt-1.5 flex items-center justify-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                {trial.poseLandmarksDetected || 33} Pose Landmarks
              </span>
              <span className="text-[10px] text-slate-400 block">{( (trial.ballTrackConfidence || 0.95) * 100 ).toFixed(0)}% Ball Tracking Conf.</span>
            </div>
          </div>

          {/* Sub-metrics Breakdown Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" /> Speed
              </span>
              <span className="text-base font-black text-white">{trial.rawScores.speed}</span>
            </div>
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                <Activity className="w-3 h-3 text-emerald-400" /> Agility
              </span>
              <span className="text-base font-black text-white">{trial.rawScores.agility}</span>
            </div>
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                <Repeat className="w-3 h-3 text-cyan-400" /> Ball Control
              </span>
              <span className="text-base font-black text-white">{trial.rawScores.control}</span>
            </div>
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                <Footprints className="w-3 h-3 text-purple-400" /> Technical
              </span>
              <span className="text-base font-black text-white">{trial.rawScores.technical}</span>
            </div>
          </div>

          {/* AI Feedback Section */}
          <div className="space-y-4">
            
            {/* Strengths */}
            <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl space-y-2">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Key Biomechanical Strengths
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-200">
                {trial.aiFeedback?.strengths.map((s, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Areas for Improvement */}
            <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-2xl space-y-2">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> Actionable Coaching Tips
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-200">
                {trial.aiFeedback?.improvements.map((imp, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{imp}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Scout Notes */}
            {trial.aiFeedback?.scoutNotes && (
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-cyan-400" /> AI Scout Evaluation Summary
                </h4>
                <p className="text-xs text-slate-300 italic leading-relaxed">
                  "{trial.aiFeedback.scoutNotes}"
                </p>
              </div>
            )}

          </div>

          {/* Video Preview Replay */}
          {(trial.videoUrl || trial.videoBlobUrl) && (
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Video className="w-4 h-4 text-emerald-400" /> Recorded Trial Video Replay
              </h4>
              <video
                src={trial.videoBlobUrl || trial.videoUrl}
                controls
                className="w-full h-52 object-cover rounded-xl bg-slate-900 border border-slate-800"
              />
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
          >
            Close Scorecard
          </button>
        </div>

      </div>
    </div>
  );
};
