# Cinebook Security Specification

## 1. Data Invariants
- Posts must have a valid rating (integer between 1 and 5).
- Post review text must not exceed 1000 characters.
- A user can only write posts with authorId matching their authenticated UID.
- Public display name is required and capped at 60 characters.
- When creating a post, initial likeCount must be 0.
- When liking/unliking, users can only modify their own like record in `/posts/{postId}/likes/{userId}`.
- Lists are restricted so users can only modify their own items (`/users/{userId}/lists/{itemKey}`).
- Following is restricted so users can only modify their own following documents (`/users/{userId}/following/{targetUid}`).

## 2. The Dirty Dozen Payloads (Forbidden Test Cases)
1. Creating a post with rating 6 (must be rejected: rating > 5).
2. Creating a post with rating 0 or -1 (must be rejected: rating < 1).
3. Creating a post with authorId different from request.auth.uid (must be rejected: identity spoofing).
4. Creating a post with text longer than 1000 characters (must be rejected: buffer overflow).
5. Updating another user's post content (must be rejected: unauthorized edit).
6. Updating a post to tamper with authorId (must be rejected: immutable author).
7. Creating a like on someone else's UID path `/posts/{p}/likes/{otherUid}` (must be rejected).
8. Writing to another user's profile `/users/{otherUid}` (must be rejected).
9. Writing to another user's list `/users/{otherUid}/lists/{item}` (must be rejected).
10. Writing to another user's following list `/users/{otherUid}/following/{target}` (must be rejected).
11. Updating likeCount by +50 in a single request (must be rejected: count jump).
12. Unauthenticated write to posts or lists (must be rejected: unauthenticated).
