import React from 'react';

export const TmdbFooter: React.FC = () => {
  return (
    <footer className="tmdb-footer">
      <div className="tmdb-footer-content">
        <div style={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
          Cinebook
        </div>

        <p style={{ maxWidth: '480px', lineHeight: 1.5, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          A sua rede social para descobrir, organizar e resenhar filmes, séries e livros com a comunidade.
        </p>

        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
          Cinebook © {new Date().getFullYear()} — Feito para quem ama histórias e boas leituras.
        </div>
      </div>
    </footer>
  );
};
