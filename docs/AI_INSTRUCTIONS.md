# AI Developer Instructions - Guide-Tour (Maître Digital)

Estas instruções servem como "Regras de Ouro" para qualquer IA que for alocada neste projeto. Leia sempre antes de analisar ou propor código.

## 1. O Contexto do Produto
O Guide-Tour é um **SaaS B2B ("Maître Digital")** focado em Food Trucks, Trailers e Lancherias. Ele possui 3 pilares:
1. **Radar de Eventos:** Mapa interativo gerado via scraping de agendas locais.
2. **Guias Operacionais:** Passo-a-passo (SOPs) já implementado no repositório.
3. **Comunicação:** Integração futura com `cloudwhats.app.br`.
A IA deve manter esse contexto de negócio ao sugerir features ou fluxos de UX.

## 2. Regra Absoluta de Infraestrutura (Deploy)
- **USE NIXPACKS.**
- NUNCA sugira a criação ou edição de um `Dockerfile`. O projeto utiliza Nixpacks para build em produção (Easypanel/Coolify/etc).

## 3. Regra Absoluta de Backend e Banco de Dados
- **BACKEND 100% SUPABASE (Self-Hosted).**
- O frontend usa React + Vite + Tailwind.
- NUNCA sugira ORMs externos (Prisma/Drizzle) ou outro banco (MongoDB). Use as bibliotecas `@supabase/supabase-js`.
- RLS (Row Level Security) é obrigatório. Todo dado pertence a um `tenant_id`.

## 4. Regras de Integração de IA (Firecrawl e Gemini)
- O Web Scraping é feito pelo **Firecrawl (Agentic Extraction)** e processado pelo **Google Gemini**.
- O código de integração DEVE morar exclusivamente nas **Edge Functions** (Deno) em `supabase/functions/`, NUNCA no frontend em React, para proteger as chaves de API.
- Ao gerar componentes de Frontend, se baseie no uso de mapas para exibição de dados geolocalizados.
