import React from 'react';
import { Film, BookOpen, Moon, Sun, Download, Users, Home, Search, Bookmark, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onOpenAuth: () => void;
  onGoToProfile: () => void;
  theme: 'auto' | 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenInstall?: () => void;
  onOpenWatchedWithFollowers?: () => void;
  currentTab?: string;
  onSelectTab?: (tab: any) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAuth,
  onGoToProfile,
  theme,
  onToggleTheme,
  onOpenInstall,
  onOpenWatchedWithFollowers,
  currentTab,
  onSelectTab,
}) => {
  const { user, profile } = useAuth();

  return (
    <header className="site-header">
      <div className="header-content">
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <a
            href="#"
            className="brand-logo"
            onClick={(e) => {
              e.preventDefault();
              if (onSelectTab) onSelectTab('feed');
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: 'var(--accent-pink)' }}>
              <Film size={22} />
              <BookOpen size={20} />
            </span>
            <span className="brand-gradient">Cinebook</span>
          </a>

          {/* Links de Navegação Desktop */}
          {onSelectTab && (
            <nav className="desktop-header-nav" aria-label="Navegação Superior">
              <button
                type="button"
                className={`desktop-nav-link ${currentTab === 'feed' ? 'active' : ''}`}
                onClick={() => onSelectTab('feed')}
              >
                <Home size={16} />
                <span>Início</span>
              </button>
              <button
                type="button"
                className={`desktop-nav-link ${currentTab === 'search' ? 'active' : ''}`}
                onClick={() => onSelectTab('search')}
              >
                <Search size={16} />
                <span>Buscar</span>
              </button>
              <button
                type="button"
                className={`desktop-nav-link ${currentTab === 'lists' ? 'active' : ''}`}
                onClick={() => onSelectTab('lists')}
              >
                <Bookmark size={16} />
                <span>Listas</span>
              </button>
              {onOpenWatchedWithFollowers && (
                <button
                  type="button"
                  className="desktop-nav-link desktop-nav-cowatch"
                  onClick={onOpenWatchedWithFollowers}
                  title="Ver filmes que assisti com meus seguidores"
                >
                  <Users size={16} />
                  <span>Com Seguidores</span>
                </button>
              )}
            </nav>
          )}
        </div>

        <div className="header-actions">
          {/* Botão de Atalho para Filmes com Seguidores (Mobile / Tablet) */}
          {onOpenWatchedWithFollowers && (
            <button
              type="button"
              className="btn-cowatch-header"
              onClick={onOpenWatchedWithFollowers}
              title="Filmes assistidos com meus seguidores"
              aria-label="Filmes com Seguidores"
            >
              <Users size={17} />
              <span className="cowatch-label">Seguidores</span>
            </button>
          )}

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
              className="header-profile-pill"
            >
              <img
                src={profile?.photoURL || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + user.uid}
                alt={profile?.displayName || 'Perfil'}
                className="header-profile-avatar"
              />
              <span className="header-profile-name">
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
                whiteSpace: 'nowrap',
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
