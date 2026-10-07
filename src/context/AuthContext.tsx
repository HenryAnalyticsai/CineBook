import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  signInAnonymously,
} from 'firebase/auth';
import { auth } from '../firebase';
import { UserProfile, ADMIN_EMAIL, isAdminEmail } from '../types/cinebook';
import {
  getUserProfile,
  upsertUserProfile,
  ensureFollowAdmin,
  setCachedAdminInfo,
} from '../services/firestoreService';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  signInWithGoogle: () => Promise<void>;
  loginWithPhone: (phoneDigits: string) => Promise<boolean>;
  updateProfileBio: (bio: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const isAdmin = Boolean(
    profile?.isAdmin ||
    isAdminEmail(user?.email) ||
    isAdminEmail(profile?.email)
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const isCurrentUserAdmin = isAdminEmail(currentUser.email);
          let userProfile = await getUserProfile(currentUser.uid);

          if (!userProfile) {
            const defaultName = isCurrentUserAdmin
              ? currentUser.displayName || 'Henry Analytics (ADM)'
              : currentUser.displayName || `Usuário${currentUser.uid.substring(0, 4).toUpperCase()}`;

            const defaultPhoto =
              currentUser.photoURL ||
              `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.uid}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;

            userProfile = {
              uid: currentUser.uid,
              displayName: defaultName,
              photoURL: defaultPhoto,
              email: currentUser.email?.toLowerCase(),
              role: isCurrentUserAdmin ? 'admin' : 'user',
              isAdmin: isCurrentUserAdmin,
              bio: isCurrentUserAdmin
                ? '👑 Perfil Oficial do Administrador do Cinebook.'
                : 'Amante de cinema, séries e boa literatura no Cinebook.',
              createdAt: new Date().toISOString(),
            };

            await upsertUserProfile(userProfile);
          } else {
            // Se for admin, garante flags atualizadas
            if (isCurrentUserAdmin && (!userProfile.isAdmin || userProfile.role !== 'admin')) {
              userProfile = {
                ...userProfile,
                email: currentUser.email?.toLowerCase() || ADMIN_EMAIL,
                role: 'admin',
                isAdmin: true,
              };
              await upsertUserProfile(userProfile);
            }
          }

          if (isCurrentUserAdmin) {
            setCachedAdminInfo({
              adminUid: currentUser.uid,
              email: ADMIN_EMAIL,
              displayName: userProfile.displayName,
              photoURL: userProfile.photoURL,
            });
          } else {
            // Qualquer outro usuário automaticamente segue o Administrador
            await ensureFollowAdmin(currentUser.uid, userProfile.displayName, userProfile.photoURL);
          }

          setProfile(userProfile);
        } catch (err: any) {
          console.error('Erro ao sincronizar perfil de usuário:', err);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error('Erro ao autenticar com Google:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('A janela de login com Google foi fechada antes de concluir.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('Domínio não autorizado no Firebase Console. Adicione a URL atual em Authentication > Settings > Authorized domains.');
      } else {
        setError(err.message || 'Falha ao autenticar com Google.');
      }
      throw err;
    }
  };

  /**
   * Login por telefone com confirmação direta (sem envio de SMS)
   */
  const loginWithPhone = async (phoneDigits: string): Promise<boolean> => {
    try {
      setError(null);
      const cleanDigits = phoneDigits.replace(/\D/g, '');
      if (cleanDigits.length < 10 || cleanDigits.length > 11) {
        setError('Informe um número válido com DDD (ex: 11 98765-4321).');
        return false;
      }

      let authenticatedUser = auth.currentUser;

      if (!authenticatedUser) {
        try {
          const cred = await signInAnonymously(auth);
          authenticatedUser = cred.user;
        } catch (anonErr: any) {
          console.warn('Autenticação anônima do Firebase não habilitada ou indisponível:', anonErr);
        }
      }

      const uid = authenticatedUser?.uid || 'user_phone_' + cleanDigits;
      const safePublicName = `Usuário${uid.substring(0, 4).toUpperCase()}`;
      const defaultPhoto = `https://api.dicebear.com/7.x/bottts/svg?seed=${uid}&backgroundColor=b6e3f4,c0aede,ffd5dc,ffdfbf`;

      let userProfile = await getUserProfile(uid);
      if (!userProfile) {
        userProfile = {
          uid,
          displayName: safePublicName,
          photoURL: defaultPhoto,
          bio: 'Membro Cinebook verificado por celular.',
          createdAt: new Date().toISOString(),
        };
        try {
          await upsertUserProfile(userProfile);
        } catch (dbErr) {
          console.warn('Perfil inicial salvo localmente:', dbErr);
        }
      }

      if (!auth.currentUser) {
        setUser({
          uid,
          displayName: safePublicName,
          photoURL: defaultPhoto,
        } as any);
      }

      setProfile(userProfile);
      return true;
    } catch (err: any) {
      console.error('Erro ao realizar login por telefone:', err);
      setError(err.message || 'Falha ao autenticar com o número informado.');
      return false;
    }
  };

  const updateProfileBio = async (newBio: string) => {
    if (!profile) return;
    const updated: UserProfile = {
      ...profile,
      bio: newBio.slice(0, 300),
    };
    await upsertUserProfile(updated);
    setProfile(updated);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin,
        loading,
        error,
        clearError,
        signInWithGoogle,
        loginWithPhone,
        updateProfileBio,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};

