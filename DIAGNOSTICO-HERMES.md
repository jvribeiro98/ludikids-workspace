# Diagnóstico rápido — LudiKids (Hermes)

Data: 2026-04-27
Branch: `hermes/live`
Escopo: subir projeto e identificar estado atual + possíveis erros (sem corrigir código).

## 1) Pré-requisitos no ambiente Hermes

- Node: `v22.22.2` ✅
- pnpm: não existia inicialmente; configurado com Corepack para `pnpm 9.0.0` ✅
- Docker: **não instalado** ❌
- `.env`: não existia; criado a partir de `.env.example` para tentativa de subida local.

## 2) Tentativa de subir stack local

Comando executado:

```bash
./run-local.sh
```

Resultado:

```text
Erro: Docker não encontrado. Instale Docker e tente de novo.
```

Conclusão: **não foi possível subir API/DB/Redis via script de runtime**, pois Docker é dependência obrigatória.

## 3) Verificação de build/checks sem Docker

### Instalação de dependências

```bash
pnpm install
```

Resultado: sucesso (com warnings de pacotes/deprecações, sem bloquear).

### Build geral inicial

```bash
pnpm build
```

Resultado inicial: falha no `apps/api` com muitos erros de tipos Prisma (`InvoiceStatus`, `RoleName`, etc. não exportados).

### Geração explícita do Prisma Client (API)

```bash
pnpm --filter api exec prisma generate
```

Após isso, novo build da API:

```bash
pnpm --filter api build
```

Resultado: restou **1 erro crítico**:

```text
src/contracts/contracts.service.ts:143:1 - error TS1005: '}' expected.
```

Observação: o arquivo termina na linha 142 sem fechar a classe `ContractsService` com `}` final.

### Build do frontend

```bash
pnpm --filter web build
```

Resultado: **sucesso** ✅

### Lint e testes

- API lint:
  ```bash
  pnpm --filter api lint
  ```
  Falha: **não existe configuração ESLint** para API.

- API test:
  ```bash
  pnpm --filter api test
  ```
  Falha: **nenhum teste encontrado** (`No tests found`).

## 4) Diagnóstico consolidado

Situação atual do projeto:

1. **Bloqueio de execução local**: falta Docker no ambiente.
2. **Bloqueio de build da API**: erro de sintaxe em `apps/api/src/contracts/contracts.service.ts` (chave final ausente).
3. **Qualidade/esteira incompleta**:
   - API sem configuração ESLint funcional;
   - API sem testes automatizados detectáveis.
4. **Frontend compila normalmente** (`apps/web`).

## 5) Próximos passos recomendados (ordem prática)

1. Instalar Docker no ambiente para conseguir subir stack completa.
2. Corrigir chave faltante em `contracts.service.ts`.
3. Rodar novamente:
   - `pnpm --filter api build`
   - `pnpm build`
4. Definir baseline de qualidade na API:
   - adicionar/ajustar `.eslintrc`;
   - adicionar ao menos testes smoke (health/auth).

---

Se quiser, no próximo commit eu já faço a correção mínima (chave faltante), configuro lint base da API e deixo um smoke test para ter sinal verde/vermellho real no workspace.
