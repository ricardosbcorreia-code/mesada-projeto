# Changelog — Tarefa & Mesada

Todas as mudanças notáveis do projeto serão documentadas aqui.

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

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
