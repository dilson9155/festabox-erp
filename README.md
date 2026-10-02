# FestaBox ERP

Sistema profissional de **gestão comercial e PDV** para lojas que trabalham com **embalagens, balas, doces, artigos para festas e descartáveis**.

> Stack: Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · shadcn/ui · Prisma · PostgreSQL · NextAuth (Auth.js v5).

---

## Visão geral

FestaBox ERP entrega, em uma única aplicação web responsiva:

- **PDV rápido** (busca por nome / código / EAN, leitor de código de barras USB, atalhos de teclado, pagamento múltiplo, sangria, suprimento).
- **Cadastros** completos (produtos, categorias, marcas, unidades, kits, clientes, fornecedores).
- **Estoque** confiável (saldo por produto, movimentações com motivo obrigatório, perdas, ajustes, inventário, lote/validade).
- **Compras** com **importação de NF-e (XML)** para entrada automática, com conferência antes de confirmar.
- **Financeiro** (contas a pagar e receber, bancos, plano de contas, centros de custo, caixa com abertura/fechamento).
- **Impressão** de cupom não fiscal (HTML imprimível e ESC/POS genérico 58mm/80mm).
- **Relatórios** com DRE gerencial.
- **Auditoria** de operações críticas.
- **Permissões granulares** por papel (ADMIN, GERENTE, CAIXA, VENDEDOR, ESTOQUISTA, FINANCEIRO).
- Arquitetura **preparada** para o módulo fiscal (NFC-e, NF-e, SAT, CF-e) sem reestruturação.

---

## Instalação

### Pré-requisitos

- **Node.js 20+** (recomendado 22 LTS)
- **PostgreSQL 14+** (ou use o modo SQLite para dev rápido — ver abaixo)
- npm, pnpm ou yarn

### Passo a passo

```bash
# 1. Entrar na pasta
cd festabox-erp

# 2. Instalar dependências
npm install

# 3. Copiar e ajustar variáveis de ambiente
cp .env.example .env
# Edite DATABASE_URL com sua conexão PostgreSQL:
#   DATABASE_URL="postgresql://USER:PASS@localhost:5432/festabox?schema=public"

# 4. Gerar o cliente Prisma
npm run db:generate

# 5. Criar as tabelas no banco
npm run db:push

# 6. Popular dados de demonstração
npm run db:seed

# 7. Subir o servidor de desenvolvimento
npm run dev
```

Acesse `http://localhost:3000` e entre com **`admin@festabox.com`** / **`admin123`**.

### Modo SQLite (dev rápido, sem instalar PostgreSQL)

