import React, { useState, useEffect, useRef } from 'react';
import {
  Search as SearchIcon,
  Film,
  Tv,
  BookOpen,
  Users,
  UserPlus,
  UserCheck,
  ShieldCheck,
  Loader2,
  X,
  Layers,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { MediaItem, MediaType, UserProfile, FollowingRelation, ADMIN_EMAIL, isAdminEmail } from '../types/cinebook';
import { searchAllMedia, POPULAR_BOOKS, getTrendingTmdb } from '../services/mediaService';
import {
  searchUsers,
  getCommunityUsers,
  subscribeFollowing,
  followUser,
  unfollowUser,
} from '../services/firestoreService';
import { useAuth } from '../context/AuthContext';

interface SearchViewProps {
  onOpenMediaModal: (item: {
    id: string;
    type: MediaType;
    title: string;
    poster: string | null;
    year: string;
    overview?: string;
    author?: string;
  }) => void;
  onViewAuthorProfile: (userId: string) => void;
  onOpenAuth: () => void;
}

const QUICK_SUGGESTIONS = [
  { label: 'Interestelar', icon: '🎬' },
  { label: 'Duna', icon: '🎬' },
  { label: 'Stranger Things', icon: '📺' },
  { label: 'The Last of Us', icon: '📺' },
  { label: 'Dom Casmurro', icon: '📚' },
  { label: 'O Pequeno Príncipe', icon: '📚' },
  { label: 'Harry Potter', icon: '📚' },
  { label: 'Torto Arado', icon: '📚' },
];

export const SearchView: React.FC<SearchViewProps> = ({
  onOpenMediaModal,
  onViewAuthorProfile,
  onOpenAuth,
}) => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'movie' | 'series' | 'book' | 'users'>('all');
  const [mediaResults, setMediaResults] = useState<MediaItem[]>([]);
  const [userResults, setUserResults] = useState<UserProfile[]>([]);
  const [following, setFollowing] = useState<FollowingRelation[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const debounceTimerRef = useRef<any>(null);
  const searchRequestIdRef = useRef<number>(0);

  // Subscribe to following list of logged in user
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

  // Initial catalog & recommended members
  useEffect(() => {
    const loadDefaultData = async () => {
      setLoading(true);
      try {
        const trending = await getTrendingTmdb();
        const combined = [...POPULAR_BOOKS, ...trending];
        setMediaResults(combined);

        const community = await getCommunityUsers(15);
        setUserResults(community);
      } catch (err) {
        console.error('Erro ao carregar dados iniciais da busca:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDefaultData();
  }, []);

  const executeSearch = async (searchTerm: string, filter: 'all' | 'movie' | 'series' | 'book' | 'users') => {
    const trimmed = searchTerm.trim();
    const requestId = ++searchRequestIdRef.current;

    if (!trimmed) {
      setLoading(true);
      try {
        if (filter === 'users') {
          const community = await getCommunityUsers(15);
          if (requestId === searchRequestIdRef.current) setUserResults(community);
        } else {
          const trending = await getTrendingTmdb();
          const combined = [...POPULAR_BOOKS, ...trending];
          if (requestId === searchRequestIdRef.current) {
            setMediaResults(filter === 'all' ? combined : combined.filter((i) => i.type === filter));
          }
        }
      } finally {
        if (requestId === searchRequestIdRef.current) {
          setHasSearched(false);
          setLoading(false);
        }
      }
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      if (filter === 'users') {
        const usersFound = await searchUsers(trimmed);
        if (requestId === searchRequestIdRef.current) {
          setUserResults(usersFound);
        }
      } else if (filter === 'all') {
        const [foundMedia, foundUsers] = await Promise.all([
          searchAllMedia(trimmed, 'all'),
          searchUsers(trimmed),
        ]);
        if (requestId === searchRequestIdRef.current) {
          setMediaResults(foundMedia);
          setUserResults(foundUsers);
        }
      } else {
        const found = await searchAllMedia(trimmed, filter);
        if (requestId === searchRequestIdRef.current) {
          setMediaResults(found);
        }
      }
    } catch (err) {
      console.error('Erro na pesquisa:', err);
    } finally {
      if (requestId === searchRequestIdRef.current) {
        setLoading(false);
      }
    }
  };

  // Debounced search on query change
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmed = query.trim();
    if (!trimmed) {
      if (hasSearched) {
        executeSearch('', activeFilter);
      }
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      executeSearch(trimmed, activeFilter);
    }, 320);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, activeFilter]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    executeSearch(query, activeFilter);
  };

  const handleClearQuery = () => {
    setQuery('');
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    executeSearch('', activeFilter);
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setQuery(suggestion);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    executeSearch(suggestion, activeFilter);
  };

  const onFilterChange = (filter: 'all' | 'movie' | 'series' | 'book' | 'users') => {
    setActiveFilter(filter);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    executeSearch(query, filter);
  };

  const isUserFollowed = (target: UserProfile) => {
    if (target.isAdmin || isAdminEmail(target.email)) return true;
    return following.some((f) => f.targetUid === target.uid);
  };

  const handleToggleFollow = async (e: React.MouseEvent, target: UserProfile) => {
    e.stopPropagation();
    if (!user) {
      onOpenAuth();
      return;
    }
    if (target.isAdmin || isAdminEmail(target.email)) {
      return;
    }

    try {
      if (isUserFollowed(target)) {
        await unfollowUser(user.uid, target.uid);
      } else {
        await followUser(user.uid, target.uid, target.displayName, target.photoURL);
      }
    } catch (err) {
      console.error('Erro ao atualizar seguidor:', err);
    }
  };

  const renderBadge = (type: MediaType) => {
    switch (type) {
      case 'movie':
        return (
          <span className="media-tag-badge badge-movie" style={{ top: 8, left: 8, padding: '3px 8px', fontSize: '0.68rem' }}>
            <Film size={10} /> Filme
          </span>
        );
      case 'series':
        return (
          <span className="media-tag-badge badge-series" style={{ top: 8, left: 8, padding: '3px 8px', fontSize: '0.68rem' }}>
            <Tv size={10} /> Série
          </span>
        );
      case 'book':
        return (
          <span className="media-tag-badge badge-book" style={{ top: 8, left: 8, padding: '3px 8px', fontSize: '0.68rem' }}>
            <BookOpen size={10} /> Livro
          </span>
        );
    }
  };

  return (
    <div className="search-container">
      {/* Barra de busca com campo interativo e botão explícito */}
      <form onSubmit={handleManualSubmit}>
        <div className="search-input-box">
          <div className="search-input-icon-left">
            <SearchIcon size={18} />
          </div>
          <input
            type="search"
            className="search-input"
            placeholder="Buscar filmes, séries, livros e membros..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Campo de busca"
          />

          <div className="search-input-right-actions">
            {query.length > 0 && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={handleClearQuery}
                title="Limpar busca"
                aria-label="Limpar busca"
              >
                <X size={15} />
              </button>
            )}
            <button
              type="submit"
              className="search-submit-btn"
              disabled={loading}
              aria-label="Executar busca"
            >
              {loading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <>
                  <SearchIcon size={14} />
                  <span>Buscar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Atalhos Rápidos de Sugestões de Busca */}
      <div className="search-suggestions-bar" aria-label="Atalhos populares">
        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700, paddingLeft: '4px', whiteSpace: 'nowrap' }}>
          Em alta:
        </span>
        {QUICK_SUGGESTIONS.map((item) => (
          <button
            key={item.label}
            type="button"
            className="search-suggestion-chip"
            onClick={() => handleSelectSuggestion(item.label)}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Chips de Filtro Simétricos */}
      <div className="filter-chips">
        <button
          type="button"
          className={`filter-chip ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => onFilterChange('all')}
        >
          <Layers size={13} style={{ display: 'inline', marginRight: '5px' }} />
          Todos
        </button>
        <button
          type="button"
          className={`filter-chip ${activeFilter === 'movie' ? 'active' : ''}`}
          onClick={() => onFilterChange('movie')}
        >
          <Film size={13} style={{ display: 'inline', marginRight: '5px' }} />
          Filmes
        </button>
        <button
          type="button"
          className={`filter-chip ${activeFilter === 'series' ? 'active' : ''}`}
          onClick={() => onFilterChange('series')}
        >
          <Tv size={13} style={{ display: 'inline', marginRight: '5px' }} />
          Séries
        </button>
        <button
          type="button"
          className={`filter-chip ${activeFilter === 'book' ? 'active' : ''}`}
          onClick={() => onFilterChange('book')}
        >
          <BookOpen size={13} style={{ display: 'inline', marginRight: '5px' }} />
          Livros
        </button>
        <button
          type="button"
          className={`filter-chip ${activeFilter === 'users' ? 'active' : ''}`}
          onClick={() => onFilterChange('users')}
        >
          <Users size={13} style={{ display: 'inline', marginRight: '5px' }} />
          Membros
        </button>
      </div>

      {/* Resultados de Membros quando em aba 'users' */}
      {activeFilter === 'users' ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '0.96rem', fontWeight: 800 }}>
              {hasSearched ? `Membros encontrados para "${query}"` : 'Membros da Comunidade'}
            </h2>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {userResults.length} membros
            </span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <Loader2 size={30} className="animate-spin" style={{ margin: '0 auto 10px' }} />
              Buscando membros...
            </div>
          ) : userResults.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {userResults.map((u) => {
                const followingThis = isUserFollowed(u);
                const isMe = user?.uid === u.uid;
                const isAdm = Boolean(u.isAdmin || isAdminEmail(u.email));

                return (
                  <div
                    key={u.uid}
                    onClick={() => onViewAuthorProfile(u.uid)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      transition: 'border-color 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img
                        src={u.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.uid}`}
                        alt={u.displayName}
                        style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: 'var(--radius-full)',
                          objectFit: 'cover',
                          border: '1.5px solid var(--border-color)',
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.94rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{u.displayName}</span>
                          {isAdm && (
                            <span className="author-badge-adm" title="Administrador Oficial do Cinebook">
                              <ShieldCheck size={11} /> ADM
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: '0.78rem',
                            color: 'var(--text-secondary)',
                            maxWidth: '240px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {u.bio || 'Membro do Cinebook'}
                        </div>
                      </div>
                    </div>

                    {!isMe && (
                      <button
                        type="button"
                        onClick={(e) => handleToggleFollow(e, u)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '7px 14px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          background: isAdm
                            ? 'rgba(245, 158, 11, 0.08)'
                            : followingThis
                            ? 'var(--bg-subtle)'
                            : 'var(--accent-gradient)',
                          color: isAdm ? '#d97706' : followingThis ? 'var(--text-primary)' : '#fff',
                          border: isAdm
                            ? '1px solid #f59e0b'
                            : followingThis
                            ? '1px solid var(--border-color)'
                            : 'none',
                          cursor: isAdm ? 'default' : 'pointer',
                        }}
                      >
                        {isAdm ? (
                          <>
                            <ShieldCheck size={14} color="#d97706" />
                            <span>Seguindo (ADM)</span>
                          </>
                        ) : followingThis ? (
                          <>
                            <UserCheck size={14} />
                            <span>Seguindo</span>
                          </>
                        ) : (
                          <>
                            <UserPlus size={14} />
                            <span>Seguir</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '36px 20px',
                textAlign: 'center',
              }}
            >
              <Users size={32} color="var(--text-muted)" style={{ margin: '0 auto 10px' }} />
              <p style={{ fontWeight: 700, marginBottom: '6px' }}>Nenhum membro encontrado</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Tente buscar pelo nome exato ou parte do perfil do usuário.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Mídias (Filmes, Séries, Livros) ou Todos */
        <div>
          {/* Se na busca geral foram encontrados membros correspondentes, exibe um banner rápido */}
          {activeFilter === 'all' && hasSearched && userResults.length > 0 && (
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px',
                }}
              >
                <span style={{ fontSize: '0.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={16} color="var(--accent-pink)" />
                  Membros com "{query}" ({userResults.length})
                </span>
                <button
                  type="button"
                  onClick={() => onFilterChange('users')}
                  style={{ fontSize: '0.78rem', color: 'var(--accent-pink)', fontWeight: 700 }}
                >
                  Ver todos
                </button>
              </div>

              <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
                {userResults.slice(0, 4).map((u) => (
                  <button
                    key={u.uid}
                    type="button"
                    onClick={() => onViewAuthorProfile(u.uid)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 12px',
                      background: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-full)',
                      border: '1px solid var(--border-color)',
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={u.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.uid}`}
                      alt={u.displayName}
                      style={{ width: '22px', height: '22px', borderRadius: 'var(--radius-full)' }}
                    />
                    <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>{u.displayName}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Título da seção */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '0.96rem', fontWeight: 800 }}>
              {hasSearched ? `Resultados para "${query}"` : 'Títulos em Destaque'}
            </h2>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {mediaResults.length} títulos
            </span>
          </div>

          {/* Grade de Mídias com Placeholders durante Loading */}
          {loading ? (
            <div className="media-grid">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      aspectRatio: '2/3',
                      background: 'var(--bg-subtle)',
                      animation: 'pulse 1.5s infinite ease-in-out',
                    }}
                  />
                  <div style={{ padding: '8px' }}>
                    <div
                      style={{
                        height: '14px',
                        background: 'var(--bg-subtle)',
                        borderRadius: '4px',
                        marginBottom: '6px',
                        animation: 'pulse 1.5s infinite ease-in-out',
                      }}
                    />
                    <div
                      style={{
                        height: '10px',
                        width: '60%',
                        background: 'var(--bg-subtle)',
                        borderRadius: '4px',
                        animation: 'pulse 1.5s infinite ease-in-out',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : mediaResults.length > 0 ? (
            <div className="media-grid">
              {mediaResults.map((item) => (
                <div
                  key={`${item.type}_${item.id}`}
                  className="media-grid-item"
                  onClick={() => onOpenMediaModal(item)}
                >
                  <div className="grid-poster-wrap">
                    {renderBadge(item.type)}
                    <img
                      src={
                        item.poster ||
                        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=450&fit=crop'
                      }
                      alt={item.title}
                      loading="lazy"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.dataset.errored) {
                          target.dataset.errored = 'true';
                          target.src =
                            'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=450&fit=crop';
                        }
                      }}
                    />
                  </div>
                  <div className="grid-item-info">
                    <div className="grid-item-title">{item.title}</div>
                    <div className="grid-item-sub">
                      {item.author || (item.year ? item.year : 'Catálogo')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '36px 20px',
                textAlign: 'center',
              }}
            >
              <p style={{ fontWeight: 700, marginBottom: '6px', fontSize: '1rem' }}>
                Nenhum resultado encontrado para "{query}"
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                {activeFilter !== 'all'
                  ? `Não localizamos resultados em ${
                      activeFilter === 'movie' ? 'Filmes' : activeFilter === 'series' ? 'Séries' : 'Livros'
                    }. Tente buscar em todas as categorias.`
                  : 'Verifique a ortografia ou experimente um dos termos populares abaixo.'}
              </p>

              {activeFilter !== 'all' && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => onFilterChange('all')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 18px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    marginBottom: '18px',
                  }}
                >
                  <Layers size={14} />
                  <span>Buscar em Todas as Categorias</span>
                </button>
              )}

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {QUICK_SUGGESTIONS.slice(0, 4).map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    className="search-suggestion-chip"
                    onClick={() => handleSelectSuggestion(s.label)}
                  >
                    <span>{s.icon}</span>
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
