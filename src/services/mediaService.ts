import { MediaItem } from '../types/cinebook';

// Curated Brazilian & international famous books from Open Library
export const POPULAR_BOOKS: MediaItem[] = [
  {
    id: 'OL2163462W',
    type: 'book',
    title: 'Dom Casmurro',
    originalTitle: 'Dom Casmurro',
    poster: 'https://covers.openlibrary.org/b/id/8231856-L.jpg',
    year: '1899',
    overview: 'A célebre narrativa de Bento Santiago sobre sua paixão por Capitu, repleta de dúvidas e a eterna pergunta: Capitu traiu ou não traiu Bentinho?',
    author: 'Machado de Assis',
    voteAverage: 4.8,
  },
  {
    id: 'OL27479W',
    type: 'book',
    title: 'O Pequeno Príncipe',
    originalTitle: 'Le Petit Prince',
    poster: 'https://covers.openlibrary.org/b/id/12833521-L.jpg',
    year: '1943',
    overview: 'Um piloto cai no deserto do Saara e encontra um jovem príncipe vindo de um minúsculo asteroide. Uma fábula poética sobre o amor, a amizade e a perda.',
    author: 'Antoine de Saint-Exupéry',
    voteAverage: 4.9,
  },
  {
    id: 'OL262758W',
    type: 'book',
    title: '1984',
    originalTitle: 'Nineteen Eighty-Four',
    poster: 'https://covers.openlibrary.org/b/id/12843864-L.jpg',
    year: '1949',
    overview: 'A distopia definitiva de George Orwell sobre Winston Smith lutando contra a onipresença opressiva do Grande Irmão e do Partido.',
    author: 'George Orwell',
    voteAverage: 4.7,
  },
  {
    id: 'OL15358658W',
    type: 'book',
    title: 'Torto Arado',
    originalTitle: 'Torto Arado',
    poster: 'https://covers.openlibrary.org/b/id/12560312-L.jpg',
    year: '2019',
    overview: 'Nas profundezas do sertão baiano, as irmãs Bibiana e Belonísia encontram uma velha e misteriosa faca sob a cama da avó. Uma saga épica de resistência e ancestralidade.',
    author: 'Itamar Vieira Junior',
    voteAverage: 4.9,
  },
  {
    id: 'OL263158W',
    type: 'book',
    title: 'O Senhor dos Anéis: A Sociedade do Anel',
    originalTitle: 'The Fellowship of the Ring',
    poster: 'https://covers.openlibrary.org/b/id/14441584-L.jpg',
    year: '1954',
    overview: 'O jovem hobbit Frodo Bolseiro recebe a imensa e perigosa tarefa de destruir o Um Anel nas profundezas da Montanha da Perdição em Mordor.',
    author: 'J.R.R. Tolkien',
    voteAverage: 4.9,
  },
  {
    id: 'OL82563W',
    type: 'book',
    title: 'Cem Anos de Solidão',
    originalTitle: 'Cien años de soledad',
    poster: 'https://covers.openlibrary.org/b/id/10521270-L.jpg',
    year: '1967',
    overview: 'A monumental crônica da família Buendía na mágica e isolada aldeia de Macondo, obra-prima do realismo mágico latino-americano.',
    author: 'Gabriel García Márquez',
    voteAverage: 4.8,
  },
];

function normalizeText(text?: string | null): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export async function searchOpenLibraryBooks(query: string): Promise<MediaItem[]> {
  const normQuery = normalizeText(query);
  const localMatches = POPULAR_BOOKS.filter(
    (b) =>
      normalizeText(b.title).includes(normQuery) ||
      normalizeText(b.originalTitle).includes(normQuery) ||
      (b.author && normalizeText(b.author).includes(normQuery))
  );

  try {
    const encoded = encodeURIComponent(query);
    const res = await fetch(`/api/books/search?query=${encoded}`);
    if (!res.ok) return localMatches;

    const data = await res.json();
    const results = Array.isArray(data.results) ? data.results : [];

    if (results.length === 0) return localMatches;

    // Deduplicate by title
    const seen = new Set<string>();
    const combined = [...results, ...localMatches].filter((b) => {
      const normTitle = normalizeText(b.title);
      if (seen.has(normTitle)) return false;
      seen.add(normTitle);
      return true;
    });

    return combined;
  } catch (err) {
    console.warn('Erro ao buscar livros na API, usando livros locais:', err);
    return localMatches;
  }
}

