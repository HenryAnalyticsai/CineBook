import { Post, ListItem, Achievement, AchievementTier } from '../types/cinebook';

interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  requirementHint: string;
  category: Achievement['category'];
  icon: string;
  tier: AchievementTier;
  targetCount: number;
  evaluator: (data: {
    posts: Post[];
    lists: ListItem[];
    followingCount: number;
  }) => number;
}

export const ACHIEVEMENTS_REGISTRY: AchievementDefinition[] = [
  {
    id: 'primeiro_take',
    title: 'Primeiro Take',
    description: 'Publicou sua primeira resenha no Cinebook.',
    requirementHint: 'Publique 1 resenha no feed',
    category: 'reviews',
    icon: '✍️',
    tier: 'bronze',
    targetCount: 1,
    evaluator: ({ posts }) => posts.length,
  },
  {
    id: 'critico_promissor',
    title: 'Crítico Promissor',
    description: 'Compartilhou 5 resenhas de filmes, séries ou livros.',
    requirementHint: 'Publique 5 resenhas no feed',
    category: 'reviews',
    icon: '⭐',
    tier: 'silver',
    targetCount: 5,
    evaluator: ({ posts }) => posts.length,
  },
  {
    id: 'cineasta',
    title: 'Cineasta',
    description: 'Alcançou a marca histórica de 10 resenhas publicadas!',
    requirementHint: 'Publique 10 resenhas no feed',
    category: 'reviews',
    icon: '🎬',
    tier: 'gold',
    targetCount: 10,
    evaluator: ({ posts }) => posts.length,
  },
  {
    id: 'mestre_da_critica',
    title: 'Mestre da Crítica',
    description: 'Verdadeira autoridade cultural com 25 resenhas publicadas.',
    requirementHint: 'Publique 25 resenhas no feed',
    category: 'reviews',
    icon: '🏆',
    tier: 'platinum',
    targetCount: 25,
    evaluator: ({ posts }) => posts.length,
  },
  {
    id: 'rato_de_biblioteca',
    title: 'Rato de Biblioteca',
    description: 'Concluiu a leitura de 3 livros com dedicação.',
    requirementHint: 'Marque 3 livros como Concluído',
    category: 'books',
    icon: '📖',
    tier: 'silver',
    targetCount: 3,
    evaluator: ({ lists }) =>
      lists.filter((item) => item.itemType === 'book' && item.status === 'completed').length,
  },
  {
    id: 'devorador_de_livros',
    title: 'Devorador de Livros',
    description: 'Leu e concluiu 10 livros no Cinebook!',
    requirementHint: 'Marque 10 livros como Concluído',
    category: 'books',
    icon: '📚',
    tier: 'gold',
    targetCount: 10,
    evaluator: ({ lists }) =>
      lists.filter((item) => item.itemType === 'book' && item.status === 'completed').length,
  },
  {
    id: 'cinefilo_nato',
    title: 'Cinéfilo Nato',
    description: 'Assistiu e concluiu 5 filmes na sua lista.',
    requirementHint: 'Marque 5 filmes como Concluído',
    category: 'movies',
    icon: '🍿',
    tier: 'silver',
    targetCount: 5,
    evaluator: ({ lists }) =>
      lists.filter((item) => item.itemType === 'movie' && item.status === 'completed').length,
  },
  {
    id: 'maratonista',
    title: 'Maratonista de Séries',
    description: 'Concluiu 3 séries completas em suas listas.',
    requirementHint: 'Marque 3 séries como Concluído',
    category: 'series',
    icon: '📺',
    tier: 'silver',
    targetCount: 3,
    evaluator: ({ lists }) =>
      lists.filter((item) => item.itemType === 'series' && item.status === 'completed').length,
  },
  {
    id: 'colecionador',
    title: 'Colecionador Cultural',
    description: 'Catalogou 10 ou mais obras entre filmes, séries e livros.',
    requirementHint: 'Adicione 10 itens nas suas listas',
    category: 'lists',
    icon: '🔖',
    tier: 'bronze',
    targetCount: 10,
    evaluator: ({ lists }) => lists.length,
  },
  {
    id: 'conectado',
    title: 'Conectado',
    description: 'Está seguindo pelo menos 3 membros ativos da comunidade.',
    requirementHint: 'Siga 3 membros do Cinebook',
    category: 'community',
    icon: '👥',
    tier: 'bronze',
    targetCount: 3,
    evaluator: ({ followingCount }) => followingCount,
  },
  {
    id: 'guardiao_spoilers',
    title: 'Guardião de Segredos',
    description: 'Publicou resenha com alerta de spoiler ativo para proteger outros leitores.',
    requirementHint: 'Publique 1 resenha com Alerta de Spoiler',
    category: 'reviews',
    icon: '🛡️',
    tier: 'bronze',
    targetCount: 1,
    evaluator: ({ posts }) => posts.filter((p) => Boolean(p.hasSpoiler)).length,
  },
  {
    id: 'estrela_do_feed',
    title: 'Estrela do Feed',
    description: 'Suas resenhas somam 5 ou mais curtidas da comunidade.',
    requirementHint: 'Acumule 5 curtidas no total das suas resenhas',
    category: 'community',
    icon: '❤️',
    tier: 'gold',
    targetCount: 5,
    evaluator: ({ posts }) => posts.reduce((acc, p) => acc + (p.likeCount || 0), 0),
  },
];

