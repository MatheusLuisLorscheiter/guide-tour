# Guia para Desenvolvedores - Guide-Tour

## 1. Foco Atual do Desenvolvimento
O app evoluiu de um simples criador de guias para um **SaaS de Mapa de Eventos + Operação**. Ao desenvolver novas features, priorize a integração visual entre os Eventos (no Mapa) e as Escalas/Guias de trabalho.

## 2. Padrões de Interface (UI/UX)
- **Visualização Primária:** A dashboard principal deve focar no Mapa de Eventos e no Calendário.
- A aplicação é voltada para donos de negócios (Tenants). A UI deve passar segurança e alta tecnologia (Clean, Glassmorphism leve, sombras suaves).
- Ao trabalhar com Mapas (Leaflet/Mapbox), garanta que os componentes não quebrem o layout responsivo do Tailwind.

## 3. Segurança e Supabase RLS
- **TUDO é Multi-tenant.** Sempre que criar uma tabela nova (ex: `event_leads`, `map_bookmarks`), inclua a coluna `tenant_id` e configure as Row Level Security (RLS) policies.
- Não faça chamadas diretas com chaves secretas do Firecrawl ou Gemini pelo cliente Vite. Utilize o diretório `supabase/functions/` para isso.

## 4. Banco de Dados (Migrations)
- Modificações de banco (como adicionar suporte a coordenadas de latitude/longitude na tabela `events`) DEVEM ser feitas criando novos arquivos SQL em `supabase/migrations/` e rodando `supabase db reset`.
