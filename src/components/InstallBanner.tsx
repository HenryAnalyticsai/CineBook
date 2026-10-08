import React, { useState, useEffect } from 'react';
import { Download, X, Sparkles, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface InstallBannerProps {
  onOpenInstallModal: () => void;
}

export const InstallBanner: React.FC<InstallBannerProps> = ({ onOpenInstallModal }) => {
  const { isInstalled, isInstallable, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    // Check if dismissed in this session
    const isDismissed = sessionStorage.getItem('cinebook_install_banner_dismissed') === 'true';
    if (!isDismissed && !isInstalled) {
      // Small timeout so it doesn't flash immediately on initial render
      const timer = setTimeout(() => {
        setDismissed(false);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [isInstalled]);

  if (dismissed || isInstalled) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('cinebook_install_banner_dismissed', 'true');
  };

  const handleAction = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setDismissed(true);
        return;
      }
    }
    onOpenInstallModal();
  };

  return (
    <div className="install-banner-bar" role="region" aria-label="Aviso de instalação do aplicativo">
      <div className="install-banner-content">
        <div className="install-banner-icon">
          <Smartphone size={20} color="var(--accent-pink)" />
        </div>
        <div className="install-banner-text">
          <div className="install-banner-title">
            <strong>Baixe o App Cinebook</strong>
            <span className="install-banner-tag">Grátis &amp; Leve</span>
          </div>
          <p className="install-banner-desc">
            Instale no celular para abrir em tela cheia e acessar offline!
          </p>
        </div>
      </div>

      <div className="install-banner-actions">
        <button
          type="button"
          className="btn-primary install-banner-btn"
          onClick={handleAction}
        >
          <Download size={15} />
          <span>Baixar App</span>
        </button>

        <button
          type="button"
          className="install-banner-close"
          onClick={handleDismiss}
          aria-label="Dispensar aviso de instalação"
          title="Dispensar"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
