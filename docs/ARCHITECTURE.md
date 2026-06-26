# Arquitetura e Infraestrutura - Guide-Tour

Este documento descreve as decisões de arquitetura e a pilha de tecnologias escolhidas para o projeto Guide-Tour. A conformidade com estas diretrizes é obrigatória para manter a integridade e a escalabilidade do sistema.

## 1. Stack Principal (Frontend)
- **Framework**: React 18+ com Vite.
- **Linguagem**: TypeScript.
- **Estilização**: TailwindCSS + Framer Motion (para micro-interações e transições fluidas).
- **Roteamento**: React Router v7.

## 2. Backend e Banco de Dados (Supabase)
Todo o ecossistema de backend deve ser centralizado no **Supabase (Auto-hospedado / Self-Hosted)**, instalado junto à aplicação. Nenhum outro banco de dados ou serviço de autenticação deve ser introduzido.

**Recursos Utilizados do Supabase:**
- **Database (Postgres)**: Onde residem as tabelas de Tenants (Workspaces), Perfis (Profiles), Escalas, Guias e Eventos.
- **Row Level Security (RLS)**: Essencial para garantir a separação multi-tenant. Usuários de uma lancheria não podem visualizar/editar dados de outra.
- **Autenticação (Auth)**: Gerenciamento de credenciais, convites (invites) e sessões.
- **Realtime**: Utilizado para atualizar o dashboard (escalas e monitoramento) instantaneamente.
- **Storage**: Para upload de fotos/documentos de guias.
- **Edge Functions**: Toda lógica que não pode residir no cliente ou requer credenciais seguras deve ser implementada no Edge Functions (Deno) nativo do Supabase.

## 3. Deploy e Infraestrutura (Nixpacks)
A regra de implantação é estrita: **100% via Nixpacks**. 
- **Sem Dockerfiles**: É estritamente proibido criar arquivos `Dockerfile` ou configurações de `docker-compose` (exceto o nativo que já gerencia o servidor self-hosted global, se aplicável).
- O Nixpacks analisa automaticamente o `package.json` ou outros metadados do projeto para gerar o contêiner de produção sem fricção.
- Variáveis de ambiente serão injetadas através do painel de controle do provedor (Easypanel/Coolify/Railway, etc) ou do arquivo `.env` para instâncias locais.

## 4. Integrações de IA (Firecrawl e Google Gemini)

### 4.1. Firecrawl (Web Scraping & Agentic Data Extraction)
- **Objetivo**: Extrair a agenda de eventos locais da web.
- **Fluxo**:
  - Configuração: Cada tenant (gestor) configura a cidade ou região de interesse nas opções do seu workspace.
  - Execução: 1 vez ao dia, uma Cron Job (via Edge Function do Supabase ou similar) dispara um agente do **Firecrawl** (conforme especificado em `docs/firecrawl/agent.md`).
  - O scraping é **individual** por cidade configurada, evitando sobrecarga ou dados desnecessários para Tenants de outras regiões.

### 4.2. Google Gemini
- **Objetivo**: Inteligência de dados.
- O resultado do Firecrawl, após ser formatado, é enviado ao Google Gemini para classificar o tipo de evento, prever o impacto na rede de fast-food (ex: "Evento de 10.000 pessoas próximo à praça X. Sugestão: Aumentar o efetivo no turno da noite.")
- Os relatórios gerados por IA ficarão salvos no Supabase atrelados ao Workspace específico para visualização mensal/anual no dashboard.

## 5. Fluxo de Dados (Data Flow)

1. **Client** (Vite App) ↔ **Supabase Auth / Postgres (RLS)**
2. **Client** ↔ **Edge Functions (Supabase)** (Quando o cliente solicita uma ação sensível, ex: disparar IA manualmente).
3. **Cron Job** → Dispara **Supabase Edge Function** → Aciona **Firecrawl Agent** para a Cidade "X" → Retorna JSON → Passa por **Google Gemini** para enriquecimento → Salva em **Postgres (Eventos)**.
4. **Postgres** → Notifica **Supabase Realtime** → Atualiza o **Client** do gestor.
