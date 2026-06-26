# Contratos e Orçamentos Web

Frontend em React + Vite + TailwindCSS para o teste técnico de contratos, assinaturas e gestão de obras.

## Rodar localmente

```bash
npm install
cp .env.example .env
npm run dev
```

No Windows, se o comando `cp` não funcionar, crie o arquivo `.env` manualmente copiando o conteúdo do `.env.example`.

```env
VITE_API_URL="http://localhost:3333/api"
```

Depois acesse:

```txt
http://localhost:5173
```

## O que já está incluído

- Login e cadastro
- Layout interno com menu lateral
- Select de empresa abaixo do card do topo do menu
- Opção para adicionar outra empresa pelo próprio select
- Listagem de contratos integrada com a API
- Filtros por busca, status e tipo
- Criação de contrato
- Atalho para enviar assinatura
- Atalho para vincular obra ao contrato
- Tela base de assinaturas
- Tela base de obras

## Observação

O frontend já chama `GET /companies` e `POST /companies` para listar e adicionar empresas. Se o backend ainda não tiver essas rotas, crie-as no módulo de empresas.