/**
 * Calcula a lista de conquistas avaliando os dados atuais do usuário em tempo real
 */
export function calculateUserAchievements(
  posts: Post[],
  lists: ListItem[],
  followingCount: number = 0
): Achievement[] {
  return ACHIEVEMENTS_REGISTRY.map((def) => {
    const count = def.evaluator({ posts, lists, followingCount });
    const clampedCount = Math.min(count, def.targetCount);
    const isUnlocked = count >= def.targetCount;
    const progressPercent = Math.min(100, Math.round((count / def.targetCount) * 100));

    return {
      id: def.id,
      title: def.title,
      description: def.description,
      requirementHint: def.requirementHint,
      category: def.category,
      icon: def.icon,
      tier: def.tier,
      targetCount: def.targetCount,
      currentCount: count,
      isUnlocked,
      progressPercent,
    };
  });
}

/**
 * Retorna as melhores conquistas para exibir como selo de destaque no perfil ou no post
 */
export function getTopUnlockedBadge(achievements: Achievement[]): Achievement | null {
  const unlocked = achievements.filter((a) => a.isUnlocked);
  if (unlocked.length === 0) return null;

  // Prioriza Platina > Ouro > Prata > Bronze
  const tierWeight: Record<AchievementTier, number> = {
    platinum: 4,
    gold: 3,
    silver: 2,
    bronze: 1,
  };

  return unlocked.sort((a, b) => tierWeight[b.tier] - tierWeight[a.tier] || b.targetCount - a.targetCount)[0];
}

export const TIER_CONFIG: Record<
  AchievementTier,
  { name: string; color: string; bg: string; border: string }
> = {
  bronze: {
    name: 'Bronze',
    color: '#b45309',
    bg: 'rgba(180, 83, 9, 0.12)',
    border: 'rgba(180, 83, 9, 0.35)',
  },
  silver: {
    name: 'Prata',
    color: '#64748b',
    bg: 'rgba(100, 116, 139, 0.12)',
    border: 'rgba(100, 116, 139, 0.35)',
  },
  gold: {
    name: 'Ouro',
    color: '#d97706',
    bg: 'rgba(217, 119, 6, 0.15)',
    border: 'rgba(217, 119, 6, 0.4)',
  },
  platinum: {
    name: 'Platina',
    color: '#0284c7',
    bg: 'rgba(2, 132, 199, 0.15)',
    border: 'rgba(2, 132, 199, 0.4)',
  },
};
