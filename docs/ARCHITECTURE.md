# Arquitetura e Infraestrutura - Guide-Tour (Maître Digital)

Este documento descreve as decisões de arquitetura para o SaaS de gestão de eventos e operações.

## 1. Stack Principal (Frontend)
- **Framework:** React 18+ com Vite.
- **Linguagem:** TypeScript.
- **Estilização:** TailwindCSS + Framer Motion.
- **Mapas:** Biblioteca de mapas (ex: Leaflet via `react-leaflet` ou Mapbox) para plotagem de eventos locais.

## 2. Backend e Banco de Dados (Supabase Self-Hosted)
Todo o ecossistema de backend é centralizado no **Supabase**.
- **Postgres + RLS:** Separação estrita de dados multi-tenant (`tenant_id`).
- **Auth:** Gerenciamento de credenciais e roles (admin/user).
- **Edge Functions (Deno):** Lógica sensível, integrações de webhook e orquestração de chamadas para IAs externas.

## 3. Motor de Busca de Eventos (Firecrawl + Gemini)
O coração do módulo "Radar de Oportunidades" opera em background:
1. **Gatilho (Cron):** Uma tarefa programada (via pg_cron ou n8n externo) inicia o processo para as cidades cadastradas pelos tenants.
2. **Scraping (Firecrawl):** Execução da API Agentic do Firecrawl buscando agendas culturais.
3. **Enriquecimento (Google Gemini):** A Edge Function envia o raw text do Firecrawl para a API do Gemini, que processa, formata em JSON estruturado (Nome do Evento, Localização, Coordenadas Geográficas, Data, Estimativa de Impacto).
4. **Armazenamento:** Salvo no Postgres e plotado no frontend via Mapa.

## 4. Integrações Futuras
- **Stripe:** Gestão de assinaturas do SaaS.
- **CloudWhats.app.br:** Comunicação via API/Webhooks para captação de leads do evento.

## 5. Deploy e Infraestrutura
- **Regra de Ouro:** **100% via Nixpacks**.
- Nenhuma utilização manual de `Dockerfile` ou `docker-compose` para o frontend.