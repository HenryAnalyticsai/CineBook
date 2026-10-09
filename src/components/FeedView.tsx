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
  ShieldCheck,
  UserCheck,
  Globe,
} from 'lucide-react';
import {
  Post,
  MediaItem,
  MediaType,
  FollowingRelation,
  FollowerRelation,
  ADMIN_EMAIL,
  isAdminEmail,
} from '../types/cinebook';
import { PostCard } from './PostCard';
import { useAuth } from '../context/AuthContext';
import {
  subscribeFeedPosts,
  subscribeFollowing,
  subscribeFollowers,
  getAdminInfo,
} from '../services/firestoreService';
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
  const { user, profile, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'recent' | 'network'>('recent');
  const [networkFilter, setNetworkFilter] = useState<'all' | 'followers' | 'following' | 'admin'>('all');
  const [posts, setPosts] = useState<Post[]>([]);
  const [following, setFollowing] = useState<FollowingRelation[]>([]);
  const [followers, setFollowers] = useState<FollowerRelation[]>([]);
  const [adminInfo, setAdminInfo] = useState<{ adminUid: string; email: string; displayName?: string } | null>(null);
  const [trendingMedia, setTrendingMedia] = useState<MediaItem[]>([]);
  const [trendingFilter, setTrendingFilter] = useState<'all' | 'movie' | 'series'>('all');
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);

  const isCurrentUserAdmin = Boolean(
    isAdmin ||
    isAdminEmail(user?.email) ||
    isAdminEmail(profile?.email)
  );

  // Load admin info
  useEffect(() => {
    getAdminInfo().then((info) => {
      if (info) setAdminInfo(info);
    });
  }, []);

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

  // Subscribe to followers if user is authenticated
  useEffect(() => {
    if (!user) {
      setFollowers([]);
      return;
    }
    const unsub = subscribeFollowers(user.uid, (list) => {
      setFollowers(list);
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

  // Identificação dos seguidores e pessoas seguidas
  const followingUids = new Set(following.map((f) => f.targetUid));
  const followerUids = new Set(followers.map((f) => f.followerUid));

  // O ADM (henryanalyticsai@gmail.com) é sempre seguido por todos os usuários
  if (adminInfo?.adminUid && user?.uid !== adminInfo.adminUid) {
    followingUids.add(adminInfo.adminUid);
  }

  // Determina a relação com o autor do post
  const getPostRelation = (
    post: Post
  ): 'admin' | 'following' | 'follower' | 'mutual' | 'self' | 'none' => {
    if (user && post.authorId === user.uid) return 'self';

    const isPostAdm = Boolean(
      post.isAdmin ||
      post.authorEmail?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ||
      (adminInfo && post.authorId === adminInfo.adminUid)
    );
    if (isPostAdm) return 'admin';

    if (!user) return 'none';

    const isFollowedByMe = followingUids.has(post.authorId);
    // Para o Administrador Henry, todos os usuários da comunidade são seus seguidores (pois todos o seguem)
    const isFollowingMe = isCurrentUserAdmin || followerUids.has(post.authorId);

    if (isFollowedByMe && isFollowingMe) return 'mutual';
    if (isFollowingMe) return 'follower';
    if (isFollowedByMe) return 'following';
    return 'none';
  };

  // Filtro de exibição dos posts no feed
  const displayedPosts = posts.filter((post) => {
    const relation = getPostRelation(post);
    const isAuthorSelf = Boolean(user && post.authorId === user.uid);

    if (activeTab === 'network') {
      // Aba "Seguidores & Seguindo": apenas postagens da rede do usuário
      if (isAuthorSelf) return true;
      if (networkFilter === 'followers') return relation === 'follower' || relation === 'mutual';
      if (networkFilter === 'following') return relation === 'following' || relation === 'mutual';
      if (networkFilter === 'admin') return relation === 'admin';
      // 'all' na aba de rede: seguidores, seguidos, conexões mútuas ou ADM
      return (
        relation === 'follower' ||
        relation === 'following' ||
        relation === 'mutual' ||
        relation === 'admin'
      );
    }

    // Aba "Para Você" (Geral): aplica sub-filtro se ativado
    if (networkFilter === 'followers') {
      return relation === 'follower' || relation === 'mutual';
    }
    if (networkFilter === 'following') {
      return relation === 'following' || relation === 'mutual';
    }
    if (networkFilter === 'admin') {
      return relation === 'admin';
    }

    return true;
  });

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

      {/* Feed Tabs: Para Você (Geral) vs Seguidores & Seguindo */}
      <div className="feed-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'recent'}
          className={`feed-tab-btn ${activeTab === 'recent' ? 'active' : ''}`}
          onClick={() => setActiveTab('recent')}
        >
          <Sparkles size={16} />
          <span>Para Você</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'network'}
          className={`feed-tab-btn ${activeTab === 'network' ? 'active' : ''}`}
          onClick={() => {
            if (!user) {
              onOpenAuth();
            } else {
              setActiveTab('network');
            }
          }}
        >
          <Users size={16} />
          <span>Conexões</span>
        </button>
      </div>

      {/* Sub-Filtros de Rede Social: Simetria Perfeita em Ícones, Alturas e Textos */}
      {user && (
        <div className="network-filters-bar">
          <div className="network-filters-scroll">
            <button
              type="button"
              className={`network-filter-chip ${networkFilter === 'all' ? 'active' : ''}`}
              onClick={() => setNetworkFilter('all')}
            >
              <Globe size={15} />
              <span>Todas as resenhas</span>
            </button>

            <button
              type="button"
              className={`network-filter-chip ${networkFilter === 'followers' ? 'active' : ''}`}
              onClick={() => setNetworkFilter('followers')}
            >
              <Users size={15} />
              <span>Meus Seguidores</span>
              {isCurrentUserAdmin ? (
                <span className="chip-badge">Todos</span>
              ) : followerUids.size > 0 ? (
                <span className="chip-badge">{followerUids.size}</span>
              ) : null}
            </button>

            <button
              type="button"
              className={`network-filter-chip ${networkFilter === 'following' ? 'active' : ''}`}
              onClick={() => setNetworkFilter('following')}
            >
              <UserCheck size={15} />
              <span>Quem Eu Sigo</span>
              {followingUids.size > 0 && <span className="chip-badge">{followingUids.size}</span>}
            </button>

            <button
              type="button"
              className={`network-filter-chip adm-chip ${networkFilter === 'admin' ? 'active' : ''}`}
              onClick={() => setNetworkFilter('admin')}
              title="Ver publicações oficiais do Administrador"
            >
              <ShieldCheck size={15} />
              <span>Postagens do ADM</span>
            </button>
          </div>
        </div>
      )}

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
              relationType={getPostRelation(post)}
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
            {networkFilter === 'followers'
              ? 'Nenhuma resenha dos seus seguidores no momento'
              : networkFilter === 'following'
              ? 'Nenhuma resenha de quem você segue ainda'
              : networkFilter === 'admin'
              ? 'O Administrador ainda não fez publicações recentes'
              : activeTab === 'network'
              ? 'Sua rede ainda não tem publicações'
              : 'Seja o primeiro a publicar!'}
          </h3>

          <p
            style={{
              fontSize: '0.9rem',
              color: 'var(--text-secondary)',
              marginBottom: '20px',
              maxWidth: '420px',
              margin: '0 auto 20px',
              lineHeight: 1.45,
            }}
          >
            {networkFilter === 'followers'
              ? isCurrentUserAdmin
                ? 'Como ADM, todas as resenhas criadas pelos membros que te seguem serão listadas aqui.'
                : 'Quando outros membros do Cinebook começarem a te seguir, suas resenhas aparecerão aqui automaticamente.'
              : networkFilter === 'admin'
              ? `O ADM (${ADMIN_EMAIL}) publica recomendações e anúncios da comunidade aqui.`
              : activeTab === 'network'
              ? 'Siga pessoas no feed ou explore a aba Para Você para descobrir novas opiniões culturais.'
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
