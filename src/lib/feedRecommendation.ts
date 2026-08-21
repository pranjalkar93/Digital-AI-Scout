import { CommunityPost } from '../types';

export interface FeedWeights {
  recencyWeight: number;
  engagementWeight: number;
  followWeight: number;
  locationWeight: number;
  relevanceWeight: number;
}

export const DEFAULT_FEED_WEIGHTS: FeedWeights = {
  recencyWeight: 0.25,
  engagementWeight: 0.30,
  followWeight: 0.25,
  locationWeight: 0.10,
  relevanceWeight: 0.10,
};

export class RuleBasedRecommendationService {
  static rankPosts(
    posts: CommunityPost[],
    userState: string = 'Kerala',
    followedUserIds: Set<string> = new Set(),
    weights: FeedWeights = DEFAULT_FEED_WEIGHTS
  ): CommunityPost[] {
    const now = Date.now();

    return [...posts].sort((a, b) => {
      const scoreA = this.calculatePostScore(a, userState, followedUserIds, weights, now);
      const scoreB = this.calculatePostScore(b, userState, followedUserIds, weights, now);
      return scoreB - scoreA;
    });
  }

  private static calculatePostScore(
    post: CommunityPost,
    userState: string,
    followedUserIds: Set<string>,
    weights: FeedWeights,
    now: number
  ): number {
    // 1. Recency Score (decaying over 48h)
    let postTime = now - 3600000;
    if (post.timestamp) {
      const parsed = new Date(post.timestamp).getTime();
      if (!isNaN(parsed)) postTime = parsed;
    }
    const hoursAgo = Math.max(0, (now - postTime) / (1000 * 60 * 60));
    const recencyScore = Math.max(0, 1 - hoursAgo / 48);

    // 2. Engagement Score (likes, comments, shares)
    const totalEngagements = (post.likesCount || 0) + (post.commentsCount || 0) * 2 + (post.sharesCount || 0) * 3;
    const engagementScore = Math.min(1, totalEngagements / 1000);

    // 3. Follow Relationship Score
    const followScore = followedUserIds.has(post.authorId) ? 1.0 : 0.0;

    // 4. Location Relevance Score (matches user state e.g. Kerala, Goa)
    const locationScore = post.authorState && post.authorState.toLowerCase() === userState.toLowerCase() ? 1.0 : 0.2;

    // 5. Content Relevance Score (verified AI trial results & high quality player videos prioritized)
    let relevanceScore = 0.5;
    if (post.postType === 'TRIAL_RESULT' || post.postType === 'ACHIEVEMENT') relevanceScore = 1.0;
    if (post.postType === 'PLAYER_VIDEO' || post.postType === 'FREESTYLE') relevanceScore = 0.85;

    return (
      recencyScore * weights.recencyWeight +
      engagementScore * weights.engagementWeight +
      followScore * weights.followWeight +
      locationScore * weights.locationWeight +
      relevanceScore * weights.relevanceWeight
    );
  }
}
