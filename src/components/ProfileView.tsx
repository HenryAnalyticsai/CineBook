import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  LogOut,
  UserPlus,
  UserCheck,
  Edit2,
  Bookmark,
  MessageSquare,
  ArrowLeft,
  Trophy,
  Award,
} from 'lucide-react';
import { UserProfile, Post, ListItem, ListStatus, LIST_STATUS_LABELS, MediaType } from '../types/cinebook';
import { useAuth } from '../context/AuthContext';
import {
  getUserProfile,
  subscribeFeedPosts,
  subscribeUserLists,
  subscribeFollowing,
  followUser,
  unfollowUser,
} from '../services/firestoreService';
import { calculateUserAchievements, getTopUnlockedBadge } from '../services/achievementService';
import { AchievementsSection } from './AchievementsSection';
import { PostCard } from './PostCard';

interface ProfileViewProps {
  targetUserId?: string | null;
  onBackToFeed?: () => void;
  onOpenMediaModal: (item: any) => void;
  onViewAuthorProfile: (authorId: string) => void;
  onOpenAuth: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  targetUserId,
  onBackToFeed,
  onOpenMediaModal,
  onViewAuthorProfile,
  onOpenAuth,
}) => {
  const { user, profile: myProfile, logout, updateProfileBio } = useAuth();
  const currentUid = targetUserId || user?.uid;
  const isOwnProfile = user?.uid === currentUid;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [lists, setLists] = useState<ListItem[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followingCount, setFollowingCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'reviews' | 'achievements' | 'want' | 'in_progress' | 'completed'>('reviews');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState('');
  const [loading, setLoading] = useState(true);

  // Gamificação: Conquistas calculadas em tempo real
  const achievements = calculateUserAchievements(posts, lists, followingCount);
  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;
  const topBadge = getTopUnlockedBadge(achievements);

  // Fetch target profile
  useEffect(() => {
    if (!currentUid) {
      setLoading(false);
      return;
    }

    const loadProfile = async () => {
      setLoading(true);
      if (isOwnProfile && myProfile) {
        setProfile(myProfile);
        setBioInput(myProfile.bio || '');
      } else {
        const fetched = await getUserProfile(currentUid);
        if (fetched) {
          setProfile(fetched);
          setBioInput(fetched.bio || '');
        } else {
          // Fallback if profile doesn't exist yet
          const safeName = `Usuário${currentUid.substring(0, 4).toUpperCase()}`;
          setProfile({
            uid: currentUid,
            displayName: safeName,
            photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUid}`,
            bio: 'Membro do Cinebook',
          });
        }
      }
      setLoading(false);
    };

    loadProfile();
  }, [currentUid, isOwnProfile, myProfile]);

  // Subscribe to posts by this user
  useEffect(() => {
    if (!currentUid) return;
    const unsub = subscribeFeedPosts((allPosts) => {
      setPosts(allPosts.filter((p) => p.authorId === currentUid));
    });
    return () => unsub();
  }, [currentUid]);

  // Subscribe to lists by this user
  useEffect(() => {
    if (!currentUid) return;
    const unsub = subscribeUserLists(currentUid, (userLists) => {
      setLists(userLists);
    });
    return () => unsub();
  }, [currentUid]);

  // Check if current logged-in user follows this profile
  useEffect(() => {
    if (!user || isOwnProfile || !currentUid) {
      setIsFollowing(false);
      return;
    }
    const unsub = subscribeFollowing(user.uid, (followingList) => {
      setIsFollowing(followingList.some((f) => f.targetUid === currentUid));
    });
    return () => unsub();
  }, [user, currentUid, isOwnProfile]);

  // Track following count of this profile
  useEffect(() => {
    if (!currentUid) return;
    const unsub = subscribeFollowing(currentUid, (followingList) => {
      setFollowingCount(followingList.length);
    });
    return () => unsub();
  }, [currentUid]);

  const handleToggleFollow = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    if (!profile) return;

    try {
      if (isFollowing) {
        await unfollowUser(user.uid, profile.uid);
      } else {
        await followUser(user.uid, profile.uid, profile.displayName, profile.photoURL);
      }
    } catch (err) {
      console.error('Erro ao seguir/deixar de seguir:', err);
    }
  };

  const handleSaveBio = async () => {
    await updateProfileBio(bioInput);
    setIsEditingBio(false);
  };

  if (!currentUid && !user) {
    return (
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '40px 20px',
          textAlign: 'center',
          marginTop: '20px',
        }}
      >
        <UserIcon size={40} color="var(--accent-pink)" style={{ margin: '0 auto 12px' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>
          Perfil no Cinebook
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Faça login para acompanhar suas resenhas, seguidores e listas de filmes e livros.
        </p>
        <button
          type="button"
          className="btn-primary"
          onClick={onOpenAuth}
          style={{ padding: '10px 24px', borderRadius: 'var(--radius-full)', fontWeight: 700 }}
        >
          Entrar ou Criar Perfil
        </button>
      </div>
    );
  }

  const listItemsForStatus = (status: ListStatus) => lists.filter((i) => i.status === status);

  return (
    <div>
      {/* Botão Voltar se estiver visitando perfil de outro usuário */}
      {!isOwnProfile && onBackToFeed && (
        <button
          type="button"
          onClick={onBackToFeed}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.88rem',
            color: 'var(--accent-pink)',
            fontWeight: 700,
            marginBottom: '14px',
          }}
        >
          <ArrowLeft size={18} /> Voltar ao feed
        </button>
      )}

      {/* Card de Perfil estilo Instagram */}
      <section className="profile-card">
        <div className="profile-header-row">
          <img
            src={
              profile?.photoURL ||
              `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUid}`
            }
            alt={profile?.displayName || 'Avatar'}
            className="profile-avatar-large"
          />

          <div className="profile-stats-group">
            <div className="stat-box">
              <span className="stat-number">{posts.length}</span>
              <span className="stat-label">Resenhas</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">{followingCount}</span>
              <span className="stat-label">Seguindo</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">{lists.length}</span>
              <span className="stat-label">Salvos</span>
            </div>
            <div
              className="stat-box"
              onClick={() => setActiveTab('achievements')}
              style={{ cursor: 'pointer' }}
              title="Ver conquistas do usuário"
            >
              <span className="stat-number" style={{ color: 'var(--accent-gold)' }}>
                {unlockedCount}
              </span>
              <span className="stat-label">Selos</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '4px' }}>
          <h1 className="profile-name" style={{ margin: 0 }}>
            {profile?.displayName || 'Usuário'}
          </h1>
          {topBadge && (
            <button
              type="button"
              className="profile-top-badge"
              onClick={() => setActiveTab('achievements')}
              title={`Selo principal: ${topBadge.title} - ${topBadge.description}`}
            >
              <span>{topBadge.icon}</span>
              <span>{topBadge.title}</span>
            </button>
          )}
        </div>

        {isEditingBio ? (
          <div style={{ marginBottom: '14px' }}>
            <textarea
              className="form-control"
              value={bioInput}
              onChange={(e) => setBioInput(e.target.value)}
              placeholder="Conte um pouco sobre suas preferências culturais..."
              maxLength={300}
              style={{ minHeight: '80px', marginBottom: '8px' }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsEditingBio(false)}
                style={{ padding: '6px 14px', fontSize: '0.82rem', borderRadius: 'var(--radius-sm)' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleSaveBio}
                style={{ padding: '6px 14px', fontSize: '0.82rem', borderRadius: 'var(--radius-sm)' }}
              >
                Salvar Bio
              </button>
            </div>
          </div>
        ) : (
          <p className="profile-bio">
            {profile?.bio || 'Sem biografia informada.'}
          </p>
        )}

        {/* Botões de Ação do Perfil */}
        {isOwnProfile ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn-secondary profile-action-btn"
              onClick={() => setIsEditingBio(true)}
            >
              <Edit2 size={16} />
              <span>Editar Bio</span>
            </button>
            <button
              type="button"
              className="btn-outline-danger profile-action-btn"
              onClick={logout}
              style={{ maxWidth: '120px' }}
              title="Sair da conta"
            >
              <LogOut size={16} />
              <span>Sair</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            className={`profile-action-btn ${isFollowing ? 'btn-secondary' : 'btn-primary'}`}
            onClick={handleToggleFollow}
          >
            {isFollowing ? (
              <>
                <UserCheck size={18} />
                <span>Seguindo</span>
              </>
            ) : (
              <>
                <UserPlus size={18} />
                <span>Seguir</span>
              </>
            )}
          </button>
        )}
      </section>

      {/* Abas do Perfil: Resenhas, Conquistas e as Três Listas */}
      <div className="feed-tabs" style={{ marginBottom: '16px' }}>
        <button
          type="button"
          className={`feed-tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
          style={{ fontSize: '0.82rem', padding: '10px 4px' }}
        >
          <MessageSquare size={15} />
          <span>Resenhas ({posts.length})</span>
        </button>

        <button
          type="button"
          className={`feed-tab-btn ${activeTab === 'achievements' ? 'active' : ''}`}
          onClick={() => setActiveTab('achievements')}
          style={{ fontSize: '0.82rem', padding: '10px 4px' }}
        >
          <Trophy size={15} color={activeTab === 'achievements' ? 'var(--accent-gold)' : 'currentColor'} />
          <span>Conquistas ({unlockedCount})</span>
        </button>

        <button
          type="button"
          className={`feed-tab-btn ${activeTab === 'want' ? 'active' : ''}`}
          onClick={() => setActiveTab('want')}
          style={{ fontSize: '0.82rem', padding: '10px 4px' }}
        >
          <Bookmark size={15} />
          <span>Quero ({listItemsForStatus('want').length})</span>
        </button>

        <button
          type="button"
          className={`feed-tab-btn ${activeTab === 'in_progress' ? 'active' : ''}`}
          onClick={() => setActiveTab('in_progress')}
          style={{ fontSize: '0.82rem', padding: '10px 4px' }}
        >
          <span>Em curso ({listItemsForStatus('in_progress').length})</span>
        </button>

        <button
          type="button"
          className={`feed-tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
          style={{ fontSize: '0.82rem', padding: '10px 4px' }}
        >
          <span>Concluído ({listItemsForStatus('completed').length})</span>
        </button>
      </div>

      {/* Conteúdo da Aba Ativa */}
      {activeTab === 'achievements' ? (
        <AchievementsSection
          achievements={achievements}
          userName={profile?.displayName || 'Usuário'}
        />
      ) : activeTab === 'reviews' ? (
        posts.length > 0 ? (
          <div>
            {posts.map((post, idx) => (
              <PostCard
                key={post.id}
                post={post}
                index={idx}
                onOpenMediaModal={onOpenMediaModal}
                onViewAuthorProfile={onViewAuthorProfile}
                onOpenAuth={onOpenAuth}
              />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
            Nenhuma resenha publicada ainda por este perfil.
          </div>
        )
      ) : (
        // Uma das 3 listas
        listItemsForStatus(activeTab).length > 0 ? (
          <div className="media-grid">
            {listItemsForStatus(activeTab).map((item) => (
              <div
                key={item.itemKey}
                className="media-grid-item"
                onClick={() =>
                  onOpenMediaModal({
                    id: item.itemId,
                    type: item.itemType,
                    title: item.title,
                    poster: item.posterUrl,
                    year: item.year,
                  })
                }
              >
                <div className="grid-poster-wrap">
                  <img src={item.posterUrl} alt={item.title} loading="lazy" />
                </div>
                <div className="grid-item-info">
                  <div className="grid-item-title">{item.title}</div>
                  <div className="grid-item-sub">
                    {item.itemType === 'book' ? 'Livro' : item.itemType === 'series' ? 'Série' : 'Filme'} • {item.year}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
            Nenhum título nesta lista ainda.
          </div>
        )
      )}
    </div>
  );
};
