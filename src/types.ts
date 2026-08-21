export type Role = 'GUEST' | 'USER' | 'PLAYER' | 'PARENT' | 'SCOUT' | 'CLUB_ADMIN' | 'ACADEMY_ADMIN' | 'ADMIN';

export type AccountStatus = 'UNREGISTERED' | 'REGISTERED' | 'VERIFIED' | 'ACTIVE' | 'SUSPENDED' | 'BLOCKED' | 'DELETED';

export type PlayerQualificationStatus = 'NOT_STARTED' | 'ELIGIBLE' | 'ASSESSMENT_STARTED' | 'ASSESSMENT_IN_PROGRESS' | 'ASSESSMENT_SUBMITTED' | 'UNDER_EVALUATION' | 'PASSED' | 'FAILED' | 'RETRY_AVAILABLE';

export interface UserAccount {
  id: string;
  phone: string;
  email?: string;
  role: Role; // Default 'USER' for everyone
  status: AccountStatus; // 'ACTIVE'
  displayName: string;
  firstName: string;
  lastName: string;
  username?: string;
  username_normalized?: string;
  dob: string; // YYYY-MM-DD
  gender: 'Male' | 'Female' | 'Other';
  city: string;
  district?: string;
  state: string;
  country: string;
  profilePhoto: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
  qualificationStatus: PlayerQualificationStatus;
  qualificationScore?: number;
  qualificationDate?: string;
  playerId?: string; // DSI-XXXXXX when passed
  guardianConsentGiven?: boolean;
  guardianPhone?: string;
  guardianName?: string;
  profileCompletionPct: number; // e.g. 80%
}

export interface QualificationAttempt {
  id: string;
  userId: string;
  attemptNumber: number;
  timestamp: string;
  scores: {
    ballControl: number;
    passing: number;
    coordination: number;
    overall: number;
  };
  passed: boolean;
  feedback: {
    strengths: string[];
    improvements: string[];
    summary: string;
  };
  drillsCompleted: {
    drillId: string;
    drillTitle: string;
    score: number;
    metricValue: number;
  }[];
}

export interface QualificationRules {
  minPassingScore: number; // default 70
  maxAttemptsPerDay: number; // default 3
  retryCooldownHours: number; // default 0 or 24
  requiredDrillsCount: number; // default 3
  requireGuardianConsentForMinors: boolean; // default true
}

export type Tier = 'BRONZE' | 'SILVER' | 'GOLD' | 'UNRANKED';

export type Position = 
  | 'Goalkeeper' 
  | 'Center Back' 
  | 'Full Back' 
  | 'Defensive Mid' 
  | 'Central Mid' 
  | 'Attacking Mid' 
  | 'Winger' 
  | 'Striker';

export interface VerificationStatus {
  phoneVerified: boolean;
  parentVerified: boolean;
  ageVerified: boolean;
  footballIdVerified: boolean;
  aiffCrsId?: string;
}

export interface PlayerProfile {
  id: string;
  name: string;
  dob: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  photo: string;
  phone: string;
  city: string;
  state: string;
  district: string;
  pinCode: string;
  position: Position;
  preferredFoot: 'Right' | 'Left' | 'Both';
  heightCm: number;
  weightKg: number;
  playingLevel: 'Grassroots' | 'District Academy' | 'State Youth League' | 'National Academy';
  currentAcademy: string;
  yearsExperience: number;
  tier: Tier;
  overallScore: number;
  technicalScore: number;
  physicalScore: number;
  consistencyScore: number;
  speedScore: number;
  agilityScore: number;
  ballControlScore: number;
  nationalRank: number;
  stateRank: number;
  districtRank: number;
  drillsCompleted: number;
  totalAttempts: number;
  verificationStatus: VerificationStatus;
  guardianPhone?: string;
  guardianName?: string;
  bio?: string;
  highlights?: string[];
  isProSubscriber?: boolean;
}

export type DrillCategory = 
  | 'BALL_CONTROL' 
  | 'JUGGLING' 
  | 'PASSING' 
  | 'WEAK_FOOT' 
  | 'SHOOTING' 
  | 'SPRINT' 
  | 'AGILITY' 
  | 'DRIBBLING';

