import express from "express";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

// Load Firebase Configuration
let firebaseConfig: any = {};
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  }
} catch (err) {
  console.error("Error reading firebase-applet-config.json:", err);
}

// Spawn Python FastAPI Server in background
try {
  const pythonProc = spawn("python3", ["main.py"], {
    cwd: process.cwd(),
    env: { ...process.env },
    stdio: "pipe"
  });

  pythonProc.on("error", (err) => {
    console.log("[Python FastAPI Spawn Note - Python environment not available, using Node fallback]:", err.message);
  });

  pythonProc.stdout?.on("data", (data) => console.log(`[Python FastAPI] ${data.toString().trim()}`));
  pythonProc.stderr?.on("data", (data) => console.log(`[Python FastAPI Error] ${data.toString().trim()}`));
} catch (err) {
  console.log("Python FastAPI start note:", err);
}

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({ apiKey });
    }
  }
  return aiClient;
}

// In-memory OTP storage for simulation
const activeOtps: Record<string, { code: string; expiresAt: number }> = {};

// In-memory Data Store for Identity Lifecycle & Qualification Engine
const userAccounts: Record<string, any> = {
  'usr-demo': {
    id: 'usr-demo',
    phone: '+91 98471 22104',
    email: 'rahul.menacherry@digitalscout.in',
    role: 'USER',
    status: 'ACTIVE',
    displayName: 'Rahul Menacherry',
    firstName: 'Rahul',
    lastName: 'Menacherry',
    username: 'rahulfootball',
    username_normalized: 'rahulfootball',
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
    qualificationStatus: 'PASSED',
    qualificationScore: 92,
    qualificationDate: '2026-08-15',
    playerId: 'DSI-000123',
    profileCompletionPct: 100
  }
};

const playerProfilesStore: Record<string, any> = {
  'DSI-000123': {
    id: 'DSI-000123',
    userId: 'usr-demo',
    name: 'Rahul Menacherry',
    dob: '2008-04-12',
    age: 16,
    gender: 'Male',
    photo: 'https://images.unsplash.com/photo-1543351611-58f69d7c1781?auto=format&fit=crop&q=80&w=300',
    phone: '+91 98471 22104',
    city: 'Kochi',
    district: 'Ernakulam',
    state: 'Kerala',
    pinCode: '682011',
    position: 'Central Mid',
    preferredFoot: 'Both',
    heightCm: 174,
    weightKg: 64,
    playingLevel: 'State Youth League',
    currentAcademy: 'Malabar Grassroots FC',
    yearsExperience: 5,
    tier: 'GOLD',
    overallScore: 92,
    technicalScore: 94,
    physicalScore: 89,
    consistencyScore: 91,
    speedScore: 88,
    agilityScore: 93,
    ballControlScore: 95,
    nationalRank: 3,
    stateRank: 1,
    districtRank: 1,
    drillsCompleted: 18,
    totalAttempts: 32,
    bio: 'Dynamic central midfielder with elite dual-foot vision, fast transition recovery, and top regional juggle consistency.',
    verificationStatus: {
      phoneVerified: true,
      parentVerified: true,
      ageVerified: true,
      footballIdVerified: true,
      aiffCrsId: 'CRS-KER-2024-8831'
    }
  }
};

const userFollows: Array<{ id: string; followerUserId: string; followingUserId: string; createdAt: string }> = [
  { id: 'fol-1', followerUserId: 'usr-demo', followingUserId: 'player-02', createdAt: new Date().toISOString() },
  { id: 'fol-2', followerUserId: 'usr-demo', followingUserId: 'player-03', createdAt: new Date().toISOString() }
];

const blockedUsers: Array<{ id: string; blockerUserId: string; blockedUserId: string; createdAt: string }> = [];
const profileReports: Array<{ id: string; reporterUserId: string; targetUserId: string; reason: string; description: string; status: string; createdAt: string }> = [];

const playerScoreSnapshots: Record<string, any[]> = {
  'DSI-000123': [
    { id: 'snap-1', overallScore: 72, technicalScore: 74, physicalScore: 70, date: '2026-05-10', source: 'Trial #1 - Bronze' },
    { id: 'snap-2', overallScore: 81, technicalScore: 83, physicalScore: 79, date: '2026-06-22', source: 'Trial #2 - Silver' },
    { id: 'snap-3', overallScore: 88, technicalScore: 90, physicalScore: 86, date: '2026-07-18', source: 'Trial #3 - Silver+' },
    { id: 'snap-4', overallScore: 92, technicalScore: 94, physicalScore: 89, date: '2026-08-15', source: 'Trial #4 - Gold Benchmark' }
  ]
};

const playerAchievementsStore: Record<string, any[]> = {
  'DSI-000123': [
    { id: 'ach-1', code: 'FIRST_TRIAL', name: 'First Trial Completed', description: 'Submitted first AI-evaluated drill performance', icon: '🏆', earnedAt: '2026-05-10' },
    { id: 'ach-2', code: 'BRONZE_UNLOCKED', name: 'Bronze Tier Unlocked', description: 'Crossed 60+ overall score threshold', icon: '🥉', earnedAt: '2026-05-10' },
    { id: 'ach-3', code: 'SILVER_UNLOCKED', name: 'Silver Tier Unlocked', description: 'Crossed 78+ overall score threshold', icon: '🥈', earnedAt: '2026-06-22' },
    { id: 'ach-4', code: 'GOLD_UNLOCKED', name: 'Gold Tier Unlocked', description: 'Crossed 90+ overall score threshold', icon: '🥇', earnedAt: '2026-08-15' },
    { id: 'ach-5', code: 'STATE_TOP_100', name: 'State Top 100', description: 'Ranked in top 100 players in Kerala state', icon: '🏅', earnedAt: '2026-08-15' }
  ]
};

const qualificationAttempts: Record<string, any[]> = {};
let qualificationRules = {
  minPassingScore: 70,
  maxAttemptsPerDay: 3,
  retryCooldownHours: 0,
  requiredDrillsCount: 3,
  requireGuardianConsentForMinors: true
};

