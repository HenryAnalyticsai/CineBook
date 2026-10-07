import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  increment,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Post, ListItem, UserProfile, FollowingRelation } from '../types/cinebook';

// --- USUÁRIOS & PERFIS ---

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function searchUsers(searchTerm: string): Promise<UserProfile[]> {
  const path = 'users';
  try {
    const q = query(collection(db, 'users'), limit(50));
    const snap = await getDocs(q);
    const lower = searchTerm.trim().toLowerCase();
    const users: UserProfile[] = [];
    snap.forEach((d) => {
      const data = d.data() as UserProfile;
      if (
        data.displayName?.toLowerCase().includes(lower) ||
        data.bio?.toLowerCase().includes(lower)
      ) {
        users.push(data);
      }
    });
    return users;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function getCommunityUsers(limitCount: number = 20): Promise<UserProfile[]> {
  const path = 'users';
  try {
    const q = query(collection(db, 'users'), limit(limitCount));
    const snap = await getDocs(q);
    const users: UserProfile[] = [];
    snap.forEach((d) => {
      users.push(d.data() as UserProfile);
    });
    return users;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function upsertUserProfile(profile: UserProfile): Promise<void> {
  const path = `users/${profile.uid}`;
  try {
    await setDoc(
      doc(db, 'users', profile.uid),
      {
        uid: profile.uid,
        displayName: profile.displayName.slice(0, 60),
        photoURL: profile.photoURL || '',
        bio: (profile.bio || '').slice(0, 300),
        createdAt: profile.createdAt || new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// --- LISTAS PESSOAIS (Quero ver/ler, Em andamento, Concluído) ---

export function subscribeUserLists(
  uid: string,
  onUpdate: (items: ListItem[]) => void
): Unsubscribe {
  const path = `users/${uid}/lists`;
  const listsRef = collection(db, 'users', uid, 'lists');

  return onSnapshot(
    listsRef,
    (snapshot) => {
      const items: ListItem[] = snapshot.docs.map((d) => d.data() as ListItem);
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function setUserListItem(uid: string, item: ListItem): Promise<void> {
  const path = `users/${uid}/lists/${item.itemKey}`;
  try {
    await setDoc(doc(db, 'users', uid, 'lists', item.itemKey), {
      ...item,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function removeUserListItem(uid: string, itemKey: string): Promise<void> {
  const path = `users/${uid}/lists/${itemKey}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'lists', itemKey));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- SEGUINDO (FOLLOWING) ---

export function subscribeFollowing(
  uid: string,
  onUpdate: (following: FollowingRelation[]) => void
): Unsubscribe {
  const path = `users/${uid}/following`;
  const followingRef = collection(db, 'users', uid, 'following');

  return onSnapshot(
    followingRef,
    (snapshot) => {
      const relations: FollowingRelation[] = snapshot.docs.map((d) => d.data() as FollowingRelation);
      onUpdate(relations);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function followUser(
  currentUid: string,
  targetUid: string,
  targetName: string = '',
  targetPhoto: string = ''
): Promise<void> {
  const path = `users/${currentUid}/following/${targetUid}`;
  try {
    await setDoc(doc(db, 'users', currentUid, 'following', targetUid), {
      targetUid,
      targetName: targetName.slice(0, 60),
      targetPhoto: targetPhoto.slice(0, 500),
      followedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function unfollowUser(currentUid: string, targetUid: string): Promise<void> {
  const path = `users/${currentUid}/following/${targetUid}`;
  try {
    await deleteDoc(doc(db, 'users', currentUid, 'following', targetUid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- POSTS / RESENHAS NO FEED ---

export function subscribeFeedPosts(
  onUpdate: (posts: Post[]) => void
): Unsubscribe {
  const path = 'posts';
  const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(50));

  return onSnapshot(
    q,
    (snapshot) => {
      const posts: Post[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          authorId: data.authorId,
          authorName: data.authorName,
          authorPhoto: data.authorPhoto || '',
          itemId: data.itemId,
          itemType: data.itemType,
          itemTitle: data.itemTitle,
          itemPoster: data.itemPoster || '',
          itemYear: data.itemYear || '',
          rating: Number(data.rating),
          text: data.text || '',
          likeCount: Number(data.likeCount || 0),
          hasSpoiler: Boolean(data.hasSpoiler),
          createdAt: data.createdAt,
        };
      });
      onUpdate(posts);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function createPost(post: Omit<Post, 'id' | 'likeCount'>): Promise<string> {
  const path = 'posts';
  // Validation
  if (post.rating < 1 || post.rating > 5) {
    throw new Error('A avaliação deve ser entre 1 e 5 estrelas.');
  }
  if (!post.text.trim()) {
    throw new Error('A resenha não pode ser vazia.');
  }
  if (post.text.length > 1000) {
    throw new Error('A resenha não pode exceder 1.000 caracteres.');
  }

  try {
    const postRef = doc(collection(db, 'posts'));
    const payload = {
      authorId: post.authorId,
      authorName: post.authorName.slice(0, 60),
      authorPhoto: post.authorPhoto.slice(0, 500),
      itemId: post.itemId.slice(0, 100),
      itemType: post.itemType,
      itemTitle: post.itemTitle.slice(0, 200),
      itemPoster: post.itemPoster.slice(0, 500),
      itemYear: post.itemYear.slice(0, 10),
      rating: Math.round(post.rating),
      text: post.text.slice(0, 1000),
      likeCount: 0,
      hasSpoiler: Boolean(post.hasSpoiler),
      createdAt: post.createdAt || new Date().toISOString(),
    };
    await setDoc(postRef, payload);
    return postRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deletePost(postId: string): Promise<void> {
  const path = `posts/${postId}`;
  try {
    await deleteDoc(doc(db, 'posts', postId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- CURTIDAS (LIKES) ---

export function subscribePostLike(
  postId: string,
  userId: string,
  onUpdate: (isLiked: boolean) => void
): Unsubscribe {
  const path = `posts/${postId}/likes/${userId}`;
  const likeDoc = doc(db, 'posts', postId, 'likes', userId);
  return onSnapshot(
    likeDoc,
    (snap) => {
      onUpdate(snap.exists());
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function togglePostLike(
  postId: string,
  userId: string,
  isCurrentlyLiked: boolean
): Promise<void> {
  const path = `posts/${postId}/likes/${userId}`;
  try {
    const batch = writeBatch(db);
    const likeRef = doc(db, 'posts', postId, 'likes', userId);
    const postRef = doc(db, 'posts', postId);

    if (isCurrentlyLiked) {
      batch.delete(likeRef);
      batch.update(postRef, { likeCount: increment(-1) });
    } else {
      batch.set(likeRef, { uid: userId, createdAt: new Date().toISOString() });
      batch.update(postRef, { likeCount: increment(1) });
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