export interface DrillBenchmark {
  label: string;
  minScore: number;
  threshold: string;
}

export interface Drill {
  id: string;
  title: string;
  category: DrillCategory;
  level: 'Bronze' | 'Silver' | 'Gold';
  environment: 'Gali Mode (Narrow Space)' | 'Ground Mode (Small Field)' | 'Regulation Pitch';
  description: string;
  instructions: string[];
  videoRequirements: string[];
  durationSeconds: number;
  equipment: string[];
  benchmarks: {
    bronze: DrillBenchmark;
    silver: DrillBenchmark;
    gold: DrillBenchmark;
  };
  videoTutorialUrl?: string;
  iconName: string;
  primaryMetricName: string;
  primaryMetricUnit: string;
}

export interface TrialMetrics {
  sprintVelocityMs?: number; // m/s
  accelerationMs2?: number; // m/s²
  agilityRecoverySec?: number; // sec
  jugglesCount?: number;
  passingAccuracyPct?: number;
  weakFootControlPct?: number;
  shootingAccuracyPct?: number;
  touchTightnessScore?: number;
  coneTimeSec?: number;
  primaryMetricValue: number;
}

export interface TrialResult {
  id: string;
  playerId: string;
  drillId: string;
  drillTitle: string;
  timestamp: string;
  videoUrl?: string;
  videoBlobUrl?: string;
  metrics: TrialMetrics;
  rawScores: {
    overall: number;
    technical: number;
    physical: number;
    speed: number;
    agility: number;
    control: number;
  };
  tierAchieved: Tier;
  poseLandmarksDetected: number;
  ballTrackConfidence: number;
  aiFeedback: {
    strengths: string[];
    improvements: string[];
    scoutNotes: string;
  };
  status: 'PROCESSING' | 'COMPLETED' | 'FLAGGED';
}

export interface ScoutProfile {
  id: string;
  name: string;
  role: string;
  clubOrAcademy: string;
  state: string;
  verifiedBadge: boolean;
  avatar: string;
  shortlistedPlayerIds: string[];
  notes: Record<string, string>; // playerId -> private note
}

export interface ScoutAlert {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  playerId: string;
  playerName: string;
  playerState: string;
  playerTier: Tier;
  drillTitle: string;
  score: number;
  read: boolean;
}

export interface MessageRequest {
  id: string;
  scoutId: string;
  scoutName: string;
  clubName: string;
  playerId: string;
  playerName: string;
  guardianPhone: string;
  subject: string;
  message: string;
  status: 'PENDING_GUARDIAN_APPROVAL' | 'APPROVED' | 'DECLINED';
  timestamp: string;
  moderatorNotes?: string;
}

export interface GuardianConsent {
  id: string;
  playerId: string;
  playerName: string;
  guardianName: string;
  guardianPhone: string;
  relation: string;
  consentGiven: boolean;
  timestamp: string;
  otpVerified: boolean;
  auditTrail: string[];
}

export interface PostComment {
  id: string;
  authorName: string;
  authorPhoto: string;
  text: string;
  timestamp: string;
}

export type PostStatus = 'DRAFT' | 'PROCESSING' | 'PUBLISHED' | 'FAILED' | 'REMOVED';
export type PostVisibility = 'PUBLIC' | 'FOLLOWERS_ONLY' | 'PRIVATE';
export type MediaProcessingStatus = 'PREPARING' | 'COMPRESSING' | 'UPLOADING' | 'PROCESSING' | 'COMPLETE' | 'FAILED';

