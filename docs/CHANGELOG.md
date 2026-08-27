# Changelog — Tarefa & Mesada

Todas as mudanças notáveis do projeto serão documentadas aqui.

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [1.1.0] — 2026-08-27

### 🔒 Segurança

- **Security**: Validação de `audience` no Google ID Token — impede que tokens de outros apps Google autentiquem no backend.
- **Security**: Removido placeholder hardcoded `COLOQUE_SEU_WEB_CLIENT_ID_AQUI` do `GoogleLoginButton.tsx`. Agora o botão não renderiza se a variável não estiver configurada.
- **Security**: Implementado sistema de Refresh Tokens (`/auth/refresh`) com rotação automática no mobile.
- **Security**: Interceptor do Axios com retry automático em 401 (token expirado).

### ✨ Autenticação

- **Breaking**: Migração completa de **Clerk** para **Google Auth nativo** (`google-auth-library` + `@react-native-google-signin`).
- **Feature**: Login Google com `GoogleLoginButton.tsx` (Android nativo) e `GoogleLoginButton.web.tsx` (Web/OAuth).
- **Feature**: Endpoint `/auth/google` no backend — cria ou vincula conta via Google ID Token.
- **Feature**: JWT próprio com access token (15min) + refresh token (30d).

### 🛠️ Ajustes e Limpeza

- **Chore**: Versão sincronizada em `app.json`, `mobile/package.json` e `backend/package.json` → `1.1.0`.
- **Chore**: Removidos assets de template (react-logo) do diretório de imagens.
- **Chore**: Atualizados `.env.example` (backend e mobile) com variáveis corretas (removidas referências ao Clerk).
- **Docs**: Atualizado `ROADMAP.md` com decisões de migração e marco v1.1.0.
- **Docs**: Atualizado `ARCHITECTURE.md` e `README.md` com stack atual.

---

## [1.0.2] — 2026-04-07

### ✨ Autenticação e Segurança (Clerk)

- **Feature**: Implementado Login Social com Google utilizando **Clerk Auth**.
- **Security**: Resolvido erro de **COOP** (Cross-Origin-Opener-Policy) que bloqueava o retorno do popup de login no navegador.
- **Sync**: Criado endpoint `/auth/sync-clerk` no backend para sincronização automática de perfis de pais/estatísticas.
- **Fix**: Logout agora é totalmente assíncrono, garantindo que a sessão do Clerk seja encerrada antes do recarregamento da página (Web).
- **Security**: Reestruturação dos arquivos `.env` para evitar o vazamento de chaves secretas do backend no pacote mobile.

## [1.0.1] — 2026-04-06

### ✨ Melhorias e Ajustes

- Fix: Melhorada a responsividade das abas de navegação no Android, evitando que o conteúdo fique sobreposto pelos botões do sistema.
- Feature: Implementada e validada a funcionalidade de exclusão de prêmios pelo pai na loja de recompensas.
- Validado em dispositivo físico via APK.

## [1.0.0] — 2026-04-04

### 🎉 Primeiro Release de Produção (MVP)

#### Autenticação

- Cadastro e login de pais com email/senha e JWT
- Login de filhos com PIN de 4 dígitos
- Proteção de rotas por papel (parent/child)

#### Gestão de Tarefas (Pai)

- Criação de tarefas com tipo (obrigatória, bônus, penalidade)
- Configuração de recorrência (diária, semanal, mensal, anual)
- Suporte a subtarefas (checklist)
- Atribuição de tarefas a filhos
- Aprovação / rejeição de execuções

#### Execução de Tarefas (Filho)

- Dashboard com tarefas do dia
- Checklist interativo de subtarefas
- Marcação de tarefa como concluída

#### Sistema de Gamificação

- XP calculado como `valor_tarefa × 10`
- Sistema de níveis (Iniciante → Mestre)
- Barra de progresso de nível

#### Loja de Recompensas

- Criação de recompensas pelo pai (com custo em XP e limite opcional)
- Resgate de recompensas pelo filho
- Aprovação / rejeição de resgates pelo pai
- XP disponível = acumulado - gasto em resgates aprovados

#### Relatórios

- Relatório mensal por filho: XP, bônus, penalidades, mesada final
- Histórico de meses anteriores

#### Notificações Push

- Notificação ao pai quando filho resgata prêmio
- Notificação ao filho quando pai aprova/rejeita resgate

#### Infraestrutura

- Backend: Node.js/Express + Prisma + PostgreSQL (Supabase)
- Mobile: React Native + Expo (TypeScript)
- Deploy: Render.com (backend) + EAS Build (APK Android)
- APK de preview disponível para testers

#### Link do APK (v1.0.0)

- [Build no Expo](https://expo.dev/accounts/appmesada/projects/appmesada/builds/0f876d04-e98a-431b-b71f-c5c79501ed5d)
