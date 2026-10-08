import React, { useState } from 'react';
import {
  Download,
  X,
  Smartphone,
  Laptop,
  Share2,
  CheckCircle2,
  PlusSquare,
  MoreVertical,
  Zap,
  WifiOff,
  HardDrive,
  Copy,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface InstallAppModalProps {
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ onClose }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'device' | 'ios' | 'android' | 'pc'>(
    isIOS ? 'ios' : isAndroid ? 'android' : 'device'
  );
  const [copied, setCopied] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);
  const [installing, setInstalling] = useState(false);

  const handleInstallClick = async () => {
    if (!isInstallable) return;
    setInstalling(true);
    const accepted = await install();
    setInstalling(false);
    if (accepted) {
      setInstallSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2500);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-modal-title"
    >
      <div
        className="modal-container install-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px', width: '92%' }}
      >
        {/* Header com Fechar */}
        <div className="install-modal-header">
          <div className="install-app-badge">
            <img
              src="/icon.svg"
              alt="Cinebook Ícone"
              className="install-app-icon"
            />
            <div>
              <h2 id="install-modal-title" className="install-modal-title">
                Baixar o App Cinebook
              </h2>
              <p className="install-modal-subtitle">
                Instale no seu celular ou computador sem ocupar espaço
              </p>
            </div>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Fechar modal de instalação"
          >
            <X size={20} />
          </button>
        </div>

        {/* Status de Já Instalado */}
        {isInstalled && (
          <div className="install-installed-banner">
            <CheckCircle2 size={20} color="#10b981" />
            <div>
              <strong>Aplicativo Instalado!</strong>
              <p style={{ margin: 0, fontSize: '0.82rem', opacity: 0.9 }}>
                Você já tem o Cinebook instalado no seu dispositivo ou está rodando em tela cheia.
              </p>
            </div>
          </div>
        )}

        {/* Mensagem de Sucesso Imediato */}
        {installSuccess && (
          <div className="install-installed-banner" style={{ borderColor: '#10b981', background: 'rgba(16, 185, 129, 0.15)' }}>
            <CheckCircle2 size={22} color="#10b981" />
            <div>
              <strong>Instalação Iniciada com Sucesso!</strong>
              <p style={{ margin: 0, fontSize: '0.82rem' }}>
                O ícone do Cinebook agora está disponível na sua tela de início!
              </p>
            </div>
          </div>
        )}

        {/* Botão de 1 Clique quando suportado */}
        {isInstallable && !isInstalled && !installSuccess && (
          <div className="install-cta-card">
            <div className="install-cta-info">
              <span className="install-cta-badge">Disponível Agora</span>
              <h3>Instalação Direta em 1 Clique</h3>
              <p>Adicione à sua tela inicial sem precisar abrir lojas de aplicativos pesadas.</p>
            </div>
            <button
              type="button"
              className="btn-primary install-primary-btn"
              onClick={handleInstallClick}
              disabled={installing}
            >
              <Download size={20} />
              <span>{installing ? 'Instalando...' : 'Instalar Agora no Aparelho'}</span>
            </button>
          </div>
        )}

        {/* Benefícios do App */}
        <div className="install-benefits-grid">
          <div className="benefit-item">
            <div className="benefit-icon-box">
              <Zap size={18} color="var(--accent-pink)" />
            </div>
            <div>
              <h4>Acesso Rápido</h4>
              <p>Abra direto pela tela de início como app nativo.</p>
            </div>
          </div>

          <div className="benefit-item">
            <div className="benefit-icon-box">
              <WifiOff size={18} color="#06b6d4" />
            </div>
            <div>
              <h4>Modo Offline</h4>
              <p>Consulte listas e notas mesmo sem conexão.</p>
            </div>
          </div>

          <div className="benefit-item">
            <div className="benefit-icon-box">
              <HardDrive size={18} color="#10b981" />
            </div>
            <div>
              <h4>Super Leve</h4>
              <p>Menos de 2 MB, economiza armazenamento.</p>
            </div>
          </div>

          <div className="benefit-item">
            <div className="benefit-icon-box">
              <ShieldCheck size={18} color="#f59e0b" />
            </div>
            <div>
              <h4>Sempre Seguro</h4>
              <p>Atualizações automáticas em segundo plano.</p>
            </div>
          </div>
        </div>

        {/* Guias por Plataforma */}
        <div className="install-tabs">
          <button
            type="button"
            className={`install-tab-btn ${activeTab === 'android' ? 'active' : ''}`}
            onClick={() => setActiveTab('android')}
          >
            <Smartphone size={16} />
            <span>Android</span>
          </button>

          <button
            type="button"
            className={`install-tab-btn ${activeTab === 'ios' ? 'active' : ''}`}
            onClick={() => setActiveTab('ios')}
          >
            <Smartphone size={16} />
            <span>iPhone / iPad</span>
          </button>

          <button
            type="button"
            className={`install-tab-btn ${activeTab === 'pc' ? 'active' : ''}`}
            onClick={() => setActiveTab('pc')}
          >
            <Laptop size={16} />
            <span>Computador</span>
          </button>
        </div>

        {/* Conteúdo da Aba */}
        <div className="install-instructions-box">
          {activeTab === 'android' && (
            <div className="install-steps">
              <div className="install-step">
                <span className="step-number">1</span>
                <div>
                  <strong>No Chrome ou Navegador do Android:</strong>
                  <p>
                    Se o botão de 1 clique acima não aparecer, toque nos <strong>três pontinhos (⋮)</strong> no topo direito da tela.
                  </p>
                </div>
              </div>
              <div className="install-step">
                <span className="step-number">2</span>
                <div>
                  <strong>Escolha "Instalar aplicativo" ou "Adicionar à tela inicial"</strong>
                  <p>Confirme a instalação para criar o ícone direto no seu menu de aplicativos.</p>
                </div>
              </div>
              <div className="install-step">
                <span className="step-number">3</span>
                <div>
                  <strong>Pronto!</strong>
                  <p>O Cinebook abrirá em tela cheia como qualquer app da Play Store.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ios' && (
            <div className="install-steps">
              <div className="install-step">
                <span className="step-number">1</span>
                <div>
                  <strong>Abra no navegador Safari do iPhone ou iPad</strong>
                  <p>Toque no ícone de <strong>Compartilhar</strong> (o quadrado com uma seta para cima <Share2 size={13} style={{ display: 'inline', verticalAlign: 'middle' }} /> na barra inferior do Safari).</p>
                </div>
              </div>
              <div className="install-step">
                <span className="step-number">2</span>
                <div>
                  <strong>Role para baixo e toque em:</strong>
                  <p className="highlight-step">
                    <PlusSquare size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                    "Adicionar à Tela de Início"
                  </p>
                </div>
              </div>
              <div className="install-step">
                <span className="step-number">3</span>
                <div>
                  <strong>Toque em "Adicionar" no canto superior direito</strong>
                  <p>O ícone do Cinebook aparecerá na tela do seu iPhone para acesso instantâneo!</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pc' && (
            <div className="install-steps">
              <div className="install-step">
                <span className="step-number">1</span>
                <div>
                  <strong>No Google Chrome ou Microsoft Edge no PC ou Mac:</strong>
                  <p>Olhe para a <strong>barra de endereços</strong> no topo direito (onde fica a URL).</p>
                </div>
              </div>
              <div className="install-step">
                <span className="step-number">2</span>
                <div>
                  <strong>Clique no ícone de instalar (<Download size={13} style={{ display: 'inline' }} />)</strong>
                  <p>Clique em <strong>"Instalar Cinebook"</strong> para ter uma janela dedicada e atalho na área de trabalho.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé do Modal com Compartilhar Link */}
        <div className="install-modal-footer">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleCopyLink}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
            <span>{copied ? 'Link Copiado para o Clipboard!' : 'Copiar Link para Baixar no Celular'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
