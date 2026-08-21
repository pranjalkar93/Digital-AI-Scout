import React, { useState } from 'react';
import { PlayerProfile, Drill, TrialResult, Role, CommunityPost, UserAccount, PlayerAchievement } from '../types';
import { RadarChart } from './RadarChart';
import { TrialDetailsModal } from './TrialDetailsModal';
import { AiffVerificationModal } from './AiffVerificationModal';
import { ProPassCheckoutModal } from './ProPassCheckoutModal';
import { 
  Trophy, 
  Medal, 
  Zap, 
  Activity, 
  Footprints, 
  Target, 
  Repeat, 
  Play, 
  ShieldCheck, 
  MapPin, 
  Sparkles, 
  Clock, 
  Calendar, 
  Tv, 
  CheckCircle2, 
  Lock,
  Award,
  Video,
  Film,
  UserCheck,
  Eye,
  Heart,
  Share2,
  ChevronRight,
  TrendingUp,
  FileCheck,
  BarChart3,
  Flame,
  Star,
  Layers,
  ArrowUpRight,
  Building2
} from 'lucide-react';

interface PlayerPortalProps {
  player: PlayerProfile;
  drills: Drill[];
  trialHistory: TrialResult[];
  activeSubTab: string;
  onOpenRecorder: (drill: Drill) => void;
  onNavigateToTab: (tab: string) => void;
  onToggleProSubscription?: () => void;
  onUpgradePro?: () => void;
  currentRole?: Role;
  currentUserAccount?: UserAccount | null;
  posts?: CommunityPost[];
  onVerifyAiffCrs?: (playerId: string, crsId: string) => void;
}

