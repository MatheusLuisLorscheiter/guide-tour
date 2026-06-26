# Product Requirements Document (PRD) - Guide-Tour (Maître Digital)

## 1. Visão Geral do Produto
O Guide-Tour evoluiu para se tornar um **"Maître Digital"**: um SaaS B2B completo para operações de gastronomia nômade (food trucks, trailers, tendas de eventos) e lancherias. O sistema atua como um orquestrador central que resolve três dores principais: descobrir onde estão os clientes (eventos), padronizar a operação para equipes rotativas (guias/SOPs) e reter clientes (integração de comunicação).

## 2. Público-alvo (Personas)
- **Gestor do Estabelecimento / Tenant:** Dono do food truck ou lancheria. Precisa encontrar eventos lucrativos, organizar a escala de freelancers para o final de semana e garantir que a operação não vire um caos.
- **Funcionários e Freelancers temporários:** Usuários que acessam o app no celular durante o evento para ver escalas, checklists de montagem e guias de preparo dos lanches.

## 3. Modelo de Negócios e Monetização
- **Estratégia de Aquisição (Risk Reversal):** Oferecer um "Mapeamento Gratuito" de eventos na região do lead.
- **Trial / Freemium:** Teste grátis para cadastrar a equipe e usar os checklists operacionais.
- **SaaS Premium:** Assinatura recorrente (via Stripe) liberando acesso contínuo ao Radar de Eventos (scraping automático) e integrações avançadas de comunicação.

## 4. Módulos Principais (Core Features)

### 4.1. Radar de Oportunidades (Event Scraper & Mapas)
- **Integração Firecrawl:** Varredura global filtrada pelas "cidades de interesse" do Tenant. Busca editais de prefeituras, Sympla e agendas culturais.
- **Visualização em Mapa:** Mapa interativo (Leaflet/Mapbox) exibindo os "pins" dos eventos próximos com estimativa de público (classificação de impacto via Gemini).
- **Gestão de Interesse:** O gestor pode marcar um evento no mapa como "Confirmado" e gerar uma escala de trabalho a partir dele.

### 4.2. Maître Operacional (Passo-a-Passo e Escalas)
- **Guias Visuais (SOPs):** Passo-a-passo de afazeres (ex: "Como montar o lanche X", "Checklist de abertura do trailer").
- **Escalas de Trabalho:** Alocação de freelancers para eventos específicos aprovados no Radar.

### 4.3. Ecossistema de Comunicação (CloudWhats)
- **Integração:** Conexão futura com `cloudwhats.app.br` para automação de mensagens, captação de leads no evento via QR Code e fidelização pós-evento.

## 5. Requisitos Não-Funcionais
- **UX/UI Premium:** Interface limpa e moderna focada em mapas e cards (Framer Motion).
- **Isolamento de Dados (Multitenancy):** Dados de eventos e guias devem ser estritamente separados por Tenant via RLS no Supabase.