// Module 4: Content Creation & Media Upload In-Memory Stores
const postsStore: Record<string, any> = {
  'post-01': {
    id: 'post-01',
    authorId: 'usr-demo',
    authorName: 'Rahul Menacherry',
    authorHandle: '@rahulfootball',
    authorPhoto: 'https://images.unsplash.com/photo-1543351611-58f69d7c1781?auto=format&fit=crop&q=80&w=300',
    authorState: 'Kerala',
    authorPosition: 'Central Mid',
    authorTier: 'GOLD',
    title: 'Kochi Grassroots Evening Skill Session ⚽🔥',
    caption: 'Working on quick dual-foot release and 1v1 turn velocity under pressure at Malabar Pitch!',
    postType: 'PLAYER_VIDEO',
    category: 'Highlight',
    contentType: 'SOCIAL_VIDEO',
    status: 'PUBLISHED',
    visibility: 'PUBLIC',
    hashtags: ['kerala', 'grassroots', 'skills', 'midfielder'],
    locationName: 'Malabar Grassroots Academy, Kochi',
    videoThumbnail: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=600',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    viewsCount: 1420,
    likesCount: 88,
    commentsCount: 12,
    sharesCount: 14,
    upvotedByMe: false,
    timestamp: '2 hours ago',
    publishedAt: new Date(Date.now() - 7200000).toISOString(),
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
    reported: false
  }
};

const postMediaStore: Record<string, any[]> = {
  'post-01': [
    {
      id: 'media-01',
      postId: 'post-01',
      mediaType: 'VIDEO',
      storageProvider: 'LOCAL',
      storageKey: 'videos/post-01-hd.mp4',
      thumbnailKey: 'thumbnails/post-01-thumb.jpg',
      mimeType: 'video/mp4',
      fileSize: 42800000,
      durationSeconds: 45,
      width: 1280,
      height: 720,
      fps: 30,
      processingStatus: 'COMPLETE',
      createdAt: new Date().toISOString()
    }
  ]
};

const mediaUploadSessions: Record<string, any> = {};
const contentProcessingJobsStore: Record<string, any[]> = {};
const hashtagsStore: Record<string, { id: string; name: string; normalizedName: string }> = {
  'kerala': { id: 'ht-1', name: 'kerala', normalizedName: 'kerala' },
  'grassroots': { id: 'ht-2', name: 'grassroots', normalizedName: 'grassroots' },
  'freestyle': { id: 'ht-3', name: 'freestyle', normalizedName: 'freestyle' },
  'skills': { id: 'ht-4', name: 'skills', normalizedName: 'skills' },
  'midfielder': { id: 'ht-5', name: 'midfielder', normalizedName: 'midfielder' }
};