export interface PostMedia {
  id: string;
  postId: string;
  mediaType: 'VIDEO' | 'PHOTO';
  storageProvider: 'LOCAL' | 'AZURE_BLOB';
  storageKey: string;
  thumbnailKey?: string;
  mimeType: string;
  fileSize: number;
  durationSeconds?: number;
  width?: number;
  height?: number;
  fps?: number;
  processingStatus: MediaProcessingStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContentProcessingJob {
  id: string;
  postId: string;
  jobType: 'VIDEO_TRANSCODE' | 'THUMBNAIL_GENERATE' | 'MODERATION_CHECK' | 'AI_ANALYSIS';
  status: 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  attemptCount: number;
  errorCode?: string;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt?: string;
}

export interface CommunityPost {
  id: string;
  authorId: string;
  authorName: string;
  authorHandle: string;
  authorPhoto: string;
  authorState: string;
  authorPosition?: Position | string;
  authorAgeGroup?: string; // e.g. U17
  authorTier: Tier;
  title: string;
  caption?: string;
  postType: 'PLAYER_VIDEO' | 'TRIAL_RESULT' | 'FREESTYLE' | 'ACHIEVEMENT' | 'CLUB_POST' | 'MATCH_STATS' | 'PHOTO' | 'TEXT_POST';
  category: 'FOR_YOU' | 'TRENDING' | 'NEAR_YOU' | 'PLAYERS' | 'FREESTYLE' | 'TRIALS' | 'TOP_PROSPECTS' | 'Highlight' | 'Ground Match' | 'Drill Attempt' | 'MATCH_STATS' | 'PHOTOS';
  contentType?: 'SOCIAL_VIDEO' | 'TRIAL_VIDEO';
  trialId?: string;
  videoThumbnail?: string;
  videoUrl?: string;
  imageUrl?: string;
  status?: PostStatus;
  visibility?: PostVisibility;
  hashtags?: string[];
  locationName?: string;
  media?: PostMedia[];
  viewsCount?: number;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  upvotedByMe: boolean;
  savedByMe?: boolean;
  timestamp: string;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  reported: boolean;
  matchStats?: {
    opponent: string;
    matchScore: string; // e.g. "3 - 1"
    result: 'WON' | 'LOST' | 'DRAW';
    goals: number;
    assists: number;
    matchDate: string;
    venue?: string; // e.g. "Kochi Municipal Ground"
    tackles?: number;
    passesCompletedPct?: number;
    isManOfTheMatch?: boolean;
  };
  footballStats?: {
    speedMs?: string;
    ballControl?: number;
    agility?: number;
    overallScore?: number;
    aiVerified?: boolean;
    drillTitle?: string;
  };
  comments?: PostComment[];
}

export interface FeatureFlags {
  enableAiPoseAnalysis: boolean;
  enableWhatsAppOtp: boolean;
  enableScoutDirectMessaging: boolean;
  enableCommunityFeed: boolean;
  enableAiffVerification: boolean;
}

export type AuditActionType =
  | 'USER_REGISTER'
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'PROFILE_UPDATE'
  | 'QUALIFICATION_START'
  | 'QUALIFICATION_SUBMIT'
  | 'DRILL_ATTEMPT_SUBMIT'
  | 'POST_CREATE'
  | 'POST_CREATED'
  | 'POST_PUBLISHED'
  | 'POST_UPDATED'
  | 'POST_DELETED'
  | 'POST_DRAFT_SAVED'
  | 'VIDEO_UPLOAD_COMPLETED'
  | 'GUARDIAN_CONSENT_REQUESTED'
  | 'POST_LIKE'
  | 'POST_COMMENT'
  | 'SUBSCRIPTION_CHANGE'
  | 'SCOUT_SHORTLIST_TOGGLE'
  | 'GUARDIAN_CONSENT_GIVEN'
  | 'FOLLOW_CREATED'
  | 'FOLLOW_REMOVED'
  | 'USER_BLOCKED'
  | 'USER_UNBLOCKED'
  | 'USER_PROFILE_REPORT';


export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  actionType: AuditActionType;
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export interface DrillSubmission {
  id: string;
  userId: string;
  userName: string;
  playerState: string;
  drillId: string;
  drillTitle: string;
  category: string;
  videoUrl?: string;
  primaryMetricName?: string;
  primaryMetricValue?: number;
  score: number;
  tierAchieved: Tier;
  status: 'COMPLETED' | 'PROCESSING' | 'FLAGGED';
  timestamp: string;
}

export interface SubscriptionTransaction {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  planName: string;
  amountInr: number;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  paymentMethod: string;
  timestamp: string;
}

export interface ScoutActionLog {
  id: string;
  scoutId: string;
  scoutName: string;
  action: 'SHORTLIST' | 'NOTE_ADDED' | 'MESSAGE_SENT';
  targetPlayerId: string;
  targetPlayerName: string;
  notes?: string;
  timestamp: string;
}
