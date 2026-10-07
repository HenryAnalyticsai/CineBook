import React, { useState, useEffect } from 'react';
import { Sparkles, Users, MessageSquarePlus, Film, BookOpen, Flame } from 'lucide-react';
import { Post, MediaItem, MediaType, FollowingRelation } from '../types/cinebook';
import { PostCard } from './PostCard';
import { useAuth } from '../context/AuthContext';
import { subscribeFeedPosts, subscribeFollowing } from '../services/firestoreService';
import { getTrendingTmdb } from '../services/mediaService';

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
  const [trendingMedia, setTrendingMedia] = useState<MediaItem[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingTrending, setLoadingTrending] = useState(true);

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

  // Load trending movies and series from TMDB
  useEffect(() => {
    const loadTrending = async () => {
      setLoadingTrending(true);
      try {
        const list = await getTrendingTmdb();
        setTrendingMedia(list);
      } catch (err) {
        console.error('Erro ao buscar filmes e séries mais vistos:', err);
      } finally {
        setLoadingTrending(false);
      }
    };
    loadTrending();
  }, []);

  // Filter posts
  const followingUids = new Set(following.map((f) => f.targetUid));
  const displayedPosts =
    activeTab === 'recent'
      ? posts
      : posts.filter((p) => p.authorId === user?.uid || followingUids.has(p.authorId));

  return (
    <div>
      {/* Seção Filmes e Séries Mais Vistos (TMDB) */}
      <section className="trending-showcase" aria-label="Filmes e Séries Mais Vistos">
        <div className="trending-header-row">
          <div className="trending-header-title">
            <Flame size={18} color="var(--accent-pink)" />
            <span>Filmes e Séries Mais Vistos</span>
          </div>
          <span className="trending-header-pill">Em alta</span>
        </div>

        {loadingTrending ? (
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', padding: '4px 0' }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <div
                key={n}
                style={{
                  width: '114px',
                  aspectRatio: '2/3',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-subtle)',
                  flexShrink: 0,
                }}
              />
            ))}
          </div>
        ) : trendingMedia.length > 0 ? (
          <div className="trending-carousel">
            {trendingMedia.map((media) => (
              <button
                key={`${media.type}_${media.id}`}
                type="button"
                className="trending-card"
                onClick={() =>
                  onOpenMediaModal({
                    id: media.id,
                    type: media.type,
                    title: media.title,
                    poster: media.poster,
                    year: media.year,
                  })
                }
                title={`${media.title} (${media.type === 'movie' ? 'Filme' : 'Série'})`}
              >
                <div className="trending-poster-box">
                  <img
                    src={
                      media.poster ||
                      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&h=450&fit=crop'
                    }
                    alt={media.title}
                    loading="lazy"
                  />
                  <span
                    className={`trending-card-badge ${
                      media.type === 'movie' ? 'badge-movie' : 'badge-series'
                    }`}
                  >
                    {media.type === 'movie' ? 'Filme' : 'Série'}
                  </span>
                  {media.voteAverage && media.voteAverage > 0 ? (
                    <span className="trending-card-score">
                      ⭐ {media.voteAverage.toFixed(1)}
                    </span>
                  ) : null}
                </div>
                <span className="trending-card-title">{media.title}</span>
                <span className="trending-card-sub">{media.year || 'Em alta'}</span>
              </button>
            ))}
          </div>
        ) : null}
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
          {displayedPosts.map((post, idx) => (
            <PostCard
              key={post.id}
              post={post}
              index={idx}
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
