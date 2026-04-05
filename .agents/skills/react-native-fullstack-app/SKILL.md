---
name: react-native-fullstack-app
description: >
  Boas práticas, convenções e preferências para projetos de App Mobile com
  React Native (Expo) + Backend Node.js/Express + Prisma + Supabase (PostgreSQL).
  Baseado na experiência do projeto Tarefa & Mesada (Abril/2026).
---

# Skill: React Native Fullstack App

Use esta skill ao iniciar ou trabalhar em qualquer projeto de aplicativo mobile com o stack abaixo. Siga cada seção como guia de decisão, estrutura e qualidade.

---

## 1. Tech Stack Preferido

| Camada | Tecnologia | Motivo |
|---|---|---|
| Mobile | React Native + Expo (TypeScript) | Cross-platform, build facilitado via EAS |
| Backend | Node.js + Express + TypeScript | Tipagem forte, familiaridade do dev |
| ORM | Prisma | Type-safe, migrations automáticas |
| Banco de dados | PostgreSQL via Supabase | Free tier generoso, interface visual, auth integrado |
| Autenticação | JWT (access token) | Simples, stateless, funciona offline |
| Notificações Push | Expo Push Notifications | Sem configuração nativa de FCM/APNs |
| Build Mobile | EAS Build (Expo) | Gera APK/IPA sem Android Studio |
| Deploy Backend | Render.com | Deploy automático via GitHub, free tier |
| Versionamento | Git + GitHub | CI/CD automático no Render |

---

## 2. Estrutura de Pastas

### Backend (`backend/`)
```
backend/
├── prisma/
│   └── schema.prisma         # Modelos do banco
├── src/
│   ├── app.ts                # Express app (middlewares, rotas)
│   ├── server.ts             # Entry point (listen)
│   ├── config/
│   │   └── prisma.ts         # Singleton do PrismaClient
│   ├── controllers/          # Lógica de cada recurso (camelCase: authController.ts)
│   ├── middlewares/
│   │   └── auth.ts           # JWT: verifica token e injeta req.user
│   ├── routes/               # Express Router por recurso
│   ├── services/             # Serviços externos (ex: notificationService.ts)
│   └── utils/
│       └── response.ts       # Helpers: sendError(), sendSuccess()
├── .env                      # Nunca commitar
├── .env.example              # Sempre manter atualizado
└── package.json
```

### Mobile (`mobile/`)
```
mobile/
├── src/
│   ├── assets/               # Imagens, fontes, ícones
│   ├── components/           # Componentes reutilizáveis (ui.tsx, etc.)
│   ├── hooks/                # Custom hooks (useAuth, useTasks, etc.)
│   ├── navigation/           # React Navigation (Stack, Tab, etc.)
│   ├── screens/
│   │   ├── parent/           # Telas do papel "pai"
│   │   └── child/            # Telas do papel "filho"
│   ├── services/
│   │   └── api.ts            # Axios instance configurada
│   ├── store/
│   │   └── AuthContext.tsx   # Context + Provider de autenticação
│   ├── types/
│   │   └── api.ts            # Tipos TypeScript para todos os modelos da API
│   └── utils/
│       ├── config.ts         # API_URL (produção vs desenvolvimento)
│       ├── helpers.ts        # Funções utilitárias
│       └── theme.ts          # Cores, fontes, espaçamentos globais
├── app.json                  # Config Expo
└── eas.json                  # Perfis de build (preview, production)
```

### Documentação (`docs/`)
```
docs/
├── README.md        # Visão geral, setup local, scripts
├── ARCHITECTURE.md  # Diagrama de fluxo de dados
├── API.md           # Todos os endpoints com exemplos
├── RULES.md         # Regras de negócio detalhadas
├── CHANGELOG.md     # Histórico de versões (formato Keep a Changelog)
└── ROADMAP.md       # Fases e checklist de evolução
```

---

## 3. Convenções de Código

### Backend
- **Controllers:** `camelCase` — `authController.ts`, `taskController.ts`
- **Rotas:** `camelCase` — `authRoutes.ts`, `taskRoutes.ts`
- **Funções exportadas:** `camelCase` — `getRewards`, `createTask`
- **Modelos Prisma:** `PascalCase` no schema, `snake_case` no banco (`@@map`)
- **Resposta de erro padrão:** `{ error: "mensagem" }` via `sendError(res, status, msg)`
- **Resposta de sucesso:** `res.json(data)` ou `res.status(201).json(data)` via `sendSuccess()`
- **Nunca usar `any`:** Sempre tipar explicitamente. Usar tipos inferidos do Prisma.

### Mobile
- **Screens:** `PascalCase` — `TaskListScreen.tsx`, `ChildDashboard.tsx`
- **Components:** `PascalCase` — `TaskCard.tsx`, `Button.tsx`
- **Hooks:** `camelCase` com prefixo `use` — `useAuth.ts`, `useTasks.ts`
- **Tipos:** Em `src/types/api.ts`, interfaces para todos os modelos da API
- **API_URL:** Sempre em `src/utils/config.ts`, apontar para produção antes do build

---

## 4. Autenticação

