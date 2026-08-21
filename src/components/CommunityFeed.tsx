import React, { useState, useRef, useEffect } from 'react';
import { CommunityPost, PlayerProfile, UserAccount } from '../types';
import { RuleBasedRecommendationService } from '../lib/feedRecommendation';
import { CreateContentModal } from './CreateContentModal';
import { EditPostModal } from './EditPostModal';
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  Sparkles, 
  MapPin, 
  Plus, 
  Flame, 
  Bookmark, 
  Send, 
  Image as ImageIcon, 
  Video, 
  BarChart2, 
  Trophy, 
  Calendar, 
  X, 
  Upload, 
  Eye, 
  CheckCircle2, 
  ShieldCheck, 
  Smile, 
  User,
  Medal,
  MoreHorizontal,
  Volume2,
  VolumeX,
  Play,
  Pause,
  TrendingUp,
  Compass,
  Users,
  Check,
  Search,
  Zap,
  Award,
  Flag,
  Copy,
  Home,
  Film,
  Edit3
} from 'lucide-react';

interface CommunityFeedProps {
  posts: CommunityPost[];
  players: PlayerProfile[];
  currentRole: string;
  currentUserAccount?: UserAccount | null;
  onUpvotePost: (postId: string) => void;
  onAddPost: (post: Partial<CommunityPost>) => void;
  onSelectPlayer: (player: PlayerProfile) => void;
  onRequireAuth: () => void;
  onOpenRecorder?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const CommunityFeed: React.FC<CommunityFeedProps> = ({
  posts,
  players,
  currentRole,
  currentUserAccount,
  onUpvotePost,
  onAddPost,
  onSelectPlayer,
  onRequireAuth,
  onOpenRecorder,
  onNavigateTab
}) => {
  // Feed Filter Tabs
  const [activeFeedTab, setActiveFeedTab] = useState<'FOR_YOU' | 'FOLLOWING' | 'TRENDING' | 'NEAR_YOU' | 'REELS'>('FOR_YOU');
  
  // Followed Users State
  const [followedUserIds, setFollowedUserIds] = useState<Set<string>>(new Set(['player-01', 'player-02']));

  // Module 4 Creation & Edit Modal States
  const [isCreateContentModalOpen, setIsCreateContentModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<CommunityPost | null>(null);

  // Post Composer Modal State
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerMode, setComposerMode] = useState<'TEXT_POST' | 'PHOTO' | 'MATCH_STATS' | 'PLAYER_VIDEO'>('TEXT_POST');
  
  // Form Inputs
  const [caption, setCaption] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<string>('');
  const [selectedVideoThumbnail, setSelectedVideoThumbnail] = useState<string>('');
  
  // Match Stats Inputs
  const [opponent, setOpponent] = useState('');
  const [matchScore, setMatchScore] = useState('2 - 1');
  const [matchResult, setMatchResult] = useState<'WON' | 'LOST' | 'DRAW'>('WON');
  const [goals, setGoals] = useState<number>(1);
  const [assists, setAssists] = useState<number>(0);
  const [matchVenue, setMatchVenue] = useState('Kochi Municipal Turf Ground');
  const [isMotm, setIsMotm] = useState<boolean>(false);
  const [tackles, setTackles] = useState<number>(3);
  const [passPct, setPassPct] = useState<number>(85);

  // File upload ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Comments, Saved Bookmarks & Share Modal State
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState('');
  const [savedPostIds, setSavedPostIds] = useState<Set<string>>(new Set(['post-2']));
  const [shareModalPost, setShareModalPost] = useState<CommunityPost | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // Double Tap Heart Animation State
  const [doubleTapHeartPostId, setDoubleTapHeartPostId] = useState<string | null>(null);

  // Video Reel Play / Pause & Mute States
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(true);

  // Content Moderation / Reported Posts
  const [reportedPostIds, setReportedPostIds] = useState<Set<string>>(new Set());
  const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null);

  // Instagram Story Modal State
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [storyProgress, setStoryProgress] = useState<number>(0);
  const [storyLiked, setStoryLiked] = useState<boolean>(false);

  // Instagram Stories Mock Data
  const INSTAGRAM_STORIES = [
    {
      id: 'your-story',
      isUser: true,
      name: 'Your Story',
      photo: currentUserAccount?.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
      storyMedia: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=800',
      caption: 'Warmup session before AI Trial assessment! ⚽🔥',
      time: 'Just now',
      hasUnseen: false
    },
    {
      id: 'story-1',
      name: 'Rahul M.',
      handle: '@rahulfootball',
      photo: 'https://images.unsplash.com/photo-1543351611-58f69d7c1781?auto=format&fit=crop&q=80&w=300',
      storyMedia: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=800',
      caption: 'Top corner free-kick goal at Kozhikode Regional Ground! 🚀',
      time: '2h ago',
      hasUnseen: true
    },
    {
      id: 'story-2',
      name: 'Amanpreet S.',
      handle: '@aman_speedster',
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
      storyMedia: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800',
      caption: 'Night turf match with Punjab Youth Squad ✨ 30m sprint peak velocity!',
      time: '4h ago',
      hasUnseen: true
    },
    {
      id: 'story-3',
      name: 'Sanathoi K.',
      handle: '@sanathoi_mf',
      photo: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&q=80&w=300',
      storyMedia: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&q=80&w=800',
      caption: 'Cone dribble AI score: 89 / 100 ⚡ West Bengal Trials',
      time: '5h ago',
      hasUnseen: true
    },
    {
      id: 'story-4',
      name: 'Malabar FC',
      handle: '@malabarfc',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
      storyMedia: 'https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&q=80&w=800',
      caption: 'Scouting trials open in Ernakulam & Kozhikode for U17 🎯',
      time: '7h ago',
      hasUnseen: false
    }
  ];

