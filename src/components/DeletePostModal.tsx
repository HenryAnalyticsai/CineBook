import React from 'react';
import { X, Trash2, AlertTriangle, Star, Loader2 } from 'lucide-react';
import { Post } from '../types/cinebook';

interface DeletePostModalProps {
  isOpen: boolean;
  post: Post;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
  error: string | null;
}

export const DeletePostModal: React.FC<DeletePostModalProps> = ({
  isOpen,
  post,
  onClose,
  onConfirm,
  isDeleting,
  error,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={isDeleting ? undefined : onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      <div
        className="modal-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '440px', textAlign: 'center' }}
      >
        {!isDeleting && (
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Fechar modal de exclusão"
          >
            <X size={20} />
          </button>
        )}

        {/* Ícone de Aviso */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(239, 68, 68, 0.12)',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <Trash2 size={30} />
        </div>

        <h2 id="delete-modal-title" className="modal-title" style={{ fontSize: '1.25rem', marginBottom: '8px' }}>
          Excluir esta publicação?
        </h2>

        <p className="modal-desc" style={{ marginBottom: '16px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
          Esta ação é irreversível. Sua resenha sobre <strong>"{post.itemTitle}"</strong> e todas as curtidas serão removidas permanentemente do Cinebook.
        </p>

        {/* Prévia da Publicação a ser Excluída */}
        <div
          style={{
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '12px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textAlign: 'left',
          }}
        >
          <img
            src={
              post.itemPoster ||
              'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=100&h=150&fit=crop'
            }
            alt={post.itemTitle}
            style={{
              width: '42px',
              height: '58px',
              borderRadius: '4px',
              objectFit: 'cover',
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: '0.88rem',
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {post.itemTitle}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '2px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={12}
                    fill={s <= post.rating ? 'var(--accent-gold)' : 'none'}
                    color={s <= post.rating ? 'var(--accent-gold)' : 'var(--text-muted)'}
                  />
                ))}
              </div>
              {post.hasSpoiler && (
                <span className="spoiler-badge-tiny">
                  <AlertTriangle size={10} /> Spoiler
                </span>
              )}
            </div>

            <p
              style={{
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                margin: 0,
              }}
            >
              "{post.text}"
            </p>
          </div>
        </div>

        {error && (
          <div
            className="alert-box alert-error"
            style={{ marginBottom: '16px', fontSize: '0.82rem', textAlign: 'left' }}
            role="alert"
          >
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <div>{error}</div>
          </div>
        )}

        {/* Botões de Ação */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            style={{
              width: '100%',
              padding: '12px',
              background: '#ef4444',
              color: '#ffffff',
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
              fontSize: '0.94rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.25)',
            }}
          >
            {isDeleting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Excluindo publicação...
              </>
            ) : (
              <>
                <Trash2 size={16} />
                Sim, Excluir Publicação
              </>
            )}
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={isDeleting}
            style={{
              width: '100%',
              padding: '11px',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              fontSize: '0.92rem',
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
