import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { BottomNav, NavTab } from './components/BottomNav';
import { FeedView } from './components/FeedView';
import { SearchView } from './components/SearchView';
import { ListsView } from './components/ListsView';
import { ProfileView } from './components/ProfileView';
import { MediaDetailModal } from './components/MediaDetailModal';
import { CreatePostModal } from './components/CreatePostModal';
import { AuthModal } from './components/AuthModal';
import { TmdbFooter } from './components/TmdbFooter';
import { MediaType } from './types/cinebook';

function CinebookApp() {
  const { user } = useAuth();

  // Navigation and Views
  const [currentTab, setCurrentTab] = useState<NavTab>('feed');
  const [viewingProfileUid, setViewingProfileUid] = useState<string | null>(null);

  // Modals
  const [selectedMedia, setSelectedMedia] = useState<any | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createInitialMedia, setCreateInitialMedia] = useState<any | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Dark/Light Theme
  const [theme, setTheme] = useState<'auto' | 'dark' | 'light'>('auto');

  useEffect(() => {
    // Check saved theme or system preference
    const saved = localStorage.getItem('cinebook_theme') as 'auto' | 'dark' | 'light';
    if (saved) {
      setTheme(saved);
      applyTheme(saved);
    }
  }, []);

  const applyTheme = (t: 'auto' | 'dark' | 'light') => {
    document.body.classList.remove('dark', 'light');
    if (t === 'dark') {
      document.body.classList.add('dark');
    } else if (t === 'light') {
      document.body.classList.add('light');
    }
  };

  const handleToggleTheme = () => {
    const next = theme === 'auto' ? 'dark' : theme === 'dark' ? 'light' : 'auto';
    setTheme(next);
    localStorage.setItem('cinebook_theme', next);
    applyTheme(next);
  };

  const handleSelectTab = (tab: NavTab) => {
    if (tab === 'create') {
      if (!user) {
        setShowAuthModal(true);
      } else {
        setCreateInitialMedia(null);
        setShowCreateModal(true);
      }
      return;
    }

    if (tab === 'profile') {
      setViewingProfileUid(null); // Clear viewing another profile to show own
    }

    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewAuthorProfile = (authorId: string) => {
    setViewingProfileUid(authorId);
    setCurrentTab('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleWriteReviewForMedia = (item: any) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setCreateInitialMedia(item);
    setShowCreateModal(true);
  };

  return (
    <div className="app-wrapper">
      {/* Header Fixo */}
      <Header
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenAuth={() => setShowAuthModal(true)}
        onGoToProfile={() => {
          setViewingProfileUid(null);
          setCurrentTab('profile');
        }}
      />

      {/* Conteúdo Principal */}
      <main className="main-container">
        {currentTab === 'feed' && (
          <FeedView
            onOpenMediaModal={(media) => setSelectedMedia(media)}
            onViewAuthorProfile={handleViewAuthorProfile}
            onOpenCreateModal={() => {
              if (!user) setShowAuthModal(true);
              else {
                setCreateInitialMedia(null);
                setShowCreateModal(true);
              }
            }}
            onOpenAuth={() => setShowAuthModal(true)}
          />
        )}

        {currentTab === 'search' && (
          <SearchView
            onOpenMediaModal={(media) => setSelectedMedia(media)}
            onViewAuthorProfile={handleViewAuthorProfile}
            onOpenAuth={() => setShowAuthModal(true)}
          />
        )}

        {currentTab === 'lists' && (
          <ListsView
            onOpenMediaModal={(media) => setSelectedMedia(media)}
            onWriteReview={handleWriteReviewForMedia}
            onGoToSearch={() => setCurrentTab('search')}
            onOpenAuth={() => setShowAuthModal(true)}
          />
        )}

        {currentTab === 'profile' && (
          <ProfileView
            targetUserId={viewingProfileUid}
            onBackToFeed={() => {
              setViewingProfileUid(null);
              setCurrentTab('feed');
            }}
            onOpenMediaModal={(media) => setSelectedMedia(media)}
            onViewAuthorProfile={handleViewAuthorProfile}
            onOpenAuth={() => setShowAuthModal(true)}
          />
        )}
      </main>

      {/* Rodapé com Atribuição TMDB */}
      <TmdbFooter />

      {/* Navegação Inferior (Mobile First) */}
      <BottomNav currentTab={currentTab} onSelectTab={handleSelectTab} />

      {/* Modal de Detalhes da Obra (Salvar na Lista / Resenhar) */}
      {selectedMedia && (
        <MediaDetailModal
          item={selectedMedia}
          onClose={() => setSelectedMedia(null)}
          onWriteReview={handleWriteReviewForMedia}
          onOpenAuth={() => setShowAuthModal(true)}
        />
      )}

      {/* Modal de Criação de Resenha */}
      {showCreateModal && (
        <CreatePostModal
          initialMedia={createInitialMedia}
          onClose={() => {
            setShowCreateModal(false);
            setCreateInitialMedia(null);
          }}
          onPostCreated={() => {
            setCurrentTab('feed');
          }}
          onOpenAuth={() => setShowAuthModal(true)}
        />
      )}

      {/* Modal de Autenticação (Google e Celular) */}
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CinebookApp />
    </AuthProvider>
  );
}