export async function searchTmdbMedia(query: string): Promise<MediaItem[]> {
  const normQuery = normalizeText(query);
  const localFallbackMatches = POPULAR_TRENDING_FALLBACK.filter(
    (m) =>
      normalizeText(m.title).includes(normQuery) ||
      normalizeText(m.originalTitle).includes(normQuery)
  );

  try {
    const res = await fetch(`/api/tmdb/search?query=${encodeURIComponent(query)}`);
    if (!res.ok) return localFallbackMatches;
    const data = await res.json();
    const results = (data.results || []).map((item: any) => ({
      id: String(item.id),
      type: (item.type === 'tv' || item.type === 'series' ? 'series' : 'movie') as 'movie' | 'series',
      title: item.title,
      originalTitle: item.originalTitle,
      poster: item.poster,
      year: item.year,
      overview: item.overview,
      voteAverage: item.voteAverage,
    }));

    if (results.length === 0) return localFallbackMatches;
    return results;
  } catch (err) {
    console.warn('Erro ao buscar filmes/séries no TMDB, usando fallback:', err);
    return localFallbackMatches;
  }
}

export const POPULAR_TRENDING_FALLBACK: MediaItem[] = [
  {
    id: '157336',
    type: 'movie',
    title: 'Interestelar',
    originalTitle: 'Interstellar',
    poster: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    year: '2014',
    overview: 'As reservas naturais da Terra estão chegando ao fim e um grupo de astronautas recebe a missão de verificar possíveis planetas para receberem a população mundial.',
    voteAverage: 8.4,
  },
  {
    id: '693134',
    type: 'movie',
    title: 'Duna: Parte 2',
    originalTitle: 'Dune: Part Two',
    poster: 'https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg',
    year: '2024',
    overview: 'Paul Atreides se une a Chani e aos Fremen enquanto busca vingança contra os conspiradores que destruíram sua família.',
    voteAverage: 8.3,
  },
  {
    id: '872585',
    type: 'movie',
    title: 'Oppenheimer',
    originalTitle: 'Oppenheimer',
    poster: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    year: '2023',
    overview: 'A história do físico americano J. Robert Oppenheimer, seu papel no Projeto Manhattan e o desenvolvimento da bomba atômica.',
    voteAverage: 8.1,
  },
  {
    id: '27205',
    type: 'movie',
    title: 'A Origem',
    originalTitle: 'Inception',
    poster: 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
    year: '2010',
    overview: 'Dom Cobb é um ladrão com a rara habilidade de roubar segredos do inconsciente durante o estado de sono.',
    voteAverage: 8.4,
  },
  {
    id: '100088',
    type: 'series',
    title: 'The Last of Us',
    originalTitle: 'The Last of Us',
    poster: 'https://image.tmdb.org/t/p/w500/uKvVjHNqB5VmOrdxqAt2V7JMrGx.jpg',
    year: '2023',
    overview: 'Vinte anos após a destruição da civilização moderna, Joel é contratado para contrabandear Ellie para fora de uma zona de quarentena opressiva.',
    voteAverage: 8.6,
  },
  {
    id: '66732',
    type: 'series',
    title: 'Stranger Things',
    originalTitle: 'Stranger Things',
    poster: 'https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
    year: '2016',
    overview: 'Quando um garoto desaparece, a pequena cidade de Hawkins descobre um mistério envolvendo experimentos secretos e forças sobrenaturais.',
    voteAverage: 8.6,
  },
  {
    id: '94605',
    type: 'series',
    title: 'Arcane',
    originalTitle: 'Arcane',
    poster: 'https://image.tmdb.org/t/p/w500/fqldf2t8ztc9aiwn397FQ3cfO0N.jpg',
    year: '2021',
    overview: 'Em meio ao conflito entre Piltover e Zaun, duas irmãs lutam em lados opostos de uma guerra entre tecnologias mágicas.',
    voteAverage: 8.7,
  },
  {
    id: '1396',
    type: 'series',
    title: 'Breaking Bad',
    originalTitle: 'Breaking Bad',
    poster: 'https://image.tmdb.org/t/p/w500/3xnWaLQjelJDDF7LT6bBo6f4BRe.jpg',
    year: '2008',
    overview: 'Ao saber que tem câncer terminal, um professor de química do ensino médio junta-se a um ex-aluno para fabricar e vender metanfetamina.',
    voteAverage: 8.9,
  },
  {
    id: '550',
    type: 'movie',
    title: 'Clube da Luta',
    originalTitle: 'Fight Club',
    poster: 'https://image.tmdb.org/t/p/w500/bptfVGEQuv6vDTIMVCHjJ9Dz8PX.jpg',
    year: '1999',
    overview: 'Um homem deprimido que sofre de insônia conhece um estranho vendedor de sabão chamado Tyler Durden.',
    voteAverage: 8.4,
  },
  {
    id: '76479',
    type: 'series',
    title: 'The Boys',
    originalTitle: 'The Boys',
    poster: 'https://image.tmdb.org/t/p/w500/2zmTngn1tYC1AvfnNDBpQI4QrEO.jpg',
    year: '2019',
    overview: 'Uma visão divertida e irreverente do que acontece quando super-heróis abusam de seus superpoderes.',
    voteAverage: 8.5,
  },
  {
    id: '1399',
    type: 'series',
    title: 'Game of Thrones',
    originalTitle: 'Game of Thrones',
    poster: 'https://image.tmdb.org/t/p/w500/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg',
    year: '2011',
    overview: 'Em uma terra onde os verões podem durar anos e o inverno uma vida, famílias nobres lutam pelo Trono de Ferro.',
    voteAverage: 8.4,
  },
  {
    id: '97546',
    type: 'series',
    title: 'Ted Lasso',
    originalTitle: 'Ted Lasso',
    poster: 'https://image.tmdb.org/t/p/w500/uRHsiw1wLxPHFXkkv4Ix1s0O6f4.jpg',
    year: '2020',
    overview: 'Ted Lasso é um técnico de futebol americano que se muda para a Inglaterra para treinar um clube da Premier League.',
    voteAverage: 8.4,
  },
];

