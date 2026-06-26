# AI Developer Instructions - Guide-Tour

Estas instruções servem como "Regras de Ouro" (Core Guidelines) para qualquer IA (LLM, Copilot, Cursor, Gemini, etc.) que for alocada para auxiliar o desenvolvimento ou refatoração do projeto Guide-Tour.
Leia este arquivo sempre que for realizar análises arquitetônicas ou antes de sugerir configurações de deploy.

## 1. Regra Absoluta de Infraestrutura (Deploy)
**VOCÊ DEVE USAR NIXPACKS.**
- NUNCA sugira a criação, edição ou utilização de um arquivo `Dockerfile`. O projeto utiliza **Nixpacks** exclusivamente para todo o build de container em produção.
- NUNCA sugira um `docker-compose.yml` para a aplicação (seja Vite ou Edge Functions) no ambiente de deploy.
- Caso o usuário pergunte sobre problemas de deploy, assuma que o ambiente alvo suporta Nixpacks (ex: Coolify, Railway, Easypanel, Flightcontrol).

## 2. Regra Absoluta de Backend e Autenticação
**O BACKEND É 100% SUPABASE (Self-Hosted).**
- Este projeto já tem o Supabase rodando auto-hospedado ao lado da aplicação.
- NUNCA sugira ferramentas terceiras para Autenticação (como NextAuth, Clerk, Firebase, Auth0). Use `supabase.auth`.
- NUNCA sugira adicionar outro ORM (Prisma, Drizzle) misturado ou outro banco (MongoDB, MySQL). Utilize **sempre** o Postgres do Supabase, via as bibliotecas oficiais `@supabase/supabase-js` e `@supabase/ssr`.
- Todo processamento de background sensível (como chamadas ao Firecrawl ou Google Gemini) DEVE ser sugerido para ser feito via **Edge Functions** (Deno) do próprio Supabase.
- Todos os dados, por se tratar de um App Multi-tenant SaaS, devem ser rigorosamente guardados sob políticas **RLS (Row Level Security)**. Se for sugerir criação de tabela, sempre lembre de sugerir habilitar o RLS.

## 3. Diretrizes Funcionais e Design System
- **UI/UX**: O alvo do app é o nicho de lancherias, organização de escalas de funcionários e gestão de eventos da cidade. O layout que a IA deve gerar precisa ser "Premium", vibrante, com micro-interações via **Framer Motion**, glassmorphism moderado, dark/light modes de extremo bom gosto, distanciando-se de visuais amadores ou com cores cruas (vermelho puro, azul puro).
- O Frontend usa Vite + React + TailwindCSS.
- As integrações com **Firecrawl (Agentic Extraction)** e **Google Gemini** são centrais no produto. As buscas do Firecrawl são rodadas 1x por dia, **individualizadas por cidades configuradas pelo tenant** (consulte as documentações locais como `docs/firecrawl/agent.md` se existirem, ao gerar a integração).
- Os resumos/tabelas/dashboards são para que os donos de estabelecimentos visualizem oportunidades (calendário anual de eventos) e programem escalas de freelancers para baterem essas demandas.

## 4. O Fluxo de Web Scraping Diário
1. O Agente de IA responsável por entender o backend deve saber que o app irá consumir a API do Firecrawl de maneira individual. 
2. A lógica reside em: Disparar um Cron (no Supabase) -> Executar uma function -> Iniciar a tarefa de Agente no Firecrawl para extração na cidade X -> Processar com Google Gemini (summarizar/classificar) -> Guardar no banco de dados isolado para aquele Workspace/Tenant.

---
**Ao ler essas instruções, a IA compreende os limites estritos do repositório, não desviando o usuário com arquiteturas paralelas (como conteinerizar o front manualmente ou migrar para bancos não-postgres).**
