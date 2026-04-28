# Matriz RBAC — LudiKids ERP Escolar

## Perfis oficiais
- `PROFESSOR`
- `FUNCIONARIO`
- `COORDENACAO`
- `FINANCEIRO`
- `ADMIN_CEO`
- `ADMINISTRADOR`
- `MODERADOR`

> `ADMINISTRADOR` e `MODERADOR` são perfis técnicos/operacionais de plataforma.

## Princípios
1. **Least privilege**: cada perfil vê apenas o que precisa.
2. **Tenant-first**: toda query precisa ser filtrada por `tenantId`.
3. **Auditável**: ações sensíveis devem gerar evento em `AuditLog`.
4. **Paridade UX**: mesmas regras de autorização em desktop e PWA mobile.

## Mapa por domínio

| Domínio | Professor | Funcionário | Coordenação | Financeiro | Admin/CEO | Admin | Moderador |
|---|---:|---:|---:|---:|---:|---:|---:|
| Dashboard executivo | ❌ | ❌ | ✅ (acadêmico) | ✅ (financeiro) | ✅ | ✅ | ✅ |
| Crianças / Matrículas / Responsáveis | ✅ (somente turmas delegadas) | ✅ (operacional) | ✅ | ❌ | ✅ | ✅ | ✅ |
| Diário / Frequência / Ocorrências | ✅ | ✅ | ✅ (aprova/edita) | ❌ | ✅ | ✅ | ✅ |
| Contratos pedagógicos | ✅ (leitura) | ✅ (leitura) | ✅ | ✅ (leitura) | ✅ | ✅ | ✅ |
| Faturamento (billing) | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Pagamentos / Inadimplência | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Gastos / Centro de custo | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| RH / Ponto | leitura própria | leitura própria | ✅ | ❌ | ✅ | ✅ | ✅ |
| Comunicação (WhatsApp/alertas) | ✅ (comunicados da turma) | ✅ (execução) | ✅ | ✅ (avisos cobrança) | ✅ | ✅ | ✅ |
| Usuários / Permissões | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Tenants / Configuração global | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Backups / Auditoria | ❌ | ❌ | leitura | ❌ | ✅ | ✅ | ✅ |

## Ações sensíveis obrigatórias para auditoria
- Alteração de permissão/perfil de usuário
- Exclusão de criança, contrato, fatura, pagamento, gasto
- Alteração de valores financeiros
- Aprovação/reprovação de registro pedagógico crítico
- Mudanças em integrações externas (Asaas, mensageria)

## Próxima evolução (Fase 2 RBAC)
- Permissão por **ação** (CRUD + aprovar + exportar + auditar) além de papel.
- Escopo por turma/equipe para `PROFESSOR` e `FUNCIONARIO`.
- Feature flags por tenant para módulos opcionais.
