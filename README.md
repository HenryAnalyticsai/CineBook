# Cinebook - Rede Social para Filmes, Séries e Livros

Cinebook é uma rede social no estilo Instagram focada em amantes de filmes, séries e livros. Permite criar resenhas com avaliação de 1 a 5 estrelas, manter listas organizadas ("Quero ver/ler", "Em andamento", "Concluído"), curtir publicações em tempo real e seguir outros usuários.

---

## 🏗️ Stack Tecnológica & Arquitetura

- **Frontend & Full-Stack:** React 19 + TypeScript + Express (Backend para rotas `/api/*`) / Compatível com Next.js 15 (App Router).
- **CSS:** CSS Puro, Mobile-first, suporte automático aos modos Claro e Escuro (`prefers-color-scheme`), com foco visível no teclado (`:focus-visible`).
- **Autenticação:** Firebase Auth (Google Sign-In e Celular com DDD + SMS, prefixo +55 automático e reCAPTCHA invisível).
- **Banco de Dados:** Cloud Firestore com regras de segurança rigorosas.
- **Filmes e Séries:** The Movie Database (TMDB) API em português (`pt-BR`).
- **Livros:** Open Library (API aberta sem necessidade de chave).
- **Segurança de Segredos:** O token v4 do TMDB fica exclusivamente no servidor (`.env.local` / rotas `/api/tmdb/*`) e nunca é exposto ao navegador.

---

## 🔒 Segurança e Privacidade de Dados

1. **Privacidade do Usuário por Celular:**
   Conforme especificado, o número de telefone **nunca é exposto publicamente**. O nome exibido no perfil para usuários que ingressam via celular é automaticamente formatado como `Usuário[XXXX]` (composto pelo prefixo "Usuário" seguido dos 4 primeiros caracteres do UID).
2. **Proteção do Token TMDB:**
   O token de acesso de leitura (v4 Bearer) ou chave de API do TMDB é injetado apenas nas rotas do servidor em `server.ts` (`/api/tmdb/search`, `/api/tmdb/trending`). O frontend consome apenas essas rotas proxy internas.
3. **Regras de Segurança do Firestore (`firestore.rules`):**
   - Leitura de posts, likes e listas é pública.
   - Escrita é restrita exclusivamente ao proprietário do registro (`request.auth.uid == userId` ou `authorId`).
   - Validação matemática de nota (inteiro estritamente entre 1 e 5).
   - Validação do tamanho do texto da resenha (até 1.000 caracteres).
   - O contador `likeCount` só pode variar de 1 em 1 unidade.

---

## 🚀 Instalação e Execução

### 1. Clonar e Instalar Dependências
```bash
npm install
```

### 2. Configurar o Arquivo `.env.local`
Crie um arquivo `.env.local` na raiz do projeto (este arquivo já está no `.gitignore`):
```env
# Token de leitura v4 do TMDB (Bearer) - Obrigatório para busca no catálogo completo:
TMDB_READ_ACCESS_TOKEN="seu_token_v4_aqui"

# Opcional (Chave v3):
TMDB_API_KEY="sua_chave_v3_aqui"
```

> **Nota:** Se você executar o projeto sem fornecer o token do TMDB, o Cinebook ativará automaticamente o **Modo Demonstração com Títulos Populares em pt-BR** e busca completa na Open Library, permitindo navegar, avaliar e testar sem travamentos.

