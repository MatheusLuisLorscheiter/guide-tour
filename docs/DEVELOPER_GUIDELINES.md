# Guia para Desenvolvedores (Developer Guidelines) - Guide-Tour

Este documento serve como a principal referência para desenvolvedores humanos que irão trabalhar no projeto Guide-Tour. Leia com atenção as diretrizes arquitetônicas em `docs/ARCHITECTURE.md` antes de começar.

## 1. Setup Local

### 1.1 Pré-requisitos
- **Node.js**: Versão mais recente LTS (ou via gerenciador de versão).
- **pnpm**: Gerenciador de pacotes oficial do repositório (`npm install -g pnpm`).
- **Supabase CLI**: Ferramenta de linha de comando para rodar e gerenciar o backend localmente (`npm install -g supabase`).

### 1.2 Rodando o Projeto
1. Instale as dependências na raiz:
   ```bash
   pnpm install
   ```
2. Inicie o backend do Supabase localmente (certifique-se de que o Docker Desktop está rodando apenas para este simulador local, ou inicie o backend hospedado via chaves de API):
   ```bash
   supabase start
   ```
3. O Supabase start irá prover as credenciais locais (`API URL` e `anon key`). Preencha essas informações no seu arquivo `.env.local`:
   ```env
   VITE_SUPABASE_URL=http://127.0.0.1:54321
   VITE_SUPABASE_ANON_KEY=sua_chave_anonima_local
   ```
4. Inicie o frontend:
   ```bash
   pnpm run dev
   ```

## 2. Padrões de Código
- **Tipagem (TypeScript)**: Todo código novo deve ser estritamente tipado. Evite usar `any`. As tipagens do banco de dados (geradas pelo Supabase) devem ser mantidas sincronizadas.
- **Componentização**: Utilize abordagens de componentes limpos. Para UI base, prefira classes Tailwind em conjunto com `clsx` e `tailwind-merge`.
- **Layouts UI**: A interface deve ser dinâmica, moderna e premium. Use e abuse das animações com `framer-motion` para melhorar a experiência do usuário. Nada de cores sólidas e padrões genéricos, a aplicação precisa passar credibilidade e ter um tom sério porém dinâmico.

## 3. Gestão de Banco de Dados (Migrations)
Como usamos o Supabase, as mudanças no schema do banco de dados **jamais** devem ser feitas manualmente no painel de produção/hospedagem.
- Crie uma migration sempre que for mudar o banco:
  ```bash
  supabase migration new minha_nova_tabela
  ```
- Edite o arquivo `.sql` gerado dentro de `supabase/migrations/` e execute:
  ```bash
  supabase db reset
  ```
Isso garante que o time todo tem o mesmo banco de dados sincronizado pelo controle de versão.

## 4. Integrações Externas
Se for mexer com o **Firecrawl** ou **Google Gemini**, toda lógica deve viver em uma **Edge Function** dentro de `supabase/functions/`. O frontend Vite nunca deve chamar as APIs do Firecrawl ou Gemini diretamente, para não expor as chaves secretas.

O Firecrawl rodará 1 vez ao dia para cidades configuradas, portanto os testes na Edge Function não devem sobrecarregar a API do Firecrawl desnecessariamente na máquina local.

## 5. Deploy
- O repositório foi feito para usar **Nixpacks** exclusivamente.
- Não crie ou faça merge de `Dockerfiles`.
- Qualquer dependência de sistema que o app precise, configure de acordo com a sintaxe ou ferramentas do Nixpacks (se necessário, através do provedor).