### Backend
```typescript
// Middleware auth.ts injeta req.user com id, role
interface AuthenticatedRequest extends Request {
  user?: { id: string; role: 'parent' | 'child' }
}
// Sempre verificar req.user?.role antes de qualquer operação sensível
```

### Mobile
- Token JWT salvo via `AsyncStorage` ou `SecureStore`
- AuthContext provê: `user`, `token`, `signIn()`, `signOut()`
- Todas as requisições incluem `Authorization: Bearer <token>` no header

---

## 5. Banco de Dados (Supabase + Prisma)

### Connection String no Render
⚠️ **SEMPRE usar o Session Pooler** (não Direct Connection, não Transaction Pooler):
```
postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres?sslmode=require
```
- **Porta:** `5432` (Session mode — compatível com Prisma prepared statements)
- **NÃO usar porta `6543`** (Transaction mode quebra Prisma com erro `prepared statement does not exist`)

### Schema Prisma
- Sempre definir `@@map("nome_tabela")` para usar snake_case no banco
- Usar `@default(uuid())` para IDs
- Datas sempre com `DateTime @default(now())`

### Comando de build (package.json)
```json
"build": "npx prisma generate && tsc"
```
O `prisma generate` é obrigatório antes do `tsc` para gerar o client para o ambiente Linux do Render.

---

## 6. Deploy

### Backend → Render.com
| Campo | Valor |
|---|---|
| Root Directory | `backend` |
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |
| Environment | `DATABASE_URL`, `JWT_SECRET` |

### Mobile → EAS Build
```bash
# Antes de qualquer build: atualizar mobile/src/utils/config.ts
# com a URL de produção do Render

# APK para testers:
npx eas-cli build -p android --profile preview

# Build de produção (Play Store):
npx eas-cli build -p android --profile production
```

**Perfis em `eas.json`:**
```json
{
  "build": {
    "preview": {
      "android": { "buildType": "apk" }
    },
    "production": {
      "android": { "buildType": "app-bundle" }
    }
  }
}
```

---

## 7. Variáveis de Ambiente

### Regras
- **Nunca commitar `.env`** — garantir que está no `.gitignore`
- **Sempre manter `.env.example`** atualizado com todas as variáveis (sem valores reais)
- No Render, configurar via painel "Environment" — não via arquivo

### Template `.env.example`
```env
# Banco de dados (Supabase Session Pooler — porta 5432)
DATABASE_URL=postgresql://postgres.REF:PASS@aws-0-REGION.pooler.supabase.com:5432/postgres?sslmode=require

# JWT (mínimo 32 caracteres, gerado aleatoriamente)
JWT_SECRET=sua_chave_secreta_aqui

# Porta local (opcional)
PORT=3000
```

---

## 8. Documentação Mínima Obrigatória

Todo projeto deve ter em `docs/`:

| Arquivo | Conteúdo |
|---|---|
| `README.md` | Setup local, tech stack, scripts úteis |
| `RULES.md` | Regras de negócio documentadas |
| `ROADMAP.md` | Fases com checklist (✅ / ⬜) |
| `CHANGELOG.md` | Histórico de versões (Keep a Changelog) |
| `API.md` | Endpoints com exemplos de request/response |

---

## 9. Git e Versionamento

### Padrão de commits
```
feat: adiciona tela de onboarding
fix: corrige cálculo de XP na loja
refactor: renomeia controllers para camelCase
docs: atualiza ROADMAP com fase 2
chore: remove arquivos de debug
```

### Tags de versão semântica
```bash
git tag -a v1.0.0 -m "Release v1.0.0 — MVP"
git push origin main --tags
```

### .gitignore essencial
```
node_modules/
dist/
.env
.expo/
*.apk
*.aab
```

---

## 10. Checklist de Production-Readiness

Antes de considerar um projeto "pronto para testers":

- [ ] `DATABASE_URL` aponta para Session Pooler (porta 5432)
- [ ] `API_URL` no mobile aponta para URL de produção (não localhost)
- [ ] Nenhum arquivo `.env` commitado
- [ ] `.env.example` atualizado
- [ ] `npm run build` compila sem erros
- [ ] Backend responde em `/health` com `{ status: "ok" }`
- [ ] Nenhum arquivo de debug (`test_*.ts`, `verify_*.ts`) no repositório
- [ ] Documentação mínima criada (`docs/`)
- [ ] Tag de versão criada no GitHub
- [ ] APK testado em dispositivo físico

---

## 11. Armadilhas Conhecidas

| Problema | Causa | Solução |
|---|---|---|
| `prepared statement "s1" does not exist` | Prisma com Transaction Pooler (porta 6543) | Usar Session Pooler (porta 5432) |
| `Can't reach database server` | Render não consegue acessar a porta 5432 direta | Usar Session Pooler do Supabase |
| App no celular não conecta ao backend | `API_URL` ainda apontando para `localhost` | Atualizar `config.ts` antes do build |
| Build do EAS usa código desatualizado | Config não commitada antes do `eas build` | Sempre `git push` antes de `eas build` |
| Login demora 50+ segundos | Render free tier "dorme" após inatividade | Normal no free. Upgrade para plano pago resolve |
| Windows: rename de arquivo só muda caixa | `Copy-Item` falha, remove-item apaga original | Recriar o arquivo manualmente com novo nome |
