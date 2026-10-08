import React, { useState, useRef } from 'react';
import { X, Star, Film, Tv, BookOpen, Search, Loader2, AlertTriangle } from 'lucide-react';
import { MediaType, MediaItem } from '../types/cinebook';
import { useAuth } from '../context/AuthContext';
import { createPost } from '../services/firestoreService';
import { searchAllMedia, POPULAR_BOOKS } from '../services/mediaService';

interface CreatePostModalProps {
  initialMedia?: {
    id: string;
    type: MediaType;
    title: string;
    poster: string | null;
    year: string;
  } | null;
  onClose: () => void;
  onPostCreated: () => void;
  onOpenAuth: () => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  initialMedia,
  onClose,
  onPostCreated,
  onOpenAuth,
}) => {
  const { user, profile } = useAuth();
  const [selectedMedia, setSelectedMedia] = useState<any>(initialMedia || null);
  const [rating, setRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState('');
  const [hasSpoiler, setHasSpoiler] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const debounceTimerRef = useRef<any>(null);
  const searchRequestIdRef = useRef<number>(0);

  const handleSearchMedia = (q: string) => {
    setSearchQuery(q);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmed = q.trim();
    if (!trimmed) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const reqId = ++searchRequestIdRef.current;

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await searchAllMedia(trimmed);
        if (reqId === searchRequestIdRef.current) {
          setSearchResults(results.slice(0, 8));
        }
      } catch (err) {
        console.error('Erro ao buscar mídias para resenha:', err);
      } finally {
        if (reqId === searchRequestIdRef.current) {
          setIsSearching(false);
        }
      }
    }, 280);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }

    if (!selectedMedia) {
      setFormError('Selecione um filme, série ou livro para resenhar.');
      return;
    }

    if (rating < 1 || rating > 5) {
      setFormError('Escolha uma nota entre 1 e 5 estrelas.');
      return;
    }

    const trimmed = reviewText.trim();
    if (!trimmed) {
      setFormError('Escreva sua opinião sobre a obra.');
      return;
    }

    if (trimmed.length > 1000) {
      setFormError('A resenha não pode ultrapassar 1.000 caracteres.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      await createPost({
        authorId: user.uid,
        authorName: profile?.displayName || 'Usuário Cinebook',
        authorPhoto: profile?.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
        itemId: selectedMedia.id,
        itemType: selectedMedia.type,
        itemTitle: selectedMedia.title,
        itemPoster:
          selectedMedia.poster ||
          'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&h=800&fit=crop',
        itemYear: selectedMedia.year || '',
        rating,
        text: trimmed,
        hasSpoiler,
        createdAt: new Date().toISOString(),
      });

      onPostCreated();
      onClose();
    } catch (err: any) {
      console.error('Falha ao publicar resenha:', err);
      setFormError(err.message || 'Erro ao publicar. Verifique sua conexão.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Fechar"
        >
          <X size={22} />
        </button>

        <h2 className="modal-title">Nova Resenha</h2>
        <p className="modal-desc">
          Compartilhe suas impressões de filmes, séries ou livros no feed do Cinebook.
        </p>

        {formError && (
          <div className="alert-box alert-error" role="alert">
            {formError}
          </div>
        )}

        {/* Escolha do Título */}
        {!selectedMedia ? (
          <div style={{ marginBottom: '18px' }}>
            <label className="form-label" style={{ marginBottom: '6px', display: 'block' }}>
              Qual obra você assistiu ou leu?
            </label>
            <div className="search-input-box" style={{ marginBottom: '10px' }}>
              <Search size={18} />
              <input
                type="text"
                className="search-input"
                placeholder="Digite o nome do filme, série ou livro..."
                value={searchQuery}
                onChange={(e) => handleSearchMedia(e.target.value)}
              />
            </div>

            {isSearching && (
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', padding: '10px' }}>
                <Loader2 size={18} className="animate-spin" style={{ display: 'inline', marginRight: '6px' }} />
                Buscando...
              </div>
            )}

            {searchResults.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                {searchResults.map((item) => (
                  <button
                    key={`${item.type}_${item.id}`}
                    type="button"
                    onClick={() => {
                      setSelectedMedia(item);
                      setSearchResults([]);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-subtle)',
                      textAlign: 'left',
                    }}
                  >
                    <img
                      src={
                        item.poster ||
                        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100&h=150&fit=crop'
                      }
                      alt={item.title}
                      style={{ width: '34px', height: '48px', objectFit: 'cover', borderRadius: '4px' }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{item.title}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        {item.type === 'book' ? 'Livro' : item.type === 'series' ? 'Série' : 'Filme'} • {item.year}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {searchQuery === '' && (
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Sugestões populares rápidas:
                </div>
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {POPULAR_BOOKS.slice(0, 3).map((book) => (
                    <button
                      key={book.id}
                      type="button"
                      onClick={() => setSelectedMedia(book)}
                      style={{
                        padding: '6px 12px',
                        background: 'var(--bg-subtle)',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      📖 {book.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              marginBottom: '18px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img
                src={
                  selectedMedia.poster ||
                  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=100&h=150&fit=crop'
                }
                alt={selectedMedia.title}
                style={{ width: '40px', height: '56px', objectFit: 'cover', borderRadius: '4px' }}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{selectedMedia.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {selectedMedia.type === 'book' ? 'Livro' : selectedMedia.type === 'series' ? 'Série' : 'Filme'}{' '}
                  {selectedMedia.year ? `(${selectedMedia.year})` : ''}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedMedia(null)}
              style={{ fontSize: '0.78rem', color: 'var(--accent-pink)', fontWeight: 700 }}
            >
              Trocar
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Seletor de Avaliação com Estrelas */}
          <div className="form-group">
            <label className="form-label">Sua Avaliação (1 a 5 estrelas)</label>
            <div style={{ display: 'flex', gap: '8px', padding: '6px 0' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  aria-label={`${star} estrelas`}
                  style={{
                    padding: '6px',
                    borderRadius: 'var(--radius-full)',
                    background: star <= rating ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-subtle)',
                  }}
                >
                  <Star
                    size={28}
                    fill={star <= rating ? 'var(--accent-gold)' : 'none'}
                    color={star <= rating ? 'var(--accent-gold)' : 'var(--text-muted)'}
                  />
                </button>
              ))}
              <span
                style={{
                  alignSelf: 'center',
                  fontWeight: 700,
                  fontSize: '1rem',
                  marginLeft: '8px',
                  color: 'var(--accent-gold)',
                }}
              >
                {rating} de 5
              </span>
            </div>
          </div>

          {/* Campo de Texto da Resenha */}
          <div className="form-group">
            <label className="form-label" htmlFor="review-text">
              Sua Resenha
            </label>
            <textarea
              id="review-text"
              className="form-control"
              placeholder="O que você achou da direção, atuações, enredo ou narrativa? (até 1000 caracteres)"
              maxLength={1000}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              required
            />
            <div className="char-counter">
              <span style={{ color: reviewText.length > 900 ? 'var(--accent-pink)' : 'inherit' }}>
                {reviewText.length}
              </span>{' '}
              / 1000 caracteres
            </div>
          </div>

          {/* Alerta de Spoiler Toggle */}
          <div
            className={`spoiler-toggle-card ${hasSpoiler ? 'active' : ''}`}
            onClick={() => setHasSpoiler(!hasSpoiler)}
            role="checkbox"
            aria-checked={hasSpoiler}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                setHasSpoiler(!hasSpoiler);
              }
            }}
          >
            <div className="spoiler-toggle-left">
              <div className={`spoiler-icon-badge ${hasSpoiler ? 'active' : ''}`}>
                <AlertTriangle size={18} />
              </div>
              <div className="spoiler-toggle-texts">
                <div className="spoiler-toggle-title">
                  Alerta de Spoiler
                  {hasSpoiler && <span className="spoiler-tag-inline">Ativado</span>}
                </div>
                <div className="spoiler-toggle-desc">
                  Oculta a resenha no feed com aviso para quem ainda não assistiu ou leu
                </div>
              </div>
            </div>

            <div className={`switch-pill ${hasSpoiler ? 'checked' : ''}`} aria-hidden="true">
              <span className="switch-knob" />
            </div>
          </div>

          {/* Botão de Envio */}
          <button
            type="submit"
            className="btn-primary"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '13px',
              borderRadius: 'var(--radius-md)',
              fontWeight: 800,
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {submitting ? (
              <>
                <Loader2 size={20} className="animate-spin" /> Publicando no Feed...
              </>
            ) : (
              'Publicar Resenha no Feed'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
