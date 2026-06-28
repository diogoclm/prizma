# Setup — Prizma TIR

## Pré-requisitos
- Node.js 20+
- PostgreSQL 15+

## 1. Instalar dependências
```bash
npm install
```

## 2. Configurar banco
```bash
cp .env.example .env
# editar .env com sua DATABASE_URL
```

## 3. Criar banco e rodar migrations
```bash
npm run db:migrate
```

## 4. Popular com dados iniciais (carteira atual)
```bash
npm run db:seed
```

## 5. Rodar os testes do motor financeiro
```bash
npm run test:run
```
Todos os testes devem passar — inclusive os casos validados contra Excel/Sheets.

## 6. Rodar em desenvolvimento
```bash
npm run dev
# http://localhost:3000
```

## Verificar saúde da API
```
GET /api/health  →  { "status": "ok", "db": "connected" }
```
