import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Curated fallback titles if no TMDB token is configured yet
const SAMPLE_MEDIA = [
  {
    id: '550',
    type: 'movie',
    title: 'Clube da Luta',
    originalTitle: 'Fight Club',
    poster: 'https://image.tmdb.org/t/p/w500/bptfVGEQuv6vDTIMVCHjJ9Dz8PX.jpg',
    year: '1999',
    overview: 'Um homem deprimido que sofre de insônia conhece um estranho vendedor de sabão chamado Tyler Durden e logo se vê morando em uma casa decrépita após seu apartamento perfeito ser destruído.',
    voteAverage: 8.4,
  },
  {
    id: '27205',
    type: 'movie',
    title: 'A Origem',
    originalTitle: 'Inception',
    poster: 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
    year: '2010',
    overview: 'Dom Cobb é um ladrão com a rara habilidade de roubar segredos do inconsciente, durante o estado de sono. Impedido de retornar para sua família, ele recebe uma oportunidade de redenção.',
    voteAverage: 8.4,
  },
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
    id: '1399',
    type: 'series',
    title: 'Game of Thrones',
    originalTitle: 'Game of Thrones',
    poster: 'https://image.tmdb.org/t/p/w500/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg',
    year: '2011',
    overview: 'Em uma terra onde os verões podem durar vários anos e o inverno uma vida inteira, sete famílias nobres lutam pelo controle da mítica terra de Westeros.',
    voteAverage: 8.4,
  },
  {
    id: '1396',
    type: 'series',
    title: 'Breaking Bad',
    originalTitle: 'Breaking Bad',
    poster: 'https://image.tmdb.org/t/p/w500/3xnWaLQjelJDDF7LT6bBo6f4BRe.jpg',
    year: '2008',
    overview: 'Ao saber que tem câncer terminal, um professor de química do ensino médio junta-se a um ex-aluno para fabricar e vender metanfetamina e garantir o futuro de sua família.',
    voteAverage: 8.9,
  },
  {
    id: '66732',
    type: 'series',
    title: 'Stranger Things',
    originalTitle: 'Stranger Things',
    poster: 'https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
    year: '2016',
    overview: 'Quando um garoto desaparece, a pequena cidade de Hawkins descobre um mistério envolvendo experimentos secretos, forças sobrenaturais e uma garota com poderes estranhos.',
    voteAverage: 8.6,
  },
  {
    id: '129',
    type: 'movie',
    title: 'A Viagem de Chihiro',
    originalTitle: '千と千尋の神隠し',
    poster: 'https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg',
    year: '2001',
    overview: 'Chihiro e seus pais estão se mudando para uma cidade diferente. A caminho da nova casa, o pai decide pegar um atalho. Eles se deparam com uma mesa repleta de comida, e os pais de Chihiro começam a comer freneticamente.',
    voteAverage: 8.5,
  },
  {
    id: '94605',
    type: 'series',
    title: 'Arcane',
    originalTitle: 'Arcane',
    poster: 'https://image.tmdb.org/t/p/w500/fqldf2t8ztc9aiwn397FQ3cfO0N.jpg',
    year: '2021',
    overview: 'Em meio ao conflito entre as cidades-gêmeas de Piltover e Zaun, duas irmãs lutam em lados opostos de uma guerra entre tecnologias mágicas e convicções incompatíveis.',
    voteAverage: 8.7,
  },
  {
    id: '872585',
    type: 'movie',
    title: 'Oppenheimer',
    originalTitle: 'Oppenheimer',
    poster: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    year: '2023',
    overview: 'A história do físico americano J. Robert Oppenheimer, seu papel no Projeto Manhattan e o desenvolvimento da bomba atômica durante a Segunda Guerra Mundial.',
    voteAverage: 8.1,
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
    id: '238',
    type: 'movie',
    title: 'O Poderoso Chefão',
    originalTitle: 'The Godfather',
    poster: 'https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
    year: '1972',
    overview: 'O patriarca idoso de uma dinastia do crime organizado transfere o controle de seu império clandestino para seu filho relutante.',
    voteAverage: 8.7,
  },
  {
    id: '76479',
    type: 'series',
    title: 'The Boys',
    originalTitle: 'The Boys',
    poster: 'https://image.tmdb.org/t/p/w500/2zmTngn1tYC1AvfnNDBpQI4QrEO.jpg',
    year: '2019',
    overview: 'Uma visão divertida e irreverente do que acontece quando os super-heróis abusam de seus superpoderes em vez de usá-los para o bem.',
    voteAverage: 8.5,
  }
];

