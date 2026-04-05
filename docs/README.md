# Tarefa & Mesada 📋💰

Um aplicativo mobile de gestão de tarefas e mesada para famílias, com sistema de gamificação por XP.

## Visão Geral

Permite que pais criem tarefas, atribuam a filhos, acompanhem a execução e calculem automaticamente a mesada com base no desempenho. Filhos visualizam suas tarefas, ganham XP e resgatam recompensas.

## Tech Stack

| Camada | Tecnologia |
|---|---|
| **Mobile** | React Native + Expo (TypeScript) |
| **Backend** | Node.js + Express + TypeScript |
| **ORM** | Prisma |
| **Banco de Dados** | PostgreSQL (Supabase) |
| **Autenticação** | JWT |
| **Notificações** | Expo Push Notifications |
| **Build Mobile** | EAS Build (Expo Application Services) |
| **Deploy Backend** | Render.com |

## Estrutura do Projeto

```
tarefa-mesada/
├── backend/          # API REST Node.js/Express
├── mobile/           # App React Native/Expo
└── docs/             # Documentação do projeto
```

## Setup Local

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Expo CLI (`npm install -g expo-cli`)
- Conta no Supabase (banco de dados)

### Backend

```bash
cd backend
cp .env.example .env
# Preencha as variáveis em .env
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

### Mobile

```bash
cd mobile
npm install
# Edite mobile/src/utils/config.ts com o IP local do backend
npx expo start
```

## Variáveis de Ambiente

Veja `backend/.env.example` para a lista completa.

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | String de conexão do PostgreSQL (Supabase) |
| `JWT_SECRET` | Chave secreta para geração de tokens JWT |

## Scripts Úteis

```bash
# Backend — desenvolvimento
cd backend && npm run dev

# Backend — build de produção
cd backend && npm run build

# Mobile — web (desenvolvimento)
cd mobile && npm run web

# Mobile — build APK (testers)
cd mobile && npx eas-cli build -p android --profile preview
```

## Deploy

- **Backend:** Auto-deploy no [Render.com](https://render.com) a cada `git push origin main`
- **Mobile:** Build manual via EAS. Ver `docs/CHANGELOG.md` para link do APK atual.
