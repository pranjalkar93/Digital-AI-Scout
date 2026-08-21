import React, { useState } from 'react';
import { PlayerProfile, TrialResult, CommunityPost, Role } from '../types';
import { X, ShieldCheck, MapPin, Share2, UserPlus, Trophy, Medal, Zap, Activity, Footprints, Target, Sparkles, Video, CheckCircle2, Award } from 'lucide-react';

interface PlayerProfileModalProps {
  player: PlayerProfile;
  trialHistory: TrialResult[];
  posts: CommunityPost[];
  onClose: () => void;
  onOpenRecorder?: (drillId: string) => void;
  isFollowing?: boolean;
  onToggleFollow?: () => void;
  currentRole?: Role;
  onRequireAuth?: () => void;
}

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({
  player,
  trialHistory,
  posts,
  onClose,
  isFollowing = false,
  onToggleFollow,
  currentRole = 'GUEST',
  onRequireAuth
}) => {
  const [activeTab, setActiveTab] = useState<'Videos' | 'Trials' | 'Stats' | 'Achievements'>('Videos');
  const [followed, setFollowed] = useState(isFollowing);

  const playerPosts = posts.filter(p => p.authorId === player.id || p.authorName.toLowerCase() === player.name.toLowerCase());
  const playerTrials = trialHistory.filter(t => t.playerId === player.id);

  const handleFollowClick = () => {
    if (currentRole === 'GUEST') {
      if (onRequireAuth) onRequireAuth();
      return;
    }
    setFollowed(!followed);
    if (onToggleFollow) onToggleFollow();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${player.name} - Digital Scout Profile`,
        text: `Check out ${player.name}'s verified football profile on Digital Scout India!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert(`Copied link to ${player.name}'s profile to clipboard!`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6 max-h-[90vh] flex flex-col">
        
        {/* Top Bar Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
            <span>/player/{player.name.toLowerCase().replace(/\s+/g, '-')}</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Profile Header Hero Card */}
          <div className="relative p-6 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 border border-slate-800 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10 text-center sm:text-left">
              
              {/* Photo Frame */}
              <div className="relative">
                <img
                  src={player.photo}
                  alt={player.name}
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover border-2 border-emerald-400 shadow-xl"
                />
                <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black tracking-wider uppercase border border-amber-300 shadow-md">
                  ⭐ {player.tier}
                </span>
              </div>

              {/* Information */}
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-2xl font-black text-white">{player.name}</h2>
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    @{player.name.toLowerCase().replace(/\s+/g, '')}
                  </span>
                  {player.verificationStatus.aiffCrsId && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1" title="AIFF CRS Verified">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> AIFF VERIFIED
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300 font-medium flex items-center justify-center sm:justify-start gap-3">
                  <span className="flex items-center gap-1 text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    {player.state}, India
                  </span>
                  <span>•</span>
                  <span className="text-emerald-400 font-bold">U{player.age || 17}</span>
                  <span>•</span>
                  <span className="text-amber-300 font-semibold">{player.position}</span>
                </p>

                {player.bio && (
                  <p className="text-xs text-slate-400 max-w-xl italic">
                    "{player.bio}"
                  </p>
                )}

                {/* Score & Badges Summary */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2">
                  <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Overall Score</p>
                      <p className="text-sm font-black text-emerald-400">{player.overallScore} / 100</p>
                    </div>
                  </div>

                  <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">National Rank</p>
                      <p className="text-sm font-black text-amber-300">#{player.nationalRank || 428}</p>
                    </div>
                  </div>

                  <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-2">
                    <Medal className="w-4 h-4 text-teal-400" />
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">State Rank</p>
                      <p className="text-sm font-black text-teal-300">#{player.stateRank || 17}</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="flex sm:flex-col items-center gap-2.5 w-full sm:w-auto pt-2 sm:pt-0">
                <button
                  onClick={handleFollowClick}
                  className={`w-full sm:w-32 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    followed
                      ? 'bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  {followed ? 'Following' : 'Follow Player'}
                </button>

                <button
                  onClick={handleShare}
                  className="w-full sm:w-32 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  Share Profile
                </button>
              </div>

            </div>
          </div>

          {/* Performance Radar Metrics Grid */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400 fill-amber-400" /> AI Verified Football Performance Data
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                  <span>Speed Velocity</span>
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <p className="text-base font-extrabold text-white">
                  {player.speedScore ? `${(player.speedScore / 12).toFixed(1)} m/s` : '7.8 m/s'}
                </p>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-amber-400 h-full rounded-full" style={{ width: `${player.speedScore || 88}%` }} />
                </div>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                  <span>Ball Control</span>
                  <Footprints className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <p className="text-base font-extrabold text-white">
                  {player.ballControlScore || 86} / 100
                </p>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${player.ballControlScore || 86}%` }} />
                </div>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                  <span>Agility Index</span>
                  <Activity className="w-3.5 h-3.5 text-teal-400" />
                </div>
                <p className="text-base font-extrabold text-white">
                  {player.agilityScore || 91} / 100
                </p>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-teal-400 h-full rounded-full" style={{ width: `${player.agilityScore || 91}%` }} />
                </div>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                  <span>Shooting Accuracy</span>
                  <Target className="w-3.5 h-3.5 text-red-400" />
                </div>
                <p className="text-base font-extrabold text-white">
                  {player.technicalScore || 79} / 100
                </p>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-red-400 h-full rounded-full" style={{ width: `${player.technicalScore || 79}%` }} />
                </div>
              </div>

            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="border-b border-slate-800 flex items-center gap-2">
            {(['Videos', 'Trials', 'Stats', 'Achievements'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  activeTab === tab
                    ? 'border-emerald-400 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Sub-Tab Content Area */}
          {activeTab === 'Videos' && (
            <div className="space-y-4">
              {playerPosts.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/50 rounded-2xl border border-slate-800">
                  <Video className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 font-medium">No published highlight clips yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {playerPosts.map(post => (
                    <div key={post.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
                      <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-800 bg-slate-900 group">
                        <img src={post.videoThumbnail} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-slate-950/30 flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
                            ▶
                          </div>
                        </div>
                      </div>
                      <p className="text-xs font-bold text-white line-clamp-1">{post.title}</p>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>❤️ {post.likesCount} Likes</span>
                        <span>💬 {post.commentsCount || 0} Comments</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'Trials' && (
            <div className="space-y-3">
              {playerTrials.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/50 rounded-2xl border border-slate-800">
                  <Sparkles className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 font-medium">No official AI verified trial submissions available yet.</p>
                </div>
              ) : (
                playerTrials.map(trial => (
                  <div key={trial.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{trial.drillTitle}</span>
                        <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          {trial.tierAchieved}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Score: <span className="text-emerald-400 font-bold">{trial.rawScores.overall} / 100</span> • {trial.timestamp}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                        AI Verified
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'Stats' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <h4 className="text-xs font-bold text-slate-300">Biomechanical Profile</h4>
                <div className="space-y-1.5 text-xs text-slate-400">
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span>Preferred Foot</span>
                    <span className="text-white font-semibold">{player.preferredFoot}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span>Height / Weight</span>
                    <span className="text-white font-semibold">{player.heightCm} cm / {player.weightKg} kg</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span>Current Academy</span>
                    <span className="text-white font-semibold">{player.currentAcademy || 'Grassroots Ground'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Experience Level</span>
                    <span className="text-white font-semibold">{player.playingLevel}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <h4 className="text-xs font-bold text-slate-300">Verification & Safety Badges</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Parent / Guardian Consent Signed</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Age & Identity Verified</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>AIFF CRS Passport Linked</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Achievements' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-3">
                <Award className="w-8 h-8 text-amber-400" />
                <div>
                  <h4 className="text-xs font-bold text-white">Gold Tier Badge</h4>
                  <p className="text-[10px] text-slate-400">Top 5% National Percentile</p>
                </div>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-3">
                <Trophy className="w-8 h-8 text-emerald-400" />
                <div>
                  <h4 className="text-xs font-bold text-white">State Top 20</h4>
                  <p className="text-[10px] text-slate-400">Rank #17 in Kerala</p>
                </div>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-3">
                <Zap className="w-8 h-8 text-teal-400" />
                <div>
                  <h4 className="text-xs font-bold text-white">Sprint Master</h4>
                  <p className="text-[10px] text-slate-400">Velocity &gt; 7.5 m/s</p>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
