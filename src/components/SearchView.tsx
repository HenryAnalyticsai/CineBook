import React, { useState, useEffect } from 'react';
import {
  Search as SearchIcon,
  Film,
  Tv,
  BookOpen,
  Users,
  UserPlus,
  UserCheck,
  Loader2,
} from 'lucide-react';
import { MediaItem, MediaType, UserProfile, FollowingRelation } from '../types/cinebook';
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
      const trending = await getTrendingTmdb();
      const combined = [...POPULAR_BOOKS, ...trending];
      setMediaResults(combined);

      const community = await getCommunityUsers(15);
      setUserResults(community);
      setLoading(false);
    };
    loadDefaultData();
  }, []);

  const handleSearch = async (searchTerm: string, filter: 'all' | 'movie' | 'series' | 'book' | 'users') => {
    const trimmed = searchTerm.trim();

    if (!trimmed) {
      setLoading(true);
      if (filter === 'users') {
        const community = await getCommunityUsers(15);
        setUserResults(community);
      } else {
        const trending = await getTrendingTmdb();
        const combined = [...POPULAR_BOOKS, ...trending];
        setMediaResults(filter === 'all' ? combined : combined.filter((i) => i.type === filter));
      }
      setHasSearched(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      if (filter === 'users') {
        const usersFound = await searchUsers(trimmed);
        setUserResults(usersFound);
      } else if (filter === 'all') {
        const [foundMedia, foundUsers] = await Promise.all([
          searchAllMedia(trimmed, 'all'),
          searchUsers(trimmed),
        ]);
        setMediaResults(foundMedia);
        setUserResults(foundUsers);
      } else {
        const found = await searchAllMedia(trimmed, filter);
        setMediaResults(found);
      }
    } catch (err) {
      console.error('Erro na pesquisa:', err);
    } finally {
      setLoading(false);
    }
  };

  const onFilterChange = (filter: 'all' | 'movie' | 'series' | 'book' | 'users') => {
    setActiveFilter(filter);
    handleSearch(query, filter);
  };

  const isUserFollowed = (targetUid: string) => {
    return following.some((f) => f.targetUid === targetUid);
  };

  const handleToggleFollow = async (e: React.MouseEvent, target: UserProfile) => {
    e.stopPropagation();
    if (!user) {
      onOpenAuth();
      return;
    }

    try {
      if (isUserFollowed(target.uid)) {
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
      {/* Barra de busca */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch(query, activeFilter);
        }}
      >
        <div className="search-input-box">
          <SearchIcon size={20} />
          <input
            type="search"
            className="search-input"
            placeholder="Buscar filmes, séries, livros e membros..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch(query, activeFilter);
              }
            }}
            aria-label="Campo de busca"
          />
        </div>
      </form>

      {/* Chips de Filtro Sem termos TMDB e OpenLibrary */}
      <div className="filter-chips">
        <button
          type="button"
          className={`filter-chip ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => onFilterChange('all')}
        >
          Todos
        </button>
        <button
          type="button"
          className={`filter-chip ${activeFilter === 'movie' ? 'active' : ''}`}
          onClick={() => onFilterChange('movie')}
        >
          <Film size={13} style={{ display: 'inline', marginRight: '4px' }} />
          Filmes
        </button>
        <button
          type="button"
          className={`filter-chip ${activeFilter === 'series' ? 'active' : ''}`}
          onClick={() => onFilterChange('series')}
        >
          <Tv size={13} style={{ display: 'inline', marginRight: '4px' }} />
          Séries
        </button>
        <button
          type="button"
          className={`filter-chip ${activeFilter === 'book' ? 'active' : ''}`}
          onClick={() => onFilterChange('book')}
        >
          <BookOpen size={13} style={{ display: 'inline', marginRight: '4px' }} />
          Livros
        </button>
        <button
          type="button"
          className={`filter-chip ${activeFilter === 'users' ? 'active' : ''}`}
          onClick={() => onFilterChange('users')}
          style={{
            borderColor: activeFilter === 'users' ? 'var(--accent-pink)' : 'var(--border-color)',
            fontWeight: 700,
          }}
        >
          <Users size={14} style={{ display: 'inline', marginRight: '4px' }} />
          Membros para Seguir
        </button>
      </div>

      {/* Resultados de Membros quando em aba 'users' */}
      {activeFilter === 'users' ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 800 }}>
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
                const followingThis = isUserFollowed(u.uid);
                const isMe = user?.uid === u.uid;

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
                        <div style={{ fontWeight: 700, fontSize: '0.94rem', color: 'var(--text-primary)' }}>
                          {u.displayName}
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
                          background: followingThis ? 'var(--bg-subtle)' : 'var(--accent-gradient)',
                          color: followingThis ? 'var(--text-primary)' : '#fff',
                          border: followingThis ? '1px solid var(--border-color)' : 'none',
                        }}
                      >
                        {followingThis ? (
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 800 }}>
              {hasSearched ? `Obras para "${query}"` : 'Títulos em Destaque'}
            </h2>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {mediaResults.length} títulos
            </span>
          </div>

          {/* Grade de Mídias */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
              <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
              Buscando títulos...
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
              <p style={{ fontWeight: 700, marginBottom: '6px' }}>Nenhum título encontrado</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Tente buscar com outro termo ou selecione a categoria "Todos" ou "Membros".
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
