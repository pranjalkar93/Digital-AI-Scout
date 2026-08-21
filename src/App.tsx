import React, { lazy, Suspense, useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from './lib/firebase';
import { collection, onSnapshot, doc, setDoc, getDoc } from 'firebase/firestore';
import {
  Role,
  PlayerProfile,
  Drill,
  TrialResult,
  ScoutProfile,
  ScoutAlert,
  MessageRequest,
  GuardianConsent,
  CommunityPost,
  FeatureFlags,
  UserAccount
} from './types';
import {
  INITIAL_PLAYERS,
  SAMPLE_DRILLS,
  CURRENT_SCOUT,
  INITIAL_ALERTS,
  INITIAL_MESSAGES,
  INITIAL_POSTS,
  INITIAL_CONSENTS,
  INITIAL_FEATURE_FLAGS
} from './data/mockData';

import { Navbar } from './components/Navbar';
import {
  logAuditTransaction,
  recordSubscriptionTransaction,
  recordScoutAction
} from './lib/auditLogger';

// Keep the initial bundle limited to the application shell. Each portal and
// modal is fetched only when the visitor opens the corresponding experience.
const PlayerPortal = lazy(async () => ({ default: (await import('./components/PlayerPortal')).PlayerPortal }));
const LeaderboardView = lazy(async () => ({ default: (await import('./components/LeaderboardView')).LeaderboardView }));
const TrialRecorderModal = lazy(async () => ({ default: (await import('./components/TrialRecorderModal')).TrialRecorderModal }));
const ScoutPortal = lazy(async () => ({ default: (await import('./components/ScoutPortal')).ScoutPortal }));
const ParentPortal = lazy(async () => ({ default: (await import('./components/ParentPortal')).ParentPortal }));
const AdminConsole = lazy(async () => ({ default: (await import('./components/AdminConsole')).AdminConsole }));
const CommunityFeed = lazy(async () => ({ default: (await import('./components/CommunityFeed')).CommunityFeed }));
const DiscoverView = lazy(async () => ({ default: (await import('./components/DiscoverView')).DiscoverView }));
const PlayerProfileModal = lazy(async () => ({ default: (await import('./components/PlayerProfileModal')).PlayerProfileModal }));
const AuthModal = lazy(async () => ({ default: (await import('./components/AuthModal')).AuthModal }));
const PlayerQualificationJourney = lazy(async () => ({ default: (await import('./components/PlayerQualificationJourney')).PlayerQualificationJourney }));
const AuditLogsModal = lazy(async () => ({ default: (await import('./components/AuditLogsModal')).AuditLogsModal }));
const UserProfileView = lazy(async () => ({ default: (await import('./components/UserProfileView')).UserProfileView }));

export default function App() {
  const [currentRole, setCurrentRole] = useState<Role>('GUEST');
  const [currentUserAccount, setCurrentUserAccount] = useState<UserAccount | null>(null);
  const [activeTab, setActiveTab] = useState<string>('community'); // LANDING IS THE FEED!

  // Qualification Journey Modal State
  const [isQualificationOpen, setIsQualificationOpen] = useState<boolean>(false);

  // Application State
  const [players, setPlayers] = useState<PlayerProfile[]>(INITIAL_PLAYERS);
  const [activePlayer, setActivePlayer] = useState<PlayerProfile>(INITIAL_PLAYERS[0]);
  const [drills, setDrills] = useState<Drill[]>(SAMPLE_DRILLS);
  const [scout, setScout] = useState<ScoutProfile>(CURRENT_SCOUT);
  const [alerts, setAlerts] = useState<ScoutAlert[]>(INITIAL_ALERTS);
  const [messages, setMessages] = useState<MessageRequest[]>(INITIAL_MESSAGES);
  const [posts, setPosts] = useState<CommunityPost[]>(INITIAL_POSTS);
  const [consent, setConsent] = useState<GuardianConsent>(INITIAL_CONSENTS[0]);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>(INITIAL_FEATURE_FLAGS);

  // Selected Player Profile Modal
  const [selectedPlayerForModal, setSelectedPlayerForModal] = useState<PlayerProfile | null>(null);

  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Audit Logs Modal State
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);

  // Recorder Modal state
  const [selectedDrillForRecorder, setSelectedDrillForRecorder] = useState<Drill | null>(null);
  const [isRecorderOpen, setIsRecorderOpen] = useState<boolean>(false);

  // Trial History State
  const [trialHistory, setTrialHistory] = useState<TrialResult[]>([
    {
      id: 'trial-init-1',
      playerId: 'player-01',
      drillId: 'drill-juggle',
      drillTitle: 'Continuous Ball Juggling',
      timestamp: '2026-08-19',
      metrics: { primaryMetricValue: 104, jugglesCount: 104 },
      rawScores: { overall: 92, technical: 94, physical: 89, speed: 88, agility: 93, control: 95 },
      tierAchieved: 'GOLD',
      poseLandmarksDetected: 33,
      ballTrackConfidence: 0.98,
      aiFeedback: {
        strengths: ['Flawless dual-foot rhythm control', 'Excellent posture stability'],
        improvements: ['Slight knee angle flex adjustment on weak foot'],
        scoutNotes: 'Top regional U17 midfield prospect.'
      },
      status: 'COMPLETED'
    }
  ]);

  // Auth login completion
  const handleLoginSuccess = async (
    role: Role,
    phoneOrEmail: string,
    userDetails?: any
  ) => {
    const existingUserId = userDetails?.id || `usr-${Date.now()}`;
    const targetRole: Role = userDetails?.role || role || 'USER';

    const displayName = userDetails?.displayName ||
      (userDetails?.firstName ? `${userDetails.firstName} ${userDetails.lastName || ''}`.trim() : '') ||
      (targetRole === 'PLAYER' ? 'Rahul Menacherry' : 'Digital Scout Member');

    const firstName = userDetails?.firstName || (targetRole === 'PLAYER' ? 'Rahul' : 'Digital');
    const lastName = userDetails?.lastName || (targetRole === 'PLAYER' ? 'Menacherry' : 'Member');

    // Create or restore user account
    const userAcc: UserAccount = {
      id: existingUserId,
      phone: userDetails?.phone || phoneOrEmail,
      role: targetRole,
      status: userDetails?.status || 'ACTIVE',
      displayName,
      firstName,
      lastName,
      dob: userDetails?.dob || '2008-05-15',
      gender: userDetails?.gender || 'Male',
      city: userDetails?.city || 'Kochi',
      state: userDetails?.state || 'Kerala',
      country: userDetails?.country || 'India',
      profilePhoto: userDetails?.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
      createdAt: userDetails?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      qualificationStatus: userDetails?.qualificationStatus || (targetRole === 'PLAYER' ? 'PASSED' : 'NOT_STARTED'),
      qualificationScore: userDetails?.qualificationScore,
      playerId: userDetails?.playerId,
      profileCompletionPct: userDetails?.profileCompletionPct || 85
    };

    setCurrentRole(targetRole);
    setCurrentUserAccount(userAcc);

    // If logged in user is a PLAYER, restore their player profile context
    if (targetRole === 'PLAYER' || userAcc.qualificationStatus === 'PASSED' || userAcc.playerId) {
      const pId = userAcc.playerId || `plr-${existingUserId}`;

      try {
        const playerSnap = await getDoc(doc(db, 'players', pId));
        if (playerSnap.exists()) {
          const loadedPlayer = playerSnap.data() as PlayerProfile;
          setActivePlayer(loadedPlayer);
          console.log("[Firestore DB] Loaded player profile context:", loadedPlayer.name);
        } else {
          const fallbackPlayer: PlayerProfile = {
            id: pId,
            name: displayName,
            photo: userAcc.profilePhoto,
            dob: userAcc.dob,
            age: 18,
            gender: userAcc.gender as any,
            phone: userAcc.phone,
            state: userAcc.state,
            city: userAcc.city,
            district: 'Central',
            pinCode: '682001',
            position: 'Central Mid',
            preferredFoot: 'Right',
            heightCm: 174,
            weightKg: 65,
            playingLevel: 'Grassroots',
            currentAcademy: 'Grassroots Football Academy',
            yearsExperience: 3,
            tier: 'SILVER',
            overallScore: userAcc.qualificationScore || 78,
            technicalScore: 78,
            physicalScore: 76,
            consistencyScore: 75,
            speedScore: 80,
            agilityScore: 77,
            ballControlScore: 79,
            nationalRank: 342,
            stateRank: 28,
            districtRank: 4,
            drillsCompleted: 3,
            totalAttempts: 3,
            bio: 'Verified Digital Scout player.',
            verificationStatus: {
              phoneVerified: true,
              parentVerified: true,
              ageVerified: true,
              aiffCrsId: 'CRS-IND-2026-99',
              footballIdVerified: true
            },
            isProSubscriber: false
          };
          setActivePlayer(fallbackPlayer);
        }
      } catch (err) {
        console.warn("Player profile load note:", err);
      }

      setCurrentRole('PLAYER');
      setActiveTab('dashboard');
    } else if (targetRole === 'SCOUT') {
      setActiveTab('talent-search');
    } else if (targetRole === 'PARENT') {
      setActiveTab('parent-consent');
    } else if (targetRole === 'ADMIN') {
      setActiveTab('admin-overview');
    } else {
      setActiveTab('community');
    }
  };

  // Log Out handler
  const handleLogout = () => {
    if (currentUserAccount) {
      logAuditTransaction(
        currentUserAccount.id,
        currentUserAccount.displayName,
        currentRole,
        'USER_LOGOUT',
        `User logged out of Digital Scout session`,
        { phone: currentUserAccount.phone, role: currentRole }
      );
    }

    setCurrentRole('GUEST');
    setCurrentUserAccount(null);
    setSelectedPlayerForModal(null);
    setIsAuditModalOpen(false);
    setIsRecorderOpen(false);
    setIsQualificationOpen(false);
    setIsAuthModalOpen(false);
    setActiveTab('community'); // Navigate to landing / home page
  };

  // Player Qualification Assessment Success
  const handleQualificationSuccess = async (playerId: string, score: number) => {
    // Upgrade Role to PLAYER
    setCurrentRole('PLAYER');

    const updatedUserAcc: UserAccount = {
      ...(currentUserAccount || {
        id: `usr-${Date.now()}`,
        phone: '+91 98765 43210',
        displayName: 'Registered Player',
        firstName: 'Registered',
        lastName: 'Player',
        dob: '2008-05-15',
        gender: 'Male',
        city: 'Kochi',
        state: 'Kerala',
        country: 'India',
        profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        profileCompletionPct: 90
      }),
      role: 'PLAYER',
      qualificationStatus: 'PASSED',
      qualificationScore: score,
      playerId
    };

    setCurrentUserAccount(updatedUserAcc);

    // Set Active Player
    const newPlayerProfile: PlayerProfile = {
      id: playerId,
      name: updatedUserAcc.displayName || 'Rahul Menacherry',
      photo: updatedUserAcc.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
      dob: updatedUserAcc.dob || '2008-05-15',
      age: 17,
      gender: 'Male',
      phone: updatedUserAcc.phone || '+91 98765 43210',
      state: updatedUserAcc.state || 'Kerala',
      city: updatedUserAcc.city || 'Kochi',
      district: 'Ernakulam',
      pinCode: '682001',
      position: 'Central Mid',
      preferredFoot: 'Right',
      heightCm: 174,
      weightKg: 65,
      playingLevel: 'Grassroots',
      currentAcademy: 'Kochi Grassroots Football Academy',
      yearsExperience: 3,
      tier: 'SILVER',
      overallScore: score,
      technicalScore: score,
      physicalScore: score - 2,
      consistencyScore: score - 3,
      speedScore: score + 2,
      agilityScore: score - 1,
      ballControlScore: score + 1,
      nationalRank: 342,
      stateRank: 28,
      districtRank: 4,
      drillsCompleted: 1,
      totalAttempts: 1,
      bio: 'Verified Digital Scout player.',
      verificationStatus: {
        phoneVerified: true,
        parentVerified: true,
        ageVerified: true,
        aiffCrsId: 'CRS-IND-2026-99',
        footballIdVerified: true
      },
      isProSubscriber: false
    };

    setActivePlayer(newPlayerProfile);
    setPlayers(prev => [newPlayerProfile, ...prev]);
    setActiveTab('dashboard');

    // Persist to Firestore /users and /players
    try {
      if (updatedUserAcc.id) {
        await setDoc(doc(db, 'users', updatedUserAcc.id), updatedUserAcc, { merge: true });
      }
      await setDoc(doc(db, 'players', playerId), newPlayerProfile, { merge: true });
      console.log(`[Firestore DB] Saved player ${playerId} and updated user ${updatedUserAcc.id}`);

      // Log Audit Transaction
      await logAuditTransaction(
        updatedUserAcc.id,
        updatedUserAcc.displayName,
        'PLAYER',
        'QUALIFICATION_SUBMIT',
        `User completed qualification drill assessment with score ${score} and upgraded to PLAYER status`,
        { score, playerId }
      );
    } catch (dbErr) {
      console.warn("Firestore qualification save note:", dbErr);
    }
  };

  // Handle Trial Completion from Modal
  const handleTrialCompleted = async (newTrial: TrialResult) => {
    setTrialHistory(prev => [newTrial, ...prev]);

    // If current user was a Normal USER, upgrade them to a Verified PLAYER on passing a trial!
    if (currentRole === 'USER') {
      setCurrentRole('PLAYER');
    }

    // Update active player's scores and total attempts
    const updatedPlayers = players.map(p => {
      if (p.id === activePlayer.id) {
        const newTotalAttempts = p.totalAttempts + 1;
        const newDrillsCompleted = p.drillsCompleted + 1;

        const newTier = newTrial.tierAchieved === 'GOLD' || p.tier === 'GOLD' ? 'GOLD' :
                        newTrial.tierAchieved === 'SILVER' || p.tier === 'SILVER' ? 'SILVER' : 'BRONZE';

        const updated = {
          ...p,
          tier: newTier,
          overallScore: Math.max(p.overallScore, newTrial.rawScores.overall),
          totalAttempts: newTotalAttempts,
          drillsCompleted: newDrillsCompleted
        };

        if (p.id === activePlayer.id) {
          setActivePlayer(updated);
        }
        return updated;
      }
      return p;
    });

    setPlayers(updatedPlayers);

    // Save trial result to Firestore under player document or subcollection
    try {
      if (activePlayer?.id) {
        await setDoc(doc(db, 'players', activePlayer.id, 'trials', newTrial.id), newTrial);
        console.log(`[Firestore DB] Saved trial ${newTrial.id} with video ${newTrial.videoUrl} to player ${activePlayer.id}`);
      }
    } catch (err) {
      console.warn("Firestore trial save note:", err);
    }

    // If Gold tier achieved, trigger scout alert!
    if (newTrial.tierAchieved === 'GOLD') {
      const newAlert: ScoutAlert = {
        id: `alert-${Date.now()}`,
        timestamp: 'Just now',
        title: 'New Gold Tier Prospect Breakthrough!',
        message: `${activePlayer.name} (${activePlayer.state}) achieved Gold standard in ${newTrial.drillTitle}.`,
        playerId: activePlayer.id,
        playerName: activePlayer.name,
        playerState: activePlayer.state,
        playerTier: 'GOLD',
        drillTitle: newTrial.drillTitle,
        score: newTrial.rawScores.overall,
        read: false
      };
      setAlerts(prev => [newAlert, ...prev]);
    }
  };

  // WhatsApp OTP Verification Handler
  const handleVerifyParentOtp = async (phone: string, code: string): Promise<boolean> => {
    try {
      const resp = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code })
      });
      const data = await resp.json();
      if (data.verified) {
        setConsent(prev => ({
          ...prev,
          consentGiven: true,
          otpVerified: true,
          auditTrail: [
            ...prev.auditTrail,
            `${new Date().toISOString().replace('T', ' ').slice(0,19)} - WhatsApp OTP verified for phone ${phone}.`
          ]
        }));
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  // Monitored Contact Request Handlers
  const handleSendContactRequest = (req: Partial<MessageRequest>) => {
    const newMsg: MessageRequest = {
      id: `msg-${Date.now()}`,
      scoutId: req.scoutId || scout.id,
      scoutName: req.scoutName || scout.name,
      clubName: req.clubName || scout.clubOrAcademy,
      playerId: req.playerId || activePlayer.id,
      playerName: req.playerName || activePlayer.name,
      guardianPhone: req.guardianPhone || '+91 94470 11982',
      subject: req.subject || 'Official Scout Request',
      message: req.message || '',
      status: 'PENDING_GUARDIAN_APPROVAL',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };
    setMessages(prev => [newMsg, ...prev]);

    recordScoutAction({
      scoutId: scout.id,
      scoutName: scout.name,
      action: 'MESSAGE_SENT',
      targetPlayerId: newMsg.playerId,
      targetPlayerName: newMsg.playerName,
      notes: `Sent official contact request to ${newMsg.playerName}`
    });
  };

  const handleApproveMessage = (msgId: string) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, status: 'APPROVED' } : m));
  };

  const handleDeclineMessage = (msgId: string) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, status: 'DECLINED' } : m));
  };

  // Scout Notes & Shortlist Handlers
  const handleUpdateScoutNote = (playerId: string, note: string) => {
    setScout(prev => ({
      ...prev,
      notes: { ...prev.notes, [playerId]: note }
    }));
  };

  const handleToggleShortlist = (playerId: string) => {
    let actionType: 'SHORTLIST_ADD' | 'SHORTLIST_REMOVE' = 'SHORTLIST_ADD';
    setScout(prev => {
      const exists = prev.shortlistedPlayerIds.includes(playerId);
      actionType = exists ? 'SHORTLIST_REMOVE' : 'SHORTLIST_ADD';
      const updated = exists
        ? prev.shortlistedPlayerIds.filter(id => id !== playerId)
        : [...prev.shortlistedPlayerIds, playerId];
      return { ...prev, shortlistedPlayerIds: updated };
    });

    const targetPlayer = players.find(p => p.id === playerId);
    recordScoutAction({
      scoutId: scout.id,
      scoutName: scout.name,
      action: 'SHORTLIST',
      targetPlayerId: playerId,
      targetPlayerName: targetPlayer?.name || 'Player',
      notes: `${actionType === 'SHORTLIST_ADD' ? 'Added' : 'Removed'} ${targetPlayer?.name || 'Player'} to talent shortlist`
    });
  };

  // AIFF CRS Verification
  const handleVerifyAiffCrs = (playerId: string, crsId: string) => {
    setPlayers(prev => prev.map(p => {
      if (p.id === playerId) {
        return {
          ...p,
          verificationStatus: {
            ...p.verificationStatus,
            aiffCrsId: crsId,
            footballIdVerified: true
          }
        };
      }
      return p;
    }));
  };

  // Community Feed Handlers
  const handleUpvotePost = (postId: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const isUpvoted = p.upvotedByMe;
        return {
          ...p,
          upvotedByMe: !isUpvoted,
          likesCount: isUpvoted ? p.likesCount - 1 : p.likesCount + 1
        };
      }
      return p;
    }));

    logAuditTransaction(
      currentUserAccount?.id || activePlayer.id,
      currentUserAccount?.displayName || activePlayer.name,
      currentRole,
      'POST_LIKE',
      `Liked post ${postId}`,
      { postId }
    );
  };

  // Sync posts with Firestore Database
  useEffect(() => {
    const postsCollection = collection(db, 'posts');
    const unsubscribe = onSnapshot(
      postsCollection,
      (snapshot) => {
        if (!snapshot.empty) {
          const loadedPosts: CommunityPost[] = snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...(docSnap.data() as Omit<CommunityPost, 'id'>)
          }));
          // Merge loaded Firestore posts with existing
          setPosts(prev => {
            const firestoreIds = new Set(loadedPosts.map(p => p.id));
            const localOnly = prev.filter(p => !firestoreIds.has(p.id));
            return [...loadedPosts, ...localOnly];
          });
        }
      },
      (error) => {
        console.warn("Firestore snapshot listener note:", error.message);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleAddPost = async (newPost: Partial<CommunityPost>) => {
    const authorName = currentUserAccount?.displayName || newPost.authorName || (currentRole === 'PLAYER' ? activePlayer.name : 'Digital Scout Member');
    const authorPhoto = currentUserAccount?.profilePhoto || newPost.authorPhoto || (currentRole === 'PLAYER' ? activePlayer.photo : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300');
    const authorState = currentUserAccount?.state || newPost.authorState || activePlayer.state || 'Kerala';

    const postId = `post-${Date.now()}`;
    const postObj: CommunityPost = {
      id: postId,
      authorId: currentUserAccount?.id || activePlayer.id,
      authorName,
      authorHandle: `@${authorName.toLowerCase().replace(/\s+/g, '')}`,
      authorPhoto,
      authorState,
      authorPosition: newPost.authorPosition || (currentRole === 'PLAYER' ? activePlayer.position : 'Football Enthusiast'),
      authorAgeGroup: currentRole === 'PLAYER' ? `U${activePlayer.age || 17}` : 'Member',
      authorTier: newPost.authorTier || (currentRole === 'PLAYER' ? activePlayer.tier : 'BRONZE'),
      title: newPost.title || 'Football Update',
      postType: newPost.postType || 'TEXT_POST',
      category: newPost.category || 'FOR_YOU',
      videoThumbnail: newPost.videoThumbnail || '',
      imageUrl: newPost.imageUrl || '',
      viewsCount: 1,
      likesCount: 1,
      commentsCount: 0,
      sharesCount: 0,
      upvotedByMe: true,
      timestamp: 'Just now',
      reported: false,
      matchStats: newPost.matchStats || null,
      footballStats: newPost.footballStats || null,
      comments: []
    };

    setPosts(prev => [postObj, ...prev]);

    // Persist post to Firebase Firestore Database
    try {
      await setDoc(doc(db, 'posts', postId), postObj);
      console.log(`[Firebase Database] Successfully saved post ${postId} to Firestore!`);

      // Log Audit Transaction for Post Creation
      logAuditTransaction(
        postObj.authorId,
        authorName,
        currentRole,
        'POST_CREATE',
        `Created community post: "${postObj.title}"`,
        { postId, category: postObj.category, postType: postObj.postType }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `posts/${postId}`);
    }
  };

  // Pro Subscription Toggle Handler
  const handleToggleProSubscription = () => {
    const updatedStatus = !activePlayer.isProSubscriber;
    setActivePlayer(prev => ({ ...prev, isProSubscriber: updatedStatus }));
    setPlayers(prev => prev.map(p => p.id === activePlayer.id ? { ...p, isProSubscriber: updatedStatus } : p));

    recordSubscriptionTransaction({
      userId: activePlayer.id,
      userName: activePlayer.name,
      userPhone: activePlayer.phone || '',
      planName: updatedStatus ? 'Digital Scout PRO Pass (₹499/mo)' : 'Free Tier',
      amountInr: updatedStatus ? 499 : 0,
      status: updatedStatus ? 'SUCCESS' : 'PENDING',
      paymentMethod: updatedStatus ? 'UPI / Razorpay' : 'N/A'
    });
  };

  const handleUpgradeToPro = () => {
    setActivePlayer(prev => ({ ...prev, isProSubscriber: true }));
    setPlayers(prev => prev.map(p => p.id === activePlayer.id ? { ...p, isProSubscriber: true } : p));

    recordSubscriptionTransaction({
      userId: activePlayer.id,
      userName: activePlayer.name,
      userPhone: activePlayer.phone || '',
      planName: 'Digital Scout PRO Pass (₹499/mo)',
      amountInr: 499,
      status: 'SUCCESS',
      paymentMethod: 'UPI / Razorpay'
    });
  };

  const unreadMessagesCount = messages.filter(m => m.status === 'PENDING_GUARDIAN_APPROVAL').length;
  const unreadAlertsCount = alerts.filter(a => !a.read).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Navigation Header */}
      <Navbar
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        goldAlertsCount={unreadAlertsCount}
        unreadMessagesCount={unreadMessagesCount}
        playerName={currentUserAccount?.displayName || (currentRole === 'PLAYER' ? activePlayer.name : 'Digital Scout Member')}
        currentUserAccount={currentUserAccount}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenAuditLogs={() => setIsAuditModalOpen(true)}
        onLogout={handleLogout}
      />

      <Suspense fallback={
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" aria-busy="true">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center text-sm text-slate-400">
            Loading Digital Scout India…
          </div>
        </main>
      }>
      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* LANDING / FEED VIEW (DEFAULT) */}
        {activeTab === 'community' && (
          <CommunityFeed
            posts={posts}
            players={players}
            currentRole={currentRole}
            currentUserAccount={currentUserAccount}
            onUpvotePost={handleUpvotePost}
            onAddPost={handleAddPost}
            onSelectPlayer={(p) => setSelectedPlayerForModal(p)}
            onRequireAuth={() => setIsAuthModalOpen(true)}
            onOpenRecorder={() => {
              setSelectedDrillForRecorder(drills[0]);
              setIsRecorderOpen(true);
            }}
            onNavigateTab={(t) => setActiveTab(t)}
          />
        )}

        {/* USER PROFILE & IDENTITY VIEW */}
        {activeTab === 'profile' && (
          <UserProfileView
            currentUser={currentUserAccount || {
              id: 'usr-demo',
              phone: '+91 98471 22104',
              role: currentRole === 'PLAYER' ? 'PLAYER' : 'USER',
              status: 'ACTIVE',
              displayName: 'Rahul Menacherry',
              firstName: 'Rahul',
              lastName: 'Menacherry',
              username: 'rahulfootball',
              dob: '2008-04-12',
              gender: 'Male',
              city: 'Kochi',
              district: 'Ernakulam',
              state: 'Kerala',
              country: 'India',
              profilePhoto: 'https://images.unsplash.com/photo-1543351611-58f69d7c1781?auto=format&fit=crop&q=80&w=300',
              bio: 'Dynamic midfielder passionate about Kerala grassroots football! ⚽🔥',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
              qualificationStatus: currentRole === 'PLAYER' ? 'PASSED' : 'NOT_STARTED',
              playerId: 'DSI-000123',
              profileCompletionPct: 85
            }}
            targetPlayer={activePlayer}
            trialHistory={trialHistory}
            posts={posts}
            onOpenRecorder={() => {
              setSelectedDrillForRecorder(drills[0]);
              setIsRecorderOpen(true);
            }}
            onStartQualification={() => setIsQualificationOpen(true)}
            onProfileUpdated={(updated) => setCurrentUserAccount(updated)}
            onRequireAuth={() => setIsAuthModalOpen(true)}
          />
        )}

        {/* DISCOVER SEARCH VIEW */}
        {activeTab === 'discover' && (
          <DiscoverView
            players={players}
            posts={posts}
            onSelectPlayer={(p) => setSelectedPlayerForModal(p)}
            onRequireAuth={() => setIsAuthModalOpen(true)}
          />
        )}

        {/* LEADERBOARD RANKINGS VIEW */}
        {activeTab === 'leaderboard' && (
          <LeaderboardView
            players={players}
            onSelectPlayer={(p) => setSelectedPlayerForModal(p)}
          />
        )}

        {/* DRILLS LIBRARY VIEW */}
        {activeTab === 'drills' && (
          <PlayerPortal
            player={activePlayer}
            drills={drills}
            trialHistory={trialHistory}
            activeSubTab="drills"
            currentRole={currentRole}
            currentUserAccount={currentUserAccount}
            posts={posts}
            onOpenRecorder={(drill) => {
              if (currentRole === 'GUEST') {
                setIsAuthModalOpen(true);
              } else {
                setSelectedDrillForRecorder(drill);
                setIsRecorderOpen(true);
              }
            }}
            onNavigateToTab={setActiveTab}
            onToggleProSubscription={handleToggleProSubscription}
            onUpgradePro={() => {
              setActivePlayer(prev => ({ ...prev, isProSubscriber: true }));
            }}
            onVerifyAiffCrs={(pId, crsId) => {
              handleVerifyAiffCrs(pId, crsId);
            }}
          />
        )}

        {/* MY FOOTBALL PLAYER PORTAL DASHBOARD */}
        {activeTab === 'dashboard' && (
          <PlayerPortal
            player={activePlayer}
            drills={drills}
            trialHistory={trialHistory}
            activeSubTab="dashboard"
            currentRole={currentRole}
            currentUserAccount={currentUserAccount}
            posts={posts}
            onOpenRecorder={(drill) => {
              if (currentRole === 'GUEST') {
                setIsAuthModalOpen(true);
              } else {
                setSelectedDrillForRecorder(drill);
                setIsRecorderOpen(true);
              }
            }}
            onNavigateToTab={setActiveTab}
            onToggleProSubscription={handleToggleProSubscription}
            onUpgradePro={() => {
              setActivePlayer(prev => ({ ...prev, isProSubscriber: true }));
            }}
            onVerifyAiffCrs={(pId, crsId) => {
              handleVerifyAiffCrs(pId, crsId);
            }}
          />
        )}

        {/* SCOUT PORTAL VIEWS */}
        {currentRole === 'SCOUT' && (activeTab === 'talent-search' || activeTab === 'scout-alerts' || activeTab === 'scout-shortlist') && (
          <ScoutPortal
            scout={scout}
            players={players}
            alerts={alerts}
            activeTab={activeTab}
            onSendContactRequest={handleSendContactRequest}
            onUpdateScoutNote={handleUpdateScoutNote}
            onToggleShortlist={handleToggleShortlist}
          />
        )}

        {/* PARENT / GUARDIAN PORTAL VIEWS */}
        {currentRole === 'PARENT' && (activeTab === 'parent-consent' || activeTab === 'parent-messages') && (
          <ParentPortal
            player={activePlayer}
            messages={messages}
            consent={consent}
            onApproveMessage={handleApproveMessage}
            onDeclineMessage={handleDeclineMessage}
            onVerifyParentOtp={handleVerifyParentOtp}
          />
        )}

        {/* PLATFORM ADMIN CONSOLE */}
        {currentRole === 'ADMIN' && (activeTab === 'admin-overview' || activeTab === 'admin-verification') && (
          <AdminConsole
            featureFlags={featureFlags}
            onUpdateFlags={setFeatureFlags}
            drills={drills}
            onUpdateDrillBenchmark={(drillId, level, minScore, threshold) => {
              setDrills(prev => prev.map(d => {
                if (d.id === drillId) {
                  return {
                    ...d,
                    benchmarks: {
                      ...d.benchmarks,
                      [level]: { ...d.benchmarks[level], minScore, threshold }
                    }
                  };
                }
                return d;
              }));
            }}
            players={players}
            onVerifyAiffCrs={handleVerifyAiffCrs}
            activeTab={activeTab}
          />
        )}

      </main>

      {/* Public Player Profile Modal */}
      {selectedPlayerForModal && (
        <PlayerProfileModal
          player={selectedPlayerForModal}
          trialHistory={trialHistory}
          posts={posts}
          currentRole={currentRole}
          onRequireAuth={() => setIsAuthModalOpen(true)}
          onClose={() => setSelectedPlayerForModal(null)}
          onOpenRecorder={(drillId) => {
            if (currentRole === 'GUEST') {
              setIsAuthModalOpen(true);
              return;
            }
            const targetDrill = drills.find(d => d.id === drillId) || drills[0];
            setSelectedDrillForRecorder(targetDrill);
            setIsRecorderOpen(true);
            setSelectedPlayerForModal(null);
          }}
        />
      )}

      {/* Role-Aware Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        onStartQualification={() => setIsQualificationOpen(true)}
      />

      {/* Player Qualification Journey Engine Modal */}
      <PlayerQualificationJourney
        isOpen={isQualificationOpen}
        onClose={() => setIsQualificationOpen(false)}
        user={currentUserAccount}
        onQualificationSuccess={handleQualificationSuccess}
      />

      {/* Trial Recording Modal */}
      {selectedDrillForRecorder && (
        <TrialRecorderModal
          drill={selectedDrillForRecorder}
          player={activePlayer}
          isOpen={isRecorderOpen}
          onClose={() => {
            setIsRecorderOpen(false);
            setSelectedDrillForRecorder(null);
          }}
          onTrialCompleted={handleTrialCompleted}
          parentalConsentGiven={consent.consentGiven}
          onUpgradeToPro={handleUpgradeToPro}
        />
      )}

      {/* Audit Logs Viewer Modal */}
      <AuditLogsModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        currentUser={currentUserAccount}
        currentRole={currentRole}
      />
      </Suspense>

    </div>
  );
}