function getTmdbHeaders(): Record<string, string> {
  const token = process.env.TMDB_READ_ACCESS_TOKEN;
  if (token) {
    return {
      Authorization: `Bearer ${token.trim()}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

function normalizeText(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

const CURATED_BOOKS = [
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
    overview: 'Um piloto cai no deserto do Saara e encontra um jovem príncipe vindo de um minúsculo asteroide. Uma fábula poética sobre o amor e a amizade.',
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
    id: 'OL1168007W',
    type: 'book',
    title: 'A Revolução dos Bichos',
    originalTitle: 'Animal Farm',
    poster: 'https://covers.openlibrary.org/b/id/11261342-L.jpg',
    year: '1945',
    overview: 'Uma sátira política clássica em que os animais da Fazenda do Solar se rebelam contra seus donos humanos em busca de igualdade.',
    author: 'George Orwell',
    voteAverage: 4.8,
  },
  {
    id: 'OL15358658W',
    type: 'book',
    title: 'Torto Arado',
    originalTitle: 'Torto Arado',
    poster: 'https://covers.openlibrary.org/b/id/12560312-L.jpg',
    year: '2019',
    overview: 'Nas profundezas do sertão baiano, as irmãs Bibiana e Belonísia encontram uma misteriosa faca. Uma saga épica de resistência e ancestralidade.',
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
    overview: 'O jovem hobbit Frodo Bolseiro recebe a imensa e perigosa tarefa de destruir o Um Anel nas profundezas de Mordor.',
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
    overview: 'A monumental crônica da família Buendía na mágica e mística aldeia de Macondo.',
    author: 'Gabriel García Márquez',
    voteAverage: 4.8,
  },
  {
    id: 'OL82586W',
    type: 'book',
    title: 'Harry Potter e a Pedra Filosofal',
    originalTitle: "Harry Potter and the Philosopher's Stone",
    poster: 'https://covers.openlibrary.org/b/id/10521270-L.jpg',
    year: '1997',
    overview: 'O jovem bruxo órfão Harry Potter descobre sua verdadeira herança mágica e ingressa na Escola de Magia e Bruxaria de Hogwarts.',
    author: 'J.K. Rowling',
    voteAverage: 4.9,
  },
  {
    id: 'OL82587W',
    type: 'book',
    title: 'Harry Potter e o Prisioneiro de Azkaban',
    originalTitle: 'Harry Potter and the Prisoner of Azkaban',
    poster: 'https://covers.openlibrary.org/b/id/10521271-L.jpg',
    year: '1999',
    overview: 'Em seu terceiro ano em Hogwarts, Harry investiga a fuga de Sirius Black da temida prisão de bruxos Azkaban.',
    author: 'J.K. Rowling',
    voteAverage: 4.9,
  },
  {
    id: 'OL262752W',
    type: 'book',
    title: 'O Hobbit',
    originalTitle: 'The Hobbit',
    poster: 'https://covers.openlibrary.org/b/id/12843865-L.jpg',
    year: '1937',
    overview: 'Bilbo Bolseiro vive uma vida pacata até ser arrastado pelo mago Gandalf e treze anões em uma expedição para resgatar um tesouro guardado por Smaug.',
    author: 'J.R.R. Tolkien',
    voteAverage: 4.8,
  },
  {
    id: 'OL491702W',
    type: 'book',
    title: 'Percy Jackson e o Ladrão de Raios',
    originalTitle: 'The Lightning Thief',
    poster: 'https://covers.openlibrary.org/b/id/8302526-L.jpg',
    year: '2005',
    overview: 'Percy Jackson descobre que é um semideus, filho de Poseidon, e é acusado injustamente de ter roubado o raio-mestre de Zeus.',
    author: 'Rick Riordan',
    voteAverage: 4.8,
  },
  {
    id: 'OL2163458W',
    type: 'book',
    title: 'Memórias Póstumas de Brás Cubas',
    originalTitle: 'Memórias Póstumas de Brás Cubas',
    poster: 'https://covers.openlibrary.org/b/id/8231852-L.jpg',
    year: '1881',
    overview: 'Um defunto autor narra sua vida com ironia cáustica e humor refinado, revolucionando a literatura brasileira.',
    author: 'Machado de Assis',
    voteAverage: 4.9,
  },
  {
    id: 'OL2163460W',
    type: 'book',
    title: 'A Hora da Estrela',
    originalTitle: 'A Hora da Estrela',
    poster: 'https://covers.openlibrary.org/b/id/8231850-L.jpg',
    year: '1977',
    overview: 'A tocante e poética história da jovem alagoana Macabéa no Rio de Janeiro, narrada pelo escritor Rodrigo S.M.',
    author: 'Clarice Lispector',
    voteAverage: 4.8,
  },
  {
    id: 'OL2163465W',
    type: 'book',
    title: 'Capitães da Areia',
    originalTitle: 'Capitães da Areia',
    poster: 'https://covers.openlibrary.org/b/id/8231855-L.jpg',
    year: '1937',
    overview: 'A comovente saga de um grupo de meninos abandonados que vivem em um trapiche abandonado nas praias de Salvador.',
    author: 'Jorge Amado',
    voteAverage: 4.8,
  },
  {
    id: 'OL263159W',
    type: 'book',
    title: 'Duna',
    originalTitle: 'Dune',
    poster: 'https://covers.openlibrary.org/b/id/12843869-L.jpg',
    year: '1965',
    overview: 'No planeta desértico Arrakis, o jovem Paul Atreides enfrenta traições e se torna o messias profetizado de um povo guerreiro.',
    author: 'Frank Herbert',
    voteAverage: 4.8,
  },
  {
    id: 'OL263160W',
    type: 'book',
    title: 'O Alquimista',
    originalTitle: 'O Alquimista',
    poster: 'https://covers.openlibrary.org/b/id/12843870-L.jpg',
    year: '1988',
    overview: 'A jornada mágica do pastor andaluz Santiago pelo deserto egípcio em busca de sua Lenda Pessoal e de um tesouro escondido.',
    author: 'Paulo Coelho',
    voteAverage: 4.6,
  },
  {
    id: 'OL263161W',
    type: 'book',
    title: 'É Assim Que Acaba',
    originalTitle: 'It Ends with Us',
    poster: 'https://covers.openlibrary.org/b/id/12843871-L.jpg',
    year: '2016',
    overview: 'Lily Bloom vive um relacionamento intenso e complexo, precisando tomar as decisões mais difíceis de sua vida.',
    author: 'Colleen Hoover',
    voteAverage: 4.7,
  },
];

// TMDB Search API route
app.get('/api/tmdb/search', async (req: Request, res: Response) => {
  const query = (req.query.query as string || '').trim();
  const page = req.query.page || '1';

  if (!query) {
    return res.json({ results: [], total_results: 0 });
  }

  const token = process.env.TMDB_READ_ACCESS_TOKEN;
  const apiKey = process.env.TMDB_API_KEY;
  const normQuery = normalizeText(query);

  const fallbackFiltered = SAMPLE_MEDIA.filter(
    (item) =>
      normalizeText(item.title).includes(normQuery) ||
      normalizeText(item.originalTitle).includes(normQuery)
  );

  if (!token && !apiKey) {
    return res.json({
      results: fallbackFiltered,
      total_results: fallbackFiltered.length,
      isFallback: true,
      notice: 'Adicione TMDB_READ_ACCESS_TOKEN em .env.local para busca completa no catálogo TMDB',
    });
  }

  try {
    let url = `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(query)}&language=pt-BR&page=${page}&include_adult=false`;
    if (!token && apiKey) {
      url += `&api_key=${apiKey}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, { headers: getTmdbHeaders(), signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn('TMDB search not OK, status:', response.status);
      return res.json({ results: fallbackFiltered, total_results: fallbackFiltered.length, isFallback: true });
    }

    const data = await response.json();
    const formatted = (data.results || [])
      .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
      .map((item: any) => ({
        id: String(item.id),
        type: item.media_type === 'tv' ? 'series' : 'movie',
        title: item.title || item.name || '',
        originalTitle: item.original_title || item.original_name || '',
        poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
        year: (item.release_date || item.first_air_date || '').substring(0, 4),
        overview: item.overview || '',
        voteAverage: item.vote_average || 0,
      }));

    const finalResults = formatted.length > 0 ? formatted : fallbackFiltered;

    return res.json({
      results: finalResults,
      total_results: data.total_results || finalResults.length,
      page: data.page || 1,
    });
  } catch (error: any) {
    console.error('Erro na rota de busca TMDB, usando catálogo popular:', error);
    return res.json({ results: fallbackFiltered, total_results: fallbackFiltered.length, isFallback: true });
  }
});

