# Security Specification & Threat Model

## Data Invariants
1. Users can only modify their own User document (`/users/{userId}`).
2. A normal user cannot manually assign themselves the `PLAYER` or `ADMIN` role in their user document. Role changes are controlled via server endpoints or verified rules.
3. Community posts (`/posts/{postId}`) require a valid `authorId` matching the authenticated user's `request.auth.uid` on creation.
4. Comments (`/posts/{postId}/comments/{commentId}`) require valid authenticated session and author identity.
5. All IDs must strictly conform to alphanumeric, hyphens, and underscores up to 128 chars.
6. Audit log entries (`/users/{userId}/auditLogs/{logId}` & `/auditLogs/{logId}`) are append-only; update and delete operations are forbidden to maintain audit integrity.
7. Subscription transactions (`/subscriptionTransactions/{transactionId}`), drill submissions (`/drillSubmissions/{submissionId}`), and scout actions (`/scoutActions/{actionId}`) require valid user identity.

## The "Dirty Dozen" Payloads

1. **Self-Promote Role Attack**: Payload attempting to set `role: "ADMIN"` or `role: "PLAYER"` during profile create/update.
2. **Identity Spoofing**: Payload attempting to set `authorId` to another user's UID on a post.
3. **ID Poisoning**: Injecting 2KB oversized junk characters as document ID.
4. **Shadow Field Injection**: Injecting unauthorized fields like `isScoutVerified: true` into a player profile.
5. **Ghost Update Attack**: Attempting to bypass schema checks by changing unauthorized fields during post update.
6. **Oversized String DoS Attack**: Injecting a 500KB caption string in a post.
7. **Unauthenticated Read Attack**: Attempting to read PII user records without auth.
8. **Orphaned Write Attack**: Attempting to write a comment on a non-existent post.
9. **Timestamp Spoofing Attack**: Sending client time backdated by 1 year.
10. **Spoofed Email Attack**: Attempting admin operations with `email_verified: false`.
11. **Negative Metric Attack**: Submitting negative values for likes or goals.
12. **Blanket Query Scraping**: Attempting collection-group queries without filtering by owner.
