# Roadmap — Tarefa & Mesada

Documento de controle de evolução do projeto. Atualizar este arquivo conforme as etapas forem executadas.

**Legenda:** ✅ Concluído | 🔄 Em progresso | ⬜ Pendente | ❌ Cancelado

---

## ✅ Fase 0 — MVP (Concluído em Abril/2026)

### Infraestrutura

- [x] Configuração do projeto (monorepo backend + mobile)
- [x] Banco de dados PostgreSQL no Supabase
- [x] Backend Node.js/Express/Prisma no Render.com
- [x] App mobile com Expo (React Native + TypeScript)
- [x] Repositório no GitHub com deploy automático

### Funcionalidades Entregues

- [x] Autenticação de pais (email + senha + JWT)
- [x] Login de filhos por PIN de 4 dígitos
- [x] CRUD de tarefas (obrigatória, bônus, penalidade)
- [x] Recorrência de tarefas (diária, semanal, mensal, anual)
- [x] Subtarefas (checklist)
- [x] Atribuição de tarefas a filhos
- [x] Aprovação/rejeição de execuções
- [x] Sistema de XP e níveis gamificados
- [x] Loja de recompensas com resgate e aprovação
- [x] Relatório mensal com cálculo de mesada
- [x] Notificações push (Expo)
- [x] APK instalável para Android (EAS Build)

### Qualidade e Documentação

- [x] Limpeza de dead code (12 arquivos removidos)
- [x] Padronização de nomenclatura (camelCase nos controllers)
- [x] Tipos TypeScript para modelos da API (`mobile/src/types/api.ts`)
- [x] Helper de resposta centralizado (`backend/src/utils/response.ts`)
- [x] `.env.example` para o backend
- [x] Documentação em `docs/` (README, RULES, CHANGELOG)
- [x] Tag de versão `v1.0.0` no GitHub

---

## ⬜ Fase 1 — Estabilização (Pós-feedback dos testers)

> Executar após 1–2 semanas de testes com a família.

### Experiência do Usuário (UX)

- [ ] Implementar "Login Google" (usar Clerk)
- [ ] Melhorar responsividade das abas (tarefas, loja, perfil) - tirar de trás dos botões de navegação
- [ ] Incluir exclusão de tarefas no painel de tarefas
- [ ] Penalidades e bônus apenas uma execução (desabilitar recorrência)
- [ ] Ajustar prêmios na loja para serem resgatados apenas uma vez
- [ ] Permitir exclusão de prêmios pelo pai
- [ ] Melhorar responsividade da tela de login (campo de senha ou pin ficam escondidos atrás do teclado do Android)
- [ ] Data de "lembrete de pagamento" no perfil do Pai para pagamento da mesada
- [ ] Tela de onboarding para novos usuários
- [ ] Mensagens de erro amigáveis em português (substituir "Internal Server Error")
- [ ] Validação de formulários no app (campos obrigatórios, formatos)
- [ ] Indicadores de carregamento (skeleton screens ou spinners)
- [ ] Tela/mensagem de "sem conexão com internet"
- [ ] Feedback visual ao executar ações (toasts, confirmações)

### Bugs e Ajustes (a preencher com feedback)

- [ ] _[Registrar aqui os bugs reportados pelos testers]_

---

## ⬜ Fase 2 — Funcionalidades (1–2 meses após lançamento)

### Engajamento e Personalização

- [ ] Feed de atividades recentes para o pai
- [ ] Foto de perfil / sistema de avatares para filhos
- [ ] Conquistas e badges (ex: "7 dias seguidos!", "Nível 5 atingido!")
- [ ] Animações de celebração ao completar tarefas

### Funcionalidades Solicitadas

- [ ] Data limite (prazo) para tarefas
- [ ] Múltiplos responsáveis no mesmo perfil familiar (mãe e pai)
- [ ] Filho pode adicionar comentário/foto ao entregar tarefa
- [ ] Histórico completo de tarefas por filho (além do mês atual)

### Financeiro

- [ ] Saldo virtual acumulado em Reais (além de XP)
- [ ] Extrato de mesada com detalhamento por tarefa

---

## ⬜ Fase 3 — Publicação nas Lojas (3–6 meses)

### Google Play Store

- [ ] Criar conta de desenvolvedor Google ($25, pagamento único)
- [ ] Gerar build de produção: `eas build --profile production -p android`
- [ ] Criar ficha do app (ícone, screenshots, descrição)
- [ ] Submeter para revisão
- [ ] Publicar

### Apple App Store

- [ ] Criar conta Apple Developer ($99/ano)
- [ ] Configurar certificados e provisioning profiles
- [ ] Gerar build iOS: `eas build --profile production -p ios`
- [ ] Criar ficha no App Store Connect
- [ ] Submeter para revisão da Apple
- [ ] Publicar

---

## ⬜ Fase 4 — Escala e Monetização

### Infraestrutura

- [ ] Upgrade do servidor Render (plano pago — elimina o "sleep" de 50s)
- [ ] Configurar domínio personalizado para a API
- [ ] Habilitar backup automático do banco no Supabase
- [ ] Monitoramento de erros em produção (ex: Sentry)

### Modelo de Negócio

- [ ] Definir modelo freemium (ex: limite de 2 filhos / 10 tarefas no plano free)
- [ ] Integrar plataforma de pagamento (ex: RevenueCat + Stripe)
- [ ] Implementar plano premium com funcionalidades avançadas

---

## ⬜ Fase 5 — Qualidade Técnica (contínuo)

### Testes

- [ ] Testes unitários do backend (Vitest ou Jest)
- [ ] Testes de integração dos endpoints principais
- [ ] Testes de componentes no mobile (React Native Testing Library)

### Segurança e Performance

- [ ] Rate limiting nos endpoints da API
- [ ] Implementar Refresh Token (evitar logout frequente)
- [ ] Auditoria de segurança (OWASP Mobile Top 10)
- [ ] Otimizar queries Prisma com índices no banco

### DevOps

- [ ] Pipeline CI/CD completo (GitHub Actions: lint + test + build)
- [ ] Ambientes separados: development, staging, production

---

## 📋 Controle de Versões

| Versão | Data | Descrição |
|---|---|---|
| `v1.0.0` | Abr/2026 | MVP production-ready — primeiro deploy com testers |
| `v1.1.0` | — | _(próximo release — pós feedback fase 1)_ |

---

## 📝 Log de Decisões

| Data | Decisão | Motivo |
|---|---|---|
| Abr/2026 | Render.com para backend | Gratuito, fácil integração com GitHub |
| Abr/2026 | Supabase para banco | PostgreSQL gerenciado, generoso no free tier |
| Abr/2026 | Session Pooler (porta 5432) | Compatível com Prisma (Transaction mode quebra prepared statements) |
| Abr/2026 | EAS Build para APK | Mais simples que configurar Android SDK local |
