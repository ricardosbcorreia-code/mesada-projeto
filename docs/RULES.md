# Regras de Negócio — Tarefa & Mesada

Este documento descreve todas as regras de negócio do sistema.

---

## 1. Usuários e Papéis

### Pai/Mãe (Parent)
- Cria conta com email e senha
- Cadastra filhos com nome e PIN
- Cria e gerencia tarefas
- Atribui tarefas a filhos
- Aprova ou rejeita execuções
- Cria e gerencia recompensas
- Aprova ou rejeita resgates
- Visualiza relatórios mensais

### Filho (Child)
- Acessa o app com PIN de 4 dígitos
- Visualiza suas tarefas do dia
- Marca tarefas como concluídas
- Visualiza seu XP e nível
- Solicita resgate de recompensas

---

## 2. Sistema de Tarefas

### Tipos de Tarefa
| Tipo | Efeito no XP | Descrição |
|---|---|---|
| `mandatory` | Positivo (+) | Tarefas obrigatórias |
| `bonus` | Positivo (+) | Tarefas extras/opcionais |
| `penalty` | Negativo (-) | Penalidades por comportamento |

### Valor da Tarefa
- Cada tarefa tem um valor monetário (`value`) em Reais
- O XP ganho é calculado como: `value × 10`
- Exemplo: tarefa de R$ 5,00 = 50 XP

### Recorrência
| Tipo | Descrição |
|---|---|
| `daily` | Repete todos os dias |
| `weekly` | Repete em dias específicos da semana |
| `monthly` | Repete em datas específicas do mês |
| `yearly` | Repete anualmente |

### Subtarefas
- Uma tarefa pode ter múltiplas subtarefas (checklist)
- A criança precisa marcar todos os itens para completar a tarefa principal

---

## 3. Fluxo de Execução de Tarefas

```
Criança marca tarefa como concluída
        ↓
Status: pending
        ↓
Pai aprova ou rejeita
        ↓
approved → XP creditado / rejected → sem efeito
```

### Status de Execução
| Status | Descrição |
|---|---|
| `pending` | Aguardando aprovação do pai |
| `completed` | Marcada pela criança (sinônimo de pending no fluxo atual) |
| `approved` | Aprovada pelo pai — XP contabilizado |
| `rejected` | Rejeitada pelo pai |

---

## 4. Sistema de XP e Níveis

### Cálculo de XP
- XP é acumulado apenas a partir de tarefas com status `approved`
- Fórmula: `XP Total = Σ (valor_tarefa × 10)` para todas as tarefas aprovadas no mês

### Níveis
| Nível | Nome | XP Mínimo |
|---|---|---|
| 1 | Iniciante | 0 |
| 2 | Aprendiz | 100 |
| 3 | Dedicado | 300 |
| 4 | Campeão | 600 |
| 5 | Mestre | 1000 |

---

## 5. Cálculo da Mesada

### Fórmula
```
Mesada Final = Base + Bônus - Penalidades
```

- **Base:** valor definido pelo pai no cadastro do filho (`base_allowance`)
- **Bônus:** soma dos valores de tarefas `bonus` aprovadas no mês
- **Penalidades:** soma dos valores de tarefas `penalty` aprovadas no mês

### Relatório Mensal
- Gerado sob demanda pelo pai para qualquer mês/ano
- Contém: XP ganho, bônus, penalidades e mesada final calculada
- Histórico disponível por filho

---

## 6. Sistema de Recompensas (Loja)

### Recompensas
- Criadas pelo pai com nome, descrição e custo em XP
- Podem ter limite de resgates (`max_redeems`) por filho
- Visíveis pela criança na Loja

### XP Disponível para Resgate
```
XP Disponível = XP Total Acumulado - XP já Gasto em Resgates (aprovados)
```

### Fluxo de Resgate
```
Criança solicita resgate
        ↓
Status: pending (notificação push enviada ao pai)
        ↓
Pai aprova ou rejeita
        ↓
approved → XP debitado / rejected → XP devolvido
```

### Limites
- Uma criança pode solicitar uma recompensa mesmo sem XP suficiente (validação no frontend)
- O backend impede solicitar se o limite de resgates (`max_redeems`) foi atingido

---

## 7. Notificações Push

| Evento | Destinatário | Mensagem |
|---|---|---|
| Criança resgata prêmio | Pai | "X deseja resgatar [prêmio]. Aprove!" |
| Pai aprova resgate | Filho | "Seu prêmio [nome] foi aprovado! 🎉" |
| Pai rejeita resgate | Filho | "O resgate de [nome] foi negado. ❌" |
