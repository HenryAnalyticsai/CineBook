import React, { useState } from 'react';
import {
  X,
  Smartphone,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  Edit2,
  CheckCircle2,
  Film,
  BookOpen,
  Trophy,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const {
    signInWithGoogle,
    loginWithPhone,
    error,
    clearError,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'google' | 'phone'>('google');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneSubStep, setPhoneSubStep] = useState<'input' | 'confirm'>('input');
  const [loading, setLoading] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const firebaseProjectSettingsUrl =
    'https://console.firebase.google.com/project/gen-lang-client-0570842664/authentication/settings';

  const handleCopyHostname = () => {
    if (navigator?.clipboard && currentHostname) {
      navigator.clipboard.writeText(currentHostname);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 3000);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    clearError();
    try {
      await signInWithGoogle();
      onClose();
    } catch (e) {
      // Handled in context
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneDisplay = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  const handlePhoneInputChange = (val: string) => {
    // Permite digitação natural e formata suavemente
    const digitsOnly = val.replace(/\D/g, '').slice(0, 11);
    setPhoneNumber(formatPhoneDisplay(digitsOnly));
  };

  const handleProceedToConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    const cleanDigits = phoneNumber.replace(/\D/g, '');
    if (cleanDigits.length < 10 || cleanDigits.length > 11) {
      return;
    }
    setPhoneSubStep('confirm');
  };

  const handleConfirmAndLogin = async () => {
    setLoading(true);
    clearError();
    try {
      const ok = await loginWithPhone(phoneNumber);
      if (ok) {
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  const cleanDigitsCount = phoneNumber.replace(/\D/g, '').length;
  const isPhoneValid = cleanDigitsCount >= 10 && cleanDigitsCount <= 11;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-sheet auth-modal-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Botão Fechar */}
        <button
          type="button"
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Fechar janela de login"
        >
          <X size={20} />
        </button>

        {/* Topo com Identidade Visual & Logo do Cinebook */}
        <div className="auth-brand-header">
          <div className="auth-logo-badge" title="Cinebook - Cinema, Séries e Livros">
            <span className="auth-logo-icons">
              <Film size={26} />
              <BookOpen size={24} />
            </span>
          </div>
          <div className="auth-brand-name">Cinebook</div>
          <p className="auth-brand-tagline">
            A rede social para cinéfilos, séries e leitores apaixonados
          </p>
        </div>

        {/* Mensagens de Alerta ou Erro */}
        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1.5px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              marginBottom: '16px',
            }}
            role="alert"
          >
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: '#ef4444', fontSize: '0.86rem', display: 'block', marginBottom: '2px' }}>
                  {error.includes('Domínio não autorizado')
                    ? 'Domínio não autorizado no Firebase Console'
                    : 'Aviso de Autenticação'}
                </strong>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {error}
                </div>
              </div>
            </div>

            {error.includes('Domínio não autorizado') && (
              <div
                style={{
                  marginTop: '10px',
                  paddingTop: '10px',
                  borderTop: '1px solid rgba(239, 68, 68, 0.2)',
                  fontSize: '0.8rem',
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Liberar domínio no Firebase Console:
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '8px',
                    fontFamily: 'monospace',
                    fontSize: '0.74rem',
                    overflowX: 'auto',
                  }}
                >
                  <span style={{ color: 'var(--accent-pink)', fontWeight: 700 }}>{currentHostname}</span>
                  <button
                    type="button"
                    onClick={handleCopyHostname}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 8px',
                      background: copiedDomain ? 'var(--accent-emerald)' : 'var(--bg-subtle)',
                      color: copiedDomain ? '#fff' : 'var(--text-primary)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    {copiedDomain ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedDomain ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>

                <a
                  href={firebaseProjectSettingsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    background: 'var(--accent-pink)',
                    color: '#fff',
                    borderRadius: 'var(--radius-sm)',
                    textDecoration: 'none',
                    fontWeight: 700,
                    fontSize: '0.76rem',
                  }}
                >
                  <span>Abrir Configurações do Firebase</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            )}
          </div>
        )}

        {/* Abas Segmentadas Intuitivas */}
        <div className="auth-tabs-segmented" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'google'}
            className={`auth-tab-btn ${activeTab === 'google' ? 'active' : ''}`}
            onClick={() => {
              clearError();
              setActiveTab('google');
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Conta Google</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'phone'}
            className={`auth-tab-btn ${activeTab === 'phone' ? 'active' : ''}`}
            onClick={() => {
              clearError();
              setActiveTab('phone');
            }}
          >
            <Smartphone size={17} />
            <span>Celular (+55)</span>
          </button>
        </div>

        {/* Conteúdo Aba: GOOGLE */}
        {activeTab === 'google' && (
          <div>
            <button
              type="button"
              className="auth-google-btn"
              onClick={handleGoogleLogin}
              disabled={loading}
              aria-label="Continuar com a conta do Google"
            >
              <svg width="22" height="22" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{loading ? 'Conectando ao Google...' : 'Entrar com o Google'}</span>
            </button>

            {/* Destaques de Vantagens da Plataforma */}
            <div className="auth-features-preview">
              <div className="auth-feature-row">
                <Film size={16} color="var(--accent-pink)" style={{ flexShrink: 0 }} />
                <span>
                  <strong>Listas Culturais:</strong> organize filmes, séries e livros em minutos.
                </span>
              </div>
              <div className="auth-feature-row">
                <BookOpen size={16} color="var(--accent-blue)" style={{ flexShrink: 0 }} />
                <span>
                  <strong>Resenhas com Spoiler Alert:</strong> compartilhe sua opinião sem estragar surpresas.
                </span>
              </div>
              <div className="auth-feature-row">
                <Trophy size={16} color="var(--accent-gold)" style={{ flexShrink: 0 }} />
                <span>
                  <strong>Conquistas Culturais:</strong> ganhe selos como <em>Cineasta</em> e <em>Devorador de Livros</em>.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Conteúdo Aba: CELULAR */}
        {activeTab === 'phone' && (
          <div>
            {phoneSubStep === 'input' ? (
              <form onSubmit={handleProceedToConfirm}>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label" htmlFor="phone-input">
                    Digite o número do seu celular
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div
                      style={{
                        padding: '12px 14px',
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        fontWeight: 700,
                        fontSize: '0.92rem',
                        display: 'flex',
                        alignItems: 'center',
                        userSelect: 'none',
                      }}
                    >
                      🇧🇷 +55
                    </div>
                    <input
                      id="phone-input"
                      type="tel"
                      className="form-control"
                      placeholder="(11) 98765-4321"
                      value={phoneNumber}
                      onChange={(e) => handlePhoneInputChange(e.target.value)}
                      autoFocus
                      required
                    />
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.74rem',
                      color: 'var(--text-muted)',
                      marginTop: '4px',
                    }}
                  >
                    <span>DDD + 8 ou 9 dígitos</span>
                    <span style={{ color: isPhoneValid ? 'var(--accent-emerald)' : 'inherit', fontWeight: isPhoneValid ? 700 : 400 }}>
                      {cleanDigitsCount} / 11 dígitos
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    background: 'var(--bg-subtle)',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '18px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <ShieldCheck size={18} color="var(--accent-emerald)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Totalmente confidencial:</strong> Seu número nunca será visível para outros membros. Seu nome público exibirá o identificador seguro <code>Usuário[XXXX]</code>.
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading || !isPhoneValid}
                  style={{
                    width: '100%',
                    padding: '13px',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 700,
                    fontSize: '0.96rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <span>Avançar para Confirmação</span>
                  <ArrowRight size={16} />
                </button>
              </form>
            ) : (
              /* Etapa de Confirmação Clara e Apresentável */
              <div>
                <div className="auth-confirm-box">
                  <div className="auth-confirm-icon-wrap">
                    <Smartphone size={24} />
                  </div>

                  <h3
                    style={{
                      fontSize: '1.08rem',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      marginBottom: '6px',
                    }}
                  >
                    As informações de telefone estão corretas?
                  </h3>

                  <p
                    style={{
                      fontSize: '0.84rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.45,
                      maxWidth: '320px',
                      margin: '0 auto 8px',
                    }}
                  >
                    Por favor, confirme se o número abaixo está correto para o seu acesso ao Cinebook:
                  </p>

                  <div className="auth-phone-number-display">
                    <span>🇧🇷 +55 {phoneNumber}</span>
                  </div>

                  <div
                    style={{
                      fontSize: '0.76rem',
                      color: 'var(--accent-emerald)',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      marginTop: '6px',
                    }}
                  >
                    <CheckCircle2 size={14} />
                    <span>Nenhum SMS será enviado. Entrada direta liberada!</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleConfirmAndLogin}
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '13px',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: 800,
                      fontSize: '0.96rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <CheckCircle2 size={18} />
                    <span>{loading ? 'Entrando no Cinebook...' : 'Sim, o número está correto — Entrar'}</span>
                  </button>

                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setPhoneSubStep('input')}
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '11px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <Edit2 size={14} />
                    <span>Corrigir número digitado</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
