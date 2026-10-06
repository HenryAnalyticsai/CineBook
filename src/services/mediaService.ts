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

export async function searchOpenLibraryBooks(query: string): Promise<MediaItem[]> {
  try {
    const encoded = encodeURIComponent(query);
    const res = await fetch(`https://openlibrary.org/search.json?q=${encoded}&limit=12`);
    if (!res.ok) return [];

    const data = await res.json();
    const docs = data.docs || [];

    return docs
      .filter((doc: any) => doc.title && (doc.cover_i || doc.isbn?.length))
      .map((doc: any): MediaItem => {
        const coverId = doc.cover_i;
        const poster = coverId
          ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
          : doc.isbn?.[0]
          ? `https://covers.openlibrary.org/b/isbn/${doc.isbn[0]}-L.jpg`
          : null;

        const workKey = doc.key ? doc.key.replace('/works/', '') : String(Math.random());
        const author = Array.isArray(doc.author_name) ? doc.author_name.join(', ') : doc.author_name || 'Autor Desconhecido';

        return {
          id: workKey,
          type: 'book',
          title: doc.title,
          originalTitle: doc.title,
          poster: poster,
          year: doc.first_publish_year ? String(doc.first_publish_year) : '',
          author: author,
          overview: doc.first_sentence ? doc.first_sentence.join(' ') : `Obra de ${author}.`,
          voteAverage: 4.5,
        };
      });
  } catch (err) {
    console.error('Erro ao buscar livros na Open Library:', err);
    return [];
  }
}

export async function searchTmdbMedia(query: string): Promise<MediaItem[]> {
  try {
    const res = await fetch(`/api/tmdb/search?query=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((item: any) => ({
      id: item.id,
      type: item.type as 'movie' | 'series',
      title: item.title,
      originalTitle: item.originalTitle,
      poster: item.poster,
      year: item.year,
      overview: item.overview,
      voteAverage: item.voteAverage,
    }));
  } catch (err) {
    console.error('Erro ao buscar filmes/séries:', err);
    return [];
  }
}

export async function getTrendingTmdb(): Promise<MediaItem[]> {
  try {
    const res = await fetch('/api/tmdb/trending');
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((item: any) => ({
      id: item.id,
      type: item.type as 'movie' | 'series',
      title: item.title,
      originalTitle: item.originalTitle,
      poster: item.poster,
      year: item.year,
      overview: item.overview,
      voteAverage: item.voteAverage,
    }));
  } catch (err) {
    console.error('Erro ao buscar trending:', err);
    return [];
  }
}

export async function searchAllMedia(
  query: string,
  filterType: 'all' | 'movie' | 'series' | 'book' = 'all'
): Promise<MediaItem[]> {
  if (!query.trim()) return [];

  const promises: Promise<MediaItem[]>[] = [];

  if (filterType === 'all' || filterType === 'movie' || filterType === 'series') {
    promises.push(
      searchTmdbMedia(query).then((items) => {
        if (filterType === 'all') return items;
        return items.filter((item) => item.type === filterType);
      })
    );
  }

  if (filterType === 'all' || filterType === 'book') {
    promises.push(
      searchOpenLibraryBooks(query).then((items) => {
        // Also check popular books list
        const popularMatch = POPULAR_BOOKS.filter((b) =>
          b.title.toLowerCase().includes(query.toLowerCase()) ||
          (b.author && b.author.toLowerCase().includes(query.toLowerCase()))
        );
        const combined = [...popularMatch, ...items];
        // Deduplicate by ID
        const seen = new Set<string>();
        return combined.filter((b) => {
          if (seen.has(b.id)) return false;
          seen.add(b.id);
          return true;
        });
      })
    );
  }

  const results = await Promise.all(promises);
  const flattened = results.flat();

  // If filtered by all, interleave nicely
  return flattened;
}
