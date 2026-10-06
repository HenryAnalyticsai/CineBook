import React from 'react';
import { Home, Search, PlusCircle, Bookmark, User as UserIcon } from 'lucide-react';

export type NavTab = 'feed' | 'search' | 'create' | 'lists' | 'profile';

interface BottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  return (
    <nav className="bottom-nav" aria-label="Navegação Principal">
      <button
        type="button"
        className={`bottom-nav-item ${currentTab === 'feed' ? 'active' : ''}`}
        onClick={() => onSelectTab('feed')}
        aria-label="Feed Inicial"
      >
        <Home size={22} />
        <span>Início</span>
      </button>

      <button
        type="button"
        className={`bottom-nav-item ${currentTab === 'search' ? 'active' : ''}`}
        onClick={() => onSelectTab('search')}
        aria-label="Buscar Filmes, Séries e Livros"
      >
        <Search size={22} />
        <span>Buscar</span>
      </button>

      <button
        type="button"
        className="bottom-nav-item"
        onClick={() => onSelectTab('create')}
        aria-label="Publicar Nova Resenha"
      >
        <div className="nav-create-pill">
          <PlusCircle size={24} />
        </div>
        <span style={{ marginTop: '2px' }}>Publicar</span>
      </button>

      <button
        type="button"
        className={`bottom-nav-item ${currentTab === 'lists' ? 'active' : ''}`}
        onClick={() => onSelectTab('lists')}
        aria-label="Minhas Listas Salvas"
      >
        <Bookmark size={22} />
        <span>Listas</span>
      </button>

      <button
        type="button"
        className={`bottom-nav-item ${currentTab === 'profile' ? 'active' : ''}`}
        onClick={() => onSelectTab('profile')}
        aria-label="Perfil do Usuário"
      >
        <UserIcon size={22} />
        <span>Perfil</span>
      </button>
    </nav>
  );
};