### 3. Configurar o Firebase
1. Acesse o [Firebase Console](https://console.firebase.google.com/).
2. Em **Authentication > Sign-in method**:
   - Ative **Google**.
   - Ative **Telefone** (você pode cadastrar números de teste como `+55 11 99999-9999` com o código `123456` para testar SMS sem custo).
3. Em **Authentication > Settings > Authorized domains**:
   - Adicione o domínio ou localhost onde a aplicação estiver rodando.
4. Em **Firestore Database**:
   - Crie a instância do banco de dados.
   - Copie o conteúdo de `firestore.rules` e cole na aba **Regras (Rules)** do Firestore, clicando em **Publicar**.

### 4. Rodar o Projeto
```bash
npm run dev
```
Acesse a aplicação em `http://localhost:3000`.

---

## 🧪 Roteiro de Testes Passo a Passo

1. **Login com Google e Celular:**
   - Clique em **Entrar** no cabeçalho.
   - Teste o login com Google via popup.
   - Saia e teste o login por Celular: digite DDD + número (ex: `11 98765-4321`). O sistema aplica automaticamente o prefixo `+55`. Insira o código SMS recebido.
   - Verifique que o nome do usuário gerado é `Usuário[XXXX]`.
2. **Busca Unificada:**
   - Acesse a aba **Buscar**.
   - Pesquise por títulos como "Interestelar", "Game of Thrones", "Dom Casmurro" ou "1984".
   - Alterne os filtros entre "Todos", "Filmes", "Séries" e "Livros".
3. **Listas Pessoais:**
   - Clique em qualquer título para abrir os detalhes.
   - Adicione à lista "Quero ver/ler", "Em andamento" ou "Concluído".
   - Abra a aba **Listas** e confira a contagem e a organização dos títulos salvos.
4. **Criação de Resenha:**
   - Clique no botão central **(+) Publicar**.
   - Selecione a obra desejada, marque a avaliação de 1 a 5 estrelas e digite o texto.
   - Observe o contador de até 1.000 caracteres e publique.
5. **Feed & Curtidas:**
   - Na aba **Início**, verifique a resenha recém-criada no topo da aba "Recentes".
   - Clique no ícone de coração para curtir: observe a contagem atualizar em tempo real no Firestore.
   - Alterne para a aba "Seguindo".
6. **Perfil e Seguir:**
   - Clique no nome de qualquer autor para ver o perfil completo dele.
   - Clique em **Seguir / Deixar de Seguir**.
7. **Download do Projeto em .ZIP:**
   - No topo do app, clique no botão de download para gerar e baixar o arquivo `cinebook-projeto-completo.zip`.

---

## ⚠️ Lista de Erros Comuns e Soluções

### 1. `auth/unauthorized-domain`
- **Sintoma:** Ao clicar no login com Google ou celular, o Firebase retorna erro de domínio não autorizado.
- **Causa:** O domínio atual da aplicação (URL do navegador) não está na lista de permissões do Firebase.
- **Solução:** No Firebase Console, vá em **Authentication > Settings > Authorized domains** e adicione o domínio atual.

### 2. `permission-denied` (Permissões insuficientes no Firestore)
- **Sintoma:** As resenhas ou listas não salvam e exibem erro no console.
- **Causa:** O Firestore ainda está com as regras de bloqueio padrão ou as regras não foram publicadas.
- **Solução:** Copie o arquivo `firestore.rules` deste repositório e publique-o no Firebase Console na aba **Regras**.

### 3. `auth/operation-not-allowed` (Telefone / Celular)
- **Sintoma:** Ao tentar enviar SMS com DDD, o app acusa que a operação não é permitida.
- **Causa:** O provedor "Telefone" não foi ativado no Firebase Authentication.
- **Solução:** Vá em **Authentication > Sign-in method > Telefone** e marque como ativado.

### 4. `Token TMDB inválido ou expirado`
- **Sintoma:** Busca de filmes retorna vazio ou mensagem de erro.
- **Causa:** A chave v4 colocada em `.env.local` está incorreta ou sem os caracteres completos do token Bearer.
- **Solução:** Obtenha o **API Read Access Token (v4)** em [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api) e cole sem aspas extras no arquivo `.env.local`.

---

## 🎬 Atribuição Legal TMDB
Este produto usa a API do TMDB, mas não é endossado ou certificado pelo TMDB.
Metadados de livros disponibilizados publicamente pela Open Library.