async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      service: "Digital Scout India API",
      version: "1.0.0",
      firebaseProject: firebaseConfig.projectId || "connected",
      pythonBackend: "FastAPI",
      timestamp: new Date().toISOString()
    });
  });

  // Firebase Config & Status Endpoint
  app.get("/api/firebase/config", (req, res) => {
    res.json({
      projectId: firebaseConfig.projectId,
      firestoreDatabaseId: firebaseConfig.firestoreDatabaseId,
      authDomain: firebaseConfig.authDomain,
      status: "ACTIVE"
    });
  });

  // Forward /api/py/* requests to Python FastAPI backend
  app.all("/api/py/*", async (req, res) => {
    try {
      const pyUrl = `http://127.0.0.1:8000${req.originalUrl}`;
      const options: RequestInit = {
        method: req.method,
        headers: { "Content-Type": "application/json" },
      };
      if (["POST", "PUT", "PATCH"].includes(req.method) && req.body) {
        options.body = JSON.stringify(req.body);
      }
      const pyRes = await fetch(pyUrl, options);
      const data = await pyRes.json();
      res.status(pyRes.status).json(data);
    } catch (err: any) {
      console.error("Error proxying to Python FastAPI backend:", err.message);
      res.status(502).json({
        error: "PYTHON_BACKEND_UNAVAILABLE",
        message: "Python FastAPI backend process starting or connecting...",
        details: err.message
      });
    }
  });

  // --- IDENTITY & AUTH MODULE ---

  // WhatsApp OTP Send simulation
  app.post("/api/auth/otp/send", (req, res) => {
    const { phone, purpose } = req.body;
    if (!phone) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins

    activeOtps[phone] = { code, expiresAt };

    console.log(`[WhatsApp OTP] Simulated message sent to ${phone} for ${purpose || 'verification'}: Code is ${code}`);

    res.json({
      success: true,
      message: `WhatsApp OTP sent to ${phone}`,
      simulatedCode: code,
      expiresInSeconds: 300
    });
  });

  // WhatsApp OTP Verify
  app.post("/api/auth/otp/verify", (req, res) => {
    const { phone, code } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ error: "Phone number and OTP code are required" });
    }

    const stored = activeOtps[phone];
    const isMasterCode = code === "123456";
    const isValidCode = stored && stored.code === code && stored.expiresAt > Date.now();

    if (isMasterCode || isValidCode) {
      delete activeOtps[phone];
      return res.json({
        verified: true,
        message: "WhatsApp OTP verified successfully",
        token: `dsi_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString()
      });
    }

    return res.status(400).json({
      verified: false,
      error: "Invalid or expired OTP code. Use 123456 for instant testing."
    });
  });

  // Registration Endpoint - FORCE USER ROLE (NOBODY selects 'PLAYER' on sign up)
  app.post("/api/v1/auth/register", (req, res) => {
    const { phone, firstName, lastName, dob, gender, city, state } = req.body;

    if (!phone || !firstName || !dob) {
      return res.status(400).json({ error: "Phone, First Name, and Date of Birth are required." });
    }

    const userId = `usr-${Date.now()}`;
    const displayName = `${firstName} ${lastName || ''}`.trim();

    // FORCE ROLE TO 'USER' (Normal User) according to Digital Scout Business Rules
    const newUser = {
      id: userId,
      phone,
      role: 'USER', // FORCED NORMAL_USER
      status: 'ACTIVE',
      displayName,
      firstName,
      lastName: lastName || '',
      dob,
      gender: gender || 'Male',
      city: city || 'Kochi',
      state: state || 'Kerala',
      country: 'India',
      profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      qualificationStatus: 'NOT_STARTED',
      profileCompletionPct: 80
    };

    userAccounts[userId] = newUser;

    // Save user document directly to Firebase Firestore
    if (firebaseConfig && firebaseConfig.projectId) {
      const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId || '(default)'}/documents/users/${userId}?key=${firebaseConfig.apiKey}`;
      fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: {
            id: { stringValue: userId },
            phone: { stringValue: phone || '' },
            role: { stringValue: 'USER' },
            status: { stringValue: 'ACTIVE' },
            displayName: { stringValue: displayName },
            firstName: { stringValue: firstName },
            lastName: { stringValue: lastName || '' },
            dob: { stringValue: dob || '' },
            gender: { stringValue: gender || 'Male' },
            city: { stringValue: city || 'Kochi' },
            state: { stringValue: state || 'Kerala' },
            country: { stringValue: 'India' },
            profilePhoto: { stringValue: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300' },
            qualificationStatus: { stringValue: 'NOT_STARTED' },
            createdAt: { stringValue: new Date().toISOString() }
          }
        })
      }).then(() => console.log(`[Firebase Firestore] Saved user ${userId} to /users collection`))
        .catch(err => console.error("Firestore user save error:", err));
    }

    console.log(`[User Registration] New Normal User created: ${displayName} (${userId}) - Role: USER`);

    res.json({
      success: true,
      user: newUser,
      message: "Account created successfully as Normal User. Complete the Basic Football Assessment to upgrade to Player status!"
    });
  });

  // GET Current User Profile & Identity Endpoint
  app.get("/api/v1/me/profile", (req, res) => {
    const userId = (req.headers['x-user-id'] as string) || Object.keys(userAccounts)[0] || 'usr-demo';
    const user = userAccounts[userId];

    if (!user) {
      return res.status(404).json({ error: "PROFILE_NOT_FOUND", message: "User profile not found." });
    }

    const playerProfile = user.playerId ? playerProfilesStore[user.playerId] : null;
    const followers = userFollows.filter(f => f.followingUserId === userId);
    const following = userFollows.filter(f => f.followerUserId === userId);

    res.json({
      success: true,
      user,
      playerProfile,
      socialGraph: {
        followersCount: followers.length,
        followingCount: following.length
      },
      profileCompletionPercent: user.profileCompletionPct || 80
    });
  });

  // GET Profile Completion Details
  app.get("/api/v1/me/profile/completion", (req, res) => {
    const userId = (req.headers['x-user-id'] as string) || Object.keys(userAccounts)[0] || 'usr-demo';
    const user = userAccounts[userId] || {};

    const missingFields: string[] = [];
    if (!user.displayName) missingFields.push("Display Name");
    if (!user.username) missingFields.push("Username / Handle");
    if (!user.bio) missingFields.push("Bio");
    if (!user.city) missingFields.push("City");
    if (!user.profilePhoto || user.profilePhoto.includes("default")) missingFields.push("Profile Photo");

    if (user.role === 'PLAYER') {
      const player = user.playerId ? playerProfilesStore[user.playerId] : null;
      if (!player?.position) missingFields.push("Playing Position");
      if (!player?.preferredFoot) missingFields.push("Preferred Foot");
    }

    const totalFields = 7;
    const completedFields = totalFields - missingFields.length;
    const completionPct = Math.min(100, Math.round((completedFields / totalFields) * 100));

    res.json({
      userId,
      completionPct,
      missingFields,
      isFullyComplete: missingFields.length === 0
    });
  });

  // PATCH Edit User Profile - WITH STRICT SECURITY & AUDIT LOGGING
  app.patch("/api/v1/me/profile", (req, res) => {
    const userId = (req.headers['x-user-id'] as string) || Object.keys(userAccounts)[0] || 'usr-demo';
    const body = req.body || {};

    // STRICT RULE: Block manual self-assignment of 'PLAYER' role!
    if (body.role && body.role === 'PLAYER') {
      return res.status(403).json({
        error: "ROLE_CHANGE_NOT_ALLOWED",
        message: "A normal registered user cannot manually assign themselves the PLAYER role. Player status must be earned through the Basic Football Assessment."
      });
    }

    // Check username uniqueness if changing username
    if (body.username) {
      const normalizedNew = body.username.toLowerCase().trim().replace(/^@/, '');
      const existingUser = Object.values(userAccounts).find(u => u.id !== userId && u.username_normalized === normalizedNew);
      if (existingUser) {
        return res.status(400).json({
          error: "USERNAME_TAKEN",
          message: `The username @${normalizedNew} is already taken by another user. Please choose a different handle.`
        });
      }
      body.username = normalizedNew;
      body.username_normalized = normalizedNew;
    }

    if (userAccounts[userId]) {
      const { role, ...allowedUpdates } = body;
      userAccounts[userId] = {
        ...userAccounts[userId],
        ...allowedUpdates,
        updatedAt: new Date().toISOString()
      };

      // Also update player profile display name/photo if player profile exists
      if (userAccounts[userId].playerId && playerProfilesStore[userAccounts[userId].playerId]) {
        const player = playerProfilesStore[userAccounts[userId].playerId];
        if (body.displayName) player.name = body.displayName;
        if (body.profilePhoto) player.photo = body.profilePhoto;
        if (body.city) player.city = body.city;
        if (body.state) player.state = body.state;
      }

      console.log(`[Profile Updated] User ${userId} updated profile details. Username: @${userAccounts[userId].username}`);

      return res.json({
        success: true,
        user: userAccounts[userId],
        message: "Profile updated successfully!"
      });
    }

    res.status(404).json({ error: "User profile not found." });
  });

  // POST Upload/Update Profile Photo
  app.post("/api/v1/me/profile/photo", (req, res) => {
    const userId = (req.headers['x-user-id'] as string) || Object.keys(userAccounts)[0] || 'usr-demo';
    const { photoUrl } = req.body;

    if (!photoUrl) {
      return res.status(400).json({ error: "photoUrl is required." });
    }

    if (userAccounts[userId]) {
      userAccounts[userId].profilePhoto = photoUrl;
      userAccounts[userId].updatedAt = new Date().toISOString();
      if (userAccounts[userId].playerId && playerProfilesStore[userAccounts[userId].playerId]) {
        playerProfilesStore[userAccounts[userId].playerId].photo = photoUrl;
      }
      return res.json({
        success: true,
        photoUrl,
        message: "Profile photo updated successfully!"
      });
    }

    res.status(404).json({ error: "User account not found." });
  });

  // DELETE Reset Profile Photo
  app.delete("/api/v1/me/profile/photo", (req, res) => {
    const userId = (req.headers['x-user-id'] as string) || Object.keys(userAccounts)[0] || 'usr-demo';
    const defaultAvatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300";

    if (userAccounts[userId]) {
      userAccounts[userId].profilePhoto = defaultAvatar;
      userAccounts[userId].updatedAt = new Date().toISOString();
      return res.json({
        success: true,
        photoUrl: defaultAvatar,
        message: "Profile photo reset to default avatar."
      });
    }

    res.status(404).json({ error: "User account not found." });
  });

  // GET Public Profile by @username
  app.get("/api/v1/users/:username", (req, res) => {
    const rawUsername = req.params.username.toLowerCase().trim().replace(/^@/, '');
    
    // Lookup by username, username_normalized, or id
    let targetUser = Object.values(userAccounts).find(
      u => u.username_normalized === rawUsername || u.id === rawUsername || u.username === rawUsername
    );

    if (!targetUser) {
      // Create virtual view model if searching demo/sample players
      if (rawUsername.startsWith("player-") || rawUsername === "rahulfootball") {
        targetUser = {
          id: 'player-01',
          displayName: 'Rahul Menacherry',
          username: 'rahulfootball',
          username_normalized: 'rahulfootball',
          role: 'PLAYER',
          status: 'ACTIVE',
          city: 'Kochi',
          state: 'Kerala',
          country: 'India',
          profilePhoto: 'https://images.unsplash.com/photo-1543351611-58f69d7c1781?auto=format&fit=crop&q=80&w=300',
          bio: 'Dynamic central midfielder with elite dual-foot vision and top regional juggle consistency.',
          playerId: 'DSI-000123'
        };
      } else {
        return res.status(404).json({ error: "USER_NOT_FOUND", message: `No user profile found for @${rawUsername}` });
      }
    }

    // Sanitize private sensitive fields before sending
    const { phone, email, guardianPhone, guardianName, ...publicUser } = targetUser;
    const playerProfile = targetUser.playerId ? playerProfilesStore[targetUser.playerId] : null;

    const followers = userFollows.filter(f => f.followingUserId === targetUser.id);
    const following = userFollows.filter(f => f.followerUserId === targetUser.id);

    res.json({
      success: true,
      user: publicUser,
      playerProfile,
      followersCount: followers.length,
      followingCount: following.length
    });
  });

  // POST Follow User (Prevents Self-Follow)
  app.post("/api/v1/users/:userId/follow", (req, res) => {
    const currentUserId = (req.headers['x-user-id'] as string) || Object.keys(userAccounts)[0] || 'usr-demo';
    const targetUserId = req.params.userId;

    if (currentUserId === targetUserId) {
      return res.status(400).json({ error: "INVALID_FOLLOW", message: "You cannot follow your own profile!" });
    }

    const existingIndex = userFollows.findIndex(f => f.followerUserId === currentUserId && f.followingUserId === targetUserId);
    if (existingIndex === -1) {
      userFollows.push({
        id: `fol-${Date.now()}`,
        followerUserId: currentUserId,
        followingUserId: targetUserId,
        createdAt: new Date().toISOString()
      });
      console.log(`[Social Graph] User ${currentUserId} followed ${targetUserId}`);
    }

    const followersCount = userFollows.filter(f => f.followingUserId === targetUserId).length;

    res.json({
      success: true,
      isFollowing: true,
      followersCount,
      message: `Now following user ${targetUserId}`
    });
  });

  // DELETE Unfollow User
  app.delete("/api/v1/users/:userId/follow", (req, res) => {
    const currentUserId = (req.headers['x-user-id'] as string) || Object.keys(userAccounts)[0] || 'usr-demo';
    const targetUserId = req.params.userId;

    const index = userFollows.findIndex(f => f.followerUserId === currentUserId && f.followingUserId === targetUserId);
    if (index !== -1) {
      userFollows.splice(index, 1);
      console.log(`[Social Graph] User ${currentUserId} unfollowed ${targetUserId}`);
    }

    const followersCount = userFollows.filter(f => f.followingUserId === targetUserId).length;

    res.json({
      success: true,
      isFollowing: false,
      followersCount,
      message: `Unfollowed user ${targetUserId}`
    });
  });

  // POST Block User (Prevents Self-Block)
  app.post("/api/v1/users/:userId/block", (req, res) => {
    const currentUserId = (req.headers['x-user-id'] as string) || Object.keys(userAccounts)[0] || 'usr-demo';
    const targetUserId = req.params.userId;

    if (currentUserId === targetUserId) {
      return res.status(400).json({ error: "INVALID_BLOCK", message: "You cannot block yourself!" });
    }

    const existing = blockedUsers.find(b => b.blockerUserId === currentUserId && b.blockedUserId === targetUserId);
    if (!existing) {
      blockedUsers.push({
        id: `block-${Date.now()}`,
        blockerUserId: currentUserId,
        blockedUserId: targetUserId,
        createdAt: new Date().toISOString()
      });
      console.log(`[Moderation] User ${currentUserId} blocked ${targetUserId}`);
    }

    res.json({
      success: true,
      blocked: true,
      message: `Blocked user ${targetUserId}`
    });
  });

  // DELETE Unblock User
  app.delete("/api/v1/users/:userId/block", (req, res) => {
    const currentUserId = (req.headers['x-user-id'] as string) || Object.keys(userAccounts)[0] || 'usr-demo';
    const targetUserId = req.params.userId;

    const index = blockedUsers.findIndex(b => b.blockerUserId === currentUserId && b.blockedUserId === targetUserId);
    if (index !== -1) {
      blockedUsers.splice(index, 1);
      console.log(`[Moderation] User ${currentUserId} unblocked ${targetUserId}`);
    }

    res.json({
      success: true,
      blocked: false,
      message: `Unblocked user ${targetUserId}`
    });
  });

  // POST Report Profile
  app.post("/api/v1/users/:userId/report", (req, res) => {
    const currentUserId = (req.headers['x-user-id'] as string) || Object.keys(userAccounts)[0] || 'usr-demo';
    const targetUserId = req.params.userId;
    const { reason, description } = req.body;

    const reportId = `rep-${Date.now()}`;
    const reportEntry = {
      id: reportId,
      reporterUserId: currentUserId,
      targetUserId,
      reason: reason || 'Inappropriate content or suspicious profile',
      description: description || '',
      status: 'PENDING_REVIEW',
      createdAt: new Date().toISOString()
    };

    profileReports.push(reportEntry);
    console.log(`[Moderation Report Created] Report ${reportId} for user ${targetUserId} by ${currentUserId}`);

    res.json({
      success: true,
      reportId,
      message: "Report submitted successfully to Digital Scout Moderation Team."
    });
  });

  // --- MODULE 4: CONTENT CREATION & MEDIA UPLOAD API ENDPOINTS ---

  // GET All Published Feed Posts
  app.get("/api/v1/posts", (req, res) => {
    const currentUserId = (req.headers['x-user-id'] as string) || 'usr-demo';
    const activePosts = Object.values(postsStore)
      .filter(p => !p.deletedAt && p.status === 'PUBLISHED')
      .sort((a, b) => new Date(b.createdAt || b.publishedAt || 0).getTime() - new Date(a.createdAt || a.publishedAt || 0).getTime());

    res.json({
      success: true,
      count: activePosts.length,
      posts: activePosts
    });
  });

  // GET User Specific Posts
  app.get("/api/v1/users/:userId/posts", (req, res) => {
    const userId = req.params.userId;
    const userPosts = Object.values(postsStore).filter(
      p => !p.deletedAt && p.status === 'PUBLISHED' && (p.authorId === userId || p.authorName.toLowerCase().includes(userId.toLowerCase()))
    );

    res.json({
      success: true,
      userId,
      count: userPosts.length,
      posts: userPosts
    });
  });

  // GET User Drafts
  app.get("/api/v1/me/drafts", (req, res) => {
    const currentUserId = (req.headers['x-user-id'] as string) || 'usr-demo';
    const drafts = Object.values(postsStore).filter(
      p => p.authorId === currentUserId && p.status === 'DRAFT' && !p.deletedAt
    );

    res.json({
      success: true,
      count: drafts.length,
      drafts
    });
  });

  // GET Single Post Details
  app.get("/api/v1/posts/:id", (req, res) => {
    const postId = req.params.id;
    const post = postsStore[postId];

    if (!post || post.deletedAt) {
      return res.status(404).json({ error: "POST_NOT_FOUND", message: `Post ${postId} not found.` });
    }

    const media = postMediaStore[postId] || [];
    const processingJobs = contentProcessingJobsStore[postId] || [];

    res.json({
      success: true,
      post,
      media,
      processingJobs
    });
  });

  // POST Create Post / Save Draft
  app.post("/api/v1/posts", (req, res) => {
    const currentUserId = (req.headers['x-user-id'] as string) || 'usr-demo';
    const currentUser = userAccounts[currentUserId] || {
      id: currentUserId,
      displayName: 'Rahul Menacherry',
      username: 'rahulfootball',
      role: 'USER',
      state: 'Kerala',
      dob: '2008-04-12'
    };

    const {
      title,
      caption,
      postType = 'PLAYER_VIDEO',
      category = 'Highlight',
      contentType = 'SOCIAL_VIDEO',
      visibility = 'PUBLIC',
      hashtags = [],
      locationName = '',
      videoThumbnail,
      videoUrl,
      imageUrl,
      status = 'PUBLISHED',
      trialId,
      sessionId
    } = req.body;

    // CONTENT-028: Minor Guardian Consent Verification for Media Uploads
    const birthYear = new Date(currentUser.dob || '2008-04-12').getFullYear();
    const isMinor = (new Date().getFullYear() - birthYear) < 18;
    const isMediaPost = postType === 'PLAYER_VIDEO' || postType === 'PHOTO' || videoUrl || imageUrl || sessionId;

    if (isMinor && isMediaPost && !currentUser.guardianConsentGiven && qualificationRules.requireGuardianConsentForMinors) {
      return res.status(403).json({
        error: "GUARDIAN_CONSENT_REQUIRED",
        isMinor: true,
        message: "Under-18 Protection Policy: Parental or Guardian consent must be verified before uploading or capturing football videos."
      });
    }

    // CONTENT-027: Automated Safety Check Simulation
    const bannedWords = ['hate', 'spam', 'abuse', 'violence', 'scam'];
    const combinedText = `${title || ''} ${caption || ''} ${hashtags.join(' ')}`.toLowerCase();
    const containsBanned = bannedWords.some(w => combinedText.includes(w));

    if (containsBanned) {
      return res.status(400).json({
        error: "SAFETY_CHECK_FAILED",
        message: "Safety Moderation Check: Content contained inappropriate text or flagged tags. Please edit and resubmit."
      });
    }

    const postId = `post-${Date.now()}`;
    const authorHandle = currentUser.username ? `@${currentUser.username}` : currentUser.displayName;

    const newPost = {
      id: postId,
      authorId: currentUser.id,
      authorName: currentUser.displayName,
      authorHandle,
      authorPhoto: currentUser.profilePhoto || 'https://images.unsplash.com/photo-1543351611-58f69d7c1781?auto=format&fit=crop&q=80&w=300',
      authorState: currentUser.state || 'Kerala',
      authorPosition: currentUser.role === 'PLAYER' ? 'Central Mid' : 'Player',
      authorTier: currentUser.qualificationScore && currentUser.qualificationScore >= 90 ? 'GOLD' : 'SILVER',
      title: title || (contentType === 'TRIAL_VIDEO' ? 'Official Drill Assessment Video' : 'Digital Scout Football Post'),
      caption: caption || '',
      postType,
      category,
      contentType,
      trialId: trialId || null,
      status: status as string, // 'DRAFT', 'PROCESSING', 'PUBLISHED'
      visibility: visibility as string, // 'PUBLIC', 'FOLLOWERS_ONLY', 'PRIVATE'
      hashtags: hashtags.map((h: string) => h.replace(/^#/, '').toLowerCase()),
      locationName: locationName || `${currentUser.city || 'Kochi'}, ${currentUser.state || 'Kerala'}`,
      videoThumbnail: videoThumbnail || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=600',
      videoUrl: videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      imageUrl: imageUrl || null,
      viewsCount: 1,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      upvotedByMe: false,
      timestamp: 'Just now',
      publishedAt: status === 'PUBLISHED' ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reported: false
    };

    postsStore[postId] = newPost;

    // Attach media record if sessionId passed
    if (sessionId && mediaUploadSessions[sessionId]) {
      const session = mediaUploadSessions[sessionId];
      postMediaStore[postId] = [
        {
          id: `media-${Date.now()}`,
          postId,
          mediaType: session.mimeType.startsWith('image') ? 'PHOTO' : 'VIDEO',
          storageProvider: 'LOCAL',
          storageKey: session.storageKey || `videos/${postId}.mp4`,
          thumbnailKey: `thumbnails/${postId}-thumb.jpg`,
          mimeType: session.mimeType,
          fileSize: session.fileSize,
          durationSeconds: session.durationSeconds || 60,
          width: 1280,
          height: 720,
          fps: 30,
          processingStatus: 'COMPLETE',
          createdAt: new Date().toISOString()
        }
      ];
    }

    // Register processing jobs
    contentProcessingJobsStore[postId] = [
      { id: `job-1-${postId}`, postId, jobType: 'VIDEO_TRANSCODE', status: 'COMPLETED', attemptCount: 1, completedAt: new Date().toISOString() },
      { id: `job-2-${postId}`, postId, jobType: 'THUMBNAIL_GENERATE', status: 'COMPLETED', attemptCount: 1, completedAt: new Date().toISOString() },
      { id: `job-3-${postId}`, postId, jobType: 'MODERATION_CHECK', status: 'COMPLETED', attemptCount: 1, completedAt: new Date().toISOString() }
    ];

    console.log(`[Module 4 - Post Created] Post ${postId} (${status}) published by ${currentUser.displayName}`);

    res.json({
      success: true,
      postId,
      post: newPost,
      message: status === 'DRAFT' ? "Post saved as draft!" : "Post published successfully to Digital Scout feed!"
    });
  });

  // PATCH Edit Post Metadata (CONTENT-023: Caption, Hashtags, Location, Visibility)
  app.patch("/api/v1/posts/:id", (req, res) => {
    const currentUserId = (req.headers['x-user-id'] as string) || 'usr-demo';
    const postId = req.params.id;
    const post = postsStore[postId];

    if (!post || post.deletedAt) {
      return res.status(404).json({ error: "POST_NOT_FOUND", message: `Post ${postId} not found.` });
    }

    // Check ownership
    if (post.authorId !== currentUserId && currentUserId !== 'usr-demo') {
      return res.status(403).json({ error: "UNAUTHORIZED", message: "You can only edit posts that you authored." });
    }

    const { caption, hashtags, locationName, visibility, status } = req.body;

    // Protect immutable attributes: original media, author, AI trial association cannot be tampered with
    if (caption !== undefined) post.caption = caption;
    if (locationName !== undefined) post.locationName = locationName;
    if (visibility !== undefined) post.visibility = visibility;
    if (status !== undefined) {
      post.status = status;
      if (status === 'PUBLISHED' && !post.publishedAt) {
        post.publishedAt = new Date().toISOString();
      }
    }
    if (hashtags !== undefined && Array.isArray(hashtags)) {
      post.hashtags = hashtags.map((h: string) => h.replace(/^#/, '').toLowerCase());
    }

    post.updatedAt = new Date().toISOString();
    postsStore[postId] = post;

    console.log(`[Module 4 - Post Edited] Updated metadata for post ${postId}`);

    res.json({
      success: true,
      post,
      message: "Post details updated successfully."
    });
  });

  // DELETE Soft-Delete Post (CONTENT-024)
  app.delete("/api/v1/posts/:id", (req, res) => {
    const currentUserId = (req.headers['x-user-id'] as string) || 'usr-demo';
    const postId = req.params.id;
    const post = postsStore[postId];

    if (!post || post.deletedAt) {
      return res.status(404).json({ error: "POST_NOT_FOUND", message: `Post ${postId} not found.` });
    }

    if (post.authorId !== currentUserId && currentUserId !== 'usr-demo') {
      return res.status(403).json({ error: "UNAUTHORIZED", message: "You can only delete posts that you authored." });
    }

    // Perform soft deletion
    post.deletedAt = new Date().toISOString();
    post.status = 'REMOVED';
    postsStore[postId] = post;

    console.log(`[Module 4 - Post Deleted] Soft deleted post ${postId}`);

    res.json({
      success: true,
      postId,
      message: "Post removed successfully from community feed."
    });
  });

  // POST Initiate Media Upload Session (Chunked Uploads CONTENT-012, CONTENT-013)
  app.post("/api/v1/media/upload/initiate", (req, res) => {
    const currentUserId = (req.headers['x-user-id'] as string) || 'usr-demo';
    const { filename, fileSize, mimeType, totalChunks = 1, durationSeconds } = req.body;

    const maxMB = parseInt(process.env.VIDEO_MAX_SIZE_MB || '200', 10);
    const maxSizeBytes = maxMB * 1024 * 1024;

    if (fileSize > maxSizeBytes) {
      return res.status(400).json({
        error: "FILE_TOO_LARGE",
        message: `File size (${(fileSize / (1024 * 1024)).toFixed(1)} MB) exceeds platform limit of ${maxMB} MB.`
      });
    }

    const sessionId = `upsess-${Date.now()}`;
    mediaUploadSessions[sessionId] = {
      sessionId,
      userId: currentUserId,
      filename: filename || 'football-video.mp4',
      fileSize: fileSize || 10000000,
      mimeType: mimeType || 'video/mp4',
      totalChunks: Math.max(1, totalChunks),
      chunksReceived: [],
      durationSeconds: durationSeconds || 45,
      status: 'UPLOADING',
      bytesUploaded: 0,
      storageKey: `uploads/user_${currentUserId}/${sessionId}_${filename || 'video.mp4'}`
    };

    console.log(`[Module 4 - Media Upload Session] Initiated session ${sessionId} for ${filename} (${totalChunks} chunks)`);

    res.json({
      success: true,
      sessionId,
      totalChunks,
      status: 'UPLOADING',
      chunkSizeRecommendedMB: 2
    });
  });

  // POST Upload Chunk (Supports Resumable Interrupted Uploads)
  app.post("/api/v1/media/upload/:sessionId/chunk", (req, res) => {
    const sessionId = req.params.sessionId;
    const session = mediaUploadSessions[sessionId];

    if (!session) {
      return res.status(404).json({ error: "SESSION_NOT_FOUND", message: `Upload session ${sessionId} not found.` });
    }

    const { chunkIndex, chunkSizeBytes = 2000000 } = req.body;

    if (!session.chunksReceived.includes(chunkIndex)) {
      session.chunksReceived.push(chunkIndex);
      session.bytesUploaded = Math.min(session.fileSize, session.chunksReceived.length * chunkSizeBytes);
    }

    const progressPct = Math.round((session.chunksReceived.length / session.totalChunks) * 100);

    if (session.chunksReceived.length >= session.totalChunks) {
      session.status = 'PROCESSING';
    }

    res.json({
      success: true,
      sessionId,
      chunkIndex,
      chunksReceivedCount: session.chunksReceived.length,
      totalChunks: session.totalChunks,
      progressPct,
      bytesUploaded: session.bytesUploaded,
      fileSize: session.fileSize,
      status: session.status
    });
  });

  // POST Finalize Upload Session
  app.post("/api/v1/media/upload/:sessionId/complete", (req, res) => {
    const sessionId = req.params.sessionId;
    const session = mediaUploadSessions[sessionId];

    if (!session) {
      return res.status(404).json({ error: "SESSION_NOT_FOUND", message: `Upload session ${sessionId} not found.` });
    }

    session.status = 'COMPLETE';
    session.videoUrl = session.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

    res.json({
      success: true,
      sessionId,
      status: 'COMPLETE',
      videoUrl: session.videoUrl,
      thumbnailUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=600',
      message: "Media upload complete and optimized for streamable playback!"
    });
  });

  // GET Session Upload & Processing Status
  app.get("/api/v1/media/:sessionId/status", (req, res) => {
    const sessionId = req.params.sessionId;
    const session = mediaUploadSessions[sessionId];

    if (!session) {
      return res.status(404).json({ error: "SESSION_NOT_FOUND", message: `Upload session ${sessionId} not found.` });
    }

    const progressPct = Math.round((session.chunksReceived.length / session.totalChunks) * 100);

    res.json({
      sessionId,
      status: session.status,
      progressPct,
      bytesUploaded: session.bytesUploaded || 0,
      fileSize: session.fileSize || 0,
      chunksReceived: session.chunksReceived.length,
      totalChunks: session.totalChunks
    });
  });

  // GET Post Processing Status
  app.get("/api/v1/posts/:id/processing-status", (req, res) => {
    const postId = req.params.id;
    const jobs = contentProcessingJobsStore[postId] || [
      { id: 'job-1', postId, jobType: 'VIDEO_TRANSCODE', status: 'COMPLETED' },
      { id: 'job-2', postId, jobType: 'THUMBNAIL_GENERATE', status: 'COMPLETED' },
      { id: 'job-3', postId, jobType: 'MODERATION_CHECK', status: 'COMPLETED' }
    ];

    res.json({
      postId,
      jobs,
      allCompleted: jobs.every((j: any) => j.status === 'COMPLETED')
    });
  });


  // --- PLAYER PROFILE & STATS ENDPOINTS ---

  // GET Player Details
  app.get("/api/v1/players/:playerId", (req, res) => {
    const playerId = req.params.playerId;
    const player = playerProfilesStore[playerId] || playerProfilesStore['DSI-000123'];

    if (!player) {
      return res.status(404).json({ error: "PLAYER_NOT_FOUND", message: `Player profile ${playerId} not found.` });
    }

    res.json({
      success: true,
      player
    });
  });

  // GET Player Performance Stats Breakdown
  app.get("/api/v1/players/:playerId/stats", (req, res) => {
    const playerId = req.params.playerId;
    const player = playerProfilesStore[playerId] || playerProfilesStore['DSI-000123'];

    res.json({
      playerId,
      overallScore: player?.overallScore || 92,
      tier: player?.tier || 'GOLD',
      metrics: {
        speed: { score: player?.speedScore || 88, displayValue: '7.8 m/s' },
        ballControl: { score: player?.ballControlScore || 95, displayValue: '95/100' },
        agility: { score: player?.agilityScore || 93, displayValue: '93/100' },
        technical: { score: player?.technicalScore || 94, displayValue: '94/100' },
        physical: { score: player?.physicalScore || 89, displayValue: '89/100' },
        consistency: { score: player?.consistencyScore || 91, displayValue: '91/100' }
      }
    });
  });

  // GET Player Achievements
  app.get("/api/v1/players/:playerId/achievements", (req, res) => {
    const playerId = req.params.playerId;
    const achievements = playerAchievementsStore[playerId] || playerAchievementsStore['DSI-000123'] || [];

    res.json({
      playerId,
      achievementsCount: achievements.length,
      achievements
    });
  });

  // GET Player Score History / Snapshots
  app.get("/api/v1/players/:playerId/progress", (req, res) => {
    const playerId = req.params.playerId;
    const snapshots = playerScoreSnapshots[playerId] || playerScoreSnapshots['DSI-000123'] || [];

    res.json({
      playerId,
      snapshots
    });
  });

  // GET Player Rankings
  app.get("/api/v1/players/:playerId/rankings", (req, res) => {
    const playerId = req.params.playerId;
    const player = playerProfilesStore[playerId] || playerProfilesStore['DSI-000123'];

    res.json({
      playerId,
      nationalRank: player?.nationalRank || 3,
      stateRank: player?.stateRank || 1,
      districtRank: player?.districtRank || 1,
      state: player?.state || 'Kerala'
    });
  });

  // --- PLAYER QUALIFICATION & PROMOTION MODULE ---

  // Eligibility Check Endpoint
  app.get("/api/v1/player/eligibility", (req, res) => {
    const userId = (req.headers['x-user-id'] as string) || 'usr-default';
    const user = userAccounts[userId] || { dob: '2008-05-15', qualificationStatus: 'NOT_STARTED' };

    // Calculate age from DOB
    const birthYear = new Date(user.dob || '2008-05-15').getFullYear();
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;
    const isMinor = age < 18;

    res.json({
      eligible: true,
      isMinor,
      age,
      profileComplete: true,
      guardianConsentRequired: isMinor && !user.guardianConsentGiven,
      qualificationStatus: user.qualificationStatus || 'NOT_STARTED',
      rules: qualificationRules
    });
  });

  // Start Qualification Assessment Session
  app.post("/api/v1/player/qualification/start", (req, res) => {
    const userId = (req.headers['x-user-id'] as string) || 'usr-default';
    const attemptId = `qual-att-${Date.now()}`;

    if (!qualificationAttempts[userId]) {
      qualificationAttempts[userId] = [];
    }

    if (userAccounts[userId]) {
      userAccounts[userId].qualificationStatus = 'ASSESSMENT_IN_PROGRESS';
    }

    res.json({
      attemptId,
      status: 'ASSESSMENT_IN_PROGRESS',
      rules: qualificationRules,
      requiredDrills: [
        { id: 'qual-drill-1', title: 'Basic Ball Control & Juggling', category: 'BALL_CONTROL', durationSeconds: 60, targetMetric: '40+ touches' },
        { id: 'qual-drill-2', title: 'Agility & Shuttle Sprint', category: 'AGILITY', durationSeconds: 45, targetMetric: '< 10.5 seconds' },
        { id: 'qual-drill-3', title: 'Target Wall Passing', category: 'PASSING', durationSeconds: 60, targetMetric: '15+ accurate passes' }
      ]
    });
  });

  // Submit Qualification Assessment & Evaluate Result (Server-Side Player Promotion Service)
  app.post("/api/v1/player/qualification/:id/submit", (req, res) => {
    const userId = (req.headers['x-user-id'] as string) || 'usr-default';
    const { scores, drillResults, position, preferredFoot, heightCm, weightKg } = req.body;

    const ballControlScore = scores?.ballControl || Math.floor(65 + Math.random() * 25);
    const passingScore = scores?.passing || Math.floor(65 + Math.random() * 25);
    const coordinationScore = scores?.coordination || Math.floor(65 + Math.random() * 25);
    const overallScore = Math.round((ballControlScore + passingScore + coordinationScore) / 3);

    const passed = overallScore >= qualificationRules.minPassingScore;

    const userHistory = qualificationAttempts[userId] || [];
    const attemptNumber = userHistory.length + 1;

    const attemptRecord = {
      id: req.params.id,
      userId,
      attemptNumber,
      timestamp: new Date().toISOString(),
      scores: {
        ballControl: ballControlScore,
        passing: passingScore,
        coordination: coordinationScore,
        overall: overallScore
      },
      passed,
      feedback: passed ? {
        strengths: ["Excellent foot-eye coordination under pressure", "Rhythmic dual-foot ball control stability"],
        improvements: ["Maintain head-up orientation during high-tempo transitions"],
        summary: "Demonstrated solid technical football foundation exceeding minimum qualification benchmark."
      } : {
        strengths: ["Strong physical energy and enthusiasm during trial"],
        improvements: ["Work on non-dominant foot touch control", "Practice wall passing rhythm for 15 mins daily"],
        summary: `Score of ${overallScore} is below the required ${qualificationRules.minPassingScore} qualification benchmark. Practice and try again!`
      },
      drillsCompleted: drillResults || []
    };

    if (!qualificationAttempts[userId]) {
      qualificationAttempts[userId] = [];
    }
    qualificationAttempts[userId].push(attemptRecord);

    if (passed) {
      // PROMOTED TO PLAYER ROLE SERVER-SIDE!
      const playerId = `DSI-${Math.floor(100000 + Math.random() * 900000)}`;

      if (userAccounts[userId]) {
        userAccounts[userId].role = 'PLAYER'; // SERVER-SIDE PROMOTION
        userAccounts[userId].qualificationStatus = 'PASSED';
        userAccounts[userId].qualificationScore = overallScore;
        userAccounts[userId].qualificationDate = new Date().toISOString().slice(0, 10);
        userAccounts[userId].playerId = playerId;
      }

      console.log(`[Player Qualification Service] User ${userId} PASSED with score ${overallScore}. Promoted to PLAYER role with ID ${playerId}!`);

      return res.json({
        passed: true,
        overallScore,
        playerId,
        scores: attemptRecord.scores,
        feedback: attemptRecord.feedback,
        promotedRole: 'PLAYER',
        message: "🎉 Congratulations! You have successfully passed the Basic Football Assessment and earned VERIFIED PLAYER status!"
      });
    } else {
      if (userAccounts[userId]) {
        userAccounts[userId].qualificationStatus = 'FAILED';
      }

      console.log(`[Player Qualification Service] User ${userId} FAILED with score ${overallScore}. Retry available.`);

      return res.json({
        passed: false,
        overallScore,
        scores: attemptRecord.scores,
        feedback: attemptRecord.feedback,
        requiredScore: qualificationRules.minPassingScore,
        retryCooldownSeconds: qualificationRules.retryCooldownHours * 3600,
        message: `Your score was ${overallScore}/100. You need ${qualificationRules.minPassingScore} to qualify as a Digital Scout Player.`
      });
    }
  });

  // ADMIN: Get/Patch Qualification Rules
  app.get("/api/v1/admin/qualification-rules", (req, res) => {
    res.json(qualificationRules);
  });

  app.patch("/api/v1/admin/qualification-rules", (req, res) => {
    qualificationRules = {
      ...qualificationRules,
      ...req.body
    };
    res.json({ success: true, rules: qualificationRules });
  });

  // Gemini AI Drill Performance Evaluation
  app.post("/api/ai/analyze-drill", async (req, res) => {
    try {
      const { drillTitle, primaryMetric, metricValue, playerPosition, playerAge, playerState } = req.body;

      const client = getGeminiClient();
      if (!client) {
        // Fallback intelligent feedback if GEMINI_API_KEY is missing
        return res.json({
          feedback: {
            strengths: [
              `Solid base rhythm and athletic posture maintained during ${drillTitle}.`,
              `Metric of ${metricValue} ${primaryMetric} places performance in competitive tier for U${playerAge} players in ${playerState}.`
            ],
            improvements: [
              `Focus on stabilizing non-dominant side balance to increase burst speed.`,
              `Practice 15 minutes daily with elevated visual awareness (head up scanning).`
            ],
            scoutNotes: `Promising scout profile for ${playerPosition} position. Technical foundation aligns well with top regional standards.`
          },
          aiModelUsed: "Rule-Engine Fallback"
        });
      }

      const prompt = `
Act as a Senior Indian Football Scout and AI Biomechanics Analyst for "Digital Scout India".
Evaluate a grassroots football player's performance in a standardized trial drill:

- Drill Title: ${drillTitle}
- Measured Metric: ${metricValue} (${primaryMetric})
- Player Position: ${playerPosition}
- Age: U${playerAge}
- Region/State: ${playerState}

Provide a JSON object response with exact keys:
1. "strengths": Array of 2 concise bullet points highlighting key technical biomechanical strengths.
2. "improvements": Array of 2 actionable coaching tips for improvement.
3. "scoutNotes": A 2-sentence tactical summary written for club scouts evaluating this player's potential.

Keep feedback encouraging, professional, and tailored to Indian football scout standards.
Only output valid JSON.
`;

      const response = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      });

      const rawText = response.text || "";
      let parsed = {
        strengths: [`Excellent biomechanical rhythm in ${drillTitle}`, `Strong metric execution for U${playerAge}`],
        improvements: [`Enhance weak-side recovery speed`, `Focus on head-up field awareness`],
        scoutNotes: `Standout U${playerAge} prospect from ${playerState} showing solid ${playerPosition} traits.`
      };

      try {
        const cleanedJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        parsed = JSON.parse(cleanedJson);
      } catch (err) {
        console.warn("Could not parse AI JSON output directly, using structured text fallback");
      }

      res.json({
        feedback: parsed,
        aiModelUsed: "gemini-2.5-flash"
      });

    } catch (error: any) {
      console.error("Error in AI drill analysis:", error);
      res.status(500).json({
        error: "Failed to generate AI evaluation",
        message: error.message
      });
    }
  });

  // Vite Middleware Setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Digital Scout India server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Fatal error starting server:", err);
});
