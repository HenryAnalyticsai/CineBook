import React, { useState, useEffect } from 'react';
import { Bookmark, Film, Tv, BookOpen, Trash2, Edit3, ArrowRight } from 'lucide-react';
import { ListItem, ListStatus, MediaType, LIST_STATUS_LABELS } from '../types/cinebook';
import { useAuth } from '../context/AuthContext';
import { subscribeUserLists, removeUserListItem, setUserListItem } from '../services/firestoreService';

interface ListsViewProps {
  onOpenMediaModal: (item: any) => void;
  onWriteReview: (item: any) => void;
  onGoToSearch: () => void;
  onOpenAuth: () => void;
}

export const ListsView: React.FC<ListsViewProps> = ({
  onOpenMediaModal,
  onWriteReview,
  onGoToSearch,
  onOpenAuth,
}) => {
  const { user } = useAuth();
  const [lists, setLists] = useState<ListItem[]>([]);
  const [activeStatus, setActiveStatus] = useState<ListStatus>('want');
  const [mediaFilter, setMediaFilter] = useState<'all' | 'movie' | 'series' | 'book'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLists([]);
      setLoading(false);
      return;
    }
    const unsub = subscribeUserLists(user.uid, (items) => {
      setLists(items);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  if (!user) {
    return (
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '40px 20px',
          textAlign: 'center',
          marginTop: '20px',
        }}
      >
        <Bookmark size={40} color="var(--accent-pink)" style={{ margin: '0 auto 12px' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>
          Suas Listas Pessoais
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Organize filmes, séries e livros em "Quero ver/ler", "Em andamento" e "Concluído".
        </p>
        <button
          type="button"
          className="btn-primary"
          onClick={onOpenAuth}
          style={{ padding: '10px 24px', borderRadius: 'var(--radius-full)', fontWeight: 700 }}
        >
          Entrar para ver minhas listas
        </button>
      </div>
    );
  }

  const itemsByStatus = lists.filter((item) => item.status === activeStatus);
  const filteredItems =
    mediaFilter === 'all'
      ? itemsByStatus
      : itemsByStatus.filter((item) => item.itemType === mediaFilter);

  const getStatusCount = (status: ListStatus) => lists.filter((i) => i.status === status).length;

  const handleStatusChange = async (item: ListItem, newStatus: ListStatus) => {
    await setUserListItem(user.uid, {
      ...item,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleRemove = async (itemKey: string) => {
    if (window.confirm('Remover este título da sua lista?')) {
      await removeUserListItem(user.uid, itemKey);
    }
  };

  const renderBadge = (type: MediaType) => {
    switch (type) {
      case 'movie':
        return (
          <span className="media-tag-badge badge-movie" style={{ top: 6, left: 6, padding: '2px 6px', fontSize: '0.65rem' }}>
            <Film size={10} /> Filme
          </span>
        );
      case 'series':
        return (
          <span className="media-tag-badge badge-series" style={{ top: 6, left: 6, padding: '2px 6px', fontSize: '0.65rem' }}>
            <Tv size={10} /> Série
          </span>
        );
      case 'book':
        return (
          <span className="media-tag-badge badge-book" style={{ top: 6, left: 6, padding: '2px 6px', fontSize: '0.65rem' }}>
            <BookOpen size={10} /> Livro
          </span>
        );
    }
  };

  return (
    <div>
      {/* Abas das 3 Listas */}
      <div className="feed-tabs" style={{ marginBottom: '14px' }}>
        {(['want', 'in_progress', 'completed'] as ListStatus[]).map((status) => {
          const count = getStatusCount(status);
          const isActive = activeStatus === status;
          return (
            <button
              key={status}
              type="button"
              className={`feed-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => setActiveStatus(status)}
              style={{ fontSize: '0.84rem', padding: '10px 8px' }}
            >
              <span>{LIST_STATUS_LABELS[status].label}</span>
              <span
                style={{
                  background: isActive ? 'var(--accent-pink)' : 'var(--bg-hover)',
                  color: isActive ? '#fff' : 'var(--text-muted)',
                  fontSize: '0.72rem',
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Subfiltros de tipo de mídia */}
      <div className="filter-chips" style={{ marginBottom: '16px' }}>
        <button
          type="button"
          className={`filter-chip ${mediaFilter === 'all' ? 'active' : ''}`}
          onClick={() => setMediaFilter('all')}
        >
          Todos ({itemsByStatus.length})
        </button>
        <button
          type="button"
          className={`filter-chip ${mediaFilter === 'movie' ? 'active' : ''}`}
          onClick={() => setMediaFilter('movie')}
        >
          Filmes ({itemsByStatus.filter((i) => i.itemType === 'movie').length})
        </button>
        <button
          type="button"
          className={`filter-chip ${mediaFilter === 'series' ? 'active' : ''}`}
          onClick={() => setMediaFilter('series')}
        >
          Séries ({itemsByStatus.filter((i) => i.itemType === 'series').length})
        </button>
        <button
          type="button"
          className={`filter-chip ${mediaFilter === 'book' ? 'active' : ''}`}
          onClick={() => setMediaFilter('book')}
        >
          Livros ({itemsByStatus.filter((i) => i.itemType === 'book').length})
        </button>
      </div>

      {/* Grade de Itens */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Carregando títulos...
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="media-grid">
          {filteredItems.map((item) => (
            <div key={item.itemKey} className="media-grid-item">
              <div
                className="grid-poster-wrap"
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
                {renderBadge(item.itemType)}
                <img src={item.posterUrl} alt={item.title} loading="lazy" />
              </div>

              <div className="grid-item-info">
                <div>
                  <div className="grid-item-title">{item.title}</div>
                  <div className="grid-item-sub">{item.year || 'Catálogo'}</div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '8px',
                    paddingTop: '6px',
                    borderTop: '1px solid var(--border-color)',
                  }}
                >
                  <button
                    type="button"
                    title="Escrever Resenha"
                    onClick={() =>
                      onWriteReview({
                        id: item.itemId,
                        type: item.itemType,
                        title: item.title,
                        poster: item.posterUrl,
                        year: item.year,
                      })
                    }
                    style={{ color: 'var(--accent-pink)', padding: '4px' }}
                  >
                    <Edit3 size={15} />
                  </button>

                  <select
                    value={item.status}
                    onChange={(e) => handleStatusChange(item, e.target.value as ListStatus)}
                    style={{
                      fontSize: '0.72rem',
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      borderRadius: '4px',
                      padding: '2px 4px',
                    }}
                    aria-label="Mudar status da lista"
                  >
                    <option value="want">Quero</option>
                    <option value="in_progress">Em curso</option>
                    <option value="completed">Concluído</option>
                  </select>

                  <button
                    type="button"
                    title="Remover da lista"
                    onClick={() => handleRemove(item.itemKey)}
                    style={{ color: 'var(--text-muted)', padding: '4px' }}
                  >
                    <Trash2 size={15} />
                  </button>
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
          <Bookmark size={32} color="var(--text-muted)" style={{ margin: '0 auto 10px' }} />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px' }}>
            Nenhum título em "{LIST_STATUS_LABELS[activeStatus].label}"
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Explore o catálogo do TMDB ou Open Library para salvar livros e filmes na sua lista.
          </p>
          <button
            type="button"
            className="btn-secondary"
            onClick={onGoToSearch}
            style={{
              padding: '8px 18px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.88rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Explorar Títulos</span>
            <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
