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

const FALLBACK_CLIENT_TMDB_KEY = '5c98fcb0fe9f98d3a981009fc882faf6';

function getClientTmdbCredentials() {
  const token = (
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TMDB_READ_ACCESS_TOKEN) as string | undefined
  )?.trim();
  const apiKey = (
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TMDB_API_KEY as string | undefined) ||
    FALLBACK_CLIENT_TMDB_KEY
  ).trim();
  return { token, apiKey };
}

async function fetchDirectTmdbSearch(query: string): Promise<MediaItem[]> {
  const { token, apiKey } = getClientTmdbCredentials();
  let url = `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(query)}&language=pt-BR&page=1&include_adult=false`;
  if (!token && apiKey) {
    url += `&api_key=${apiKey}`;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6500);
  try {
    const res = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || [])
      .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
      .map((item: any) => ({
        id: String(item.id),
        type: (item.media_type === 'tv' ? 'series' : 'movie') as 'movie' | 'series',
        title: item.title || item.name || '',
        originalTitle: item.original_title || item.original_name || '',
        poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
        year: (item.release_date || item.first_air_date || '').substring(0, 4),
        overview: item.overview || '',
        voteAverage: item.vote_average || 0,
      }));
  } catch (err) {
    clearTimeout(timeoutId);
    return [];
  }
}

async function fetchDirectTmdbTrending(): Promise<MediaItem[]> {
  const { token, apiKey } = getClientTmdbCredentials();
  let url = 'https://api.themoviedb.org/3/trending/all/week?language=pt-BR';
  if (!token && apiKey) {
    url += `&api_key=${apiKey}`;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6500);
  try {
    const res = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || [])
      .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
      .map((item: any) => ({
        id: String(item.id),
        type: (item.media_type === 'tv' ? 'series' : 'movie') as 'movie' | 'series',
        title: item.title || item.name || '',
        originalTitle: item.original_title || item.original_name || '',
        poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
        year: (item.release_date || item.first_air_date || '').substring(0, 4),
        overview: item.overview || '',
        voteAverage: item.vote_average || 0,
      }));
  } catch (err) {
    clearTimeout(timeoutId);
    return [];
  }
}

export async function searchOpenLibraryBooks(query: string): Promise<MediaItem[]> {
  const normQuery = normalizeText(query);
  const localMatches = POPULAR_BOOKS.filter(
    (b) =>
      normalizeText(b.title).includes(normQuery) ||
      normalizeText(b.originalTitle).includes(normQuery) ||
      (b.author && normalizeText(b.author).includes(normQuery))
  );

  let fetchedDocs: any[] = [];
  try {
    const encoded = encodeURIComponent(query);
    const res = await fetch(`/api/books/search?query=${encoded}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.results) && data.results.length > 0) {
        return data.results;
      }
    } else {
      // Direct client fetch fallback para Open Library caso a rota de servidor não exista (deploy estático)
      const olRes = await fetch(`https://openlibrary.org/search.json?q=${encoded}&limit=12`);
      if (olRes.ok) {
        const olData = await olRes.json();
        fetchedDocs = (olData.docs || []).map((doc: any) => {
          const coverId = doc.cover_i;
          const poster = coverId
            ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
            : doc.isbn?.[0]
            ? `https://covers.openlibrary.org/b/isbn/${doc.isbn[0]}-L.jpg`
            : null;
          const author = Array.isArray(doc.author_name)
            ? doc.author_name.join(', ')
            : doc.author_name || 'Autor Desconhecido';
          return {
            id: doc.key ? doc.key.replace('/works/', '') : `ol_${Math.random()}`,
            type: 'book' as const,
            title: doc.title,
            originalTitle: doc.title,
            poster,
            year: doc.first_publish_year ? String(doc.first_publish_year) : '',
            author,
            overview: doc.first_sentence ? (Array.isArray(doc.first_sentence) ? doc.first_sentence.join(' ') : doc.first_sentence) : `Livro de ${author}.`,
            voteAverage: 4.6,
          };
        });
      }
    }
  } catch (err) {
    console.warn('Erro ao buscar livros na API, usando livros locais:', err);
  }

  // Deduplicate by title
  const seen = new Set<string>();
  const combined = [...fetchedDocs, ...localMatches].filter((b) => {
    const normTitle = normalizeText(b.title);
    if (seen.has(normTitle)) return false;
    seen.add(normTitle);
    return true;
  });

  return combined;
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
    if (res.ok) {
      const data = await res.json();
      if (!data.isFallback && Array.isArray(data.results) && data.results.length > 0) {
        return data.results.map((item: any) => ({
          id: String(item.id),
          type: (item.type === 'tv' || item.type === 'series' ? 'series' : 'movie') as 'movie' | 'series',
          title: item.title,
          originalTitle: item.originalTitle,
          poster: item.poster,
          year: item.year,
          overview: item.overview,
          voteAverage: item.voteAverage,
        }));
      }
    }

    // Se o backend retornou fallback ou se está em deploy estático fora do IA Studio (404 no /api/tmdb),
    // busca diretamente na API do TMDB com CORS
    const directResults = await fetchDirectTmdbSearch(query);
    if (directResults.length > 0) {
      return directResults;
    }

    return localFallbackMatches;
  } catch (err) {
    console.warn('Erro ao conectar via proxy, tentando TMDB direto:', err);
    try {
      const directResults = await fetchDirectTmdbSearch(query);
      if (directResults.length > 0) return directResults;
    } catch {
      // fallback
    }
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

    if (res.ok) {
      const data = await res.json();
      if (!data.isFallback && Array.isArray(data.results) && data.results.length > 0) {
        const mapped: MediaItem[] = data.results.map((item: any) => ({
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
      }
    }

    // Se o backend retornou fallback ou deploy estático fora do IA Studio,
    // busca diretamente da API do TMDB
    const directTrending = await fetchDirectTmdbTrending();
    if (directTrending.length > 0) {
      cachedTrendingMedia = directTrending;
      return directTrending;
    }

    return POPULAR_TRENDING_FALLBACK;
  } catch (err) {
    console.warn('Erro ao conectar via proxy no trending, tentando TMDB direto:', err);
    try {
      const directTrending = await fetchDirectTmdbTrending();
      if (directTrending.length > 0) {
        cachedTrendingMedia = directTrending;
        return directTrending;
      }
    } catch {
      // fallback
    }
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
