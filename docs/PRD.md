# Product Requirements Document (PRD) - Guide-Tour

## 1. Visão Geral do Produto
O Guide-Tour é uma aplicação SaaS B2B focada na organização de estabelecimentos comerciais (como lancherias e similares) e na gestão de eventos. O sistema permite que gestores organizem seu espaço de trabalho, gerenciem escalas de funcionários e freelancers, acompanhem eventos locais e estruturem guias passo-a-passo.

## 2. Público-alvo (Personas)
- **Gestor do Estabelecimento / Tenant:** Donos de lancherias ou organizadores de eventos que precisam estruturar suas equipes, acompanhar demandas e prospectar vendas baseadas no calendário da cidade.
- **Funcionários e Freelancers:** Usuários convidados pelo gestor para visualizar suas escalas, obrigações (guias) e confirmar presença/disponibilidade em eventos específicos.

## 3. Modelo de Negócios e Monetização
- **Fase Inicial:** 100% gratuito para adoção rápida no mercado.
- **Fase Futura:** Integração com Stripe para planos de assinatura (ex: limites de usuários/freelancers, limites de busca no Firecrawl, etc).

## 4. Funcionalidades Principais (Core Features)

### 4.1. Gestão de Workspace (Tenant)
- Cadastro de espaço de trabalho isolado por tenant.
- Convite e gestão de acessos para funcionários e freelancers.
- Definição do local de trabalho de cada funcionário (qual praça, qual evento, qual função).

### 4.2. Escalas e Guias (Passo a Passo)
- Criação de Guias interativos para treinar e orientar a equipe.
- Escala de funcionários com horários, atribuições e afazeres.

### 4.3. Gestão de Eventos Mensais/Anuais
- Visão de calendário em tempo real mostrando os eventos previstos.
- Organização prévia de equipes para trabalhar nos eventos que o estabelecimento cobrirá.

### 4.4. Integração de Inteligência (Firecrawl e Google Gemini)
- O sistema executará o **Firecrawl** via agente 1 vez ao dia.
- Esta busca será **individualizada por cidades configuradas pelo tenant** (consultando a API conforme definido em `docs/firecrawl/agent.md`).
- A IA do **Google Gemini** será utilizada para analisar os eventos capturados, estruturar resumos e sugerir dimensionamento de equipe ou oportunidades de vendas para o gestor.

## 5. Requisitos Não-Funcionais
- **Real-time:** Atualizações de escalas e mensagens em tempo real impulsionadas pelo Supabase.
- **Performance:** App deve carregar rápido e possuir interface responsiva e premium, com navegação otimizada (Vite + React).
- **Isolamento de Dados:** Como é uma aplicação multi-tenant, os dados (especialmente os eventos capturados pelo Firecrawl de uma cidade específica) devem estar atrelados/filtrados pela organização (RLS no Supabase).
