# Contratos & Orçamentos Web

Frontend do sistema SaaS local para controle de contratos, assinaturas eletrônicas, gestão de obras, ordens de compra e relatórios.

Este projeto foi desenvolvido com **React + Vite**, **TailwindCSS**, **Zustand**, **Axios** e **React Router DOM**.

---

## Visão geral

O sistema permite que uma empresa gerencie contratos, envie contratos para assinatura, acompanhe obras vinculadas aos contratos, registre custos, emita ordens de compra e gere relatórios de obra.

Principais módulos implementados:

- Autenticação: login e cadastro.
- Empresas: seleção de empresa ativa e criação de nova empresa.
- Dashboard: KPIs reais vindos do backend.
- Contratos: listagem, criação guiada por etapas, visualização, renovação, encerramento, geração de aditivo e envio para assinatura.
- Assinaturas: envio para vários assinantes por e-mail, WhatsApp ou ambos.
- View pública de assinatura: página para o assinante visualizar e assinar o contrato.
- Obras: criação, listagem, detalhes, roteiro, etapas, custos e vistorias.
- Ordens de Compra: criação, listagem, filtros, vínculo com obra e CNPJ pagador via select.
- Relatórios: listagem de relatórios de obra, visualização detalhada e geração de PDF.

---

## Tecnologias utilizadas

- React
- Vite
- TailwindCSS
- Zustand
- Axios
- React Router DOM
- Lucide React
- jsPDF
- jsPDF AutoTable

---

## Requisitos para rodar

Antes de iniciar, tenha instalado:

- Node.js 20 ou superior
- npm
- Backend do projeto rodando localmente

Backend esperado:

```txt
http://localhost:3333/api
```

Frontend esperado:

```txt
http://localhost:5173
```

---

## Instalação

Entre na pasta do projeto:

```bash
cd contratos-orcamentos-web
```

Instale as dependências:

```bash
npm install
```

Crie o arquivo `.env` a partir do exemplo:

```bash
cp .env.example .env
```

No Windows, se o comando acima não funcionar, crie manualmente um arquivo chamado `.env` na raiz do projeto.

Conteúdo do `.env`:

```env
VITE_API_URL="http://localhost:3333/api"
```

---

## Rodando em desenvolvimento

```bash
npm run dev
```

Acesse no navegador:

```txt
http://localhost:5173
```

---

## Gerar build de produção

```bash
npm run build
```

Para testar o build localmente:

```bash
npm run preview
```

---

## Estrutura de pastas

```txt
src/
├── components/
│   ├── layout/
│   │   ├── AppLayout.jsx
│   │   ├── CompanySwitcher.jsx
│   │   ├── Header.jsx
│   │   └── Sidebar.jsx
│   └── ui/
│       ├── Badge.jsx
│       ├── Button.jsx
│       ├── Card.jsx
│       ├── Input.jsx
│       ├── Select.jsx
│       └── Textarea.jsx
├── lib/
│   └── api.js
├── pages/
│   ├── Contracts.jsx
│   ├── Dashboard.jsx
│   ├── Login.jsx
│   ├── NewContract.jsx
│   ├── Obras.jsx
│   ├── PurchaseOrders.jsx
│   ├── Register.jsx
│   ├── Reports.jsx
│   ├── ReportObraView.jsx
│   ├── Signatures.jsx
│   └── SignatureView.jsx
├── stores/
│   └── authStore.js
├── App.jsx
├── index.css
└── main.jsx
```

---

## Configuração da API

O arquivo responsável pela comunicação com o backend é:

```txt
src/lib/api.js
```

Ele configura:

- URL base da API;
- token JWT no header `Authorization`;
- empresa ativa no header `x-company-id`.

Exemplo de headers enviados:

```txt
Authorization: Bearer TOKEN_DO_USUARIO
x-company-id: ID_DA_EMPRESA_SELECIONADA
```

---

## Autenticação

O estado de autenticação fica em:

```txt
src/stores/authStore.js
```

Ele salva no `localStorage`:

```txt
@contratos:auth
```

Dados salvos:

- usuário logado;
- empresa ativa;
- token JWT.

Ao trocar de empresa no menu lateral, o frontend atualiza a empresa ativa no `localStorage` e passa a enviar o novo `x-company-id` para o backend.

---

## Rotas do frontend

### Públicas

```txt
/login
/register
/signatures/:id/view
```

### Protegidas

```txt
/
/contracts
/contracts/new
/signatures
/obras
/purchase-orders
/reports
/reports/obras/:id/view
```

