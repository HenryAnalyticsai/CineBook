export type MediaType = 'movie' | 'series' | 'book';

export type ListStatus = 'want' | 'in_progress' | 'completed';

export interface MediaItem {
  id: string;
  type: MediaType;
  title: string;
  originalTitle?: string;
  poster: string | null;
  year: string;
  overview?: string;
  author?: string;
  voteAverage?: number;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  itemId: string;
  itemType: MediaType;
  itemTitle: string;
  itemPoster: string;
  itemYear: string;
  rating: number; // 1 to 5
  text: string;
  likeCount: number;
  hasSpoiler?: boolean;
  createdAt: string;
  isLikedByMe?: boolean;
}

export interface ListItem {
  itemKey: string;
  itemId: string;
  itemType: MediaType;
  title: string;
  posterUrl: string;
  year: string;
  status: ListStatus;
  updatedAt: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  bio?: string;
  createdAt?: string;
  postCount?: number;
  followingCount?: number;
  savedCount?: number;
}

export interface FollowingRelation {
  targetUid: string;
  targetName?: string;
  targetPhoto?: string;
  followedAt: string;
}

export const LIST_STATUS_LABELS: Record<ListStatus, { label: string; verbMedia: Record<MediaType, string> }> = {
  want: {
    label: 'Quero ver/ler',
    verbMedia: {
      movie: 'Quero ver',
      series: 'Quero maratonar',
      book: 'Quero ler',
    },
  },
  in_progress: {
    label: 'Em andamento',
    verbMedia: {
      movie: 'Assistindo',
      series: 'Acompanhando série',
      book: 'Lendo agora',
    },
  },
  completed: {
    label: 'Concluído',
    verbMedia: {
      movie: 'Já assisti',
      series: 'Série concluída',
      book: 'Lido',
    },
  },
};

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export type AchievementCategory = 'reviews' | 'books' | 'movies' | 'series' | 'lists' | 'community';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  tier: AchievementTier;
  targetCount: number;
  currentCount: number;
  isUnlocked: boolean;
  progressPercent: number;
  requirementHint: string;
}
