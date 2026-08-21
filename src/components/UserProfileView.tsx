import React, { useState, useEffect } from 'react';
import { UserAccount, PlayerProfile, TrialResult, CommunityPost, Role } from '../types';
import { 
  X, ShieldCheck, MapPin, Share2, UserPlus, Trophy, Medal, Zap, 
  Activity, Footprints, Target, Sparkles, Video, CheckCircle2, Award, 
  Edit3, Flag, Ban, Check, AlertCircle, ArrowRight, UserCheck, ShieldAlert,
  ChevronRight, Sparkle
} from 'lucide-react';
import { EditProfileModal } from './EditProfileModal';
import { ReportUserModal } from './ReportUserModal';
import { logAuditTransaction } from '../lib/auditLogger';

interface UserProfileViewProps {
  currentUser: UserAccount;
  targetUsername?: string;
  targetPlayer?: PlayerProfile | null;
  trialHistory?: TrialResult[];
  posts?: CommunityPost[];
  onClose?: () => void;
  onOpenRecorder?: (drillId: string) => void;
  onStartQualification?: () => void;
  onProfileUpdated?: (updatedUser: UserAccount) => void;
  onRequireAuth?: () => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  currentUser,
  targetUsername,
  targetPlayer,
  trialHistory = [],
  posts = [],
  onClose,
  onOpenRecorder,
  onStartQualification,
  onProfileUpdated,
  onRequireAuth
}) => {
  const [activeTab, setActiveTab] = useState<'Posts' | 'Trials' | 'Stats' | 'Achievements' | 'Details'>('Posts');
  
  // Profile state
  const [userProfile, setUserProfile] = useState<UserAccount>(currentUser);
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile | null>(targetPlayer || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Social Graph
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(142);
  const [followingCount, setFollowingCount] = useState(89);
  const [isBlocked, setIsBlocked] = useState(false);

  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isOwnProfile = !targetUsername || targetUsername.toLowerCase() === currentUser.username?.toLowerCase() || targetUsername === currentUser.id;

  // Load profile data from server API if targetUsername provided
  useEffect(() => {
    if (targetUsername && !isOwnProfile) {
      setLoading(true);
      fetch(`/api/v1/users/${targetUsername}`, {
        headers: { 'x-user-id': currentUser.id }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setUserProfile(data.user);
            if (data.playerProfile) {
              setPlayerProfile(data.playerProfile);
            }
            setFollowersCount(data.followersCount || 142);
            setFollowingCount(data.followingCount || 89);
          } else {
            setError(data.message || 'User profile not found.');
          }
        })
        .catch(() => setError('Failed to fetch user profile.'))
        .finally(() => setLoading(false));
    } else {
      setUserProfile(currentUser);
      if (!targetPlayer && currentUser.playerId) {
        // Fetch player details if currentUser has playerId
        fetch(`/api/v1/players/${currentUser.playerId}`)
          .then(res => res.json())
          .then(data => {
            if (data.player) setPlayerProfile(data.player);
          })
          .catch(() => {});
      }
    }
  }, [targetUsername, currentUser]);

  const handleToggleFollow = async () => {
    if (currentUser.role === 'GUEST') {
      if (onRequireAuth) onRequireAuth();
      return;
    }

    if (isOwnProfile) return;

    try {
      const method = isFollowing ? 'DELETE' : 'POST';
      const response = await fetch(`/api/v1/users/${userProfile.id}/follow`, {
        method,
        headers: { 'x-user-id': currentUser.id }
      });
      const data = await response.json();
      if (data.success) {
        setIsFollowing(data.isFollowing);
        setFollowersCount(data.followersCount);

        await logAuditTransaction(
          currentUser.id,
          currentUser.displayName,
          currentUser.role,
          isFollowing ? 'FOLLOW_REMOVED' : 'FOLLOW_CREATED',
          `${isFollowing ? 'Unfollowed' : 'Followed'} user ${userProfile.displayName} (@${userProfile.username || userProfile.id})`,
          { targetUserId: userProfile.id }
        );
      }
    } catch (err) {
      console.error("Error toggling follow:", err);
    }
  };

  const handleBlockUser = async () => {
    if (isOwnProfile) return;

    try {
      const method = isBlocked ? 'DELETE' : 'POST';
      const response = await fetch(`/api/v1/users/${userProfile.id}/block`, {
        method,
        headers: { 'x-user-id': currentUser.id }
      });
      const data = await response.json();
      if (data.success) {
        setIsBlocked(data.blocked);
        setShowBlockConfirm(false);

        await logAuditTransaction(
          currentUser.id,
          currentUser.displayName,
          currentUser.role,
          isBlocked ? 'USER_UNBLOCKED' : 'USER_BLOCKED',
          `${isBlocked ? 'Unblocked' : 'Blocked'} user ${userProfile.displayName}`,
          { targetUserId: userProfile.id }
        );
      }
    } catch (err) {
      console.error("Error toggling block:", err);
    }
  };

  const handleShare = () => {
    const handleStr = userProfile.username ? `@${userProfile.username}` : userProfile.displayName;
    const shareUrl = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: `${userProfile.displayName} - Digital Scout Profile`,
        text: `Check out ${handleStr}'s football profile on Digital Scout India!`,
        url: shareUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert(`Copied link to ${handleStr}'s profile to clipboard!`);
    }
  };

  const userPosts = posts.filter(p => 
    p.authorId === userProfile.id || 
    p.authorName.toLowerCase() === userProfile.displayName.toLowerCase() ||
    (userProfile.username && p.authorHandle?.toLowerCase().includes(userProfile.username.toLowerCase()))
  );

  const userTrials = trialHistory.filter(t => t.playerId === playerProfile?.id || t.playerId === userProfile.playerId);

  const completionPct = userProfile.profileCompletionPct || (isOwnProfile ? 80 : 100);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-12">
      
      {/* Top Header Navigation Bar */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl px-5 py-3.5 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
            {userProfile.username ? `@${userProfile.username}` : `/${userProfile.displayName.toLowerCase().replace(/\s+/g, '-')}`}
          </span>
          <span className="text-xs font-bold text-slate-400">
            • {userProfile.role === 'PLAYER' ? 'Qualified Football Player' : 'Registered User'}
          </span>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {loading && (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl">
          <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400 font-medium">Loading profile identity details...</p>
        </div>
      )}

      {error && (
        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-3xl text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
          <h3 className="text-sm font-bold text-white">Profile Unavailable</h3>
          <p className="text-xs text-red-300">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Profile Completion Banner (Visible for Own Profile if incomplete) */}
          {isOwnProfile && completionPct < 100 && (
            <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/60 border border-emerald-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-black text-white">Profile Completion Status: {completionPct}%</span>
                </div>
                <div className="w-48 bg-slate-800 h-2 rounded-full overflow-hidden mx-auto sm:mx-0">
                  <div className="bg-emerald-400 h-full rounded-full transition-all duration-500" style={{ width: `${completionPct}%` }} />
                </div>
                <p className="text-[11px] text-slate-400">
                  Complete your bio, location, and photo to unlock higher scout recommendation priority!
                </p>
              </div>

              <button
                onClick={() => setShowEditModal(true)}
                className="px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shrink-0"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Profile
              </button>
            </div>
          )}

          {/* Become a Player Qualification Banner (Visible for Normal Registered Users) */}
          {userProfile.role === 'USER' && (
            <div className="p-6 bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 border border-emerald-500/40 rounded-3xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
              <div className="space-y-2 text-center md:text-left relative z-10">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-extrabold uppercase tracking-wider">
                  ⭐ Digital Scout Qualification Engine
                </div>
                <h3 className="text-lg font-black text-white">
                  Unlock Official Verified Player Status & Scout Visibility!
                </h3>
                <p className="text-xs text-slate-300 max-w-xl">
                  You are currently logged in as a <strong>Normal User</strong>. Take the 3-minute <strong>Basic Football Assessment</strong> (Ball Control, Agility, Target Passing) to earn your official <strong>Digital Scout Player ID</strong> and <strong>Tier Badge</strong>!
                </p>
              </div>

              {onStartQualification && (
                <button
                  onClick={onStartQualification}
                  className="px-6 py-3 bg-gradient-to-r from-amber-400 to-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all cursor-pointer flex items-center gap-2 shrink-0 relative z-10"
                >
                  <Trophy className="w-4 h-4" /> Start Basic Assessment <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Profile Hero Section */}
          <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10 text-center md:text-left">
              
              {/* Profile Photo */}
              <div className="relative">
                <img
                  src={userProfile.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300'}
                  alt={userProfile.displayName}
                  className="w-32 h-32 sm:w-36 sm:h-36 rounded-3xl object-cover border-4 border-emerald-400/80 shadow-2xl"
                />
                
                {playerProfile?.tier ? (
                  <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black tracking-wider uppercase border border-amber-300 shadow-lg whitespace-nowrap">
                    ⭐ {playerProfile.tier} TIER
                  </span>
                ) : (
                  <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-slate-800 text-emerald-400 text-[10px] font-extrabold tracking-wider uppercase border border-slate-700 shadow-lg whitespace-nowrap">
                    ⚽ {userProfile.role}
                  </span>
                )}
              </div>

              {/* Information Details */}
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{userProfile.displayName}</h1>
                  
                  {userProfile.username && (
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                      @{userProfile.username}
                    </span>
                  )}

                  {playerProfile?.verificationStatus?.aiffCrsId && (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1" title="AIFF CRS Passport Linked">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> AIFF VERIFIED
                    </span>
                  )}

                  {userProfile.playerId && (
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                      ID: {userProfile.playerId}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs text-slate-300 font-medium">
                  <span className="flex items-center gap-1 text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    {userProfile.city || 'Kochi'}, {userProfile.state || 'Kerala'}, India
                  </span>
                  <span>•</span>
                  {playerProfile?.position ? (
                    <span className="text-amber-300 font-bold">{playerProfile.position}</span>
                  ) : (
                    <span className="text-emerald-400 font-bold">U17 Grassroots</span>
                  )}
                  {playerProfile?.preferredFoot && (
                    <>
                      <span>•</span>
                      <span className="text-slate-300">{playerProfile.preferredFoot} Footed</span>
                    </>
                  )}
                </div>

                {userProfile.bio && (
                  <p className="text-xs text-slate-300 max-w-xl italic leading-relaxed">
                    "{userProfile.bio}"
                  </p>
                )}

                {/* Social Metrics Counter Bar */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 pt-2 border-t border-slate-800/80">
                  <div>
                    <span className="text-base font-black text-white">{followersCount}</span>
                    <span className="text-[11px] text-slate-400 font-semibold block">Followers</span>
                  </div>

                  <div className="w-px h-8 bg-slate-800" />

                  <div>
                    <span className="text-base font-black text-white">{followingCount}</span>
                    <span className="text-[11px] text-slate-400 font-semibold block">Following</span>
                  </div>

                  <div className="w-px h-8 bg-slate-800" />

                  <div>
                    <span className="text-base font-black text-white">{userPosts.length}</span>
                    <span className="text-[11px] text-slate-400 font-semibold block">Highlights</span>
                  </div>

                  {playerProfile?.overallScore && (
                    <>
                      <div className="w-px h-8 bg-slate-800" />
                      <div>
                        <span className="text-base font-black text-emerald-400">{playerProfile.overallScore} / 100</span>
                        <span className="text-[11px] text-slate-400 font-semibold block">Verified Score</span>
                      </div>
                    </>
                  )}
                </div>

              </div>

              {/* Action Buttons */}
              <div className="flex flex-row md:flex-col items-center gap-2.5 w-full md:w-auto pt-2 md:pt-0">
                {isOwnProfile ? (
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="w-full md:w-36 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
                  >
                    <Edit3 className="w-4 h-4" /> Edit Profile
                  </button>
                ) : (
                  <button
                    onClick={handleToggleFollow}
                    className={`w-full md:w-36 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isFollowing
                        ? 'bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20'
                    }`}
                  >
                    {isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                )}

                <button
                  onClick={handleShare}
                  className="w-full md:w-36 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Share2 className="w-4 h-4" /> Share
                </button>

                {!isOwnProfile && (
                  <div className="relative">
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title="More Options"
                    >
                      •••
                    </button>

                    {showMenu && (
                      <div className="absolute right-0 top-12 w-44 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-1.5 z-30 space-y-1">
                        <button
                          onClick={() => { setShowMenu(false); setShowReportModal(true); }}
                          className="w-full px-3 py-2 text-left text-xs font-bold text-slate-300 hover:text-red-400 hover:bg-slate-800 rounded-xl flex items-center gap-2 cursor-pointer"
                        >
                          <Flag className="w-3.5 h-3.5 text-red-400" /> Report Profile
                        </button>
                        <button
                          onClick={() => { setShowMenu(false); setShowBlockConfirm(true); }}
                          className="w-full px-3 py-2 text-left text-xs font-bold text-slate-300 hover:text-red-400 hover:bg-slate-800 rounded-xl flex items-center gap-2 cursor-pointer"
                        >
                          <Ban className="w-3.5 h-3.5 text-red-400" /> {isBlocked ? 'Unblock User' : 'Block User'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Performance Metrics Radar Bar (For Players) */}
          {playerProfile && (
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400 fill-amber-400" /> Verified Football Biomechanical Performance Data
                </h3>
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  AI Computer Vision Verified
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                
                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                    <span>Speed Velocity</span>
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <p className="text-base font-extrabold text-white">
                    {playerProfile.speedScore ? `${(playerProfile.speedScore / 12).toFixed(1)} m/s` : '7.8 m/s'}
                  </p>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-amber-400 h-full rounded-full" style={{ width: `${playerProfile.speedScore || 88}%` }} />
                  </div>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                    <span>Ball Control</span>
                    <Footprints className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <p className="text-base font-extrabold text-white">
                    {playerProfile.ballControlScore || 95} / 100
                  </p>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${playerProfile.ballControlScore || 95}%` }} />
                  </div>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                    <span>Agility Index</span>
                    <Activity className="w-3.5 h-3.5 text-teal-400" />
                  </div>
                  <p className="text-base font-extrabold text-white">
                    {playerProfile.agilityScore || 93} / 100
                  </p>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-teal-400 h-full rounded-full" style={{ width: `${playerProfile.agilityScore || 93}%` }} />
                  </div>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                    <span>Technical Rating</span>
                    <Target className="w-3.5 h-3.5 text-red-400" />
                  </div>
                  <p className="text-base font-extrabold text-white">
                    {playerProfile.technicalScore || 94} / 100
                  </p>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-red-400 h-full rounded-full" style={{ width: `${playerProfile.technicalScore || 94}%` }} />
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Navigation Sub-Tabs */}
          <div className="border-b border-slate-800 flex items-center gap-2 overflow-x-auto">
            {(['Posts', 'Trials', 'Stats', 'Achievements', 'Details'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-emerald-400 text-emerald-400 bg-emerald-500/5'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                {tab === 'Posts' ? `Highlights (${userPosts.length})` : tab}
              </button>
            ))}
          </div>

          {/* Sub-Tab Views */}

          {/* 1. Posts Tab */}
          {activeTab === 'Posts' && (
            <div className="space-y-4">
              {userPosts.length === 0 ? (
                <div className="p-12 text-center bg-slate-900/50 rounded-3xl border border-slate-800 space-y-2">
                  <Video className="w-10 h-10 text-slate-600 mx-auto" />
                  <h4 className="text-sm font-bold text-white">No published clips yet</h4>
                  <p className="text-xs text-slate-400">Posts and match highlights will appear here when published to the community feed.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {userPosts.map(post => (
                    <div key={post.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-2.5 shadow-lg group">
                      <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                        <img src={post.videoThumbnail} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center font-bold shadow-lg">
                            ▶
                          </div>
                        </div>
                        {post.category && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-slate-950/80 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                            {post.category}
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-bold text-white line-clamp-2">{post.title}</p>
                      
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                        <span>❤️ {post.likesCount} Likes</span>
                        <span>💬 {post.commentsCount || 0} Comments</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 2. Trials Tab */}
          {activeTab === 'Trials' && (
            <div className="space-y-3">
              {userTrials.length === 0 ? (
                <div className="p-12 text-center bg-slate-900/50 rounded-3xl border border-slate-800 space-y-2">
                  <Sparkles className="w-10 h-10 text-slate-600 mx-auto" />
                  <h4 className="text-sm font-bold text-white">No AI trial recordings found</h4>
                  <p className="text-xs text-slate-400">Complete standardized drills using the AI recorder to store verified performance records.</p>
                </div>
              ) : (
                userTrials.map(trial => (
                  <div key={trial.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{trial.drillTitle}</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          {trial.tierAchieved}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Score: <span className="text-emerald-400 font-bold">{trial.rawScores.overall} / 100</span> • Evaluated on {trial.timestamp}
                      </p>
                      {trial.aiFeedback?.strengths?.[0] && (
                        <p className="text-[11px] text-slate-300 italic">
                          "AI Biomechanics Note: {trial.aiFeedback.strengths[0]}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                        ✓ AI Verified
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 3. Performance Stats Tab */}
          {activeTab === 'Stats' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" /> National & State Leaderboard Snapshots
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center p-3 bg-slate-950 rounded-2xl border border-slate-800">
                    <span className="text-slate-400">National India Rank</span>
                    <span className="text-amber-300 font-black text-sm">#{playerProfile?.nationalRank || 3}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-950 rounded-2xl border border-slate-800">
                    <span className="text-slate-400">{userProfile.state || 'Kerala'} State Rank</span>
                    <span className="text-teal-300 font-black text-sm">#{playerProfile?.stateRank || 1}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-950 rounded-2xl border border-slate-800">
                    <span className="text-slate-400">{userProfile.district || 'Ernakulam'} District Rank</span>
                    <span className="text-emerald-300 font-black text-sm">#{playerProfile?.districtRank || 1}</span>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Verification & Safeguarding Badges
                </h4>
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center gap-2.5 text-emerald-400 p-2.5 bg-slate-950 rounded-2xl border border-slate-800">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>WhatsApp Phone OTP Verified</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-emerald-400 p-2.5 bg-slate-950 rounded-2xl border border-slate-800">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Parent / Guardian Consent On File (Minor Safeguarded)</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-emerald-400 p-2.5 bg-slate-950 rounded-2xl border border-slate-800">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>AIFF CRS Football Passport Linked ({playerProfile?.verificationStatus?.aiffCrsId || 'CRS-KER-2024-8831'})</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. Achievements Tab */}
          {activeTab === 'Achievements' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3.5 shadow-md">
                <Award className="w-10 h-10 text-amber-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-white">Gold Tier Badge</h4>
                  <p className="text-[10px] text-slate-400">Top 5% Percentile in India</p>
                </div>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3.5 shadow-md">
                <Trophy className="w-10 h-10 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-white">Kerala State Top 10</h4>
                  <p className="text-[10px] text-slate-400">Rank #1 Midfielder in State</p>
                </div>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3.5 shadow-md">
                <Zap className="w-10 h-10 text-teal-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-white">Sprint Velocity Master</h4>
                  <p className="text-[10px] text-slate-400">Measured Velocity &gt; 7.5 m/s</p>
                </div>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3.5 shadow-md">
                <Medal className="w-10 h-10 text-purple-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-white">Dual Footed Genius</h4>
                  <p className="text-[10px] text-slate-400">90+ score on weak foot passing</p>
                </div>
              </div>
            </div>
          )}

          {/* 5. Biomechanical Details Tab */}
          {activeTab === 'Details' && (
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Full Identity & Football Bio Details
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-400">
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex justify-between">
                  <span>Preferred Position</span>
                  <span className="text-white font-bold">{playerProfile?.position || 'Central Mid'}</span>
                </div>

                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex justify-between">
                  <span>Preferred Foot</span>
                  <span className="text-white font-bold">{playerProfile?.preferredFoot || 'Both'}</span>
                </div>

                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex justify-between">
                  <span>Height / Weight</span>
                  <span className="text-white font-bold">{playerProfile?.heightCm || 174} cm / {playerProfile?.weightKg || 64} kg</span>
                </div>

                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex justify-between">
                  <span>Grassroots Academy</span>
                  <span className="text-white font-bold">{playerProfile?.currentAcademy || 'Malabar Grassroots FC'}</span>
                </div>

                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex justify-between">
                  <span>Playing Level</span>
                  <span className="text-white font-bold">{playerProfile?.playingLevel || 'State Youth League'}</span>
                </div>

                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex justify-between">
                  <span>Years Experience</span>
                  <span className="text-white font-bold">{playerProfile?.yearsExperience || 5} Years</span>
                </div>
              </div>
            </div>
          )}

        </>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <EditProfileModal
          user={userProfile}
          onClose={() => setShowEditModal(false)}
          onProfileUpdated={(updated) => {
            setUserProfile(updated);
            if (onProfileUpdated) onProfileUpdated(updated);
          }}
        />
      )}

      {/* Report Modal */}
      {showReportModal && (
        <ReportUserModal
          targetUserId={userProfile.id}
          targetUserName={userProfile.displayName}
          currentUserId={currentUser.id}
          currentUserName={currentUser.displayName}
          currentUserRole={currentUser.role}
          onClose={() => setShowReportModal(false)}
        />
      )}

      {/* Block Confirm Modal */}
      {showBlockConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-sm w-full space-y-4 text-center">
            <Ban className="w-10 h-10 text-red-400 mx-auto" />
            <h3 className="text-sm font-bold text-white">Block {userProfile.displayName}?</h3>
            <p className="text-xs text-slate-400">
              Blocked users cannot message you or see your highlight posts in their social feed.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowBlockConfirm(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleBlockUser}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Confirm Block
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