---

## Módulo Dashboard

Arquivo:

```txt
src/pages/Dashboard.jsx
```

Consome:

```txt
GET /api/dashboard
```

Exibe:

- total de contratos;
- contratos ativos;
- contratos aguardando assinatura;
- contratos vencendo;
- obras em andamento;
- orçamento previsto;
- orçamento realizado;
- uso do orçamento;
- ordens de compra;
- alertas operacionais.

---

## Módulo Contratos

Arquivos principais:

```txt
src/pages/Contracts.jsx
src/pages/NewContract.jsx
```

### Listagem de contratos

A listagem segue os campos exigidos:

- Parte relacionada;
- Tipo de contrato;
- Valor do contrato;
- Data de início;
- Data de encerramento;
- Vigência restante calculada automaticamente.

Também possui ações rápidas:

- Visualizar;
- Renovar;
- Encerrar;
- Gerar aditivo;
- Enviar para assinatura.

O botão **Enviar para assinatura** não aparece para contratos que:

- já foram enviados para assinatura;
- já foram assinados;
- estão arquivados;
- estão expirados;
- estão cancelados;
- estão encerrados.

### Novo contrato guiado por etapas

A tela `/contracts/new` possui fluxo guiado:

1. Dados principais;
2. Valores e vigência;
3. Conteúdo do contrato;
4. Revisão.

O contrato só é criado na etapa final, ao clicar em **Criar contrato**.

Campos de valor usam máscara em reais:

- Valor total;
- Valor mensal.

Antes de enviar ao backend, os valores são convertidos para número.

---

## Módulo Assinaturas

Arquivo:

```txt
src/pages/Signatures.jsx
```

Consome contratos que ainda não foram enviados para assinatura.

Permite:

- selecionar contrato;
- escolher canal de envio;
- adicionar vários assinantes;
- enviar por e-mail;
- enviar por WhatsApp;
- enviar por e-mail e WhatsApp.

Após tentar enviar, o formulário é ocultado e o sistema exibe um painel de:

- sucesso; ou
- erro.

No sucesso, exibe os links gerados por assinante.

---

## View pública de assinatura

Arquivo:

```txt
src/pages/SignatureView.jsx
```

Rota:

```txt
/signatures/:id/view
```

Essa página é pública porque o assinante recebe o link por e-mail ou WhatsApp.

Ela permite:

- carregar o contrato pelo link;
- visualizar os dados principais;
- visualizar o conteúdo do contrato;
- assinar o contrato.

Quando todos os assinantes assinam, o backend deve marcar o contrato como assinado e arquivado.

---

## Módulo Obras

Arquivo:

```txt
src/pages/Obras.jsx
```

Permite:

- listar obras;
- criar nova obra;
- vincular obra a contrato;
- filtrar por busca e status;
- visualizar detalhes da obra;
- acompanhar roteiro por etapas;
- concluir etapas;
- lançar custos;
- registrar vistoria inicial;
- registrar vistoria final;
- visualizar orçamento previsto e realizado;
- acompanhar progresso da obra.

Status usados:

```txt
PLANNING
IN_PROGRESS
FINISHED
CANCELED
```

Categorias de custo:

```txt
MATERIAL
LABOR
EQUIPMENT
SERVICE
OTHER
```

---

## Módulo Ordens de Compra

Arquivo:

```txt
src/pages/PurchaseOrders.jsx
```

Rota:

```txt
/purchase-orders
```

Permite:

- listar ordens de compra;
- filtrar por busca, status e obra;
- criar nova O.C.;
- vincular O.C. a uma obra;
- visualizar detalhes da O.C.;
- alterar status;
- remover O.C.

O campo **CNPJ pagador** é via select.

O select pode exibir:

- CNPJ da empresa ativa;
- CNPJs já usados em ordens de compra anteriores.

Status usados:

```txt
DRAFT
ISSUED
APPROVED
CANCELED
```

---

## Módulo Relatórios

Arquivos:

```txt
src/pages/Reports.jsx
src/pages/ReportObraView.jsx
```

Rotas:

```txt
/reports
/reports/obras/:id/view
```

A página `/reports` lista relatórios de obras com filtros por:

- busca;
- status.

A página `/reports/obras/:id/view` exibe o relatório completo da obra em uma tela separada.

O relatório mostra:

- dados da empresa;
- dados da obra;
- contrato vinculado;
- progresso;
- orçamento previsto;
- orçamento realizado;
- status financeiro;
- etapas;
- custos por categoria;
- vistorias;
- ordens de compra.

