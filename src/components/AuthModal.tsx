import React, { useState } from 'react';
import { X, Smartphone, ArrowRight, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const {
    signInWithGoogle,
    sendPhoneVerificationCode,
    confirmPhoneCode,
    loginAsDemoUser,
    error,
    clearError,
    phoneStep,
    resetPhoneStep,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'google' | 'phone'>('google');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleSendSms = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearError();
    try {
      const ok = await sendPhoneVerificationCode(phoneNumber);
      if (ok) {
        // Step transitioned to code-sent
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearError();
    try {
      const ok = await confirmPhoneCode(smsCode);
      if (ok) {
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      await loginAsDemoUser();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <button
          type="button"
          className="modal-close-btn"
          onClick={() => {
            resetPhoneStep();
            onClose();
          }}
          aria-label="Fechar"
        >
          <X size={22} />
        </button>

        <h2 className="modal-title">Entrar no Cinebook</h2>
        <p className="modal-desc">
          Conecte-se para salvar suas listas, avaliar filmes e acompanhar resenhas de amigos.
        </p>

        {error && (
          <div className="alert-box alert-error" role="alert">
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.86rem', lineHeight: 1.4 }}>{error}</div>
          </div>
        )}

        {/* Abas: Google vs Celular */}
        <div className="feed-tabs" style={{ marginBottom: '20px' }}>
          <button
            type="button"
            className={`feed-tab-btn ${activeTab === 'google' ? 'active' : ''}`}
            onClick={() => {
              clearError();
              setActiveTab('google');
            }}
          >
            Google
          </button>
          <button
            type="button"
            className={`feed-tab-btn ${activeTab === 'phone' ? 'active' : ''}`}
            onClick={() => {
              clearError();
              setActiveTab('phone');
            }}
          >
            <Smartphone size={16} />
            <span>Celular (+55)</span>
          </button>
        </div>

        {activeTab === 'google' ? (
          <div>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleGoogleLogin}
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                fontWeight: 700,
                fontSize: '0.96rem',
                border: '1.5px solid var(--border-color)',
                marginBottom: '16px',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
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
              <span>Continuar com o Google</span>
            </button>

            <div
              style={{
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                textAlign: 'center',
                lineHeight: 1.5,
              }}
            >
              Autenticação segura via Firebase Auth.
            </div>
          </div>
        ) : (
          <div>
            {phoneStep === 'idle' ? (
              <form onSubmit={handleSendSms}>
                <div className="form-group">
                  <label className="form-label" htmlFor="phone-input">
                    Número do Celular (com DDD)
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div
                      style={{
                        padding: '12px 14px',
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      🇧🇷 +55
                    </div>
                    <input
                      id="phone-input"
                      type="tel"
                      className="form-control"
                      placeholder="11 98765-4321"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                    />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    O prefixo do Brasil (+55) é inserido automaticamente.
                  </div>
                </div>

                <div
                  style={{
                    background: 'var(--bg-subtle)',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                  }}
                >
                  <ShieldCheck size={18} color="var(--accent-emerald)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Privacidade garantida:</strong> Seu telefone nunca é exibido publicamente. Seu nome público será gerado como <code>Usuário[XXXX]</code>.
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 700,
                  }}
                >
                  {loading ? 'Enviando SMS...' : 'Enviar Código SMS'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleConfirmCode}>
                <div className="form-group">
                  <label className="form-label" htmlFor="sms-code">
                    Código de 6 dígitos recebido por SMS
                  </label>
                  <input
                    id="sms-code"
                    type="text"
                    maxLength={6}
                    className="form-control"
                    placeholder="123456"
                    value={smsCode}
                    onChange={(e) => setSmsCode(e.target.value)}
                    style={{ letterSpacing: '0.3em', fontSize: '1.2rem', textAlign: 'center' }}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 700,
                    marginBottom: '10px',
                  }}
                >
                  {loading ? 'Verificando...' : 'Confirmar e Entrar'}
                </button>

                <button
                  type="button"
                  onClick={resetPhoneStep}
                  style={{
                    width: '100%',
                    fontSize: '0.82rem',
                    color: 'var(--text-muted)',
                    textAlign: 'center',
                  }}
                >
                  Trocar número de telefone
                </button>
              </form>
            )}
          </div>
        )}

        {/* Opção Rápida de Demonstração / Convidado */}
        <div
          style={{
            marginTop: '22px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-color)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
            Quer testar sem precisar fazer login no Google ou aguardar SMS?
          </div>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleDemoLogin}
            style={{
              padding: '8px 18px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <UserCheck size={16} color="var(--accent-pink)" />
            <span>Entrar como Perfil Demo Instantâneo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
