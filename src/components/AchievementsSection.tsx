import React, { useState } from 'react';
import { Trophy, CheckCircle, Lock, Award, Filter, Sparkles } from 'lucide-react';
import { Achievement } from '../types/cinebook';
import { AchievementModal } from './AchievementModal';
import { TIER_CONFIG } from '../services/achievementService';

interface AchievementsSectionProps {
  achievements: Achievement[];
  userName?: string;
}

export const AchievementsSection: React.FC<AchievementsSectionProps> = ({
  achievements,
  userName = 'Usuário',
}) => {
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;
  const totalCount = achievements.length;
  const overallPercent = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  const filtered = achievements.filter((a) => {
    if (filter === 'unlocked') return a.isUnlocked;
    if (filter === 'locked') return !a.isUnlocked;
    return true;
  });

  return (
    <div className="achievements-container">
      {/* Banner de Progresso Geral */}
      <div className="achievements-hero-card">
        <div className="achievements-hero-content">
          <div className="achievements-trophy-icon">
            <Trophy size={28} />
          </div>
          <div>
            <h3 className="achievements-hero-title">
              Galeria de Conquistas
            </h3>
            <p className="achievements-hero-subtitle">
              Selos virtuais conquistados por marcos de leitura, filmes assistidos e resenhas publicadas.
            </p>
          </div>
        </div>

        <div className="achievements-hero-stats">
          <div className="achievements-stat-text">
            <span>Progresso Geral</span>
            <strong>
              {unlockedCount} de {totalCount} ({overallPercent}%)
            </strong>
          </div>
          <div className="achievement-progress-track">
            <div
              className="achievement-progress-fill"
              style={{
                width: `${overallPercent}%`,
                background: 'var(--accent-gradient)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="achievements-filter-row">
        <button
          type="button"
          className={`filter-chip ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Todas ({totalCount})
        </button>
        <button
          type="button"
          className={`filter-chip ${filter === 'unlocked' ? 'active' : ''}`}
          onClick={() => setFilter('unlocked')}
        >
          <CheckCircle size={13} /> Desbloqueadas ({unlockedCount})
        </button>
        <button
          type="button"
          className={`filter-chip ${filter === 'locked' ? 'active' : ''}`}
          onClick={() => setFilter('locked')}
        >
          <Lock size={13} /> Em Progresso ({totalCount - unlockedCount})
        </button>
      </div>

      {/* Grid de Selos de Conquista */}
      <div className="achievements-grid">
        {filtered.map((item) => {
          const tier = TIER_CONFIG[item.tier];
          return (
            <button
              key={item.id}
              type="button"
              className={`achievement-card ${item.isUnlocked ? 'unlocked' : 'locked'}`}
              onClick={() => setSelectedAchievement(item)}
              aria-label={`Ver detalhes da conquista ${item.title}`}
            >
              <div
                className="achievement-card-emblem"
                style={{
                  background: item.isUnlocked ? tier.bg : 'var(--bg-subtle)',
                  borderColor: item.isUnlocked ? tier.border : 'var(--border-color)',
                }}
              >
                <span className="achievement-card-emoji">{item.icon}</span>
                {item.isUnlocked ? (
                  <span className="achievement-status-tag unlocked">
                    <CheckCircle size={11} />
                  </span>
                ) : (
                  <span className="achievement-status-tag locked">
                    <Lock size={10} />
                  </span>
                )}
              </div>

              <div className="achievement-card-info">
                <div className="achievement-card-header-line">
                  <span className="achievement-card-title">{item.title}</span>
                  <span
                    className="achievement-tier-mini"
                    style={{ color: tier.color }}
                  >
                    {tier.name}
                  </span>
                </div>

                <p className="achievement-card-desc">{item.description}</p>

                {/* Barra de Progresso Rápida */}
                <div className="achievement-card-bar-wrap">
                  <div className="achievement-progress-track mini">
                    <div
                      className="achievement-progress-fill"
                      style={{
                        width: `${item.progressPercent}%`,
                        background: item.isUnlocked
                          ? '#10b981'
                          : 'var(--accent-gradient)',
                      }}
                    />
                  </div>
                  <span className="achievement-card-count">
                    {item.currentCount}/{item.targetCount}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
          Nenhuma conquista encontrada neste filtro.
        </div>
      )}

      {/* Modal de Detalhes da Conquista Selecionada */}
      <AchievementModal
        achievement={selectedAchievement}
        onClose={() => setSelectedAchievement(null)}
      />
    </div>
  );
};
