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

// TMDB Search API route
app.get('/api/tmdb/search', async (req: Request, res: Response) => {
  const query = (req.query.query as string || '').trim();
  const page = req.query.page || '1';

  if (!query) {
    return res.json({ results: [], total_results: 0 });
  }

  const token = process.env.TMDB_READ_ACCESS_TOKEN;
  const apiKey = process.env.TMDB_API_KEY;

  if (!token && !apiKey) {
    // Return filtered sample results if no TMDB credentials configured yet
    const filtered = SAMPLE_MEDIA.filter(
      (item) =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.originalTitle.toLowerCase().includes(query.toLowerCase())
    );
    return res.json({
      results: filtered,
      total_results: filtered.length,
      isFallback: true,
      notice: 'Adicione TMDB_READ_ACCESS_TOKEN em .env.local para busca completa no catálogo TMDB',
    });
  }

  try {
    let url = `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(query)}&language=pt-BR&page=${page}&include_adult=false`;
    if (!token && apiKey) {
      url += `&api_key=${apiKey}`;
    }

    const response = await fetch(url, { headers: getTmdbHeaders() });
    if (!response.ok) {
      const errText = await response.text();
      console.error('TMDB API Error:', response.status, errText);
      return res.status(response.status).json({ error: 'Erro ao buscar no TMDB', details: errText });
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

    return res.json({
      results: formatted,
      total_results: data.total_results || formatted.length,
      page: data.page || 1,
    });
  } catch (error: any) {
    console.error('Erro na rota de busca TMDB:', error);
    return res.status(500).json({ error: 'Falha interna ao contatar TMDB' });
  }
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