// Books Search API route (Open Library + Livros Populares com Cores e Sinopses)
app.get('/api/books/search', async (req: Request, res: Response) => {
  const query = (req.query.query as string || '').trim();

  if (!query) {
    return res.json({ results: [] });
  }

  const normQuery = normalizeText(query);

  // Filtra primeiro livros populares locais (ultra-rápido e garantido)
  const curatedMatches = CURATED_BOOKS.filter(
    (b) =>
      normalizeText(b.title).includes(normQuery) ||
      normalizeText(b.originalTitle).includes(normQuery) ||
      (b.author && normalizeText(b.author).includes(normQuery))
  );

  let openLibraryResults: any[] = [];
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const olRes = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=14`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (olRes.ok) {
      const olData = await olRes.json();
      const docs = olData.docs || [];
      openLibraryResults = docs
        .filter((doc: any) => doc.title)
        .map((doc: any) => {
          const coverId = doc.cover_i;
          const poster = coverId
            ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
            : doc.isbn?.[0]
            ? `https://covers.openlibrary.org/b/isbn/${doc.isbn[0]}-L.jpg`
            : null;

          const workKey = doc.key ? doc.key.replace('/works/', '') : `ol_${Math.random()}`;
          const author = Array.isArray(doc.author_name)
            ? doc.author_name.join(', ')
            : doc.author_name || 'Autor Desconhecido';

          return {
            id: workKey,
            type: 'book',
            title: doc.title,
            originalTitle: doc.title,
            poster: poster,
            year: doc.first_publish_year ? String(doc.first_publish_year) : '',
            author: author,
            overview: doc.first_sentence ? (Array.isArray(doc.first_sentence) ? doc.first_sentence.join(' ') : doc.first_sentence) : `Livro de ${author}.`,
            voteAverage: 4.6,
          };
        });
    }
  } catch (err) {
    console.warn('Erro ao consultar Open Library no servidor, usando livros locais:', err);
  }

  // Combina e remove duplicatas por ID ou título
  const combined = [...curatedMatches, ...openLibraryResults];
  const seenTitles = new Set<string>();
  const uniqueResults = combined.filter((b) => {
    const normTitle = normalizeText(b.title);
    if (seenTitles.has(normTitle)) return false;
    seenTitles.add(normTitle);
    return true;
  });

  return res.json({ results: uniqueResults });
});