export const PlayerPortal: React.FC<PlayerPortalProps> = ({
  player,
  drills,
  trialHistory,
  activeSubTab,
  onOpenRecorder,
  onNavigateToTab,
  onToggleProSubscription,
  onUpgradePro,
  currentRole = 'PLAYER',
  currentUserAccount,
  posts = [],
  onVerifyAiffCrs
}) => {
  // Modal States
  const [selectedTrialForModal, setSelectedTrialForModal] = useState<TrialResult | null>(null);
  const [isAiffModalOpen, setIsAiffModalOpen] = useState<boolean>(false);
  const [isProModalOpen, setIsProModalOpen] = useState<boolean>(false);

  // Sub-navigation inside Dashboard
  const [dashboardViewMode, setDashboardViewMode] = useState<'CARD' | 'HISTORY' | 'MEDIA' | 'ACHIEVEMENTS' | 'DRILLS'>('CARD');

  // Drill Category Filter
  const [selectedDrillCategory, setSelectedDrillCategory] = useState<string>('All');

  // Highlight Portfolio Media Category Filter
  const [selectedMediaCategory, setSelectedMediaCategory] = useState<'ALL' | 'HIGHLIGHTS' | 'TRIALS' | 'FREESTYLE'>('ALL');

  // Filter player's public media posts for the Highlight Portfolio
  const playerMediaPosts = posts.filter(p => {
    const isPlayerPost = p.authorId === player.id || p.authorName.toLowerCase().includes(player.name.toLowerCase());
    if (!isPlayerPost) return false;
    if (selectedMediaCategory === 'HIGHLIGHTS') return p.postType === 'PLAYER_VIDEO' || p.category === 'Highlight';
    if (selectedMediaCategory === 'TRIALS') return p.postType === 'TRIAL_RESULT' || p.category === 'Drill Attempt' || p.trialId;
    if (selectedMediaCategory === 'FREESTYLE') return p.category === 'FREESTYLE';
    return true;
  });

  // Gamification & Milestone Badges Engine
  const achievements: PlayerAchievement[] = [
    {
      id: 'ach-1',
      playerId: player.id,
      code: 'SPRINT_MASTER',
      title: 'Sprint Velocity Master',
      category: 'PHYSICAL',
      description: 'Achieved top speed velocity exceeding 7.5 m/s in official 30m sprint trial.',
      icon: 'Zap',
      unlocked: player.speedScore >= 85,
      unlockedAt: '2026-08-15',
      benchmarkText: 'Velocity > 7.5 m/s'
    },
    {
      id: 'ach-2',
      playerId: player.id,
      code: 'STATE_TOP_100',
      title: 'State Top 100 Leaderboard',
      category: 'RANKING',
      description: 'Ranked in the top 100 players in state leaderboard rankings.',
      icon: 'Trophy',
      unlocked: player.stateRank <= 100,
      unlockedAt: '2026-08-10',
      benchmarkText: 'State Rank ≤ 100'
    },
    {
      id: 'ach-3',
      playerId: player.id,
      code: 'DUAL_FOOTED_GENIUS',
      title: 'Dual-Footed Precision',
      category: 'TECHNICAL',
      description: 'Scored 90+ in weak-foot passing and ball control precision.',
      icon: 'Footprints',
      unlocked: player.technicalScore >= 90,
      unlockedAt: '2026-08-18',
      benchmarkText: 'Weak-foot score 90+'
    },
    {
      id: 'ach-4',
      playerId: player.id,
      code: 'JUGGLING_CHAMP',
      title: 'Juggling Rhythm Champion',
      category: 'TECHNICAL',
      description: 'Completed 100+ continuous ball juggles in a single 60s trial.',
      icon: 'Repeat',
      unlocked: player.ballControlScore >= 88,
      unlockedAt: '2026-08-19',
      benchmarkText: '100+ continuous touches'
    },
    {
      id: 'ach-5',
      playerId: player.id,
      code: 'GOLD_TIER_CLUB',
      title: 'Gold Tier Elite Club',
      category: 'MILESTONE',
      description: 'Reached Gold Tier standard in official AI trial assessment.',
      icon: 'Star',
      unlocked: player.tier === 'GOLD',
      unlockedAt: player.tier === 'GOLD' ? '2026-08-19' : undefined,
      benchmarkText: 'Gold Tier rating'
    },
    {
      id: 'ach-6',
      playerId: player.id,
      code: 'NATIONAL_PROSPECT',
      title: 'National Top 50 Prospect',
      category: 'RANKING',
      description: 'Featured among the top 50 U17 prospects across India.',
      icon: 'Medal',
      unlocked: player.nationalRank <= 50,
      unlockedAt: '2026-08-19',
      benchmarkText: 'National Rank ≤ 50'
    },
    {
      id: 'ach-7',
      playerId: player.id,
      code: 'AIFF_CRS_VERIFIED',
      title: 'AIFF CRS Verified Passport',
      category: 'VERIFICATION',
      description: 'Linked official AIFF Central Registration System passport.',
      icon: 'ShieldCheck',
      unlocked: !!player.verificationStatus.aiffCrsId,
      unlockedAt: player.verificationStatus.aiffCrsId ? '2026-08-01' : undefined,
      benchmarkText: 'Official AIFF Passport'
    }
  ];

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  const filteredDrills = drills.filter(d => {
    if (selectedDrillCategory !== 'All' && d.category !== selectedDrillCategory) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Normal Community Member Upgrade Callout (If USER role) */}
      {currentRole === 'USER' && (
        <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border-2 border-emerald-500/50 shadow-2xl space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 blur-3xl pointer-events-none rounded-full" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" /> Account Status: Community Member
                </span>
              </div>
              <h2 className="text-2xl font-black text-white">Upgrade Yourself to a Verified Player</h2>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                On Digital Scout India, anyone can join as a normal community member. To establish your <strong>Verified Football Identity</strong> with an AI scorecard, state/national ranking, and scout discovery portal, pass at least <strong>1 basic trial</strong>!
              </p>
            </div>

            <button
              onClick={() => onOpenRecorder(drills[0])}
              className="px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/30 transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-5 h-5 fill-slate-950" />
              <span>Pass Qualification Trial Now</span>
            </button>
          </div>
        </div>
      )}

      {/* DASHBOARD INTERNAL SUB-NAVBAR */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 overflow-x-auto gap-2 text-xs font-bold">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDashboardViewMode('CARD')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              dashboardViewMode === 'CARD'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Football Identity Card</span>
          </button>

          <button
            onClick={() => setDashboardViewMode('HISTORY')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              dashboardViewMode === 'HISTORY'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Trial History ({trialHistory.length})</span>
          </button>

          <button
            onClick={() => setDashboardViewMode('MEDIA')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              dashboardViewMode === 'MEDIA'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Highlight Portfolio ({playerMediaPosts.length})</span>
          </button>

          <button
            onClick={() => setDashboardViewMode('ACHIEVEMENTS')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              dashboardViewMode === 'ACHIEVEMENTS'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <Star className="w-4 h-4" />
            <span>Badges ({unlockedCount}/{achievements.length})</span>
          </button>

          <button
            onClick={() => setDashboardViewMode('DRILLS')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              dashboardViewMode === 'DRILLS'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>Trial Library</span>
          </button>
        </div>

        {/* PRO Pass Button Quick Trigger */}
        <button
          onClick={() => setIsProModalOpen(true)}
          className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 border transition-all cursor-pointer shrink-0 ${
            player.isProSubscriber
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
              : 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20'
          }`}
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>{player.isProSubscriber ? 'PRO MEMBER' : 'PRO PASS (₹499)'}</span>
        </button>
      </div>

      {/* VIEW 1: MY FOOTBALL HUB & FIFA PLAYER CARD */}
      {(dashboardViewMode === 'CARD' || activeSubTab === 'dashboard') && (
        <div className="space-y-6">
          
          {/* EA SPORTS FIFA STYLE PLAYER CARD */}
          <div className={`relative overflow-hidden rounded-3xl border-2 p-6 md:p-8 shadow-2xl transition-all ${
            player.tier === 'GOLD' 
              ? 'bg-gradient-to-br from-amber-950 via-slate-900 to-slate-950 border-amber-500/60 shadow-amber-500/10' 
              : player.tier === 'SILVER'
              ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 border-slate-400/60 shadow-slate-400/10'
              : 'bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border-amber-800/60'
          }`}>
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 blur-3xl pointer-events-none rounded-full" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              
              {/* Left Column: Player Card Header & Overall Badge */}
              <div className="lg:col-span-5 space-y-6">
                
                <div className="flex items-center gap-5">
                  <div className="relative shrink-0">
                    <img
                      src={player.photo}
                      alt={player.name}
                      className={`w-24 h-24 md:w-28 md:h-28 rounded-2xl object-cover border-2 shadow-2xl ${
                        player.tier === 'GOLD' ? 'border-amber-400' : 'border-emerald-500'
                      }`}
                    />
                    <span className={`absolute -bottom-2 -right-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-xl ${
                      player.tier === 'GOLD' ? 'bg-amber-500 text-slate-950 border-amber-300' :
                      player.tier === 'SILVER' ? 'bg-slate-300 text-slate-950 border-white' :
                      'bg-amber-800 text-white border-amber-600'
                    }`}>
                      {player.tier} TIER
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-2xl font-black text-white">{player.name}</h2>
                      {player.verificationStatus.aiffCrsId && (
                        <span title="AIFF CRS Verified">
                          <ShieldCheck className="w-5 h-5 text-emerald-400" />
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-amber-400 font-bold">
                      @rahulfootball • U{player.age} • <span className="text-white">{player.position}</span>
                    </p>

                    <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>{player.city}, <strong className="text-slate-200">{player.state}</strong></span>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-0.5">
                      <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{player.currentAcademy}</span>
                    </div>
                  </div>
                </div>

                {/* Overall Score Box & Regional Rank Pill Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-2xl text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Overall AI</span>
                    <span className="text-2xl font-black text-white">{player.overallScore}</span>
                  </div>

                  <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-2xl text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">State Rank</span>
                    <span className="text-lg font-black text-emerald-400">#{player.stateRank}</span>
                  </div>

                  <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-2xl text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">National</span>
                    <span className="text-lg font-black text-amber-400">#{player.nationalRank}</span>
                  </div>
                </div>

              </div>

              {/* Right Column: Biomechanical Hexagonal Radar Chart */}
              <div className="lg:col-span-7 bg-slate-950/80 border border-slate-800/80 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-around gap-6">
                <div className="shrink-0">
                  <RadarChart
                    metrics={{
                      speed: player.speedScore,
                      agility: player.agilityScore,
                      ballControl: player.ballControlScore,
                      technical: player.technicalScore,
                      physical: player.physicalScore,
                      consistency: player.consistencyScore
                    }}
                    tier={player.tier}
                    size={260}
                  />
                </div>

                {/* Sub-Metrics Text Ratings */}
                <div className="w-full space-y-2 text-xs">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
                    <BarChart3 className="w-4 h-4 text-emerald-400" />
                    Biomechanical Ratings
                  </h3>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-slate-900 rounded-xl flex justify-between items-center">
                      <span className="text-slate-400 font-bold">Speed:</span>
                      <strong className="text-amber-400 text-sm">{player.speedScore}</strong>
                    </div>
                    <div className="p-2 bg-slate-900 rounded-xl flex justify-between items-center">
                      <span className="text-slate-400 font-bold">Agility:</span>
                      <strong className="text-emerald-400 text-sm">{player.agilityScore}</strong>
                    </div>
                    <div className="p-2 bg-slate-900 rounded-xl flex justify-between items-center">
                      <span className="text-slate-400 font-bold">Control:</span>
                      <strong className="text-cyan-400 text-sm">{player.ballControlScore}</strong>
                    </div>
                    <div className="p-2 bg-slate-900 rounded-xl flex justify-between items-center">
                      <span className="text-slate-400 font-bold">Tech:</span>
                      <strong className="text-purple-400 text-sm">{player.technicalScore}</strong>
                    </div>
                    <div className="p-2 bg-slate-900 rounded-xl flex justify-between items-center">
                      <span className="text-slate-400 font-bold">Power:</span>
                      <strong className="text-emerald-400 text-sm">{player.physicalScore}</strong>
                    </div>
                    <div className="p-2 bg-slate-900 rounded-xl flex justify-between items-center">
                      <span className="text-slate-400 font-bold">Consistency:</span>
                      <strong className="text-amber-400 text-sm">{player.consistencyScore}</strong>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>

          {/* TRUST & SAFEGUARDING HUB + VERIFICATION STATUS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* AIFF CRS Passport Status Card */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> AIFF CRS Verification
                  </span>
                  {player.verificationStatus.aiffCrsId ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> VERIFIED
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black">
                      UNLINKED
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {player.verificationStatus.aiffCrsId
                    ? `Official AIFF Passport verified under ID: ${player.verificationStatus.aiffCrsId}. Listed on official state scout discovery portals.`
                    : 'Link your AIFF Central Registration System (CRS) ID to give scouts official proof of your player passport and academy background.'}
                </p>
              </div>

              <button
                onClick={() => setIsAiffModalOpen(true)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <FileCheck className="w-4 h-4" />
                <span>{player.verificationStatus.aiffCrsId ? 'Update AIFF Passport' : 'Verify AIFF CRS ID Now'}</span>
              </button>
            </div>

            {/* Guardian Consent & Minor Safeguarding Badge */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-cyan-400" /> Guardian Consent & Protection
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-black flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-cyan-400" /> GUARDIAN APPROVED
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Parental / Guardian consent is active. Scouts viewing this profile are assured that video capturing and scout messaging are legally cleared under Digital Scout India's Under-18 Safeguarding Policy.
                </p>
              </div>

              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Direct Contact Masking:</span>
                <strong className="text-slate-200">Phone & Email Protected</strong>
              </div>
            </div>

          </div>

          {/* MONETIZATION & SUBSCRIPTION PRO PASS CARD */}
          <div className="p-6 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 rounded-3xl space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black flex items-center gap-1">
                    <Zap className="w-3 h-3 fill-amber-400 text-amber-400" /> DIGITAL SCOUT PRO
                  </span>
                  <h3 className="text-base font-bold text-white">
                    {player.isProSubscriber ? 'PRO Pass Active — Unlimited Ad-Free Evaluations' : 'Upgrade to Digital Scout PRO Pass'}
                  </h3>
                </div>

                <p className="text-xs text-slate-300">
                  {player.isProSubscriber
                    ? 'Your uploads bypass sponsor ads and enter our priority 1-on-1 AI processing queue with frame-by-frame biomechanical feedback.'
                    : 'Bypass contextual video ads, receive priority AI assessment processing, and unlock frame-by-frame biomechanical breakdown.'}
                </p>
              </div>

              <button
                onClick={() => setIsProModalOpen(true)}
                className={`px-6 py-3 rounded-2xl font-black text-xs transition-all cursor-pointer whitespace-nowrap ${
                  player.isProSubscriber
                    ? 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/40'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-xl shadow-amber-500/20'
                }`}
              >
                {player.isProSubscriber ? 'Manage PRO Subscription' : 'Upgrade for ₹499/mo'}
              </button>
            </div>
          </div>

          {/* QUICK RECENT TRIAL SCORECARD LISTING */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-400" />
                Recent AI Trial Scorecards ({trialHistory.length})
              </h3>

              <button
                onClick={() => setDashboardViewMode('HISTORY')}
                className="text-xs text-emerald-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>View Full Trial Archive</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trialHistory.slice(0, 2).map(trial => (
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
                    <span className="text-slate-400">Primary Measured Value:</span>
                    <strong className="text-emerald-400 text-sm">
                      {trial.metrics.primaryMetricValue}
                    </strong>
                  </div>

                  <button
                    onClick={() => setSelectedTrialForModal(trial)}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Open AI Biomechanical Feedback</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* VIEW 2: TRIAL HISTORY & PROGRESSION ARCHIVE */}
      {dashboardViewMode === 'HISTORY' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-white">AI Trial History & Feedback Archive</h2>
              <p className="text-xs text-slate-400">Old scores are never overwritten; they track your athletic progression over time.</p>
            </div>

            <button
              onClick={() => onNavigateToTab('drills')}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/10"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Record New Trial</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trialHistory.map(trial => (
              <div
                key={trial.id}
                className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-5 space-y-4 transition-all shadow-xl flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase border ${
                      trial.tierAchieved === 'GOLD' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                      trial.tierAchieved === 'SILVER' ? 'bg-slate-300/20 text-slate-200 border-slate-300/40' :
                      'bg-amber-800/20 text-amber-400 border-amber-800/40'
                    }`}>
                      {trial.tierAchieved} TIER
                    </span>
                    <span className="text-xs text-slate-400 font-medium">{trial.timestamp}</span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white">{trial.drillTitle}</h3>
                    <p className="text-xs text-emerald-400 font-bold mt-0.5">
                      Measured Metric: {trial.metrics.primaryMetricValue}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl space-y-1 text-xs text-slate-300">
                    <p className="text-[11px] font-bold text-slate-400">Sub-scores:</p>
                    <div className="grid grid-cols-2 gap-1 text-[11px]">
                      <span>Speed: <strong className="text-white">{trial.rawScores.speed}</strong></span>
                      <span>Agility: <strong className="text-white">{trial.rawScores.agility}</strong></span>
                      <span>Control: <strong className="text-white">{trial.rawScores.control}</strong></span>
                      <span>Tech: <strong className="text-white">{trial.rawScores.technical}</strong></span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedTrialForModal(trial)}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>View Full AI Feedback Report</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 3: HIGHLIGHT PORTFOLIO (MEDIA TAB) */}
      {dashboardViewMode === 'MEDIA' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-white">Curated Highlight Portfolio</h2>
              <p className="text-xs text-slate-400">
                Scouts evaluate in-game decision-making alongside standardized drill metrics.
              </p>
            </div>

            {/* Media Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold">
              <button
                onClick={() => setSelectedMediaCategory('ALL')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedMediaCategory === 'ALL' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                All Media
              </button>
              <button
                onClick={() => setSelectedMediaCategory('HIGHLIGHTS')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedMediaCategory === 'HIGHLIGHTS' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Match Highlights
              </button>
              <button
                onClick={() => setSelectedMediaCategory('TRIALS')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedMediaCategory === 'TRIALS' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Trial Videos
              </button>
              <button
                onClick={() => setSelectedMediaCategory('FREESTYLE')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedMediaCategory === 'FREESTYLE' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Freestyle
              </button>
            </div>
          </div>

          {playerMediaPosts.length === 0 ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
              <Video className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No Public Media Highlights Found</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Share your match clips or recorded drill trials to populate your scout portfolio grid.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {playerMediaPosts.map(post => (
                <div key={post.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-3 p-4">
                  
                  {/* Thumbnail / Video */}
                  <div className="relative aspect-video bg-slate-950 rounded-xl overflow-hidden group">
                    <img
                      src={post.videoThumbnail || post.imageUrl || 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=800'}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/90 text-slate-950 flex items-center justify-center shadow-lg">
                        <Play className="w-6 h-6 fill-slate-950 ml-0.5" />
                      </div>
                    </div>

                    <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-md bg-slate-950/80 text-emerald-400 border border-emerald-500/40 text-[10px] font-black uppercase">
                      {post.category || 'HIGHLIGHT'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-bold text-white text-sm line-clamp-1">{post.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2">{post.caption || 'Grassroots football match highlight.'}</p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                    <span className="flex items-center gap-1 text-rose-400 font-bold">
                      <Heart className="w-3.5 h-3.5 fill-rose-400" /> {post.likesCount}
                    </span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Eye className="w-3.5 h-3.5" /> {post.viewsCount || 120} views
                    </span>
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* VIEW 4: GAMIFICATION & MILESTONE BADGES */}
      {dashboardViewMode === 'ACHIEVEMENTS' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-white">Milestone Badges & Achievements</h2>
              <p className="text-xs text-slate-400">
                Automatically unlocked by the platform rules engine when performance benchmarks are met.
              </p>
            </div>

            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black">
              Unlocked: {unlockedCount} / {achievements.length}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map(ach => (
              <div
                key={ach.id}
                className={`p-5 rounded-2xl border transition-all space-y-3 ${
                  ach.unlocked
                    ? 'bg-slate-900 border-emerald-500/50 shadow-xl shadow-emerald-500/5'
                    : 'bg-slate-950/60 border-slate-800/80 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-2xl border ${
                    ach.unlocked
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                      : 'bg-slate-800 border-slate-700 text-slate-500'
                  }`}>
                    <Trophy className="w-6 h-6" />
                  </div>

                  {ach.unlocked ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> UNLOCKED
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-bold uppercase">
                      LOCKED
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-white text-sm">{ach.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{ach.description}</p>
                </div>

                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-[10px] font-bold text-slate-400 flex justify-between items-center">
                  <span>Requirement:</span>
                  <strong className="text-amber-400">{ach.benchmarkText}</strong>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* VIEW 5: DRILL LIBRARY */}
      {(dashboardViewMode === 'DRILLS' || activeSubTab === 'drills') && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-white">Standardized Football Drill Library</h2>
              <p className="text-xs text-slate-400">
                Record a standardized 60-second video trial in Gali Mode or Ground Mode for instant AI evaluation.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 overflow-x-auto text-xs font-bold">
              {['All', 'JUGGLING', 'SPRINT', 'AGILITY', 'WEAK_FOOT', 'SHOOTING'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedDrillCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
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
                  <span>Record Trial Video</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODALS */}

      {/* AI Trial Detailed Feedback Scorecard Modal */}
      {selectedTrialForModal && (
        <TrialDetailsModal
          trial={selectedTrialForModal}
          onClose={() => setSelectedTrialForModal(null)}
        />
      )}

      {/* AIFF CRS Verification Passport Modal */}
      {isAiffModalOpen && (
        <AiffVerificationModal
          currentCrsId={player.verificationStatus.aiffCrsId}
          onClose={() => setIsAiffModalOpen(false)}
          onVerified={(crsId) => {
            if (onVerifyAiffCrs) onVerifyAiffCrs(player.id, crsId);
            setIsAiffModalOpen(false);
          }}
        />
      )}

      {/* PRO Subscription Checkout Modal */}
      {isProModalOpen && (
        <ProPassCheckoutModal
          currentUserId={player.id}
          currentUserName={player.name}
          currentUserPhone={player.phone || ''}
          isAlreadyPro={player.isProSubscriber}
          onClose={() => setIsProModalOpen(false)}
          onSuccess={() => {
            if (onUpgradePro) onUpgradePro();
            setIsProModalOpen(false);
          }}
        />
      )}

    </div>
  );
};
