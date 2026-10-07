import React, { useState, useEffect } from 'react';
import { Heart, Star, Bookmark, Trash2, Film, Tv, BookOpen } from 'lucide-react';
import { Post, MediaType } from '../types/cinebook';
import { useAuth } from '../context/AuthContext';
import { subscribePostLike, togglePostLike, deletePost } from '../services/firestoreService';

interface PostCardProps {
  post: Post;
  onOpenMediaModal: (item: {
    id: string;
    type: MediaType;
    title: string;
    poster: string | null;
    year: string;
  }) => void;
  onViewAuthorProfile: (authorId: string) => void;
  onOpenAuth: () => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onOpenMediaModal,
  onViewAuthorProfile,
  onOpenAuth,
}) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [isLikePending, setIsLikePending] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Sync like count from post updates
  useEffect(() => {
    setLikeCount(post.likeCount || 0);
  }, [post.likeCount]);

  // Listen to current user's like state for this post
  useEffect(() => {
    if (!user) {
      setIsLiked(false);
      return;
    }
    const unsub = subscribePostLike(post.id, user.uid, (liked) => {
      setIsLiked(liked);
    });
    return () => unsub();
  }, [post.id, user]);

  const handleToggleLike = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    if (isLikePending) return;

    setIsLikePending(true);
    // Optimistic UI
    const nextState = !isLiked;
    setIsLiked(nextState);
    setLikeCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));

    try {
      await togglePostLike(post.id, user.uid, isLiked);
    } catch (err) {
      // Revert on error
      setIsLiked(!nextState);
      setLikeCount((prev) => (nextState ? Math.max(0, prev - 1) : prev + 1));
      console.error('Falha ao curtir resenha:', err);
    } finally {
      setIsLikePending(false);
    }
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deletePost(post.id);
    } catch (err: any) {
      console.error('Erro ao excluir post:', err);
      setDeleteError('Não foi possível excluir a publicação. Verifique suas permissões.');
      setIsDeleting(false);
    }
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffHours < 1) return 'Agora';
    if (diffHours < 24) return `${diffHours}h atrás`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d atrás`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const renderBadge = (type: MediaType) => {
    switch (type) {
      case 'movie':
        return (
          <span className="media-tag-badge badge-movie">
            <Film size={12} /> Filme
          </span>
        );
      case 'series':
        return (
          <span className="media-tag-badge badge-series">
            <Tv size={12} /> Série
          </span>
        );
      case 'book':
        return (
          <span className="media-tag-badge badge-book">
            <BookOpen size={12} /> Livro
          </span>
        );
    }
  };

  return (
    <article className="post-card">
      {/* Cabeçalho do Post estilo Instagram */}
      <div className="post-header">
        <button
          type="button"
          className="author-info"
          onClick={() => onViewAuthorProfile(post.authorId)}
          aria-label={`Ver perfil de ${post.authorName}`}
        >
          <img
            src={post.authorPhoto || `https://api.dicebear.com/7.x/bottts/svg?seed=${post.authorId}`}
            alt={post.authorName}
            className="author-avatar"
          />
          <div>
            <div className="author-name">{post.authorName}</div>
            <div className="post-time">{formatTime(post.createdAt)}</div>
          </div>
        </button>

        {user && user.uid === post.authorId && (
          <button
            type="button"
            className="icon-btn"
            onClick={() => setShowConfirmDelete((prev) => !prev)}
            title="Excluir publicação"
            aria-label="Excluir publicação"
            style={{ width: '34px', height: '34px', color: '#ef4444' }}
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* Caixa de Confirmação de Exclusão (sem depender de window.confirm) */}
      {showConfirmDelete && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            borderTop: '1px solid rgba(239, 68, 68, 0.25)',
            borderBottom: '1px solid rgba(239, 68, 68, 0.25)',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#ef4444' }}>
            Excluir esta publicação definitivamente?
          </span>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              style={{
                padding: '5px 12px',
                background: '#ef4444',
                color: '#fff',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                fontWeight: 700,
              }}
            >
              {isDeleting ? 'Excluindo...' : 'Sim, excluir'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowConfirmDelete(false);
                setDeleteError(null);
              }}
              disabled={isDeleting}
              style={{
                padding: '5px 10px',
                background: 'var(--bg-subtle)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {deleteError && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            color: '#ef4444',
            padding: '8px 16px',
            fontSize: '0.8rem',
            fontWeight: 600,
          }}
        >
          {deleteError}
        </div>
      )}

      {/* Pôster / Capa em destaque */}
      <div
        className="post-media-stage"
        onClick={() =>
          onOpenMediaModal({
            id: post.itemId,
            type: post.itemType,
            title: post.itemTitle,
            poster: post.itemPoster,
            year: post.itemYear,
          })
        }
      >
        {renderBadge(post.itemType)}
        <img
          src={
            post.itemPoster ||
            'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&h=800&fit=crop'
          }
          alt={post.itemTitle}
          className="post-poster-img"
          loading="lazy"
        />
      </div>

      {/* Barra de Ações (Curtir, Salvar na Lista) */}
      <div className="post-actions">
        <div className="post-actions-left">
          <button
            type="button"
            className={`action-btn ${isLiked ? 'liked' : ''}`}
            onClick={handleToggleLike}
            aria-label={isLiked ? 'Descurtir resenha' : 'Curtir resenha'}
          >
            <Heart
              size={24}
              className="like-heart-anim"
              fill={isLiked ? 'var(--accent-pink)' : 'none'}
              color={isLiked ? 'var(--accent-pink)' : 'currentColor'}
            />
          </button>

          <button
            type="button"
            className="action-btn"
            onClick={() =>
              onOpenMediaModal({
                id: post.itemId,
                type: post.itemType,
                title: post.itemTitle,
                poster: post.itemPoster,
                year: post.itemYear,
              })
            }
            title="Salvar nas Minhas Listas"
          >
            <Bookmark size={22} />
          </button>
        </div>
      </div>

      {/* Corpo da Resenha */}
      <div className="post-body">
        <div className="likes-counter">
          {likeCount === 1 ? '1 curtida' : `${likeCount} curtidas`}
        </div>

        <div className="media-title-row">
          <span className="media-title-highlight">
            {post.itemTitle} {post.itemYear ? `(${post.itemYear})` : ''}
          </span>
          <div className="stars-rating" aria-label={`Avaliação: ${post.rating} de 5 estrelas`}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={16}
                fill={star <= post.rating ? 'var(--accent-gold)' : 'none'}
                color={star <= post.rating ? 'var(--accent-gold)' : 'var(--text-muted)'}
              />
            ))}
          </div>
        </div>

        <p className="review-text">{post.text}</p>
      </div>
    </article>
  );
};