### Geração de PDF

A geração de PDF usa:

```txt
jspdf
jspdf-autotable
```

O botão **Baixar PDF** gera um arquivo A4 programaticamente, sem depender de print da tela ou impressão do navegador.

---

## Design e layout

O layout foi feito para ser limpo e fino:

- botões menores;
- bordas suaves;
- cards leves;
- menu lateral fixo;
- apenas o conteúdo principal rola;
- header fixo dentro da área principal;
- componentes com aparência consistente.

Arquivos principais de layout:

```txt
src/components/layout/AppLayout.jsx
src/components/layout/Sidebar.jsx
src/components/layout/Header.jsx
```

Componentes visuais base:

```txt
src/components/ui/Button.jsx
src/components/ui/Input.jsx
src/components/ui/Select.jsx
src/components/ui/Textarea.jsx
src/components/ui/Card.jsx
src/components/ui/Badge.jsx
```

---

## Backend necessário

Para o frontend funcionar completo, o backend precisa expor as rotas abaixo.

### Auth

```txt
POST /api/auth/register
POST /api/auth/login
```

### Empresas

```txt
GET  /api/companies
POST /api/companies
```

### Dashboard

```txt
GET /api/dashboard
```

### Contratos

```txt
GET    /api/contracts
GET    /api/contracts/:id
POST   /api/contracts
PUT    /api/contracts/:id
DELETE /api/contracts/:id
POST   /api/contracts/:id/send-signature
POST   /api/contracts/:id/renew
POST   /api/contracts/:id/close
POST   /api/contracts/:id/addendum
```

### Assinaturas públicas

```txt
GET  /api/signatures/:id/view
POST /api/signatures/:id/sign
```

### Obras

```txt
GET   /api/obras
GET   /api/obras/:id
POST  /api/obras
PUT   /api/obras/:id
PATCH /api/obras/:id/steps/:stepId/complete
POST  /api/obras/:id/custos
POST  /api/obras/:id/vistorias
POST  /api/obras/:id/purchase-orders
```

### Ordens de compra

```txt
GET    /api/purchase-orders
GET    /api/purchase-orders/:id
POST   /api/purchase-orders
PUT    /api/purchase-orders/:id
DELETE /api/purchase-orders/:id
```

### Relatórios

```txt
GET /api/reports/obras
GET /api/reports/obras/:id
```

---

## Fluxo recomendado para demonstração

1. Criar uma conta em `/register`.
2. Criar ou selecionar uma empresa pelo menu lateral.
3. Criar um contrato em `/contracts/new`.
4. Ir em `/signatures` e enviar o contrato para assinatura.
5. Abrir o link público de assinatura.
6. Assinar o contrato.
7. Criar uma obra vinculada ao contrato.
8. Concluir etapas da obra.
9. Lançar custos.
10. Criar uma ordem de compra.
11. Abrir o dashboard e validar os KPIs.
12. Gerar relatório da obra em PDF.

---

## Problemas comuns

### `npm run dev` mostra "Missing script: dev"

Você provavelmente está fora da pasta do projeto.

Entre na pasta correta:

```bash
cd contratos-orcamentos-web
npm run dev
```

Confirme se existe `package.json` na pasta atual:

```bash
dir
```

No Linux/macOS:

```bash
ls
```

---

### Frontend não conecta no backend

Confira o `.env`:

```env
VITE_API_URL="http://localhost:3333/api"
```

Depois reinicie o Vite:

```bash
CTRL + C
npm run dev
```

---

### Erro 401 ou token inválido

Faça logout e login novamente.

Também pode limpar o localStorage no navegador removendo:

```txt
@contratos:auth
```

---

### Erro ao alternar empresa

Verifique se o backend possui suporte ao header:

```txt
x-company-id
```

E se o usuário logado está vinculado à empresa selecionada.

---

### Relatório PDF não baixa

Rode:

```bash
npm install
```

E confira se as dependências existem no `package.json`:

```json
"jspdf": "^4.2.1",
"jspdf-autotable": "^5.0.8"
```

---

## Scripts disponíveis

```bash
npm run dev
```

Roda o projeto em desenvolvimento.

```bash
npm run build
```

Gera build de produção.

```bash
npm run preview
```

Abre uma prévia local do build.

---

## Observação sobre entrega

Este frontend foi montado para demonstração local do teste técnico. O foco é mostrar o fluxo completo do produto:

```txt
empresa -> contrato -> assinatura -> obra -> custos -> O.C. -> relatório -> dashboard
```

