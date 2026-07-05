# Family Finance — Livro-caixa da família

Aplicação web para famílias organizarem o fluxo de caixa doméstico: quem ganhou o quê, quem gastou o quê, despesas fixas recorrentes (aluguel, internet, plano de saúde...) e um histórico com relatórios por pessoa e por mês.

A regra de negócio central: **menores de 18 anos podem registrar despesas, mas não receitas** — o sistema bloqueia isso automaticamente no backend.

## ✨ Funcionalidades

- **Autenticação por família** — cada família tem usuário/senha próprios, com troca de senha obrigatória no primeiro acesso.
- **Pessoas** — cadastro dos membros da família, com data de nascimento (define se é menor de idade) e marcação de um "principal" (moderador da família).
- **Transações** — lançamento de receitas e despesas por pessoa, com edição e exclusão.
- **Despesas fixas** — contas recorrentes da família (aluguel, contas, etc.), com status "em aberto"/"quitada". Exclusão de uma despesa fixa só é permitida depois de quitada, e fica registrada em log.
- **Totais / Relatórios** — receita, despesa e saldo da família e de cada pessoa, incluindo o total de despesas fixas.
- **Histórico** — consulta de meses anteriores com movimentação.
- **Log de auditoria** — registra ações sensíveis (ex.: exclusão de pessoa, quitação/exclusão de despesa fixa) com quem realizou e quando.
- **Área administrativa** — painel separado (autenticado com credenciais de admin) para listar todas as famílias cadastradas e resetar senhas.

## 🧱 Arquitetura

Backend em **Clean Architecture**, dividido em 4 camadas:

```
FamilyFinance.Domain          → Entidades (Family, Person, Transaction, FixedExpense, AuditLog) e regras de domínio (ex.: Person.IsUnderAge())
FamilyFinance.Application     → DTOs, interfaces e services com as regras de negócio (FinanceService, AuthService, AdminService)
FamilyFinance.Infrastructure  → EF Core (ApplicationDbContext), mapeamento e migrations
FamilyFinance.API             → Controllers, Program.cs (DI, CORS, Swagger)
```

O frontend é uma SPA em React que consome essa API via REST.

## 🛠️ Tecnologias

**Backend**
- [.NET 10](https://dotnet.microsoft.com/) / ASP.NET Core Web API
- [Entity Framework Core](https://learn.microsoft.com/ef/core/) com [Npgsql](https://www.npgsql.org/) (PostgreSQL)
- Swagger / OpenAPI para documentação dos endpoints

**Frontend**
- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) como bundler/dev server
- [Axios](https://axios-http.com/) para chamadas HTTP

**Banco de dados**
- PostgreSQL (local em desenvolvimento, [Supabase](https://supabase.com/) em produção)

**Infraestrutura**
- Docker (multi-stage build) para empacotar a API
- Deploy sugerido: [Render](https://render.com/) (API) + Supabase (banco)

## 📁 Estrutura do repositório

```
/
├── FamilyFinance-Backend/
│   ├── FamilyFinance.API/            # Web API (Controllers, Program.cs, appsettings)
│   ├── FamilyFinance.Application/    # Services, DTOs, interfaces
│   ├── FamilyFinance.Domain/         # Entidades e regras de domínio
│   ├── FamilyFinance.Infrastructure/ # EF Core, DbContext, Migrations
│   ├── Dockerfile
│   └── FamilyFinance.slnx
└── FamilyFinance-Frontend/
    └── src/
        ├── components/               # Telas (Pessoas, Transações, Despesas fixas, Totais, Histórico, Log, Auth, Admin)
        ├── api.ts                    # Client HTTP (axios) para a API
        └── types.ts                  # Tipos TypeScript compartilhados
```

## 🚀 Rodando localmente

### Pré-requisitos
- [.NET SDK 10](https://dotnet.microsoft.com/download)
- [Node.js](https://nodejs.org/) 20+
- PostgreSQL rodando localmente (ou uma instância no Supabase)

### Backend

```bash
cd FamilyFinance-Backend

# configure a connection string sem expor senha no appsettings.json
dotnet user-secrets init --project FamilyFinance.API
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=Familyfinance;User Id=postgres;Password=SUA_SENHA;" --project FamilyFinance.API

# aplica as migrations
dotnet ef database update --project FamilyFinance.Infrastructure --startup-project FamilyFinance.API

# sobe a API (Swagger em http://localhost:5276/swagger)
dotnet run --project FamilyFinance.API
```

> As credenciais da área administrativa (`AdminSettings:Username` / `AdminSettings:Password`) também podem ser definidas via `user-secrets`; se não configuradas, o padrão local é `admin` / `admin123` — **troque isso antes de qualquer deploy real**.

### Frontend

```bash
cd FamilyFinance-Frontend
npm install
npm run dev
```

Acesse `http://localhost:5173`. Se a API estiver rodando em outra porta/URL, ajuste `API_BASE_URL` em `src/api.ts`.


