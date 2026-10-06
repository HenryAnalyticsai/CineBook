import React, { useState, useEffect } from 'react';
import { X, Star, Bookmark, Check, Edit3, Trash2, Film, Tv, BookOpen } from 'lucide-react';
import { MediaType, ListStatus, LIST_STATUS_LABELS, ListItem } from '../types/cinebook';
import { useAuth } from '../context/AuthContext';
import { subscribeUserLists, setUserListItem, removeUserListItem } from '../services/firestoreService';

interface MediaDetailModalProps {
  item: {
    id: string;
    type: MediaType;
    title: string;
    poster: string | null;
    year: string;
    overview?: string;
    author?: string;
  } | null;
  onClose: () => void;
  onWriteReview: (item: any) => void;
  onOpenAuth: () => void;
}

export const MediaDetailModal: React.FC<MediaDetailModalProps> = ({
  item,
  onClose,
  onWriteReview,
  onOpenAuth,
}) => {
  const { user } = useAuth();
  const [currentStatus, setCurrentStatus] = useState<ListStatus | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);

  const itemKey = item ? `${item.type}_${item.id}` : '';

  useEffect(() => {
    if (!user || !item) {
      setCurrentStatus(null);
      return;
    }
    const unsub = subscribeUserLists(user.uid, (lists) => {
      const found = lists.find((l) => l.itemKey === itemKey);
      setCurrentStatus(found ? found.status : null);
    });
    return () => unsub();
  }, [user, itemKey, item]);

  if (!item) return null;

  const handleSetStatus = async (status: ListStatus) => {
    if (!user) {
      onOpenAuth();
      return;
    }
    setSavingStatus(true);
    try {
      const listItem: ListItem = {
        itemKey,
        itemId: item.id,
        itemType: item.type,
        title: item.title,
        posterUrl:
          item.poster ||
          'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&h=800&fit=crop',
        year: item.year || '',
        status,
        updatedAt: new Date().toISOString(),
      };
      await setUserListItem(user.uid, listItem);
      setCurrentStatus(status);
    } catch (err) {
      console.error('Erro ao atualizar lista:', err);
    } finally {
      setSavingStatus(false);
    }
  };

  const handleRemoveFromList = async () => {
    if (!user) return;
    setSavingStatus(true);
    try {
      await removeUserListItem(user.uid, itemKey);
      setCurrentStatus(null);
    } catch (err) {
      console.error('Erro ao remover da lista:', err);
    } finally {
      setSavingStatus(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Fechar detalhes"
        >
          <X size={22} />
        </button>

        {/* Informações da Obra */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '18px' }}>
          <img
            src={
              item.poster ||
              'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=450&fit=crop'
            }
            alt={item.title}
            style={{
              width: '100px',
              height: '145px',
              borderRadius: 'var(--radius-md)',
              objectFit: 'cover',
              boxShadow: 'var(--shadow-md)',
              flexShrink: 0,
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--accent-pink)',
                textTransform: 'uppercase',
                marginBottom: '4px',
              }}
            >
              {item.type === 'movie' && (
                <>
                  <Film size={12} /> Filme
                </>
              )}
              {item.type === 'series' && (
                <>
                  <Tv size={12} /> Série de TV
                </>
              )}
              {item.type === 'book' && (
                <>
                  <BookOpen size={12} /> Livro
                </>
              )}
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, lineHeight: 1.25, marginBottom: '4px' }}>
              {item.title}
            </h2>

            <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              {item.author ? `Autor: ${item.author}` : ''}
              {item.year ? ` • ${item.year}` : ''}
            </div>
          </div>
        </div>

        {/* Sinopse / Resumo */}
        {item.overview && (
          <p
            style={{
              fontSize: '0.88rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              marginBottom: '20px',
              background: 'var(--bg-subtle)',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
            }}
          >
            {item.overview}
          </p>
        )}

        {/* Seção Adicionar à Lista */}
        <div style={{ marginBottom: '22px' }}>
          <div
            style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Bookmark size={16} />
            <span>Adicionar a uma das suas listas:</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(['want', 'in_progress', 'completed'] as ListStatus[]).map((status) => {
              const isActive = currentStatus === status;
              const verb = LIST_STATUS_LABELS[status].verbMedia[item.type];
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => handleSetStatus(status)}
                  disabled={savingStatus}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '11px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: `1.5px solid ${isActive ? 'var(--accent-pink)' : 'var(--border-color)'}`,
                    background: isActive ? 'rgba(225, 29, 72, 0.08)' : 'var(--bg-surface)',
                    color: isActive ? 'var(--accent-pink)' : 'var(--text-primary)',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.92rem',
                    textAlign: 'left',
                  }}
                >
                  <span>{verb}</span>
                  {isActive && <Check size={18} color="var(--accent-pink)" />}
                </button>
              );
            })}

            {currentStatus && (
              <button
                type="button"
                onClick={handleRemoveFromList}
                style={{
                  alignSelf: 'flex-start',
                  fontSize: '0.8rem',
                  color: '#ef4444',
                  marginTop: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Trash2 size={14} /> Remover da minha lista
              </button>
            )}
          </div>
        </div>

        {/* Botão de Escrever Resenha */}
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            onClose();
            onWriteReview(item);
          }}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 700,
            fontSize: '0.96rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <Edit3 size={18} />
          Escrever Resenha com Estrelas
        </button>
      </div>
    </div>
  );
};
