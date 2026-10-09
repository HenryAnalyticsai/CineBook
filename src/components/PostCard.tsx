import React, { useState, useEffect } from 'react';
import {
  Heart,
  Star,
  Bookmark,
  Trash2,
  Film,
  Tv,
  BookOpen,
  AlertTriangle,
  Eye,
  EyeOff,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { Post, MediaType, ADMIN_EMAIL } from '../types/cinebook';
import { useAuth } from '../context/AuthContext';
import { subscribePostLike, togglePostLike, deletePost } from '../services/firestoreService';
import { DeletePostModal } from './DeletePostModal';

interface PostCardProps {
  post: Post;
  index?: number;
  relationType?: 'admin' | 'following' | 'follower' | 'mutual' | 'self' | 'none';
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
  index,
  relationType = 'none',
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
  const [revealedSpoiler, setRevealedSpoiler] = useState(false);

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
    <article
      className="post-card"
      style={index !== undefined ? { animationDelay: `${Math.min(index * 0.08, 0.48)}s` } : undefined}
    >
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
            <div className="author-name-row" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span className="author-name">{post.authorName}</span>
              {/* Badge de ADM */}
              {(post.isAdmin || post.authorEmail?.toLowerCase() === ADMIN_EMAIL.toLowerCase() || relationType === 'admin') && (
                <span className="author-badge-adm" title="Administrador Oficial do Cinebook">
                  <ShieldCheck size={11} /> ADM
                </span>
              )}
              {/* Badges de Relacionamento */}
              {relationType === 'mutual' && (
                <span className="author-badge-rel mutual" title="Vocês se seguem mutuamente">
                  🤝 Conexão mútua
                </span>
              )}
              {relationType === 'follower' && (
                <span className="author-badge-rel follower" title="Este usuário segue você">
                  <Users size={10} /> Te segue
                </span>
              )}
              {relationType === 'following' && (
                <span className="author-badge-rel following" title="Você segue este autor">
                  ⭐ Você segue
                </span>
              )}
              {relationType === 'self' && (
                <span className="author-badge-rel self" title="Sua publicação">
                  ✨ Você
                </span>
              )}
            </div>
            <div className="post-time">{formatTime(post.createdAt)}</div>
          </div>
        </button>

        {user && user.uid === post.authorId && (
          <button
            type="button"
            className="icon-btn"
            onClick={() => setShowConfirmDelete(true)}
            title="Excluir publicação"
            aria-label="Excluir publicação"
            style={{ width: '34px', height: '34px', color: '#ef4444' }}
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* Modal de Confirmação de Exclusão da Publicação */}
      <DeletePostModal
        isOpen={showConfirmDelete}
        post={post}
        onClose={() => {
          setShowConfirmDelete(false);
          setDeleteError(null);
        }}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        error={deleteError}
      />

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
          <div className="media-title-left">
            <span className="media-title-highlight">
              {post.itemTitle} {post.itemYear ? `(${post.itemYear})` : ''}
            </span>
            {post.hasSpoiler && (
              <span className="spoiler-badge" title="Esta resenha contém revelações do enredo">
                <AlertTriangle size={12} /> Alerta de spoiler
              </span>
            )}
          </div>
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

        {/* Exibição condicional com proteção de spoiler */}
        {post.hasSpoiler && !revealedSpoiler ? (
          <div className="spoiler-shield-card">
            <div className="spoiler-shield-main">
              <div className="spoiler-shield-icon-wrap">
                <AlertTriangle size={20} />
              </div>
              <div className="spoiler-shield-content">
                <strong className="spoiler-shield-title">Aviso de Spoiler!</strong>
                <p className="spoiler-shield-text">
                  Esta resenha contém detalhes cruciais ou revelações da trama.
                </p>
              </div>
            </div>
            <button
              type="button"
              className="btn-reveal-spoiler"
              onClick={() => setRevealedSpoiler(true)}
              aria-label="Revelar resenha com spoilers"
            >
              <Eye size={15} /> Ver resenha com spoiler
            </button>
          </div>
        ) : (
          <div className={post.hasSpoiler ? 'spoiler-revealed-box' : undefined}>
            {post.hasSpoiler && (
              <div className="spoiler-revealed-bar">
                <span className="spoiler-revealed-tag">
                  <AlertTriangle size={12} /> Spoilers visíveis
                </span>
                <button
                  type="button"
                  className="btn-hide-spoiler"
                  onClick={() => setRevealedSpoiler(false)}
                  title="Ocultar spoilers novamente"
                >
                  <EyeOff size={13} /> Ocultar
                </button>
              </div>
            )}
            <p className="review-text">{post.text}</p>
          </div>
        )}

        {post.watchedWith && post.watchedWith.length > 0 && (
          <div
            className="post-watched-with-tag"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.78rem',
              color: 'var(--accent-pink)',
              background: 'rgba(225, 29, 72, 0.08)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              marginTop: '8px',
              fontWeight: 600,
            }}
          >
            <Users size={13} />
            <span>Assistido com {post.watchedWith.map((w) => w.name.split(' ')[0]).join(', ')}</span>
          </div>
        )}
      </div>
    </article>
  );
};
