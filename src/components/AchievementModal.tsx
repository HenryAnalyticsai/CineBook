import React from 'react';
import { X, CheckCircle, Lock, Trophy, Award, Sparkles } from 'lucide-react';
import { Achievement } from '../types/cinebook';
import { TIER_CONFIG } from '../services/achievementService';

interface AchievementModalProps {
  achievement: Achievement | null;
  onClose: () => void;
}

export const AchievementModal: React.FC<AchievementModalProps> = ({ achievement, onClose }) => {
  if (!achievement) return null;

  const tier = TIER_CONFIG[achievement.tier];

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-sheet achievement-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '420px', textAlign: 'center' }}
      >
        <button
          type="button"
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Fechar detalhes da conquista"
        >
          <X size={20} />
        </button>

        {/* Emblema Central em Destaque */}
        <div
          className="achievement-emblem-large"
          style={{
            background: achievement.isUnlocked ? tier.bg : 'var(--bg-subtle)',
            borderColor: achievement.isUnlocked ? tier.border : 'var(--border-color)',
          }}
        >
          <span className="achievement-emoji-large" role="img" aria-label={achievement.title}>
            {achievement.icon}
          </span>
          {achievement.isUnlocked && (
            <div className="achievement-sparkle-badge" title="Conquistado!">
              <Sparkles size={14} />
            </div>
          )}
        </div>

        {/* Categoria / Tier */}
        <div style={{ margin: '14px 0 6px' }}>
          <span
            className="achievement-tier-pill"
            style={{
              color: tier.color,
              background: tier.bg,
              borderColor: tier.border,
            }}
          >
            <Award size={12} /> Selo de {tier.name}
          </span>
        </div>

        <h2 className="modal-title" style={{ fontSize: '1.4rem', marginBottom: '6px' }}>
          {achievement.title}
        </h2>

        <p className="modal-desc" style={{ fontSize: '0.92rem', marginBottom: '18px' }}>
          {achievement.description}
        </p>

        {/* Barra de Progresso / Status */}
        <div
          style={{
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '14px',
            marginBottom: '20px',
            border: '1px solid var(--border-color)',
            textAlign: 'left',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
            }}
          >
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {achievement.isUnlocked ? (
                <span style={{ color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle size={15} /> Conquista Desbloqueada!
                </span>
              ) : (
                <span style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Lock size={15} /> Em Progresso ({achievement.progressPercent}%)
                </span>
              )}
            </span>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: tier.color }}>
              {achievement.currentCount} / {achievement.targetCount}
            </span>
          </div>

          <div className="achievement-progress-track">
            <div
              className="achievement-progress-fill"
              style={{
                width: `${achievement.progressPercent}%`,
                background: achievement.isUnlocked
                  ? 'linear-gradient(90deg, #10b981, #059669)'
                  : 'var(--accent-gradient)',
              }}
            />
          </div>

          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            <strong>Como conquistar:</strong> {achievement.requirementHint}
          </div>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={onClose}
          style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-md)', fontWeight: 700 }}
        >
          Fechar
        </button>
      </div>
    </div>
  );
};
