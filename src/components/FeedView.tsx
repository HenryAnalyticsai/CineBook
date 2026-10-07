import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Users,
  MessageSquarePlus,
  Film,
  BookOpen,
  Flame,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Tv,
} from 'lucide-react';
import { Post, MediaItem, MediaType, FollowingRelation } from '../types/cinebook';
import { PostCard } from './PostCard';
import { useAuth } from '../context/AuthContext';
import { subscribeFeedPosts, subscribeFollowing } from '../services/firestoreService';
import { getTrendingTmdb, POPULAR_TRENDING_FALLBACK } from '../services/mediaService';

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
  const [trendingFilter, setTrendingFilter] = useState<'all' | 'movie' | 'series'>('all');
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);

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
  const loadTrending = async () => {
    setLoadingTrending(true);
    try {
      const list = await getTrendingTmdb();
      setTrendingMedia(list && list.length > 0 ? list : POPULAR_TRENDING_FALLBACK);
    } catch (err) {
      console.error('Erro ao buscar filmes e séries mais vistos:', err);
      setTrendingMedia(POPULAR_TRENDING_FALLBACK);
    } finally {
      setLoadingTrending(false);
    }
  };

  useEffect(() => {
    loadTrending();
  }, []);

  const handleScrollCarousel = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return;
    const amount = direction === 'left' ? -280 : 280;
    carouselRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

  // Filter trending items
  const filteredTrending =
    trendingFilter === 'all'
      ? trendingMedia
      : trendingMedia.filter((m) => m.type === trendingFilter);

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
            <Flame size={19} color="var(--accent-pink)" />
            <span>Filmes e Séries Mais Vistos</span>
            <span className="trending-header-pill">Em alta</span>
          </div>

          <div className="trending-header-actions">
            {/* Filtros: Todos / Filmes / Séries */}
            <div className="trending-filter-tabs">
              <button
                type="button"
                className={`trending-filter-btn ${trendingFilter === 'all' ? 'active' : ''}`}
                onClick={() => setTrendingFilter('all')}
              >
                Todos
              </button>
              <button
                type="button"
                className={`trending-filter-btn ${trendingFilter === 'movie' ? 'active' : ''}`}
                onClick={() => setTrendingFilter('movie')}
              >
                Filmes
              </button>
              <button
                type="button"
                className={`trending-filter-btn ${trendingFilter === 'series' ? 'active' : ''}`}
                onClick={() => setTrendingFilter('series')}
              >
                Séries
              </button>
            </div>

            {/* Setas de rolagem para desktop/tablet */}
            <div className="trending-nav-arrows">
              <button
                type="button"
                className="trending-arrow-btn"
                onClick={() => handleScrollCarousel('left')}
                title="Rolar para esquerda"
                aria-label="Rolar para esquerda"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                className="trending-arrow-btn"
                onClick={() => handleScrollCarousel('right')}
                title="Rolar para direita"
                aria-label="Rolar para direita"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {loadingTrending ? (
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', padding: '4px 0' }}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                style={{
                  width: '120px',
                  aspectRatio: '2/3',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-subtle)',
                  flexShrink: 0,
                  animation: 'pulse 1.5s infinite ease-in-out',
                }}
              />
            ))}
          </div>
        ) : filteredTrending.length > 0 ? (
          <div className="trending-carousel" ref={carouselRef}>
            {filteredTrending.map((media) => (
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
                    onError={(e) => {
                      // Fallback imediato se o poster falhar
                      const target = e.currentTarget;
                      if (!target.dataset.errored) {
                        target.dataset.errored = 'true';
                        target.src =
                          'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&h=450&fit=crop';
                      }
                    }}
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
        ) : (
          <div
            style={{
              padding: '24px 16px',
              textAlign: 'center',
              background: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              Nenhum item encontrado nesta categoria.
            </p>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setTrendingFilter('all');
                loadTrending();
              }}
              style={{ fontSize: '0.82rem', padding: '6px 14px' }}
            >
              <RefreshCw size={14} style={{ marginRight: '6px' }} />
              Recarregar catálogo
            </button>
          </div>
        )}
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