  // Story Progress Timer Effect
  useEffect(() => {
    if (activeStoryIndex === null) return;

    setStoryProgress(0);
    setStoryLiked(false);

    const interval = setInterval(() => {
      setStoryProgress(prev => {
        if (prev >= 100) {
          if (activeStoryIndex < INSTAGRAM_STORIES.length - 1) {
            setActiveStoryIndex(activeStoryIndex + 1);
            return 0;
          } else {
            setActiveStoryIndex(null);
            return 100;
          }
        }
        return prev + 2.5;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [activeStoryIndex]);

  // Preset Football Images for quick selection
  const PHOTO_PRESETS = [
    { label: 'Match Day Action', url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=800' },
    { label: 'Team Huddle', url: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&q=80&w=800' },
    { label: 'Night Turf Match', url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800' },
    { label: 'Training Ground', url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=800' },
  ];

  const toggleFollowUser = (authorId: string) => {
    if (currentRole === 'GUEST') {
      onRequireAuth();
      return;
    }
    setFollowedUserIds(prev => {
      const next = new Set(prev);
      if (next.has(authorId)) next.delete(authorId);
      else next.add(authorId);
      return next;
    });
  };

  const handleOpenComposer = (mode?: 'TEXT_POST' | 'PHOTO' | 'MATCH_STATS' | 'PLAYER_VIDEO') => {
    if (currentRole === 'GUEST') {
      onRequireAuth();
      return;
    }
    if (currentUserAccount) {
      setIsCreateContentModalOpen(true);
    } else {
      setComposerMode(mode || 'TEXT_POST');
      setIsComposerOpen(true);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          if (composerMode === 'PHOTO') {
            setSelectedPhoto(reader.result);
          } else if (composerMode === 'PLAYER_VIDEO') {
            setSelectedVideoThumbnail(reader.result);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentRole === 'GUEST') {
      onRequireAuth();
      return;
    }

    if (!caption.trim() && composerMode === 'TEXT_POST') return;

    const authorDisplayName = currentUserAccount?.displayName || 'Digital Scout Member';
    const authorState = currentUserAccount?.state || 'Kerala';
    const authorPhoto = currentUserAccount?.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300';
    const isPlayer = currentUserAccount?.qualificationStatus === 'PASSED' || currentRole === 'PLAYER';

    if (composerMode === 'MATCH_STATS') {
      onAddPost({
        title: caption.trim() || `Match Log vs ${opponent || 'Opponent FC'}: ${matchScore}`,
        postType: 'MATCH_STATS',
        category: 'MATCH_STATS',
        authorName: authorDisplayName,
        authorHandle: `@${authorDisplayName.toLowerCase().replace(/\s+/g, '')}`,
        authorPhoto: authorPhoto,
        authorState: authorState,
        authorTier: isPlayer ? 'SILVER' : 'UNRANKED',
        matchStats: {
          opponent: opponent || 'Local Rival FC',
          matchScore: matchScore || '2 - 1',
          result: matchResult,
          goals: Number(goals) || 0,
          assists: Number(assists) || 0,
          matchDate: new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }),
          venue: matchVenue || 'Kochi Municipal Turf',
          isManOfTheMatch: isMotm,
          tackles: Number(tackles) || 0,
          passesCompletedPct: Number(passPct) || 80
        }
      });
    } else if (composerMode === 'PHOTO') {
      onAddPost({
        title: caption.trim() || 'Football Match Action Photo!',
        postType: 'PHOTO',
        category: 'PHOTOS',
        authorName: authorDisplayName,
        authorHandle: `@${authorDisplayName.toLowerCase().replace(/\s+/g, '')}`,
        authorPhoto: authorPhoto,
        authorState: authorState,
        authorTier: isPlayer ? 'SILVER' : 'UNRANKED',
        imageUrl: selectedPhoto || PHOTO_PRESETS[0].url
      });
    } else if (composerMode === 'PLAYER_VIDEO') {
      onAddPost({
        title: caption.trim() || 'Football Highlight Reel!',
        postType: 'PLAYER_VIDEO',
        category: 'FOR_YOU',
        authorName: authorDisplayName,
        authorHandle: `@${authorDisplayName.toLowerCase().replace(/\s+/g, '')}`,
        authorPhoto: authorPhoto,
        authorState: authorState,
        authorTier: isPlayer ? 'SILVER' : 'UNRANKED',
        videoThumbnail: selectedVideoThumbnail || PHOTO_PRESETS[0].url
      });
    } else {
      onAddPost({
        title: caption.trim(),
        postType: 'TEXT_POST',
        category: 'FOR_YOU',
        authorName: authorDisplayName,
        authorHandle: `@${authorDisplayName.toLowerCase().replace(/\s+/g, '')}`,
        authorPhoto: authorPhoto,
        authorState: authorState,
        authorTier: isPlayer ? 'SILVER' : 'UNRANKED'
      });
    }

    // Reset Form
    setCaption('');
    setOpponent('');
    setIsComposerOpen(false);
  };

  const handleUpvote = (postId: string) => {
    if (currentRole === 'GUEST') {
      onRequireAuth();
      return;
    }
    onUpvotePost(postId);
  };

  // Double Tap Media to Like (Instagram / TikTok Feature)
  const handleDoubleTapPost = (postId: string) => {
    setDoubleTapHeartPostId(postId);
    onUpvotePost(postId);
    setTimeout(() => {
      setDoubleTapHeartPostId(null);
    }, 900);
  };

  const toggleSavePost = (postId: string) => {
    if (currentRole === 'GUEST') {
      onRequireAuth();
      return;
    }
    setSavedPostIds(prev => {
      const updated = new Set(prev);
      if (updated.has(postId)) {
        updated.delete(postId);
      } else {
        updated.add(postId);
      }
      return updated;
    });
  };

  const handleAddComment = (postId: string) => {
    if (currentRole === 'GUEST') {
      onRequireAuth();
      return;
    }
    if (!commentInput.trim()) return;

    const targetPost = posts.find(p => p.id === postId);
    if (targetPost) {
      if (!targetPost.comments) targetPost.comments = [];
      targetPost.comments.push({
        id: `c-${Date.now()}`,
        authorName: currentUserAccount?.displayName || 'You',
        authorPhoto: currentUserAccount?.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
        text: commentInput,
        timestamp: 'Just now'
      });
      targetPost.commentsCount = (targetPost.commentsCount || 0) + 1;
    }
    setCommentInput('');
  };

  const handleReportPost = (postId: string) => {
    setReportedPostIds(prev => new Set(prev).add(postId));
    setActiveMenuPostId(null);
  };

  const handlePlayerClick = (authorId: string, authorName: string) => {
    const matchedPlayer = players.find(p => p.id === authorId || p.name.toLowerCase() === authorName.toLowerCase()) || players[0];
    onSelectPlayer(matchedPlayer);
  };

  // Rank posts using RuleBasedRecommendationService
  const userState = currentUserAccount?.state || 'Kerala';
  const rankedPosts = RuleBasedRecommendationService.rankPosts(posts, userState, followedUserIds);

  const filteredPosts = rankedPosts.filter(post => {
    if (reportedPostIds.has(post.id)) return false;
    if (activeFeedTab === 'FOR_YOU') return true;
    if (activeFeedTab === 'FOLLOWING') return followedUserIds.has(post.authorId);
    if (activeFeedTab === 'TRENDING') return post.likesCount > 800 || (post.viewsCount && post.viewsCount > 1000) || post.postType === 'TRIAL_RESULT';
    if (activeFeedTab === 'NEAR_YOU') return post.authorState && post.authorState.toLowerCase() === userState.toLowerCase();
    if (activeFeedTab === 'REELS') return post.postType === 'PLAYER_VIDEO' || post.postType === 'FREESTYLE' || post.videoThumbnail;
    return true;
  });

  return (
    <div className="w-full">
      
      {/* 3-COLUMN DESKTOP / RESPONSIVE SOCIAL LAYOUT */}
      <div className="flex gap-6 items-start max-w-7xl mx-auto">
        
        {/* ======================================================== */}
        {/* COLUMN 1: LEFT NAVIGATION SIDEBAR (DESKTOP) */}
        {/* ======================================================== */}
        <div className="hidden lg:flex flex-col w-60 shrink-0 sticky top-20 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl p-4 space-y-5 shadow-2xl">
          
          <div className="space-y-1">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider px-3">
              Social Feed
            </h3>
            <p className="text-[10px] text-slate-500 px-3">Discover Indian Football</p>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveFeedTab('FOR_YOU')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
                activeFeedTab === 'FOR_YOU'
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>For You Feed</span>
            </button>

            <button
              onClick={() => setActiveFeedTab('REELS')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
                activeFeedTab === 'REELS'
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Film className="w-4 h-4 text-teal-400" />
              <span>Reels & Shorts</span>
              <span className="ml-auto text-[9px] bg-teal-400/20 text-teal-300 px-1.5 py-0.5 rounded font-black">HOT</span>
            </button>

            <button
              onClick={() => setActiveFeedTab('FOLLOWING')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
                activeFeedTab === 'FOLLOWING'
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Following</span>
              <span className="ml-auto text-[10px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-400">{followedUserIds.size}</span>
            </button>

            <button
              onClick={() => setActiveFeedTab('TRENDING')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
                activeFeedTab === 'TRENDING'
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Trending Viral</span>
            </button>

            <button
              onClick={() => setActiveFeedTab('NEAR_YOU')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
                activeFeedTab === 'NEAR_YOU'
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Grassroots ({userState})</span>
            </button>
          </nav>

          <div className="pt-2 border-t border-slate-800 space-y-2">
            <button
              onClick={() => handleOpenComposer('TEXT_POST')}
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Create Post</span>
            </button>

            <button
              onClick={() => {
                if (currentRole === 'GUEST') onRequireAuth();
                else if (onOpenRecorder) onOpenRecorder();
              }}
              className="w-full py-2.5 px-3 bg-slate-950 hover:bg-slate-800 border border-emerald-500/30 text-emerald-300 font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Start AI Trial</span>
            </button>
          </div>

          {/* Quick User Card */}
          <div className="pt-3 border-t border-slate-800 flex items-center gap-2.5 px-1">
            <img
              src={currentUserAccount?.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300'}
              alt="User"
              className="w-9 h-9 rounded-full object-cover border border-slate-700"
            />
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-white truncate">
                {currentUserAccount?.displayName || (currentRole === 'PLAYER' ? 'Player Profile' : 'Community Member')}
              </h4>
              <p className="text-[10px] text-emerald-400 font-semibold truncate">
                {currentUserAccount?.qualificationStatus === 'PASSED' || currentRole === 'PLAYER' ? '⚽ Verified Player' : '⚽ Community User'}
              </p>
            </div>
          </div>

        </div>

        {/* ======================================================== */}
        {/* COLUMN 2: CENTER MAIN FEED & REELS STREAM */}
        {/* ======================================================== */}
        <div className="flex-1 max-w-xl mx-auto space-y-5 pb-24">
          
          {/* 1. INSTAGRAM STORIES TRAY */}
          <div className="bg-slate-950 border border-slate-800/90 rounded-3xl p-3 sm:p-4 shadow-2xl overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-4 min-w-max">
              
              {INSTAGRAM_STORIES.map((story, idx) => {
                return (
                  <div
                    key={story.id}
                    onClick={() => {
                      if (story.isUser && currentRole === 'GUEST') {
                        onRequireAuth();
                      } else {
                        setActiveStoryIndex(idx);
                      }
                    }}
                    className="flex flex-col items-center gap-1.5 cursor-pointer group shrink-0"
                  >
                    <div className={`relative p-[2.5px] rounded-full transition-transform group-hover:scale-105 ${
                      story.hasUnseen || story.isUser
                        ? 'bg-gradient-to-tr from-amber-500 via-rose-500 to-fuchsia-600 shadow-md shadow-rose-500/20'
                        : 'bg-slate-800 opacity-70'
                    }`}>
                      <img
                        src={story.photo}
                        alt={story.name}
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-slate-950"
                      />
                      {story.isUser && (
                        <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-rose-500 border-2 border-slate-950 flex items-center justify-center text-white font-black text-xs">
                          +
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] font-semibold text-slate-300 max-w-[68px] truncate text-center">
                      {story.name}
                    </span>
                  </div>
                );
              })}

            </div>
          </div>

          {/* 2. INSTAGRAM STORY VIEWER MODAL */}
          {activeStoryIndex !== null && (
            <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-lg flex items-center justify-center p-0 sm:p-4">
              <div className="relative w-full max-w-sm h-full sm:h-[680px] bg-slate-900 rounded-none sm:rounded-3xl overflow-hidden flex flex-col justify-between shadow-2xl border border-slate-800">
                
                {/* Background Story Image */}
                <img
                  src={INSTAGRAM_STORIES[activeStoryIndex].storyMedia}
                  alt="Story"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-transparent to-slate-950/90" />

                {/* Top Controls & Story Progress Bar */}
                <div className="relative z-10 p-3 sm:p-4 space-y-3">
                  {/* Progress Bar Segment */}
                  <div className="flex items-center gap-1">
                    {INSTAGRAM_STORIES.map((_, i) => (
                      <div key={i} className="flex-1 h-1 bg-slate-800/80 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-white transition-all duration-100"
                          style={{
                            width: i < activeStoryIndex ? '100%' : i === activeStoryIndex ? `${storyProgress}%` : '0%'
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* User Bar */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={INSTAGRAM_STORIES[activeStoryIndex].photo}
                        alt="Story user"
                        className="w-9 h-9 rounded-full object-cover border-2 border-emerald-400"
                      />
                      <div>
                        <h4 className="font-bold text-white text-xs drop-shadow">
                          {INSTAGRAM_STORIES[activeStoryIndex].name}
                        </h4>
                        <p className="text-[10px] text-slate-300 drop-shadow">
                          {INSTAGRAM_STORIES[activeStoryIndex].time}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveStoryIndex(null)}
                      className="p-1.5 rounded-full bg-slate-950/60 text-white hover:bg-slate-950 transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Tap Navigation Hotspots */}
                <div className="absolute inset-y-16 inset-x-0 z-0 flex">
                  <div
                    onClick={() => {
                      if (activeStoryIndex > 0) setActiveStoryIndex(activeStoryIndex - 1);
                    }}
                    className="w-1/2 h-full cursor-pointer"
                  />
                  <div
                    onClick={() => {
                      if (activeStoryIndex < INSTAGRAM_STORIES.length - 1) setActiveStoryIndex(activeStoryIndex + 1);
                      else setActiveStoryIndex(null);
                    }}
                    className="w-1/2 h-full cursor-pointer"
                  />
                </div>

                {/* Bottom Caption & Interactive Reply Input */}
                <div className="relative z-10 p-4 space-y-3">
                  <p className="text-sm font-bold text-white drop-shadow-md">
                    {INSTAGRAM_STORIES[activeStoryIndex].caption}
                  </p>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={`Reply to ${INSTAGRAM_STORIES[activeStoryIndex].name}...`}
                      className="flex-1 bg-slate-950/80 border border-slate-700/80 text-white px-4 py-2.5 rounded-full text-xs backdrop-blur-md focus:border-rose-500 focus:outline-none"
                    />
                    <button
                      onClick={() => setStoryLiked(!storyLiked)}
                      className="p-2.5 bg-slate-950/80 border border-slate-700/80 rounded-full text-rose-500 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Heart className={`w-5 h-5 ${storyLiked ? 'fill-rose-500 text-rose-500' : 'text-white'}`} />
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* 3. POST COMPOSER TRIGGER BOX */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-3.5 sm:p-4 space-y-3 shadow-xl">
            
            {/* Top Prompt Row */}
            <div className="flex items-center gap-3">
              <div className="p-[2px] bg-gradient-to-tr from-amber-500 via-rose-500 to-fuchsia-600 rounded-full shrink-0">
                <img
                  src={currentUserAccount?.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300'}
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover border border-slate-950"
                />
              </div>
              <button
                onClick={() => handleOpenComposer('TEXT_POST')}
                className="flex-1 text-left bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-slate-400 text-xs sm:text-sm py-2.5 px-4 rounded-full transition-all cursor-pointer truncate"
              >
                {currentUserAccount?.displayName 
                  ? `Share a post, ${currentUserAccount.firstName}...`
                  : "What's happening in your football world? Post photo, reel or stats..."}
              </button>
            </div>

            {/* Action Bar */}
            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800/80">
              <button
                onClick={() => handleOpenComposer('PHOTO')}
                className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-950 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/40 text-rose-400 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Photo</span>
              </button>

              <button
                onClick={() => handleOpenComposer('MATCH_STATS')}
                className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-950 hover:bg-amber-950/40 border border-slate-800 hover:border-amber-500/40 text-amber-400 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>Match</span>
              </button>

              <button
                onClick={() => handleOpenComposer('PLAYER_VIDEO')}
                className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-950 hover:bg-teal-950/40 border border-slate-800 hover:border-teal-500/40 text-teal-400 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Reels</span>
              </button>

              <button
                onClick={() => {
                  if (currentRole === 'GUEST') onRequireAuth();
                  else if (onOpenRecorder) onOpenRecorder();
                }}
                className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-500/10"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Trial</span>
              </button>
            </div>

            {/* Category Sub-Tabs Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 no-scrollbar border-t border-slate-800/80">
              <button
                onClick={() => setActiveFeedTab('FOR_YOU')}
                className={`px-3 py-1 rounded-full text-xs font-extrabold tracking-wide whitespace-nowrap transition-all cursor-pointer ${
                  activeFeedTab === 'FOR_YOU'
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                FOR YOU ⚽
              </button>

              <button
                onClick={() => setActiveFeedTab('REELS')}
                className={`px-3 py-1 rounded-full text-xs font-extrabold tracking-wide whitespace-nowrap transition-all cursor-pointer ${
                  activeFeedTab === 'REELS'
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                REELS / SHORTS 📹
              </button>

              <button
                onClick={() => setActiveFeedTab('FOLLOWING')}
                className={`px-3 py-1 rounded-full text-xs font-extrabold tracking-wide whitespace-nowrap transition-all cursor-pointer ${
                  activeFeedTab === 'FOLLOWING'
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                FOLLOWING 👥
              </button>

              <button
                onClick={() => setActiveFeedTab('TRENDING')}
                className={`px-3 py-1 rounded-full text-xs font-extrabold tracking-wide whitespace-nowrap transition-all cursor-pointer ${
                  activeFeedTab === 'TRENDING'
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                TRENDING 🔥
              </button>

              <button
                onClick={() => setActiveFeedTab('NEAR_YOU')}
                className={`px-3 py-1 rounded-full text-xs font-extrabold tracking-wide whitespace-nowrap transition-all cursor-pointer ${
                  activeFeedTab === 'NEAR_YOU'
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                NEAR YOU 📍
              </button>
            </div>

          </div>

          {/* 4. REELS / SHORTS FULL-HEIGHT VIEW (IF REELS TAB IS SELECTED) */}
          {activeFeedTab === 'REELS' ? (
            <div className="space-y-6">
              {filteredPosts.map(post => {
                const isFollowing = followedUserIds.has(post.authorId);
                const isSaved = savedPostIds.has(post.id);
                const isVideoPlaying = playingVideoId === post.id;
                const authorHandle = post.authorHandle || `@${post.authorName.toLowerCase().replace(/\s+/g, '')}`;

                return (
                  <div
                    key={post.id}
                    className="relative w-full h-[620px] bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between group"
                  >
                    {/* Background Media */}
                    <img
                      src={post.videoThumbnail || post.imageUrl || 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=800'}
                      alt={post.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-transparent to-slate-950/95" />

                    {/* Double Tap Heart Animation Overlay */}
                    {doubleTapHeartPostId === post.id && (
                      <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/20 backdrop-blur-[1px] animate-ping">
                        <Heart className="w-24 h-24 text-rose-500 fill-rose-500 drop-shadow-2xl" />
                      </div>
                    )}

                    {/* Top Bar Overlay */}
                    <div className="relative z-10 p-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full bg-rose-500/80 text-white font-extrabold text-[10px] tracking-wider uppercase backdrop-blur-md flex items-center gap-1">
                          <Film className="w-3 h-3" /> Reel
                        </span>
                        {post.footballStats?.aiVerified && (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/80 text-slate-950 font-black text-[10px] backdrop-blur-md flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> AI Verified
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => setIsMuted(!isMuted)}
                        className="p-2.5 rounded-full bg-slate-950/70 border border-slate-700/80 text-white hover:bg-slate-900 transition-colors cursor-pointer backdrop-blur-md"
                      >
                        {isMuted ? <VolumeX className="w-4 h-4 text-slate-300" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                      </button>
                    </div>

                    {/* Center Tap Hotspot to Play/Pause & Double Tap */}
                    <div
                      onClick={() => setPlayingVideoId(isVideoPlaying ? null : post.id)}
                      onDoubleClick={() => handleDoubleTapPost(post.id)}
                      className="absolute inset-20 z-0 flex items-center justify-center cursor-pointer select-none"
                    >
                      {!isVideoPlaying && (
                        <div className="w-16 h-16 rounded-full bg-slate-950/70 border border-white/20 text-white flex items-center justify-center font-black shadow-2xl group-hover:scale-110 transition-transform backdrop-blur-md">
                          <Play className="w-8 h-8 ml-1 fill-white" />
                        </div>
                      )}
                    </div>

                    {/* Right Vertical Action Bar (TikTok / Reels Style) */}
                    <div className="absolute right-3 bottom-16 z-20 flex flex-col items-center gap-4">
                      
                      {/* Author Avatar + Quick Follow */}
                      <div className="relative mb-2">
                        <img
                          src={post.authorPhoto}
                          alt={post.authorName}
                          onClick={() => handlePlayerClick(post.authorId, post.authorName)}
                          className="w-11 h-11 rounded-full object-cover border-2 border-emerald-400 cursor-pointer hover:scale-105 transition-transform"
                        />
                        <button
                          onClick={() => toggleFollowUser(post.authorId)}
                          className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-black shadow cursor-pointer ${
                            isFollowing ? 'bg-slate-800 text-slate-400' : 'bg-rose-500 text-white'
                          }`}
                        >
                          {isFollowing ? '✓' : '+'}
                        </button>
                      </div>

                      {/* Upvote Button */}
                      <button
                        onClick={() => handleUpvote(post.id)}
                        className="flex flex-col items-center cursor-pointer group"
                      >
                        <div className={`p-3 rounded-full backdrop-blur-md border transition-transform group-hover:scale-110 ${
                          post.upvotedByMe
                            ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/30'
                            : 'bg-slate-950/70 text-slate-200 border-slate-700/80 hover:text-rose-400'
                        }`}>
                          <Heart className={`w-5 h-5 ${post.upvotedByMe ? 'fill-white' : ''}`} />
                        </div>
                        <span className="text-[10px] font-black text-white mt-1 drop-shadow">
                          {(post.likesCount || 0).toLocaleString()}
                        </span>
                      </button>

                      {/* Comments Button */}
                      <button
                        onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)}
                        className="flex flex-col items-center cursor-pointer group"
                      >
                        <div className="p-3 rounded-full bg-slate-950/70 border border-slate-700/80 text-slate-200 hover:text-white backdrop-blur-md transition-transform group-hover:scale-110">
                          <MessageSquare className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black text-white mt-1 drop-shadow">
                          {post.commentsCount || 12}
                        </span>
                      </button>

                      {/* Share Button */}
                      <button
                        onClick={() => setShareModalPost(post)}
                        className="flex flex-col items-center cursor-pointer group"
                      >
                        <div className="p-3 rounded-full bg-slate-950/70 border border-slate-700/80 text-slate-200 hover:text-white backdrop-blur-md transition-transform group-hover:scale-110">
                          <Send className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black text-white mt-1 drop-shadow">
                          {post.sharesCount || 34}
                        </span>
                      </button>

                      {/* Save Button */}
                      <button
                        onClick={() => toggleSavePost(post.id)}
                        className="flex flex-col items-center cursor-pointer group"
                      >
                        <div className={`p-3 rounded-full backdrop-blur-md border transition-transform group-hover:scale-110 ${
                          isSaved
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : 'bg-slate-950/70 text-slate-200 border-slate-700/80 hover:text-amber-400'
                        }`}>
                          <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-slate-950' : ''}`} />
                        </div>
                      </button>

                    </div>

                    {/* Bottom Info Overlay */}
                    <div className="relative z-10 p-4 sm:p-5 pr-16 space-y-2">
                      
                      {/* Football Identity Badge */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => handlePlayerClick(post.authorId, post.authorName)}
                          className="font-extrabold text-white text-sm hover:underline cursor-pointer flex items-center gap-1.5 drop-shadow"
                        >
                          <span>{post.authorName}</span>
                          <span className="text-xs text-slate-300 font-normal">{authorHandle}</span>
                        </button>

                        {post.authorTier && post.authorTier !== 'UNRANKED' ? (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase flex items-center gap-1 backdrop-blur-md">
                            ⚽ PLAYER • {post.authorTier}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 text-[10px] font-bold backdrop-blur-md">
                            Community Member
                          </span>
                        )}
                      </div>

                      {/* Location & Score */}
                      <p className="text-[11px] text-slate-300 flex items-center gap-2 font-semibold drop-shadow">
                        <span className="flex items-center gap-1 text-emerald-400">
                          <MapPin className="w-3 h-3" /> {post.authorState || 'Kerala'}
                        </span>
                        {post.authorPosition && (
                          <>
                            <span>•</span>
                            <span>{post.authorAgeGroup || 'U17'} {post.authorPosition}</span>
                          </>
                        )}
                      </p>

                      {/* Post Caption */}
                      <p className="text-xs font-semibold text-white leading-relaxed drop-shadow line-clamp-2">
                        {post.title}
                      </p>

                    </div>

                  </div>
                );
              })}
            </div>
          ) : (
            
            /* 5. STANDARD INSTAGRAM / TIKTOK HYBRID FEED STREAM CARDS */
            <div className="space-y-6">
              {filteredPosts.map(post => {
                const isFollowing = followedUserIds.has(post.authorId);
                const isSaved = savedPostIds.has(post.id);
                const authorHandle = post.authorHandle || `@${post.authorName.toLowerCase().replace(/\s+/g, '')}`;

                return (
                  <div
                    key={post.id}
                    className="bg-slate-950 border border-slate-800/90 rounded-3xl overflow-hidden shadow-2xl space-y-3 transition-all"
                  >
                    
                    {/* POST HEADER WITH VERIFIED FOOTBALL IDENTITY */}
                    <div className="flex items-center justify-between p-3.5 pb-1">
                      <div
                        onClick={() => handlePlayerClick(post.authorId, post.authorName)}
                        className="flex items-center gap-2.5 cursor-pointer group"
                      >
                        {/* Instagram Gradient Ring */}
                        <div className="p-[2px] bg-gradient-to-tr from-amber-500 via-rose-500 to-fuchsia-600 rounded-full shrink-0">
                          <img
                            src={post.authorPhoto}
                            alt={post.authorName}
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-slate-950"
                          />
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-extrabold text-white text-xs sm:text-sm group-hover:text-rose-400 transition-colors">
                              {post.authorName}
                            </h4>
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 fill-blue-500/20" />
                            
                            {/* VERIFIED PLAYER IDENTITY BADGE */}
                            {post.authorTier && post.authorTier !== 'UNRANKED' ? (
                              <span className="px-2 py-0.2 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-black uppercase flex items-center gap-1">
                                ⚽ PLAYER • {post.authorTier}
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 text-[9px] font-bold">
                                Member
                              </span>
                            )}
                          </div>

                          <p className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span className="text-emerald-400 font-bold">{post.authorState || 'Kerala'}</span>
                            {post.authorPosition && (
                              <>
                                <span>•</span>
                                <span>{post.authorAgeGroup || 'U17'} {post.authorPosition}</span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleFollowUser(post.authorId)}
                          className={`px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer ${
                            isFollowing
                              ? 'bg-slate-800 text-slate-300 border border-slate-700'
                              : 'bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/20'
                          }`}
                        >
                          {isFollowing ? 'Following' : 'Follow'}
                        </button>
                        
                        <button
                          onClick={() => setActiveMenuPostId(activeMenuPostId === post.id ? null : post.id)}
                          className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer relative"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                          
                          {/* Menu Popup */}
                          {activeMenuPostId === post.id && (
                            <div className="absolute right-0 top-6 z-30 w-36 bg-slate-900 border border-slate-700 rounded-xl shadow-xl p-1 space-y-1">
                              {(post.authorId === currentUserAccount?.id || currentUserAccount?.id === 'usr-demo') && (
                                <button
                                  onClick={() => {
                                    setEditingPost(post);
                                    setActiveMenuPostId(null);
                                  }}
                                  className="w-full text-left px-3 py-1.5 text-[11px] font-bold text-slate-200 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Edit3 className="w-3 h-3 text-emerald-400" /> Edit Post
                                </button>
                              )}
                              <button
                                onClick={() => handleReportPost(post.id)}
                                className="w-full text-left px-3 py-1.5 text-[11px] font-bold text-rose-400 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 cursor-pointer"
                              >
                                <Flag className="w-3 h-3" /> Report Post
                              </button>
                            </div>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* POST MEDIA & CONTENT CARD (DOUBLE TAP TO LIKE) */}
                    <div
                      onDoubleClick={() => handleDoubleTapPost(post.id)}
                      className="relative bg-slate-900 overflow-hidden cursor-pointer select-none group"
                    >
                      {/* DOUBLE TAP HEART OVERLAY ANIMATION */}
                      {doubleTapHeartPostId === post.id && (
                        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/20 backdrop-blur-[1px] animate-ping">
                          <Heart className="w-24 h-24 text-rose-500 fill-rose-500 drop-shadow-2xl" />
                        </div>
                      )}

                      {/* A. PHOTO POST */}
                      {post.imageUrl && (
                        <div className="aspect-square sm:aspect-[4/5] max-h-[480px] w-full bg-slate-950">
                          <img
                            src={post.imageUrl}
                            alt={post.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {/* B. SPECIAL AI TRIAL RESULT POST CARD (US-014) */}
                      {post.postType === 'TRIAL_RESULT' && post.footballStats && (
                        <div className="p-5 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 border-y border-slate-800 space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shadow">
                              <Trophy className="w-3.5 h-3.5 text-emerald-400" />
                              VERIFIED AI TRIAL RESULT
                            </span>
                            <span className="text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                              🥈 SILVER BADGE
                            </span>
                          </div>

                          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                              <div>
                                <p className="text-[10px] text-slate-400 uppercase font-bold">Assessment Drill</p>
                                <p className="text-sm font-extrabold text-white">{post.footballStats.drillTitle || 'Continuous Ball Juggling'}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] text-slate-400 uppercase font-bold">Overall Score</p>
                                <p className="text-xl font-black text-emerald-400">{post.footballStats.overallScore || 84} / 100</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-4 gap-2 text-center">
                              <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
                                <p className="text-[9px] text-slate-400 font-bold uppercase">Control</p>
                                <p className="text-xs font-black text-amber-300">{post.footballStats.ballControl || 86}</p>
                              </div>
                              <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
                                <p className="text-[9px] text-slate-400 font-bold uppercase">Agility</p>
                                <p className="text-xs font-black text-emerald-400">{post.footballStats.agility || 91}</p>
                              </div>
                              <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
                                <p className="text-[9px] text-slate-400 font-bold uppercase">Speed</p>
                                <p className="text-xs font-black text-teal-300">{post.footballStats.speedMs || '7.8 m/s'}</p>
                              </div>
                              <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
                                <p className="text-[9px] text-slate-400 font-bold uppercase">Status</p>
                                <p className="text-xs font-black text-blue-400 flex items-center justify-center gap-0.5">
                                  <ShieldCheck className="w-3 h-3" /> Verified
                                </p>
                              </div>
                            </div>
                          </div>

                          {post.videoThumbnail && (
                            <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-800">
                              <img src={post.videoThumbnail} alt="Trial Video" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center">
                                <div className="w-12 h-12 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-black shadow-xl group-hover:scale-110 transition-transform">
                                  ▶
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* C. MATCH STATS CARD */}
                      {post.matchStats && (
                        <div className="p-4 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              🏆 MATCH LOG CARD
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {post.matchStats.matchDate || 'Aug 2026'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between px-3 py-2 bg-slate-950 rounded-2xl border border-slate-800">
                            <div className="text-left">
                              <p className="text-xs font-bold text-white">{post.authorName}</p>
                              <p className="text-[10px] text-emerald-400 font-semibold">{post.authorState} XI</p>
                            </div>

                            <div className="text-center px-4 py-1 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                              <p className="text-base font-black text-amber-300 tracking-wider">{post.matchStats.matchScore}</p>
                              <p className="text-[9px] text-slate-400 uppercase font-bold">vs {post.matchStats.opponent}</p>
                            </div>

                            <div className="text-right">
                              <p className="text-xs font-bold text-slate-300">{post.matchStats.opponent}</p>
                              <p className="text-[10px] text-slate-500">Rival FC</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-4 gap-2 text-center text-xs">
                            <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                              <p className="text-[9px] text-slate-500 font-bold uppercase">Goals</p>
                              <p className="font-black text-amber-400 text-sm">⚽ {post.matchStats.goals}</p>
                            </div>
                            <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                              <p className="text-[9px] text-slate-500 font-bold uppercase">Assists</p>
                              <p className="font-black text-emerald-400 text-sm">🅰️ {post.matchStats.assists}</p>
                            </div>
                            <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                              <p className="text-[9px] text-slate-500 font-bold uppercase">Tackles</p>
                              <p className="font-black text-teal-400 text-sm">🛡️ {post.matchStats.tackles || 3}</p>
                            </div>
                            <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                              <p className="text-[9px] text-slate-500 font-bold uppercase">Pass Acc</p>
                              <p className="font-black text-blue-400 text-sm">🎯 {post.matchStats.passesCompletedPct || 85}%</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* D. VIDEO REEL / FREESTYLE */}
                      {post.videoThumbnail && !post.imageUrl && post.postType !== 'TRIAL_RESULT' && (
                        <div className="aspect-square sm:aspect-[4/5] max-h-[480px] w-full bg-slate-950 relative">
                          <img
                            src={post.videoThumbnail}
                            alt={post.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-slate-950/20 flex items-center justify-center">
                            <div className="w-14 h-14 rounded-full bg-rose-500/90 text-white flex items-center justify-center font-black shadow-2xl group-hover:scale-110 transition-transform">
                              ▶
                            </div>
                          </div>
                        </div>
                      )}

                    </div>

                    {/* INSTAGRAM ACTION BAR (LIKE, COMMENT, SHARE, BOOKMARK) */}
                    <div className="px-4 space-y-2 pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => handleUpvote(post.id)}
                            className="text-slate-200 hover:text-rose-500 transition-colors cursor-pointer"
                          >
                            <Heart className={`w-6 h-6 ${post.upvotedByMe ? 'fill-rose-500 text-rose-500' : ''}`} />
                          </button>

                          <button
                            onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)}
                            className="text-slate-200 hover:text-white transition-colors cursor-pointer"
                          >
                            <MessageSquare className="w-6 h-6" />
                          </button>

                          <button
                            onClick={() => setShareModalPost(post)}
                            className="text-slate-200 hover:text-white transition-colors cursor-pointer"
                          >
                            <Send className="w-5 h-5" />
                          </button>
                        </div>

                        <button
                          onClick={() => toggleSavePost(post.id)}
                          className="text-slate-200 hover:text-amber-400 transition-colors cursor-pointer"
                        >
                          <Bookmark className={`w-6 h-6 ${isSaved ? 'fill-amber-400 text-amber-400' : ''}`} />
                        </button>
                      </div>

                      {/* LIKED BY ROW */}
                      <p className="text-xs font-extrabold text-white">
                        Liked by <span className="text-rose-400">rahul_m10</span> and{' '}
                        <span>{(post.likesCount || 0).toLocaleString()} others</span>
                      </p>

                      {/* CAPTION LINE */}
                      <div className="text-xs text-slate-200 leading-relaxed">
                        <span className="font-extrabold text-white mr-1.5">{authorHandle}</span>
                        <span>{post.title}</span>
                      </div>

                      {/* COMMENTS PREVIEW */}
                      <button
                        onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)}
                        className="text-xs text-slate-400 font-medium hover:text-slate-300 transition-colors cursor-pointer block"
                      >
                        View all {post.commentsCount || post.comments?.length || 12} comments
                      </button>

                      {/* TIMESTAMP */}
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        {post.timestamp || '2 HOURS AGO'}
                      </p>

                      {/* COMMENTS DRAWER */}
                      {activeCommentPostId === post.id && (
                        <div className="pt-2 border-t border-slate-800 space-y-2.5 pb-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Add a comment..."
                              value={commentInput}
                              onChange={(e) => setCommentInput(e.target.value)}
                              className="flex-1 bg-slate-900 border border-slate-800 text-white px-3 py-2 rounded-xl text-xs focus:border-rose-500 focus:outline-none"
                            />
                            <button
                              onClick={() => handleAddComment(post.id)}
                              className="px-3 py-2 bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {post.comments && post.comments.length > 0 && (
                            <div className="space-y-1.5 max-h-40 overflow-y-auto">
                              {post.comments.map(comment => (
                                <div key={comment.id} className="text-xs flex items-start gap-2">
                                  <span className="font-bold text-white shrink-0">{comment.authorName}:</span>
                                  <span className="text-slate-300">{comment.text}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* ======================================================== */}
        {/* COLUMN 3: RIGHT SIDEBAR — TRENDING & RISING PLAYERS (DESKTOP) */}
        {/* ======================================================== */}
        <div className="hidden xl:flex flex-col w-72 shrink-0 sticky top-20 space-y-5">
          
          {/* Trending Topics Card */}
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl p-4 space-y-3 shadow-xl">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <h3 className="font-extrabold text-white text-xs uppercase tracking-wider">
                Trending Football Topics
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-amber-500/40 transition-colors cursor-pointer">
                <p className="text-[10px] text-slate-400 font-semibold">1 • Trending in Kerala</p>
                <p className="font-bold text-amber-300">#KozhikodeRegionalCup</p>
                <p className="text-[10px] text-slate-500">12.4K videos & posts</p>
              </div>

              <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-teal-500/40 transition-colors cursor-pointer">
                <p className="text-[10px] text-slate-400 font-semibold">2 • AI Trial Benchmark</p>
                <p className="font-bold text-teal-300">#ContinuousJuggling100</p>
                <p className="text-[10px] text-slate-500">8.2K trial attempts</p>
              </div>

              <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-rose-500/40 transition-colors cursor-pointer">
                <p className="text-[10px] text-slate-400 font-semibold">3 • Grassroots Scouting</p>
                <p className="font-bold text-rose-300">#U17YouthShowcase2026</p>
                <p className="text-[10px] text-slate-500">5.9K player clips</p>
              </div>
            </div>
          </div>

          {/* Rising Prospects Card */}
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl p-4 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h3 className="font-extrabold text-white text-xs uppercase tracking-wider">
                  Rising Grassroots Talent
                </h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-400">India</span>
            </div>

            <div className="space-y-2.5">
              {players.slice(0, 3).map(p => {
                const isFollowing = followedUserIds.has(p.id);
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-slate-950 border border-slate-800"
                  >
                    <div
                      onClick={() => onSelectPlayer(p)}
                      className="flex items-center gap-2 cursor-pointer min-w-0"
                    >
                      <img src={p.photo} alt={p.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-white truncate">{p.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{p.state} • {p.position}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleFollowUser(p.id)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer shrink-0 ${
                        isFollowing
                          ? 'bg-slate-800 text-slate-400'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                      }`}
                    >
                      {isFollowing ? '✓' : '+ Follow'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* ======================================================== */}
      {/* SHARE MODAL */}
      {/* ======================================================== */}
      {shareModalPost && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-extrabold text-white text-sm">Share Football Content</h3>
              <button onClick={() => setShareModalPost(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 font-semibold line-clamp-2">
              "{shareModalPost.title}"
            </p>

            <div className="space-y-2">
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out this football post on Digital Scout India: ${shareModalPost.title}`)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow"
              >
                <span>Share via WhatsApp</span>
              </a>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  setLinkCopied(true);
                  setTimeout(() => setLinkCopied(false), 2000);
                }}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{linkCopied ? 'Link Copied to Clipboard!' : 'Copy Post Link'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RICH POST CREATION MODAL */}
      {isComposerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative my-8">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-sm">⚽</span>
                <div>
                  <h3 className="font-extrabold text-white text-base">Create Football Community Post</h3>
                  <p className="text-xs text-slate-400">Share your match results, photos, clips & thoughts for views & engagement</p>
                </div>
              </div>
              <button
                onClick={() => setIsComposerOpen(false)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Post Type Selector Tabs */}
            <div className="grid grid-cols-4 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setComposerMode('TEXT_POST')}
                className={`py-2 px-2 rounded-xl transition-all cursor-pointer text-center ${
                  composerMode === 'TEXT_POST' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                💬 Status
              </button>

              <button
                type="button"
                onClick={() => setComposerMode('PHOTO')}
                className={`py-2 px-2 rounded-xl transition-all cursor-pointer text-center ${
                  composerMode === 'PHOTO' ? 'bg-emerald-500 text-slate-950 font-black shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🖼️ Photo
              </button>

              <button
                type="button"
                onClick={() => setComposerMode('MATCH_STATS')}
                className={`py-2 px-2 rounded-xl transition-all cursor-pointer text-center ${
                  composerMode === 'MATCH_STATS' ? 'bg-amber-500 text-slate-950 font-black shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                📊 Match Stats
              </button>

              <button
                type="button"
                onClick={() => setComposerMode('PLAYER_VIDEO')}
                className={`py-2 px-2 rounded-xl transition-all cursor-pointer text-center ${
                  composerMode === 'PLAYER_VIDEO' ? 'bg-teal-500 text-slate-950 font-black shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                📹 Video
              </button>
            </div>

            <form onSubmit={handleCreatePostSubmit} className="space-y-4 text-xs">
              
              {/* Main Text / Caption Input */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold block">Caption / Thought</label>
                <textarea
                  rows={3}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder={
                    composerMode === 'MATCH_STATS' 
                      ? "Describe your performance or match highlights (e.g. Scored 2 goals in 2nd half comeback victory!)..."
                      : composerMode === 'PHOTO'
                      ? "Write a caption for your football photo..."
                      : composerMode === 'PLAYER_VIDEO'
                      ? "Describe your highlight clip or skill..."
                      : "Share your football updates, local ground news, or favorite team opinions..."
                  }
                  className="w-full bg-slate-950 border border-slate-700 text-white p-3 rounded-2xl focus:border-emerald-500 focus:outline-none resize-none"
                  required={composerMode === 'TEXT_POST'}
                />
              </div>

              {/* MODE SPECIFIC FIELDS */}

              {/* 1. PHOTO POST BUILDER */}
              {composerMode === 'PHOTO' && (
                <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">Select Photo or Upload File</span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload File</span>
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>

                  {/* Preset Photos Grid */}
                  <div className="grid grid-cols-4 gap-2">
                    {PHOTO_PRESETS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedPhoto(p.url)}
                        className={`relative aspect-video rounded-xl overflow-hidden border-2 cursor-pointer ${
                          selectedPhoto === p.url ? 'border-emerald-400 ring-2 ring-emerald-500/40' : 'border-slate-800 opacity-70'
                        }`}
                      >
                        <img src={p.url} alt={p.label} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>

                  {/* Selected Preview */}
                  {selectedPhoto && (
                    <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-700">
                      <img src={selectedPhoto} alt="Selected" className="w-full h-full object-cover" />
                      <span className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md text-[10px] font-bold text-emerald-400">
                        Photo Ready
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* 2. MATCH STATS BUILDER */}
              {composerMode === 'MATCH_STATS' && (
                <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400 flex items-center gap-1.5">
                      <Trophy className="w-4 h-4" /> Match Stats Logger
                    </span>
                    <span className="text-[11px] text-slate-400">Facebook / FIFA Style Game Card</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 text-[11px] font-bold block mb-1">Opponent Team Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Calicut City FC"
                        value={opponent}
                        onChange={(e) => setOpponent(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 text-white p-2.5 rounded-xl focus:border-amber-500 focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 text-[11px] font-bold block mb-1">Match Result</label>
                      <select
                        value={matchResult}
                        onChange={(e) => setMatchResult(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-700 text-white p-2.5 rounded-xl focus:border-amber-500 focus:outline-none"
                      >
                        <option value="WON">🏆 Victory (WON)</option>
                        <option value="DRAW">🤝 Draw (DRAW)</option>
                        <option value="LOST">💔 Defeat (LOST)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-400 text-[11px] font-bold block mb-1">Final Score Line</label>
                      <input
                        type="text"
                        placeholder="e.g. 3 - 1"
                        value={matchScore}
                        onChange={(e) => setMatchScore(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 text-white p-2.5 rounded-xl focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 text-[11px] font-bold block mb-1">Match Venue / Ground</label>
                      <input
                        type="text"
                        placeholder="e.g. Kochi Municipal Stadium"
                        value={matchVenue}
                        onChange={(e) => setMatchVenue(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 text-white p-2.5 rounded-xl focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800">
                    <div>
                      <label className="text-slate-400 text-[10px] font-bold block mb-1">Goals ⚽</label>
                      <input
                        type="number"
                        min={0}
                        value={goals}
                        onChange={(e) => setGoals(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl text-center font-black text-amber-400"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 text-[10px] font-bold block mb-1">Assists 🅰️</label>
                      <input
                        type="number"
                        min={0}
                        value={assists}
                        onChange={(e) => setAssists(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl text-center font-black text-emerald-400"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 text-[10px] font-bold block mb-1">Tackles 🛡️</label>
                      <input
                        type="number"
                        min={0}
                        value={tackles}
                        onChange={(e) => setTackles(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl text-center font-black text-teal-400"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 text-[10px] font-bold block mb-1">Pass % 🎯</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={passPct}
                        onChange={(e) => setPassPct(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-xl text-center font-black text-blue-400"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="motmToggle"
                      checked={isMotm}
                      onChange={(e) => setIsMotm(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-900 border-slate-700 cursor-pointer"
                    />
                    <label htmlFor="motmToggle" className="text-amber-300 font-bold text-xs cursor-pointer flex items-center gap-1">
                      ⭐ Awarded Man of the Match (MOTM)?
                    </label>
                  </div>
                </div>
              )}

              {/* 3. VIDEO POST BUILDER */}
              {composerMode === 'PLAYER_VIDEO' && (
                <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-teal-400">Video Highlight / Reel Frame</span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-400 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Video File</span>
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="video/*,image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>

                  {selectedVideoThumbnail && (
                    <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-700 group">
                      <img src={selectedVideoThumbnail} alt="Video Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-teal-400 text-slate-950 flex items-center justify-center font-black shadow-xl">
                          ▶
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsComposerOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  Publish Post 🚀
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MOBILE BOTTOM NAVIGATION BAR (US-022) */}
      {/* ======================================================== */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 px-4 py-2 flex items-center justify-around text-slate-400 shadow-2xl">
        <button
          onClick={() => {
            setActiveFeedTab('FOR_YOU');
            if (onNavigateTab) onNavigateTab('community');
          }}
          className={`flex flex-col items-center gap-1 cursor-pointer ${
            activeFeedTab === 'FOR_YOU' ? 'text-rose-500 font-extrabold' : 'hover:text-slate-200'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px]">Home</span>
        </button>

        <button
          onClick={() => {
            if (onNavigateTab) onNavigateTab('discover');
          }}
          className="flex flex-col items-center gap-1 cursor-pointer hover:text-slate-200"
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px]">Discover</span>
        </button>

        <button
          onClick={() => handleOpenComposer('TEXT_POST')}
          className="p-3 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-full text-slate-950 font-black shadow-lg shadow-emerald-500/30 -mt-5 cursor-pointer hover:scale-105 transition-transform"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>

        <button
          onClick={() => setActiveFeedTab('REELS')}
          className={`flex flex-col items-center gap-1 cursor-pointer ${
            activeFeedTab === 'REELS' ? 'text-rose-500 font-extrabold' : 'hover:text-slate-200'
          }`}
        >
          <Film className="w-5 h-5 text-teal-400" />
          <span className="text-[10px]">Reels</span>
        </button>

        <button
          onClick={() => {
            if (onNavigateTab) onNavigateTab('leaderboard');
          }}
          className="flex flex-col items-center gap-1 cursor-pointer hover:text-slate-200"
        >
          <Trophy className="w-5 h-5 text-amber-400" />
          <span className="text-[10px]">Rank</span>
        </button>
      </div>

      {/* MODULE 4: CONTENT CREATION STUDIO MODAL */}
      {isCreateContentModalOpen && currentUserAccount && (
        <CreateContentModal
          currentUser={currentUserAccount}
          onClose={() => setIsCreateContentModalOpen(false)}
          onPostCreated={(newPost) => {
            onAddPost(newPost);
            setIsCreateContentModalOpen(false);
          }}
          onStartTrial={() => {
            setIsCreateContentModalOpen(false);
            if (onOpenRecorder) onOpenRecorder();
          }}
          onRequireAuth={onRequireAuth}
        />
      )}

      {/* MODULE 4: EDIT POST MODAL */}
      {editingPost && (
        <EditPostModal
          post={editingPost}
          currentUserId={currentUserAccount?.id || 'usr-demo'}
          onClose={() => setEditingPost(null)}
          onPostUpdated={(updatedPost) => {
            setEditingPost(null);
          }}
          onPostDeleted={(deletedPostId) => {
            setEditingPost(null);
          }}
        />
      )}

    </div>
  );
};

