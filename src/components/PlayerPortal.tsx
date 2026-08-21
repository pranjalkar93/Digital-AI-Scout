import React, { useState } from 'react';
import { PlayerProfile, Drill, TrialResult, Role } from '../types';
import { Trophy, Medal, Zap, Activity, Footprints, Target, Repeat, Play, ShieldCheck, MapPin, Sparkles, Clock, Calendar, Tv, CheckCircle2, Lock } from 'lucide-react';

interface PlayerPortalProps {
  player: PlayerProfile;
  drills: Drill[];
  trialHistory: TrialResult[];
  activeSubTab: string;
  onOpenRecorder: (drill: Drill) => void;
  onNavigateToTab: (tab: string) => void;
  onToggleProSubscription?: () => void;
  currentRole?: Role;
}

export const PlayerPortal: React.FC<PlayerPortalProps> = ({
  player,
  drills,
  trialHistory,
  activeSubTab,
  onOpenRecorder,
  onNavigateToTab,
  onToggleProSubscription,
  currentRole = 'PLAYER'
}) => {
  const [selectedDrillCategory, setSelectedDrillCategory] = useState<string>('All');

  const filteredDrills = drills.filter(d => {
    if (selectedDrillCategory !== 'All' && d.category !== selectedDrillCategory) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Dashboard SubTab */}
      {activeSubTab === 'dashboard' && (
        <div className="space-y-6">
          
          {/* Normal User Player Qualification Banner */}
          {currentRole === 'USER' && (
            <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border-2 border-emerald-500/50 shadow-2xl space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 blur-3xl pointer-events-none rounded-full" />
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-400" /> Account Status: Normal Community Member
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-white">Upgrade Yourself to a Verified Player</h2>
                  <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                    On Digital Scout India, anyone can register as a normal community user. To upgrade yourself to an <strong>Official Player</strong> with an AI scorecard, national ranking, and scout portal visibility, you must complete and pass at least <strong>1 basic drill trial</strong>!
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-emerald-300 font-semibold pt-1">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 1. Record 60s Basic Drill
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 2. AI Pose & Ball Tracking
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 3. Upgrade to Verified Player
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => onOpenRecorder(drills[0])}
                  className="px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/30 transition-all cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Sparkles className="w-5 h-5 fill-slate-950" />
                  <span>Pass Qualification Drill Now</span>
                </button>
              </div>
            </div>
          )}
          
          {/* Player Hero Digital Pass Banner */}
          <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950 p-6 md:p-8 rounded-3xl border border-slate-800 shadow-2xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 blur-3xl pointer-events-none rounded-full" />

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
              
              {/* Profile Main */}
              <div className="flex items-center gap-5">
                <div className="relative">
                  <img
                    src={player.photo}
                    alt={player.name}
                    className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover border-2 border-emerald-500/50 shadow-xl"
                  />
                  <span className={`absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-lg ${
                    player.tier === 'GOLD' ? 'bg-amber-500 text-slate-950 border-amber-300' :
                    player.tier === 'SILVER' ? 'bg-slate-300 text-slate-950 border-white' :
                    'bg-amber-800 text-white border-amber-600'
                  }`}>
                    {player.tier} TIER
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl md:text-2xl font-black text-white">{player.name}</h2>
                    {player.verificationStatus.aiffCrsId && (
                      <ShieldCheck className="w-5 h-5 text-emerald-400" title="AIFF CRS Verified" />
                    )}
                    {player.isProSubscriber ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-400 fill-amber-400" /> PRO AD-FREE
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-medium flex items-center gap-1">
                        <Tv className="w-3 h-3 text-slate-400" /> Free Tier
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 mt-0.5">
                    U{player.age} • <span className="text-emerald-400 font-bold">{player.position}</span> • {player.preferredFoot} Foot
                  </p>

                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{player.city}, <strong className="text-slate-200">{player.state}</strong></span>
                    <span>• {player.currentAcademy}</span>
                  </div>
                </div>
              </div>

              {/* Ranks & Score Pill */}
              <div className="flex items-center gap-3 self-stretch md:self-auto justify-between md:justify-end border-t md:border-t-0 border-slate-800/80 pt-4 md:pt-0">
                <div className="bg-slate-950/80 border border-slate-800 px-4 py-2.5 rounded-2xl text-center">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">National Rank</span>
                  <span className="text-lg font-black text-amber-400">#{player.nationalRank} <span className="text-[10px] text-slate-500 font-normal">India</span></span>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 px-4 py-2.5 rounded-2xl text-center">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">State Rank</span>
                  <span className="text-lg font-black text-emerald-400">#{player.stateRank} <span className="text-[10px] text-slate-500 font-normal">{player.state}</span></span>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 px-4 py-2.5 rounded-2xl text-center">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">AI Score</span>
                  <span className="text-2xl font-black text-white">{player.overallScore}</span>
                </div>
              </div>

            </div>
          </div>

          {/* Revenue Generation & Pro Plan Status Banner */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl border ${player.isProSubscriber ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-slate-800 border-slate-700 text-emerald-400'}`}>
                {player.isProSubscriber ? <Zap className="w-5 h-5 fill-amber-400" /> : <Tv className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">
                    {player.isProSubscriber ? 'Digital Scout PRO Active (Ad-Free Evaluation)' : 'Digital Scout Free Plan (Ad-Supported Uploads)'}
                  </h4>
                  {player.isProSubscriber && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Priority Processing
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {player.isProSubscriber
                    ? 'All drill video uploads bypass YouTube-style ads and receive instant 1-on-1 AI evaluation.'
                    : 'Free players view contextual YouTube-style sports gear & boot ads during video uploads to fund grassroots AI processing.'}
                </p>
              </div>
            </div>

            <button
              onClick={onToggleProSubscription}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                player.isProSubscriber
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              }`}
            >
              {player.isProSubscriber ? 'Switch to Free (Test Ads)' : '⚡ Upgrade to PRO (₹199/mo)'}
            </button>
          </div>

          {/* Metric Ratings Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Speed Velocity
              </span>
              <span className="text-2xl font-black text-white">{player.speedScore}</span>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-400 h-full rounded-full" style={{ width: `${player.speedScore}%` }} />
              </div>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" /> Agility Recovery
              </span>
              <span className="text-2xl font-black text-white">{player.agilityScore}</span>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${player.agilityScore}%` }} />
              </div>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <Repeat className="w-3.5 h-3.5 text-cyan-400" /> Ball Control
              </span>
              <span className="text-2xl font-black text-white">{player.ballControlScore}</span>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${player.ballControlScore}%` }} />
              </div>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <Footprints className="w-3.5 h-3.5 text-purple-400" /> Technical Precision
              </span>
              <span className="text-2xl font-black text-white">{player.technicalScore}</span>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div className="bg-purple-400 h-full rounded-full" style={{ width: `${player.technicalScore}%` }} />
              </div>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-1 col-span-2 sm:col-span-1">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-emerald-400" /> Physical Power
              </span>
              <span className="text-2xl font-black text-white">{player.physicalScore}</span>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${player.physicalScore}%` }} />
              </div>
            </div>

          </div>

          {/* Quick Trial Record Callout Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                Ready to Upgrade Your Tier & Ranking?
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Record a standardized 60-second trial in Gali Mode or Ground Mode. AI analyzes your video instantly.
              </p>
            </div>

            <button
              onClick={() => onNavigateToTab('drills')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer whitespace-nowrap"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              Open Standard Drill Library
            </button>
          </div>

          {/* Recent Trial Scorecards History */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-400" />
              Recent AI Trial Scorecards ({trialHistory.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trialHistory.map(trial => (
                <div key={trial.id} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm">{trial.drillTitle}</h4>
                      <p className="text-xs text-slate-400">{trial.timestamp}</p>
                    </div>

                    <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase border ${
                      trial.tierAchieved === 'GOLD' ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' :
                      trial.tierAchieved === 'SILVER' ? 'bg-slate-300/20 text-slate-200 border-slate-300/50' :
                      'bg-amber-800/20 text-amber-500 border-amber-800/50'
                    }`}>
                      {trial.tierAchieved}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl text-xs">
                    <span className="text-slate-400">Primary Metric:</span>
                    <strong className="text-emerald-400 text-sm">
                      {trial.metrics.primaryMetricValue}
                    </strong>
                  </div>

                  {trial.aiFeedback?.scoutNotes && (
                    <p className="text-xs text-slate-300 italic">
                      "{trial.aiFeedback.scoutNotes}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Drill Library SubTab */}
      {activeSubTab === 'drills' && (
        <div className="space-y-6">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-white">Standardized Football Drill Library</h2>
              <p className="text-xs text-slate-400">
                Choose a drill designed for space-constrained Gali Mode or open ground mode.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 overflow-x-auto text-xs">
              {['All', 'JUGGLING', 'SPRINT', 'AGILITY', 'WEAK_FOOT', 'SHOOTING'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedDrillCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                    selectedDrillCategory === cat
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {cat.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Drill Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDrills.map(drill => (
              <div
                key={drill.id}
                className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-6 flex flex-col justify-between space-y-4 transition-all shadow-xl group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
                      {drill.environment}
                    </span>

                    <span className="text-xs font-bold text-slate-400">
                      {drill.durationSeconds}s Trial
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                    {drill.title}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-2">
                    {drill.description}
                  </p>

                  {/* Benchmarks Preview */}
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-amber-400 font-bold">Gold Standard:</span>
                      <span className="text-slate-200 font-medium">{drill.benchmarks.gold.threshold}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-300 font-bold">Silver Standard:</span>
                      <span className="text-slate-300 font-medium">{drill.benchmarks.silver.threshold}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onOpenRecorder(drill)}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  Record Trial Video
                </button>
              </div>
            ))}
          </div>

        </div>
      )}

    </div>
  );
};
