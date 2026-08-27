# Arquitetura do Projeto — Tarefa & Mesada

O projeto segue uma arquitetura de monorepo simplificada para facilitar o desenvolvimento e deploy sincronizado.

## 🏗️ Visão Geral

- **Backend**: API RESTful construída com Node.js e Express. Utiliza Prisma ORM para comunicação com o PostgreSQL hospedado no Supabase. O backend é o "juiz" de todas as regras de negócio, cálculos de XP e validações de PIN.
- **Mobile**: Aplicativo multiplataforma (Android/Web por enquanto) desenvolvido com React Native e Expo. Consome a API do backend via Axios.
- **Autenticação (Híbrida)**:
    - **Pais**: Autenticação via **Clerk** (SSO/Google Login). O backend sincroniza os dados do Clerk com o banco de dados interno.
    - **Filhos**: Autenticação via **PIN de 4 dígitos** (JWT convencional gerado pelo backend), garantindo facilidade de acesso para crianças pequenas.

## 📡 Fluxo de Dados

1. O App Mobile detecta a presença de uma sessão do Clerk.
2. O App envia o token do Clerk para o endpoint `/auth/sync-clerk`.
3. O Backend valida o token no Clerk, cria/atualiza o usuário `Parent` e retorna os dados vinculados.
4. Para crianças, o App envia o `childId` e o `PIN`, o backend valida e gera um JWT de acesso limitado.

## 🗄️ Modelo de Dados (Prisma)

- **Parent**: Associado ao `clerkId`. Dono da conta familiar.
- **Child**: Vinculado a um `Parent`. Possui PIN e acumulado de XP.
- **Task**: Definições de tarefas (nome, valor, tipo, recorrência).
- **Execution**: Instâncias diárias/semanais de tarefas completadas por um `Child` e aguardando aprovação.

---

*Última atualização: Abril de 2026*