Se quiser subir o sistema sem instalar PostgreSQL, troque o provider no `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

E em `.env`:

```
DATABASE_URL="file:./dev.db"
```

Depois rode normalmente `npm run db:push` e `npm run db:seed`.

---

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Sobe o Next.js em modo dev (hot reload) |
| `npm run build` | Faz o build de produção |
| `npm run start` | Sobe o servidor de produção (após build) |
| `npm run lint` | Roda ESLint |
| `npm run typecheck` | TypeScript sem emissão |
| `npm run db:generate` | Gera o cliente Prisma |
| `npm run db:push` | Sincroniza o schema com o banco (sem migration) |
| `npm run db:migrate` | Cria migration versionada |
| `npm run db:seed` | Roda o seed |
| `npm run db:reset` | Apaga e recria o banco com seed |
| `npm run db:studio` | Abre o Prisma Studio |

---

## Configuração

### Empresa

Acesse **Configurações** no menu lateral para definir:

- Nome (fantasia / sistema) – usado em todo o sistema e no cupom
- Razão social, CNPJ, IE, telefones
- Endereço completo
- Desconto máximo no PDV (%)
- Permite estoque negativo
- Permite alterar preço no PDV

### Impressoras

Acesse **Impressoras** para cadastrar perfis. Suportados atualmente:

- **ESC/POS 58mm** e **ESC/POS 80mm** (genéricos)
- Conexão **USB**, **Rede (IP/porta)**, **Compartilhada Windows** ou **Impressão via navegador**

Impressão do cupom não fiscal:

- `/api/sales/[id]/receipt` retorna HTML imprimível (o navegador cuida da impressão).
- `/api/sales/[id]/escpos` retorna bytes ESC/POS brutos — útil para um serviço local de impressão conectado à térmica.

### Atalhos do PDV

| Tecla | Ação |
|------|------|
| **F1** | Focar busca de produto |
| **F2** | Abrir seleção de cliente |
| **F5** | Finalizar venda |
| **F7** | Cancelar último item |
| **F8** | Cancelar toda a venda |
| **ESC** | Fechar modais |

---

## Importação de NF-e (XML)

Acesse **Compras → Importar NF-e**, faça upload do arquivo XML da NF-e e o sistema:

1. Lê o XML (suporta NF-e modelo 55).
2. Identifica fornecedor, produtos, EAN, código do fornecedor, NCM, CFOP, quantidades e valores.
3. Mostra a **prévia** com itens classificados em **Encontrados** (match por EAN/código) ou **Novos**.
4. Permite escolher a ação por item:
   - **Criar novo** produto
   - **Atualizar** (tudo)
   - **Atualizar só custo / só preço / só estoque**
   - **Pular**
5. Sugere preço de venda (markup padrão 150% sobre custo, editável).
6. Ao confirmar: cadastra/atualiza produtos, registra entrada de estoque, gera **Compra** + **Conta a Pagar** em aberto.

> A importação da NF-e é **apenas para entrada de mercadoria**. O sistema **não emite** documentos fiscais nesta versão.

---

## Impressão ESC/POS

A biblioteca `src/lib/escpos.ts` gera bytes ESC/POS brutos compatíveis com a maioria das impressoras térmicas do mercado (Elgin, Bematech, Epson, Daruma, Tanca, Sweda, Gertec). Perfis podem ter larguras 58mm ou 80mm, com corte automático, logomarca, QR Code e código de barras.

Para acionar a impressão real, existem 3 opções:

1. **Navegador** (simples) — o cupom HTML já abre com botão "Imprimir".
2. **Endpoint ESC/POS** (`/api/sales/[id]/escpos`) — retorna bytes para um serviço local de impressão.
3. **Aplicativo desktop** (Tauri / Electron) — futuro, previsto na arquitetura.

---

## Arquitetura

### Estrutura de pastas

```
festabox-erp/
├── prisma/
│   ├── schema.prisma     # Multi-empresa + fiscal preparado
│   └── seed.ts           # Dados de demonstração
├── src/
│   ├── app/              # Rotas App Router
│   │   ├── (auth)/login  # Login
│   │   ├── (dashboard)/  # Páginas protegidas (sidebar)
│   │   └── api/          # Endpoints REST
│   ├── components/
│   │   ├── ui/           # Primitivos shadcn (button, card, table...)
│   │   ├── layout/       # Sidebar, topbar, header, data-table
│   │   ├── forms/        # Formulários (Produto...)
│   │   └── pdv/          # PDV client
│   ├── lib/              # prisma, auth, money, escpos, nfe-parser, permissions
│   └── services/         # Lógica de domínio (stock, ...)
├── public/
└── .env.example
```

### Camadas

```
UI  →  API  →  Services  →  Prisma  →  DB
```

- **UI**: componentes React com `"use client"` apenas quando realmente interativos.
- **API**: rotas REST em `app/api/*` (validação com Zod + permissões + auditoria).
- **Services**: lógica de domínio (ex: `stock-service.ts`, `nfe-parser.ts`).
- **Prisma**: ORM único. Não há SQL cru no código.

### Multi-empresa preparado

A tabela `Company` representa a empresa ativa. Tabela `Branch` está pronta para múltiplas filiais com estoque separado por filial (campo `branchId` já presente em `StockBalance`). Para iniciar com filiais no futuro, basta popular a tabela `Branch`.

### Módulo fiscal (preparado, não implementado)

Os seguintes campos já existem no schema, mas **sem uso** neste momento:

- `Product.ncm`, `Product.cest`, `Product.cfop`, `Product.icmsCst`, `Product.pisCst`, `Product.cofinsCst`
- `Sale.taxDocumentType`, `Sale.taxDocumentNumber`, `Sale.taxDocumentStatus`
- `SaleItem.ncm`, `SaleItem.cfop`
- `PurchaseItem.nfm`, `PurchaseItem.cfop`
- `Company.taxEnabled`, `Company.taxEnvironment`, `Company.taxCertExpiresAt`, `Company.taxSeries`, `Company.taxLastNumber`

A ativação futura (NFC-e, NF-e, SAT, CF-e, certificado digital) pode ser feita criando-se módulos `src/lib/fiscal/*` e `src/app/(dashboard)/fiscal/*` sem alterar a estrutura existente.

---

## Segurança

- Senhas com **bcrypt**.
- Sessões gerenciadas pelo **Auth.js v5** (JWT).
- Permissões verificadas no **backend** (frontend nunca é confiável).
- Auditoria de operações críticas (criações, edições, cancelamentos, abertura/fechamento de caixa).
- Validação de entrada com **Zod** em todas as APIs.

---

## Próximos passos sugeridos

- Tela completa de Orçamentos (tabela já preparada).
- Fluxo de devoluções (modelo `SaleReturn` já criado).
- Mobile nativo (a arquitetura PWA + Tauri/Electron já está pronta).
- Módulo fiscal (NFC-e, NF-e, SAT, CF-e).
- Integração com adquirentes (Cielo, Rede, Getnet, Pagar.me, Asaas).
- PIX dinâmico e Open Finance.

---

## Licença

Software proprietário. © FestaBox.