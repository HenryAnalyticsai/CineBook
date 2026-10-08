import React from 'react';
import { Film, BookOpen, Moon, Sun, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onOpenAuth: () => void;
  onGoToProfile: () => void;
  theme: 'auto' | 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenInstall?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAuth,
  onGoToProfile,
  theme,
  onToggleTheme,
  onOpenInstall,
}) => {
  const { user, profile } = useAuth();

  return (
    <header className="site-header">
      <div className="header-content">
        <a href="#" className="brand-logo" onClick={(e) => { e.preventDefault(); window.location.hash = ''; }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: 'var(--accent-pink)' }}>
            <Film size={22} />
            <BookOpen size={20} />
          </span>
          <span className="brand-gradient">Cinebook</span>
        </a>

        <div className="header-actions">
          {/* Botão Baixar App */}
          {onOpenInstall && (
            <button
              type="button"
              className="btn-install-header"
              onClick={onOpenInstall}
              title="Baixar ou Instalar o Aplicativo Cinebook"
              aria-label="Baixar o App Cinebook"
            >
              <Download size={15} />
              <span className="install-label">Baixar App</span>
            </button>
          )}

          {/* Alternar Tema */}
          <button
            type="button"
            className="icon-btn"
            title="Alternar Tema Claro / Escuro"
            aria-label="Alternar Tema"
            onClick={onToggleTheme}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Perfil ou Entrar */}
          {user ? (
            <button
              type="button"
              onClick={onGoToProfile}
              aria-label="Meu Perfil"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 8px 4px 4px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-color)',
              }}
            >
              <img
                src={profile?.photoURL || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + user.uid}
                alt={profile?.displayName || 'Perfil'}
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: 'var(--radius-full)',
                  objectFit: 'cover',
                }}
              />
              <span
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  maxWidth: '90px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {profile?.displayName?.split(' ')[0] || 'Perfil'}
              </span>
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary"
              onClick={onOpenAuth}
              style={{
                padding: '7px 14px',
                fontSize: '0.85rem',
                borderRadius: 'var(--radius-full)',
                fontWeight: 700,
              }}
            >
              Entrar
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
