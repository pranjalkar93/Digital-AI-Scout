import React, { useState } from 'react';
import { FeatureFlags, Drill, PlayerProfile } from '../types';
import { Settings, ShieldCheck, ToggleLeft, ToggleRight, Database, Edit2, Check, Sparkles, Activity } from 'lucide-react';

interface AdminConsoleProps {
  featureFlags: FeatureFlags;
  onUpdateFlags: (flags: FeatureFlags) => void;
  drills: Drill[];
  onUpdateDrillBenchmark: (drillId: string, level: 'bronze' | 'silver' | 'gold', minScore: number, threshold: string) => void;
  players: PlayerProfile[];
  onVerifyAiffCrs: (playerId: string, crsId: string) => void;
  activeTab: string;
}

export const AdminConsole: React.FC<AdminConsoleProps> = ({
  featureFlags,
  onUpdateFlags,
  drills,
  onUpdateDrillBenchmark,
  players,
  onVerifyAiffCrs,
  activeTab
}) => {
  const [editingDrillId, setEditingDrillId] = useState<string | null>(null);
  const [editLevel, setEditLevel] = useState<'bronze' | 'silver' | 'gold'>('gold');
  const [editScore, setEditScore] = useState(90);
  const [editThreshold, setEditThreshold] = useState('');

  const handleToggleFlag = (key: keyof FeatureFlags) => {
    onUpdateFlags({
      ...featureFlags,
      [key]: !featureFlags[key]
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950 p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Settings className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-extrabold text-white">Platform Admin & Rules Engine Console</h2>
          </div>
          <p className="text-xs text-slate-400">
            Configure national benchmark threshold rules, manage feature flags, and process AIFF CRS identity verification requests.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-center">
            <span className="text-[10px] text-slate-400 block font-bold">Total Players</span>
            <span className="font-extrabold text-white">{players.length}</span>
          </div>
          <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-center">
            <span className="text-[10px] text-slate-400 block font-bold">Standard Drills</span>
            <span className="font-extrabold text-emerald-400">{drills.length}</span>
          </div>
        </div>
      </div>

      {activeTab === 'admin-overview' && (
        <div className="space-y-6">
          
          {/* Feature Flags Section */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              Dynamic System Feature Flags
            </h3>
            <p className="text-xs text-slate-400">
              Toggle core platform services on/off instantly without redeploying backends.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-xs">AI Computer Vision Pose Analysis</h4>
                  <p className="text-[11px] text-slate-400">Runs 33-point posture extraction and ball tracking.</p>
                </div>
                <button onClick={() => handleToggleFlag('enableAiPoseAnalysis')} className="text-emerald-400 cursor-pointer">
                  {featureFlags.enableAiPoseAnalysis ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8 text-slate-600" />}
                </button>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-xs">WhatsApp OTP Verification</h4>
                  <p className="text-[11px] text-slate-400">Dispatches mobile OTPs for parent consent.</p>
                </div>
                <button onClick={() => handleToggleFlag('enableWhatsAppOtp')} className="text-emerald-400 cursor-pointer">
                  {featureFlags.enableWhatsAppOtp ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8 text-slate-600" />}
                </button>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-xs">Monitored Club Contact Requests</h4>
                  <p className="text-[11px] text-slate-400">Enforces zero open-DM safety protocol.</p>
                </div>
                <button onClick={() => handleToggleFlag('enableScoutDirectMessaging')} className="text-emerald-400 cursor-pointer">
                  {featureFlags.enableScoutDirectMessaging ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8 text-slate-600" />}
                </button>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-xs">Community Grassroots Video Feed</h4>
                  <p className="text-[11px] text-slate-400">Allows player freestyle and match highlight posts.</p>
                </div>
                <button onClick={() => handleToggleFlag('enableCommunityFeed')} className="text-emerald-400 cursor-pointer">
                  {featureFlags.enableCommunityFeed ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8 text-slate-600" />}
                </button>
              </div>

            </div>
          </div>

          {/* Drill Rules Engine Benchmarks Editor */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-400" />
              Benchmark Rules Engine Editor
            </h3>
            <p className="text-xs text-slate-400">
              Update national threshold criteria for Gold, Silver, and Bronze tier progression.
            </p>

            <div className="space-y-3">
              {drills.map(drill => (
                <div key={drill.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm">{drill.title}</h4>
                      <p className="text-xs text-slate-400">Primary Metric: {drill.primaryMetricName} ({drill.primaryMetricUnit})</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                    <div className="p-2.5 bg-slate-900 rounded-lg border border-amber-800/40">
                      <span className="font-bold text-amber-500 block">Bronze Rule:</span>
                      <span className="text-slate-300">{drill.benchmarks.bronze.threshold}</span>
                    </div>

                    <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-600/40">
                      <span className="font-bold text-slate-300 block">Silver Rule:</span>
                      <span className="text-slate-300">{drill.benchmarks.silver.threshold}</span>
                    </div>

                    <div className="p-2.5 bg-slate-900 rounded-lg border border-amber-500/40">
                      <span className="font-bold text-amber-300 block">Gold Rule:</span>
                      <span className="text-slate-300">{drill.benchmarks.gold.threshold}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>
      )}

      {/* AIFF CRS Verification Queue View */}
      {activeTab === 'admin-verification' && (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            AIFF Central Registration System (CRS) Verification Queue
          </h3>
          <p className="text-xs text-slate-400">
            Review top player age certificates & official football registration IDs.
          </p>

          <div className="space-y-3">
            {players.map(player => (
              <div key={player.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <img src={player.photo} alt={player.name} className="w-10 h-10 rounded-xl object-cover" />
                  <div>
                    <h4 className="font-bold text-white text-sm">{player.name}</h4>
                    <p className="text-slate-400">U{player.age} • {player.state} • {player.currentAcademy}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {player.verificationStatus.aiffCrsId ? (
                    <span className="px-3 py-1 rounded bg-emerald-950 text-emerald-400 font-mono font-bold border border-emerald-500/30 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      CRS: {player.verificationStatus.aiffCrsId}
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        const generatedCrs = `CRS-${player.state.slice(0,3).toUpperCase()}-2026-${Math.floor(1000 + Math.random() * 9000)}`;
                        onVerifyAiffCrs(player.id, generatedCrs);
                      }}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg cursor-pointer"
                    >
                      Verify AIFF CRS Badge
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

    </div>
  );
};
