import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  Film,
  Tv,
  BookOpen,
  Star,
  Sparkles,
  Heart,
  Plus,
  Search,
  Check,
  ChevronRight,
  ExternalLink,
  Loader2,
  Calendar,
  UserCheck,
  Flame,
  LayoutGrid,
  List as ListIcon,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import {
  ListItem,
  FollowingRelation,
  FollowerRelation,
  UserProfile,
  MediaType,
  WatchedCompanion,
} from '../types/cinebook';
import { useAuth } from '../context/AuthContext';
import {
  getUserListItems,
  logCoWatchedMedia,
  subscribeFollowing,
  subscribeFollowers,
  getAdminInfo,
  setUserListItem,
} from '../services/firestoreService';
import { searchAllMedia } from '../services/mediaService';

interface WatchedWithFollowersModalProps {
  initialFollowerUid?: string | null;
  onClose: () => void;
  onOpenMediaModal: (item: any) => void;
  onOpenAuth: () => void;
  onViewUserProfile?: (uid: string) => void;
}

interface CommonItem {
  key: string;
  id: string;
  type: MediaType;
  title: string;
  posterUrl: string;
  year: string;
  myRating?: number;
  companionRating?: number;
  watchedTogether?: boolean;
  watchedAt?: string;
}

function cleanDisplayName(raw?: string): string {
  if (!raw) return 'Amigo';
  let cleaned = raw.replace(/\s*\(ADM\)\s*/gi, '').trim();
  // Se for tudo maiúsculo com mais de 3 letras, formata suavemente para Title Case
  if (cleaned.length > 3 && cleaned === cleaned.toUpperCase()) {
    cleaned = cleaned
      .toLowerCase()
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
  return cleaned;
}

export const WatchedWithFollowersModal: React.FC<WatchedWithFollowersModalProps> = ({
  initialFollowerUid,
  onClose,
  onOpenMediaModal,
  onOpenAuth,
  onViewUserProfile,
}) => {
  const { user, profile } = useAuth();

  // Conexões (seguidores e seguindo)
  const [connections, setConnections] = useState<Array<{ uid: string; name: string; photo: string; type: string }>>([]);
  const [selectedCompanion, setSelectedCompanion] = useState<{ uid: string; name: string; photo: string } | null>(null);

  // Listas de ambos
  const [myWatchedItems, setMyWatchedItems] = useState<ListItem[]>([]);
  const [companionWatchedItems, setCompanionWatchedItems] = useState<ListItem[]>([]);
  const [loadingCompanion, setLoadingCompanion] = useState(false);

  // Visualização e Filtros
  const [subTab, setSubTab] = useState<'common' | 'sessions' | 'recommendations'>('common');
  const [mediaFilter, setMediaFilter] = useState<'all' | 'movie' | 'series'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modal para registrar nova sessão assistida junto
  const [showLogModal, setShowLogModal] = useState(false);
  const [searchLogQuery, setSearchLogQuery] = useState('');
  const [searchLogResults, setSearchLogResults] = useState<any[]>([]);
  const [searchingLog, setSearchingLog] = useState(false);
  const [selectedLogMedia, setSelectedLogMedia] = useState<any | null>(null);
  const [logRating, setLogRating] = useState(5);
  const [savingLog, setSavingLog] = useState(false);
  const [logSuccessMsg, setLogSuccessMsg] = useState<string | null>(null);

  // Carrega conexões do usuário atual
  useEffect(() => {
    if (!user) return;

    let unsubFollowers: () => void = () => {};
    let unsubFollowing: () => void = () => {};

    // 1. Minhas próprias listas concluídas
    getUserListItems(user.uid).then((items) => {
      setMyWatchedItems(items.filter((i) => i.status === 'completed'));
    });

    // 2. Conexões
    unsubFollowers = subscribeFollowers(user.uid, (followers) => {
      unsubFollowing = subscribeFollowing(user.uid, async (following) => {
        const map = new Map<string, { uid: string; name: string; photo: string; type: string }>();

        followers.forEach((f) => {
          map.set(f.followerUid, {
            uid: f.followerUid,
            name: f.followerName || 'Seguidor',
            photo: f.followerPhoto || `https://api.dicebear.com/7.x/bottts/svg?seed=${f.followerUid}`,
            type: 'Seguidor',
          });
        });

        following.forEach((f) => {
          if (!map.has(f.targetUid)) {
            map.set(f.targetUid, {
              uid: f.targetUid,
              name: f.targetName || 'Seguindo',
              photo: f.targetPhoto || `https://api.dicebear.com/7.x/bottts/svg?seed=${f.targetUid}`,
              type: 'Seguindo',
            });
          }
        });

        // Adiciona ADM se ainda não estiver
        const admin = await getAdminInfo();
        if (admin && admin.adminUid !== user.uid && !map.has(admin.adminUid)) {
          map.set(admin.adminUid, {
            uid: admin.adminUid,
            name: admin.displayName || 'Henry Analytics (ADM)',
            photo: admin.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${admin.adminUid}`,
            type: 'ADM Oficial',
          });
        }

        const list = Array.from(map.values());
        setConnections(list);

        // Seleciona seguidor inicial ou o primeiro
        if (initialFollowerUid) {
          const found = list.find((c) => c.uid === initialFollowerUid);
          if (found) {
            setSelectedCompanion(found);
            return;
          }
        }
        if (list.length > 0 && !selectedCompanion) {
          setSelectedCompanion(list[0]);
        }
      });
    });

    return () => {
      unsubFollowers();
      unsubFollowing();
    };
  }, [user, initialFollowerUid]);

  // Carrega itens do seguidor selecionado
  useEffect(() => {
    if (!selectedCompanion) {
      setCompanionWatchedItems([]);
      return;
    }

    setLoadingCompanion(true);
    getUserListItems(selectedCompanion.uid)
      .then((items) => {
        setCompanionWatchedItems(items.filter((i) => i.status === 'completed'));
      })
      .catch((err) => {
        console.error('Erro ao carregar listas do seguidor:', err);
      })
      .finally(() => {
        setLoadingCompanion(false);
      });
  }, [selectedCompanion]);

  // Se usuário não estiver logado
  if (!user) {
    return (
      <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
        <div className="modal-sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
          <div style={{ textAlign: 'center', padding: '24px 8px' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(135deg, rgba(225, 29, 72, 0.15) 0%, rgba(245, 158, 11, 0.15) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: 'var(--accent-pink)',
              }}
            >
              <Users size={32} />
            </div>
            <h2 className="modal-title" style={{ fontSize: '1.25rem' }}>Filmes com Meus Seguidores</h2>
            <p className="modal-desc">
              Entre na sua conta para comparar filmes assistidos em comum e registrar sessões assistidas juntos com seus amigos.
            </p>
            <button
              type="button"
              className="btn-primary"
              onClick={onOpenAuth}
              style={{ padding: '11px 26px', borderRadius: 'var(--radius-full)', fontWeight: 700 }}
            >
              Fazer Login no Cinebook
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Cálculos de Filmes em Comum, Sessões e Recomendações
  const companionItemKeys = new Set(companionWatchedItems.map((i) => i.itemKey));
  const myItemKeys = new Set(myWatchedItems.map((i) => i.itemKey));

  // 1. Filmes que AMBOS assistiram
  const commonItems: CommonItem[] = myWatchedItems
    .filter((my) => companionItemKeys.has(my.itemKey))
    .map((my) => {
      const comp = companionWatchedItems.find((c) => c.itemKey === my.itemKey);
      const isCoWatched = Boolean(
        my.watchedWith?.some((w) => w.uid === selectedCompanion?.uid) ||
        comp?.watchedWith?.some((w) => w.uid === user.uid)
      );

      return {
        key: my.itemKey,
        id: my.itemId,
        type: my.itemType,
        title: my.title,
        posterUrl: my.posterUrl,
        year: my.year,
        myRating: my.userRating,
        companionRating: comp?.userRating,
        watchedTogether: isCoWatched,
        watchedAt: my.updatedAt,
      };
    });

  // 2. Sessões marcadas juntos
  const sessionsTogether = myWatchedItems
    .filter((my) => my.watchedWith?.some((w) => w.uid === selectedCompanion?.uid))
    .map((my) => ({
      key: my.itemKey,
      id: my.itemId,
      type: my.itemType,
      title: my.title,
      posterUrl: my.posterUrl,
      year: my.year,
      myRating: my.userRating,
      watchedTogether: true,
      watchedAt: my.updatedAt,
    }));

  // 3. Recomendações do seguidor (ele assistiu, você ainda não)
  const recommendationsFromCompanion = companionWatchedItems.filter((comp) => !myItemKeys.has(comp.itemKey));

  // Filtragem por tipo de mídia
  const applyTypeFilter = (list: any[]) => {
    if (mediaFilter === 'all') return list;
    return list.filter((item) => (item.type || item.itemType) === mediaFilter);
  };

  const filteredCommon = applyTypeFilter(commonItems);
  const filteredSessions = applyTypeFilter(sessionsTogether);
  const filteredRecommendations = applyTypeFilter(recommendationsFromCompanion);

  // Sintonia cinéfila em %
  const totalConsidered = Math.max(myWatchedItems.length, companionWatchedItems.length, 1);
  const matchPercentage = Math.min(100, Math.round((commonItems.length / totalConsidered) * 100 * 2.2));

  // Textos formatados
  const companionFullName = cleanDisplayName(selectedCompanion?.name);
  const companionFirstName = companionFullName.split(' ')[0] || 'Amigo';
  const commonCount = commonItems.length;
  const sessionsCount = sessionsTogether.length;
  const commonText = commonCount === 1 ? '1 obra em comum' : `${commonCount} obras em comum`;
  const sessionsText = sessionsCount === 1 ? '1 sessão juntos' : `${sessionsCount} sessões juntos`;

  // Busca rápida para registrar sessão
  const handleSearchLogMedia = async (q: string) => {
    setSearchLogQuery(q);
    if (!q.trim()) {
      setSearchLogResults([]);
      return;
    }
    setSearchingLog(true);
    try {
      const res = await searchAllMedia(q.trim());
      setSearchLogResults(res.slice(0, 6));
    } catch (e) {
      console.error(e);
    } finally {
      setSearchingLog(false);
    }
  };

  // Salvar novo filme assistido junto
  const handleSaveCoWatchedSession = async () => {
    if (!selectedLogMedia || !selectedCompanion) return;
    setSavingLog(true);
    try {
      const companions: WatchedCompanion[] = [
        {
          uid: selectedCompanion.uid,
          name: selectedCompanion.name,
          photo: selectedCompanion.photo,
        },
      ];

      await logCoWatchedMedia(
        user.uid,
        {
          id: selectedLogMedia.id,
          type: selectedLogMedia.type,
          title: selectedLogMedia.title,
          posterUrl: selectedLogMedia.poster || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400',
          year: selectedLogMedia.year,
          rating: logRating,
        },
        companions
      );

      // Atualiza estado local
      const newItemKey = `${selectedLogMedia.type}_${selectedLogMedia.id}`;
      const newListItem: ListItem = {
        itemKey: newItemKey,
        itemId: selectedLogMedia.id,
        itemType: selectedLogMedia.type,
        title: selectedLogMedia.title,
        posterUrl: selectedLogMedia.poster || '',
        year: selectedLogMedia.year,
        status: 'completed',
        updatedAt: new Date().toISOString(),
        watchedWith: companions,
        userRating: logRating,
      };

      setMyWatchedItems((prev) => [newListItem, ...prev.filter((i) => i.itemKey !== newItemKey)]);

      setLogSuccessMsg(`Sessão registrada com sucesso com ${companionFirstName}!`);
      setTimeout(() => {
        setShowLogModal(false);
        setSelectedLogMedia(null);
        setSearchLogQuery('');
        setLogSuccessMsg(null);
      }, 1300);
    } catch (err: any) {
      alert('Erro ao registrar sessão: ' + (err.message || 'Tente novamente.'));
    } finally {
      setSavingLog(false);
    }
  };

  // Adicionar recomendação à lista de "Quero ver"
  const handleAddRecommendationToWantList = async (rec: ListItem) => {
    try {
      await setUserListItem(user.uid, {
        itemKey: rec.itemKey,
        itemId: rec.itemId,
        itemType: rec.itemType,
        title: rec.title,
        posterUrl: rec.posterUrl,
        year: rec.year,
        status: 'want',
        updatedAt: new Date().toISOString(),
      });
      alert(`"${rec.title}" adicionado à sua lista "Quero ver"!`);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-sheet watched-followers-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '780px',
          width: '100%',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          borderRadius: '24px',
        }}
      >
        {/* Barra Superior Fixa com Pegador e Botão Fechar */}
        <div className="cowatch-sheet-header">
          <div className="cowatch-drag-pill" />
          <div className="cowatch-header-main">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="cowatch-header-badge">
                <Users size={18} />
              </div>
              <div>
                <h2 className="cowatch-header-title">Filmes com Meus Seguidores</h2>
                <p className="cowatch-header-subtitle">
                  Sintonia cinéfila e sessões que assistiram juntos
                </p>
              </div>
            </div>

            <button
              type="button"
              className="cowatch-close-btn"
              onClick={onClose}
              aria-label="Fechar"
            >
              <X size={19} />
            </button>
          </div>
        </div>

        {/* Corpo Rolável */}
        <div className="cowatch-sheet-body">
          {/* Seletor de Conexão Estilo Stories/Chips */}
          <div className="cowatch-selector-section">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span className="cowatch-section-label">Comparar com:</span>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                {connections.length} {connections.length === 1 ? 'conexão' : 'conexões'}
              </span>
            </div>

            {connections.length > 0 ? (
              <div className="cowatch-avatar-carousel">
                {connections.map((c) => {
                  const isSelected = selectedCompanion?.uid === c.uid;
                  const cCleanName = cleanDisplayName(c.name);
                  const cShortName = cCleanName.split(' ')[0];

                  return (
                    <button
                      key={c.uid}
                      type="button"
                      className={`cowatch-avatar-btn ${isSelected ? 'active' : ''}`}
                      onClick={() => setSelectedCompanion(c)}
                    >
                      <div className="cowatch-avatar-ring">
                        <img src={c.photo} alt={c.name} />
                        {isSelected && (
                          <div className="cowatch-avatar-check">
                            <Check size={10} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                      <span className="cowatch-avatar-name" title={cCleanName}>
                        {cShortName}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="cowatch-no-followers-box">
                <Users size={18} color="var(--accent-pink)" />
                <span>Você ainda não tem seguidores. Siga membros na busca ou o perfil oficial do ADM para comparar filmes!</span>
              </div>
            )}
          </div>

          {selectedCompanion && (
            <>
              {/* Card Hero de Sintonia Cinéfila */}
              <div className="cowatch-hero-card">
                <div className="cowatch-hero-top">
                  {/* Avatares Entrelaçados */}
                  <div className="cowatch-duo-avatars">
                    <img
                      src={profile?.photoURL || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + user.uid}
                      alt="Você"
                      className="duo-avatar duo-me"
                    />
                    <div className="duo-sparkle-center" title="Sintonia">
                      <Flame size={14} />
                    </div>
                    <img
                      src={selectedCompanion.photo}
                      alt={companionFullName}
                      className="duo-avatar duo-them"
                    />
                  </div>

                  {/* Textos de Sintonia */}
                  <div className="cowatch-hero-text">
                    <div className="cowatch-hero-title">
                      Sintonia com <strong>{companionFirstName}</strong>
                    </div>
                    <div className="cowatch-hero-stats">
                      {commonText} • {sessionsText}
                    </div>
                  </div>
                </div>

                {/* Régua de Compatibilidade & Ação */}
                <div className="cowatch-hero-bottom">
                  <div className="cowatch-meter-box">
                    <div className="cowatch-meter-header">
                      <span className="cowatch-meter-label">Compatibilidade</span>
                      <span className="cowatch-meter-percent">{matchPercentage}%</span>
                    </div>
                    <div className="cowatch-progress-track">
                      <div
                        className="cowatch-progress-fill"
                        style={{ width: `${Math.max(12, matchPercentage)}%` }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    className="cowatch-hero-btn"
                    onClick={() => setShowLogModal(true)}
                    title="Registrar que assistiu um novo filme com este seguidor"
                  >
                    <Plus size={16} />
                    <span>Registrar Filme Junto</span>
                  </button>
                </div>
              </div>

              {/* Segmented Control das Abas Internas */}
              <div className="cowatch-segmented-nav">
                <button
                  type="button"
                  className={`cowatch-segment-btn ${subTab === 'common' ? 'active' : ''}`}
                  onClick={() => setSubTab('common')}
                >
                  <span>Em Comum</span>
                  <span className="cowatch-segment-badge">{commonItems.length}</span>
                </button>

                <button
                  type="button"
                  className={`cowatch-segment-btn ${subTab === 'sessions' ? 'active' : ''}`}
                  onClick={() => setSubTab('sessions')}
                >
                  <span>Sessões Juntos</span>
                  <span className="cowatch-segment-badge">{sessionsTogether.length}</span>
                </button>

                <button
                  type="button"
                  className={`cowatch-segment-btn ${subTab === 'recommendations' ? 'active' : ''}`}
                  onClick={() => setSubTab('recommendations')}
                >
                  <span>Dicas dele</span>
                  <span className="cowatch-segment-badge">{recommendationsFromCompanion.length}</span>
                </button>
              </div>

              {/* Barra de Filtros e Alternador de Exibição */}
              <div className="cowatch-toolbar-row">
                <div className="cowatch-filter-chips">
                  <button
                    type="button"
                    className={`cowatch-chip ${mediaFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setMediaFilter('all')}
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    className={`cowatch-chip ${mediaFilter === 'movie' ? 'active' : ''}`}
                    onClick={() => setMediaFilter('movie')}
                  >
                    Filmes
                  </button>
                  <button
                    type="button"
                    className={`cowatch-chip ${mediaFilter === 'series' ? 'active' : ''}`}
                    onClick={() => setMediaFilter('series')}
                  >
                    Séries
                  </button>
                </div>

                <div className="cowatch-view-toggle">
                  <button
                    type="button"
                    className={`cowatch-toggle-icon ${viewMode === 'grid' ? 'active' : ''}`}
                    onClick={() => setViewMode('grid')}
                    title="Visualização em Grade"
                  >
                    <LayoutGrid size={15} />
                  </button>
                  <button
                    type="button"
                    className={`cowatch-toggle-icon ${viewMode === 'list' ? 'active' : ''}`}
                    onClick={() => setViewMode('list')}
                    title="Visualização em Lista Detalhada"
                  >
                    <ListIcon size={15} />
                  </button>
                </div>
              </div>

              {/* Conteúdo Dinâmico da Aba */}
              {loadingCompanion ? (
                <div className="cowatch-loading-box">
                  <Loader2 size={24} className="animate-spin" />
                  <span>Calculando sintonia com {companionFirstName}...</span>
                </div>
              ) : subTab === 'common' ? (
                /* ABA 1: ASSISTIDOS EM COMUM */
                filteredCommon.length > 0 ? (
                  viewMode === 'grid' ? (
                    <div className="cowatch-grid-v2">
                      {filteredCommon.map((item) => (
                        <div
                          key={item.key}
                          className="cowatch-card-v2"
                          onClick={() =>
                            onOpenMediaModal({
                              id: item.id,
                              type: item.type,
                              title: item.title,
                              poster: item.posterUrl,
                              year: item.year,
                            })
                          }
                        >
                          <div className="cowatch-poster-wrap">
                            <img src={item.posterUrl} alt={item.title} loading="lazy" />
                            <span className="cowatch-type-badge">
                              {item.type === 'movie' ? 'Filme' : 'Série'}
                            </span>
                            {item.watchedTogether && (
                              <div className="cowatch-tag-together">
                                <Users size={10} /> Juntos
                              </div>
                            )}
                          </div>

                          <div className="cowatch-card-body">
                            <div className="cowatch-movie-title">{item.title}</div>
                            <div className="cowatch-movie-year">{item.year || 'Catálogo'}</div>

                            {/* Avaliações comparadas em linhas limpas (NUNCA cortam!) */}
                            <div className="cowatch-ratings-stack">
                              <div className="cowatch-rating-badge user-badge">
                                <span className="rating-who">Você:</span>
                                <span className="rating-val">
                                  {item.myRating ? `${item.myRating}★` : '✓ Assistiu'}
                                </span>
                              </div>
                              <div className="cowatch-rating-badge companion-badge">
                                <span className="rating-who">{companionFirstName}:</span>
                                <span className="rating-val">
                                  {item.companionRating ? `${item.companionRating}★` : '✓ Assistiu'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* MODO LISTA */
                    <div className="cowatch-list-v2">
                      {filteredCommon.map((item) => (
                        <div
                          key={item.key}
                          className="cowatch-list-card"
                          onClick={() =>
                            onOpenMediaModal({
                              id: item.id,
                              type: item.type,
                              title: item.title,
                              poster: item.posterUrl,
                              year: item.year,
                            })
                          }
                        >
                          <div className="cowatch-list-poster">
                            <img src={item.posterUrl} alt={item.title} loading="lazy" />
                          </div>

                          <div className="cowatch-list-content">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                              <span className="cowatch-type-badge-inline">
                                {item.type === 'movie' ? 'Filme' : 'Série'}
                              </span>
                              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                {item.year}
                              </span>
                              {item.watchedTogether && (
                                <span className="cowatch-tag-together-inline">
                                  <Users size={10} /> Sessão Juntos
                                </span>
                              )}
                            </div>

                            <div className="cowatch-list-title">{item.title}</div>

                            <div className="cowatch-list-ratings">
                              <div className="cowatch-rating-badge user-badge">
                                <span className="rating-who">Você:</span>
                                <span className="rating-val">
                                  {item.myRating ? `${item.myRating}★` : '✓ Assistiu'}
                                </span>
                              </div>
                              <div className="cowatch-rating-badge companion-badge">
                                <span className="rating-who">{companionFirstName}:</span>
                                <span className="rating-val">
                                  {item.companionRating ? `${item.companionRating}★` : '✓ Assistiu'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="cowatch-list-arrow">
                            <ChevronRight size={18} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <div className="cowatch-empty-v2">
                    <div className="empty-icon-circle">
                      <Film size={32} />
                    </div>
                    <h4>Nenhum filme assistido em comum ainda</h4>
                    <p>
                      Quando você e {companionFirstName} marcarem os mesmos títulos como concluídos, eles aparecerão aqui com comparação detalhada.
                    </p>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => setShowLogModal(true)}
                      style={{ padding: '9px 20px', borderRadius: 'var(--radius-full)', fontWeight: 700, marginTop: '12px' }}
                    >
                      + Registrar Filme que Assistimos Juntos
                    </button>
                  </div>
                )
              ) : subTab === 'sessions' ? (
                /* ABA 2: SESSÕES REGISTRADAS JUNTOS */
                filteredSessions.length > 0 ? (
                  <div className="cowatch-grid-v2">
                    {filteredSessions.map((item) => (
                      <div
                        key={item.key}
                        className="cowatch-card-v2"
                        onClick={() =>
                          onOpenMediaModal({
                            id: item.id,
                            type: item.type,
                            title: item.title,
                            poster: item.posterUrl,
                            year: item.year,
                          })
                        }
                      >
                        <div className="cowatch-poster-wrap">
                          <img src={item.posterUrl} alt={item.title} loading="lazy" />
                          <div className="cowatch-tag-together" style={{ background: '#10b981' }}>
                            <Check size={10} strokeWidth={3} /> Confirmado
                          </div>
                        </div>
                        <div className="cowatch-card-body">
                          <div className="cowatch-movie-title">{item.title}</div>
                          <div className="cowatch-movie-year">{item.year}</div>
                          <div className="cowatch-session-flag">
                            🍿 Sessão Compartilhada
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="cowatch-empty-v2">
                    <div className="empty-icon-circle">
                      <Users size={32} />
                    </div>
                    <h4>Nenhuma sessão registrada juntos ainda</h4>
                    <p>
                      Assistiram a um filme juntos no cinema ou em casa? Registre agora para guardar na sua linha do tempo com {companionFirstName}!
                    </p>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => setShowLogModal(true)}
                      style={{ padding: '9px 20px', borderRadius: 'var(--radius-full)', fontWeight: 700, marginTop: '12px' }}
                    >
                      + Registrar Filme Assistido com {companionFirstName}
                    </button>
                  </div>
                )
              ) : (
                /* ABA 3: RECOMENDAÇÕES DO SEGUIDOR */
                filteredRecommendations.length > 0 ? (
                  <div className="cowatch-grid-v2">
                    {filteredRecommendations.map((item) => (
                      <div key={item.itemKey} className="cowatch-card-v2">
                        <div
                          className="cowatch-poster-wrap"
                          onClick={() =>
                            onOpenMediaModal({
                              id: item.itemId,
                              type: item.itemType,
                              title: item.title,
                              poster: item.posterUrl,
                              year: item.year,
                            })
                          }
                        >
                          <img src={item.posterUrl} alt={item.title} loading="lazy" />
                          <div className="cowatch-tag-together" style={{ background: 'var(--accent-gold)' }}>
                            <Sparkles size={10} /> Dica dele
                          </div>
                        </div>
                        <div className="cowatch-card-body">
                          <div className="cowatch-movie-title">{item.title}</div>
                          <div className="cowatch-movie-year">{item.year}</div>
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => handleAddRecommendationToWantList(item)}
                            style={{
                              marginTop: '8px',
                              padding: '5px 8px',
                              fontSize: '0.74rem',
                              borderRadius: 'var(--radius-sm)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              width: '100%',
                              fontWeight: 700,
                            }}
                          >
                            <Plus size={13} />
                            <span>Quero Ver</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="cowatch-empty-v2">
                    <div className="empty-icon-circle">
                      <Sparkles size={32} />
                    </div>
                    <h4>Sem recomendações pendentes</h4>
                    <p>
                      {companionFirstName} não tem outros títulos concluídos que você ainda não tenha assistido.
                    </p>
                  </div>
                )
              )}
            </>
          )}
        </div>

        {/* MODAL INTERNO: REGISTRAR FILME ASSISTIDO JUNTO */}
        {showLogModal && selectedCompanion && (
          <div className="modal-backdrop" style={{ zIndex: 120 }} onClick={() => setShowLogModal(false)}>
            <div className="modal-sheet" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
              <button type="button" className="modal-close-btn" onClick={() => setShowLogModal(false)}>
                <X size={20} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <Plus size={18} />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                  Registrar Filme Junto
                </h3>
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Assistiu com <strong>{companionFirstName}</strong>? Escolha o filme e adicione à sua lista de concluídos:
              </p>

              {logSuccessMsg ? (
                <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid #10b981', color: '#10b981', padding: '16px', borderRadius: 'var(--radius-md)', textAlign: 'center', fontWeight: 700 }}>
                  <Check size={22} style={{ display: 'inline', marginRight: '6px' }} />
                  {logSuccessMsg}
                </div>
              ) : (
                <>
                  {!selectedLogMedia ? (
                    <div>
                      <label className="form-label" style={{ marginBottom: '6px', display: 'block' }}>
                        Qual filme ou série vocês assistiram?
                      </label>
                      <div className="search-input-box" style={{ marginBottom: '10px' }}>
                        <Search size={18} />
                        <input
                          type="text"
                          className="search-input"
                          placeholder="Digite o título da obra..."
                          value={searchLogQuery}
                          onChange={(e) => handleSearchLogMedia(e.target.value)}
                          autoFocus
                        />
                      </div>

                      {searchingLog && (
                        <div style={{ textAlign: 'center', padding: '10px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          <Loader2 size={16} className="animate-spin" style={{ display: 'inline', marginRight: '6px' }} />
                          Buscando catálogo...
                        </div>
                      )}

                      {searchLogResults.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                          {searchLogResults.map((m) => (
                            <button
                              key={`${m.type}_${m.id}`}
                              type="button"
                              onClick={() => {
                                setSelectedLogMedia(m);
                                setSearchLogResults([]);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '8px 10px',
                                borderRadius: 'var(--radius-md)',
                                background: 'var(--bg-subtle)',
                                textAlign: 'left',
                                border: '1px solid var(--border-color)',
                              }}
                            >
                              <img
                                src={m.poster || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=100'}
                                alt={m.title}
                                style={{ width: '38px', height: '52px', objectFit: 'cover', borderRadius: '4px' }}
                              />
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{m.title}</div>
                                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                  {m.year} • {m.type === 'movie' ? 'Filme' : 'Série'}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-subtle)', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '14px', border: '1px solid var(--border-color)' }}>
                        <img
                          src={selectedLogMedia.poster || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=100'}
                          alt={selectedLogMedia.title}
                          style={{ width: '50px', height: '72px', objectFit: 'cover', borderRadius: '6px' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 800, fontSize: '0.96rem' }}>{selectedLogMedia.title}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{selectedLogMedia.year}</div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--accent-pink)', fontWeight: 700, marginTop: '2px' }}>
                            ✓ Assistido junto com {companionFirstName}
                          </div>
                        </div>
                        <button type="button" onClick={() => setSelectedLogMedia(null)} style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'underline' }}>
                          Trocar
                        </button>
                      </div>

                      <div style={{ marginBottom: '18px' }}>
                        <label className="form-label" style={{ display: 'block', marginBottom: '6px' }}>
                          Sua nota da sessão:
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setLogRating(star)}
                              style={{ color: star <= logRating ? '#f59e0b' : 'var(--text-muted)', padding: '4px' }}
                            >
                              <Star size={24} fill={star <= logRating ? '#f59e0b' : 'none'} />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => setSelectedLogMedia(null)}
                          style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-md)' }}
                        >
                          Voltar
                        </button>
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={handleSaveCoWatchedSession}
                          disabled={savingLog}
                          style={{ flex: 2, padding: '10px', borderRadius: 'var(--radius-md)', fontWeight: 700 }}
                        >
                          {savingLog ? 'Salvando...' : 'Confirmar e Salvar'}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