// TMDB Trending / Destaques
app.get('/api/tmdb/trending', async (req: Request, res: Response) => {
  const token = process.env.TMDB_READ_ACCESS_TOKEN;
  const apiKey = process.env.TMDB_API_KEY;

  if (!token && !apiKey) {
    return res.json({ results: SAMPLE_MEDIA, isFallback: true });
  }

  try {
    let url = 'https://api.themoviedb.org/3/trending/all/week?language=pt-BR';
    if (!token && apiKey) {
      url += `&api_key=${apiKey}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      headers: getTmdbHeaders(),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return res.json({ results: SAMPLE_MEDIA, isFallback: true });
    }

    const data = await response.json();
    const formatted = (data.results || [])
      .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
      .map((item: any) => ({
        id: String(item.id),
        type: item.media_type === 'tv' ? 'series' : 'movie',
        title: item.title || item.name || '',
        originalTitle: item.original_title || item.original_name || '',
        poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
        year: (item.release_date || item.first_air_date || '').substring(0, 4),
        overview: item.overview || '',
        voteAverage: item.vote_average || 0,
      }));

    const finalResults = formatted.length > 0 ? formatted : SAMPLE_MEDIA;
    return res.json({ results: finalResults });
  } catch (error) {
    console.error('Erro no trending TMDB, usando catálogo popular:', error);
    return res.json({ results: SAMPLE_MEDIA, isFallback: true });
  }
});

// TMDB Status check route
app.get('/api/tmdb/status', (req: Request, res: Response) => {
  const hasToken = Boolean(process.env.TMDB_READ_ACCESS_TOKEN || process.env.TMDB_API_KEY);
  res.json({
    configured: hasToken,
    message: hasToken
      ? 'Chave do TMDB ativa no servidor com segurança.'
      : 'Modo demonstração com filmes e séries populares em pt-BR ativo. Adicione TMDB_READ_ACCESS_TOKEN em .env.local para catálogo completo.',
  });
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cinebook server rodando na porta ${PORT}`);
  });
}

startServer();
