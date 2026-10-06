import React, { useState, useEffect } from 'react';
import { Sparkles, Users, MessageSquarePlus, Film, BookOpen } from 'lucide-react';
import { Post, MediaItem, MediaType, FollowingRelation } from '../types/cinebook';
import { PostCard } from './PostCard';
import { useAuth } from '../context/AuthContext';
import { subscribeFeedPosts, subscribeFollowing } from '../services/firestoreService';
import { getTrendingTmdb, POPULAR_BOOKS } from '../services/mediaService';

interface FeedViewProps {
  onOpenMediaModal: (item: {
    id: string;
    type: MediaType;
    title: string;
    poster: string | null;
    year: string;
  }) => void;
  onViewAuthorProfile: (authorId: string) => void;
  onOpenCreateModal: () => void;
  onOpenAuth: () => void;
}

export const FeedView: React.FC<FeedViewProps> = ({
  onOpenMediaModal,
  onViewAuthorProfile,
  onOpenCreateModal,
  onOpenAuth,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'recent' | 'following'>('recent');
  const [posts, setPosts] = useState<Post[]>([]);
  const [following, setFollowing] = useState<FollowingRelation[]>([]);
  const [stories, setStories] = useState<MediaItem[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Subscribe to feed posts
  useEffect(() => {
    setLoadingPosts(true);
    const unsub = subscribeFeedPosts((fetchedPosts) => {
      setPosts(fetchedPosts);
      setLoadingPosts(false);
    });
    return () => unsub();
  }, []);

  // Subscribe to following if user is authenticated
  useEffect(() => {
    if (!user) {
      setFollowing([]);
      return;
    }
    const unsub = subscribeFollowing(user.uid, (list) => {
      setFollowing(list);
    });
    return () => unsub();
  }, [user]);

  // Load curated highlights / stories
  useEffect(() => {
    const loadStories = async () => {
      const tmdbTrending = await getTrendingTmdb();
      const mixedStories: MediaItem[] = [
        ...POPULAR_BOOKS.slice(0, 4),
        ...(tmdbTrending.length > 0 ? tmdbTrending.slice(0, 5) : []),
      ];
      setStories(mixedStories);
    };
    loadStories();
  }, []);

  // Filter posts
  const followingUids = new Set(following.map((f) => f.targetUid));
  const displayedPosts =
    activeTab === 'recent'
      ? posts
      : posts.filter((p) => p.authorId === user?.uid || followingUids.has(p.authorId));

  return (
    <div>
      {/* Stories Carousel (Instagram Style) */}
      <section aria-label="Destaques e Obras em Alta">
        <div className="stories-bar">
          {stories.map((story) => (
            <button
              key={`${story.type}_${story.id}`}
              type="button"
              className="story-item"
              onClick={() =>
                onOpenMediaModal({
                  id: story.id,
                  type: story.type,
                  title: story.title,
                  poster: story.poster,
                  year: story.year,
                })
              }
              title={`${story.title} (${story.type === 'book' ? 'Livro' : 'Filme/Série'})`}
            >
              <div className="story-ring">
                <img
                  src={
                    story.poster ||
                    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=150&h=150&fit=crop'
                  }
                  alt={story.title}
                  className="story-avatar"
                />
              </div>
              <span className="story-title">{story.title}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Feed Tabs: Recentes vs Seguindo */}
      <div className="feed-tabs">
        <button
          type="button"
          className={`feed-tab-btn ${activeTab === 'recent' ? 'active' : ''}`}
          onClick={() => setActiveTab('recent')}
        >
          <Sparkles size={16} />
          <span>Recentes</span>
        </button>
        <button
          type="button"
          className={`feed-tab-btn ${activeTab === 'following' ? 'active' : ''}`}
          onClick={() => {
            if (!user) {
              onOpenAuth();
            } else {
              setActiveTab('following');
            }
          }}
        >
          <Users size={16} />
          <span>Seguindo</span>
        </button>
      </div>

      {/* Lista de Resenhas */}
      {loadingPosts ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
          Carregando publicações...
        </div>
      ) : displayedPosts.length > 0 ? (
        <div className="posts-stream">
          {displayedPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onOpenMediaModal={onOpenMediaModal}
              onViewAuthorProfile={onViewAuthorProfile}
              onOpenAuth={onOpenAuth}
            />
          ))}
        </div>
      ) : (
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '40px 24px',
            textAlign: 'center',
            marginTop: '10px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--bg-subtle)',
              margin: '0 auto 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-pink)',
            }}
          >
            <MessageSquarePlus size={32} />
          </div>

          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px' }}>
            {activeTab === 'following' ? 'Nenhuma resenha de quem você segue ainda' : 'Seja o primeiro a publicar!'}
          </h3>

          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '20px', maxWidth: '400px', margin: '0 auto 20px' }}>
            {activeTab === 'following'
              ? 'Siga pessoas no feed ou explore a aba Recentes para descobrir novas impressões e autores.'
              : 'Avalie seu filme, série ou livro favorito, atribua de 1 a 5 estrelas e compartilhe com a comunidade.'}
          </p>

          <button
            type="button"
            className="btn-primary"
            onClick={onOpenCreateModal}
            style={{
              padding: '10px 24px',
              borderRadius: 'var(--radius-full)',
              fontWeight: 700,
              fontSize: '0.95rem',
            }}
          >
            Escrever Resenha Agora
          </button>
        </div>
      )}
    </div>
  );
};
