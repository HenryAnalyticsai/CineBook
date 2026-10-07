import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  signInAnonymously,
} from 'firebase/auth';
import { auth } from '../firebase';
import { UserProfile } from '../types/cinebook';
import { getUserProfile, upsertUserProfile } from '../services/firestoreService';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  signInWithGoogle: () => Promise<void>;
  sendPhoneVerificationCode: (phoneDigits: string) => Promise<boolean>;
  confirmPhoneCode: (code: string) => Promise<boolean>;
  loginAsDemoUser: (name?: string) => Promise<void>;
  updateProfileBio: (bio: string) => Promise<void>;
  logout: () => Promise<void>;
  phoneStep: 'idle' | 'code-sent' | 'verifying';
  resetPhoneStep: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phoneStep, setPhoneStep] = useState<'idle' | 'code-sent' | 'verifying'>('idle');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const clearError = () => setError(null);
  const resetPhoneStep = () => {
    setPhoneStep('idle');
    setConfirmationResult(null);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          let userProfile = await getUserProfile(currentUser.uid);
          if (!userProfile) {
            // Determine display name:
            // Google user: displayName from Google if exists.
            // Phone or anonymous: "Usuário" + 4 first characters of uid (CRITICAL SECURITY MANDATE)
            const defaultName =
              currentUser.displayName || `Usuário${currentUser.uid.substring(0, 4).toUpperCase()}`;

            const defaultPhoto =
              currentUser.photoURL ||
              `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.uid}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;

            userProfile = {
              uid: currentUser.uid,
              displayName: defaultName,
              photoURL: defaultPhoto,
              bio: 'Amante de cinema, séries e boa literatura no Cinebook.',
              createdAt: new Date().toISOString(),
            };

            await upsertUserProfile(userProfile);
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

  const setupRecaptcha = (): RecaptchaVerifier => {
    // Clean up any existing verifier
    if ((window as any).recaptchaVerifier) {
      try {
        (window as any).recaptchaVerifier.clear();
      } catch (e) {
        // ignore
      }
    }

    const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved
      },
      'expired-callback': () => {
        setError('O reCAPTCHA expirou. Por favor, tente enviar o SMS novamente.');
      },
    });

    (window as any).recaptchaVerifier = verifier;
    return verifier;
  };

  const sendPhoneVerificationCode = async (phoneDigits: string): Promise<boolean> => {
    try {
      setError(null);
      // Clean non-digits
      const cleanDigits = phoneDigits.replace(/\D/g, '');
      if (cleanDigits.length < 10 || cleanDigits.length > 11) {
        setError('Informe um número válido com DDD (ex: 11 98765-4321).');
        return false;
      }

      // Prepend Brazil prefix +55 automatically
      const e164Number = `+55${cleanDigits}`;

      const verifier = setupRecaptcha();
      const confirmation = await signInWithPhoneNumber(auth, e164Number, verifier);
      setConfirmationResult(confirmation);
      setPhoneStep('code-sent');
      return true;
    } catch (err: any) {
      console.error('Erro ao enviar SMS:', err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('O login por Telefone precisa ser habilitado no Firebase Console (Authentication > Sign-in method > Telefone).');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Muitas tentativas de SMS. Tente novamente mais tarde ou use os números de teste do Firebase.');
      } else if (err.code === 'auth/invalid-phone-number') {
        setError('Número de telefone inválido. Verifique o DDD e os 9 dígitos.');
      } else {
        setError(err.message || 'Erro ao enviar código por SMS.');
      }
      return false;
    }
  };

  const confirmPhoneCode = async (code: string): Promise<boolean> => {
    if (!confirmationResult) {
      setError('Sessão de verificação expirada. Solicite um novo código.');
      return false;
    }

    try {
      setError(null);
      setPhoneStep('verifying');
      const result = await confirmationResult.confirm(code);
      const user = result.user;

      // Ensure public name is masked as required: "Usuário" + 4 first characters of uid
      const safePublicName = `Usuário${user.uid.substring(0, 4).toUpperCase()}`;
      const defaultPhoto = `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}&backgroundColor=b6e3f4,c0aede,ffd5dc`;

      const userProfile: UserProfile = {
        uid: user.uid,
        displayName: safePublicName,
        photoURL: defaultPhoto,
        bio: 'Membro Cinebook verificado por celular.',
        createdAt: new Date().toISOString(),
      };

      await upsertUserProfile(userProfile);
      setProfile(userProfile);
      resetPhoneStep();
      return true;
    } catch (err: any) {
      console.error('Erro ao confirmar código SMS:', err);
      setPhoneStep('code-sent');
      if (err.code === 'auth/invalid-verification-code') {
        setError('Código de 6 dígitos inválido ou incorreto.');
      } else {
        setError(err.message || 'Falha ao validar código.');
      }
      return false;
    }
  };

  // Demo user helper for instant evaluation
  const loginAsDemoUser = async (name: string = 'Crítico Cinebook') => {
    try {
      setError(null);
      let realUid = '';

      // Tenta autenticação anônima real do Firebase para respeitar as regras do Firestore
      try {
        const anonCred = await signInAnonymously(auth);
        realUid = anonCred.user.uid;
      } catch (anonErr) {
        console.warn('Login anônimo indisponível no console, usando identificador de demonstração:', anonErr);
        realUid = 'demo_critico_' + Math.random().toString(36).substring(2, 6);
      }

      const demoProfile: UserProfile = {
        uid: realUid,
        displayName: name,
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces',
        bio: 'Apaixonado por cinema, séries e boa literatura no Cinebook.',
        createdAt: new Date().toISOString(),
      };

      if (!auth.currentUser) {
        setUser({
          uid: realUid,
          displayName: name,
          email: 'demo@cinebook.social',
          photoURL: demoProfile.photoURL,
        } as any);
      }

      setProfile(demoProfile);
      await upsertUserProfile(demoProfile);
    } catch (err: any) {
      console.error('Erro ao criar usuário demo:', err);
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
    resetPhoneStep();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        error,
        clearError,
        signInWithGoogle,
        sendPhoneVerificationCode,
        confirmPhoneCode,
        loginAsDemoUser,
        updateProfileBio,
        logout,
        phoneStep,
        resetPhoneStep,
      }}
    >
      {children}
      {/* Invisible reCAPTCHA container for Phone Auth */}
      <div id="recaptcha-container"></div>
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