let cachedTrendingMedia: MediaItem[] | null = null;

export async function getTrendingTmdb(): Promise<MediaItem[]> {
  if (cachedTrendingMedia && cachedTrendingMedia.length > 0) {
    return cachedTrendingMedia;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch('/api/tmdb/trending', { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn('API /api/tmdb/trending não respondeu 200, usando catálogo em alta');
      return POPULAR_TRENDING_FALLBACK;
    }

    const data = await res.json();
    const rawList = Array.isArray(data.results) ? data.results : Array.isArray(data) ? data : [];

    if (rawList.length === 0) {
      return POPULAR_TRENDING_FALLBACK;
    }

    const mapped: MediaItem[] = rawList.map((item: any) => ({
      id: String(item.id),
      type: (item.type === 'series' || item.type === 'tv' ? 'series' : 'movie') as 'movie' | 'series',
      title: item.title || item.name || 'Título Indisponível',
      originalTitle: item.originalTitle || item.original_name || item.title || '',
      poster: item.poster || (item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null),
      year: item.year ? String(item.year) : (item.release_date || item.first_air_date || '').substring(0, 4),
      overview: item.overview || '',
      voteAverage: typeof item.voteAverage === 'number' ? item.voteAverage : (item.vote_average || 0),
    }));

    if (mapped.length > 0) {
      cachedTrendingMedia = mapped;
      return mapped;
    }

    return POPULAR_TRENDING_FALLBACK;
  } catch (err) {
    console.error('Erro ao buscar trending TMDB, usando títulos populares:', err);
    return POPULAR_TRENDING_FALLBACK;
  }
}

export async function searchAllMedia(
  query: string,
  filterType: 'all' | 'movie' | 'series' | 'book' = 'all'
): Promise<MediaItem[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const tasks: Promise<MediaItem[]>[] = [];

  if (filterType === 'all' || filterType === 'movie' || filterType === 'series') {
    tasks.push(
      searchTmdbMedia(trimmed).then((items) => {
        if (filterType === 'all') return items;
        return items.filter((item) => item.type === filterType);
      })
    );
  }

  if (filterType === 'all' || filterType === 'book') {
    tasks.push(searchOpenLibraryBooks(trimmed));
  }

  const settled = await Promise.allSettled(tasks);
  const collected: MediaItem[] = [];

  for (const item of settled) {
    if (item.status === 'fulfilled' && Array.isArray(item.value)) {
      collected.push(...item.value);
    }
  }

  // Deduplicate by ID and Title
  const seenIds = new Set<string>();
  const seenKeys = new Set<string>();
  return collected.filter((item) => {
    const key = `${item.type}_${normalizeText(item.title)}`;
    if (seenIds.has(item.id) || seenKeys.has(key)) return false;
    seenIds.add(item.id);
    seenKeys.add(key);
    return true;
  });
}
