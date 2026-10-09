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
import {
  Post,
  ListItem,
  UserProfile,
  FollowingRelation,
  FollowerRelation,
  ADMIN_EMAIL,
} from '../types/cinebook';

// --- INFORMAÇÕES DO ADM ---
let cachedAdminInfo: { adminUid: string; email: string; displayName?: string; photoURL?: string } | null = null;

export async function getAdminInfo(): Promise<{ adminUid: string; email: string; displayName?: string; photoURL?: string } | null> {
  if (cachedAdminInfo) return cachedAdminInfo;
  try {
    const snap = await getDoc(doc(db, 'system', 'admin_info'));
    if (snap.exists()) {
      const data = snap.data() as any;
      if (data.adminUid) {
        cachedAdminInfo = {
          adminUid: data.adminUid,
          email: data.email || ADMIN_EMAIL,
          displayName: data.displayName || 'Henry Analytics (ADM)',
          photoURL: data.photoURL || '',
        };
        return cachedAdminInfo;
      }
    }
  } catch (e) {
    // Continua
  }
  return null;
}

export function setCachedAdminInfo(info: { adminUid: string; email: string; displayName?: string; photoURL?: string }) {
  cachedAdminInfo = info;
}

// Garante que o usuário siga o ADM oficial (henryanalyticsai@gmail.com)
export async function ensureFollowAdmin(
  userUid: string,
  userName?: string,
  userPhoto?: string
): Promise<void> {
  const adminInfo = await getAdminInfo();
  if (!adminInfo || adminInfo.adminUid === userUid) return;

  try {
    const batch = writeBatch(db);
    // 1. Usuário segue o ADM
    const followingRef = doc(db, 'users', userUid, 'following', adminInfo.adminUid);
    batch.set(
      followingRef,
      {
        targetUid: adminInfo.adminUid,
        targetName: adminInfo.displayName || 'Henry Analytics (ADM)',
        targetPhoto: adminInfo.photoURL || '',
        followedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    // 2. ADM ganha este usuário como seguidor
    const followersRef = doc(db, 'users', adminInfo.adminUid, 'followers', userUid);
    batch.set(
      followersRef,
      {
        followerUid: userUid,
        followerName: (userName || '').slice(0, 60),
        followerPhoto: (userPhoto || '').slice(0, 500),
        followedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    await batch.commit();
  } catch (e) {
    console.warn('Aviso ao sincronizar seguimento automático do ADM:', e);
  }
}

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
    const isAdmUser =
      profile.isAdmin ||
      (profile.email && profile.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());

    const payload: any = {
      uid: profile.uid,
      displayName: profile.displayName.slice(0, 60),
      photoURL: profile.photoURL || '',
      bio: (profile.bio || '').slice(0, 300),
      createdAt: profile.createdAt || new Date().toISOString(),
    };

    if (profile.email) payload.email = profile.email;
    if (isAdmUser) {
      payload.role = 'admin';
      payload.isAdmin = true;
    }

    await setDoc(doc(db, 'users', profile.uid), payload, { merge: true });

    // Se este perfil for o Administrador (henryanalyticsai@gmail.com), registra no documento global do sistema
    if (isAdmUser) {
      cachedAdminInfo = {
        adminUid: profile.uid,
        email: ADMIN_EMAIL,
        displayName: profile.displayName,
        photoURL: profile.photoURL || '',
      };
      await setDoc(
        doc(db, 'system', 'admin_info'),
        {
          adminUid: profile.uid,
          email: ADMIN_EMAIL,
          displayName: profile.displayName,
          photoURL: profile.photoURL || '',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      ).catch((e) => console.warn('Aviso ao registrar admin_info:', e));
    }
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

export async function getUserListItems(uid: string): Promise<ListItem[]> {
  const path = `users/${uid}/lists`;
  try {
    const snap = await getDocs(collection(db, 'users', uid, 'lists'));
    return snap.docs.map((d) => d.data() as ListItem);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
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

export async function logCoWatchedMedia(
  userUid: string,
  item: {
    id: string;
    type: 'movie' | 'series' | 'book';
    title: string;
    posterUrl: string;
    year: string;
    rating?: number;
  },
  companions: Array<{ uid: string; name: string; photo?: string }>
): Promise<void> {
  const itemKey = `${item.type}_${item.id}`;
  const listItem: ListItem = {
    itemKey,
    itemId: item.id,
    itemType: item.type,
    title: item.title,
    posterUrl: item.posterUrl,
    year: item.year || '',
    status: 'completed',
    updatedAt: new Date().toISOString(),
    watchedWith: companions,
    userRating: item.rating,
  };
  await setUserListItem(userUid, listItem);
}

export async function removeUserListItem(uid: string, itemKey: string): Promise<void> {
  const path = `users/${uid}/lists/${itemKey}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'lists', itemKey));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- SEGUINDO E SEGUIDORES (FOLLOWING & FOLLOWERS) ---

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

export function subscribeFollowers(
  uid: string,
  onUpdate: (followers: FollowerRelation[]) => void
): Unsubscribe {
  const path = `users/${uid}/followers`;
  const followersRef = collection(db, 'users', uid, 'followers');

  return onSnapshot(
    followersRef,
    (snapshot) => {
      const relations: FollowerRelation[] = snapshot.docs.map((d) => d.data() as FollowerRelation);
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
  targetPhoto: string = '',
  currentUserName: string = '',
  currentUserPhoto: string = ''
): Promise<void> {
  const path = `users/${currentUid}/following/${targetUid}`;
  try {
    const batch = writeBatch(db);
    // 1. Minha lista de pessoas que sigo
    const followingRef = doc(db, 'users', currentUid, 'following', targetUid);
    batch.set(
      followingRef,
      {
        targetUid,
        targetName: targetName.slice(0, 60),
        targetPhoto: targetPhoto.slice(0, 500),
        followedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    // 2. Lista de seguidores no perfil de quem foi seguido
    const followersRef = doc(db, 'users', targetUid, 'followers', currentUid);
    batch.set(
      followersRef,
      {
        followerUid: currentUid,
        followerName: (currentUserName || '').slice(0, 60),
        followerPhoto: (currentUserPhoto || '').slice(0, 500),
        followedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function unfollowUser(currentUid: string, targetUid: string): Promise<void> {
  const path = `users/${currentUid}/following/${targetUid}`;
  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'users', currentUid, 'following', targetUid));
    batch.delete(doc(db, 'users', targetUid, 'followers', currentUid));
    await batch.commit();
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
        const isAdm = Boolean(
          data.isAdmin ||
          (data.authorEmail && data.authorEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase()) ||
          (cachedAdminInfo && cachedAdminInfo.adminUid === data.authorId)
        );

        return {
          id: d.id,
          authorId: data.authorId,
          authorName: data.authorName,
          authorPhoto: data.authorPhoto || '',
          authorEmail: data.authorEmail,
          isAdmin: isAdm,
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
          watchedWith: data.watchedWith || [],
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
    const isAdmPost = Boolean(
      post.isAdmin ||
      (post.authorEmail && post.authorEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase()) ||
      (cachedAdminInfo && cachedAdminInfo.adminUid === post.authorId)
    );

    const payload: any = {
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

    if (post.authorEmail) payload.authorEmail = post.authorEmail;
    if (isAdmPost) payload.isAdmin = true;
    if (post.watchedWith && Array.isArray(post.watchedWith)) {
      payload.watchedWith = post.watchedWith;
    }

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
