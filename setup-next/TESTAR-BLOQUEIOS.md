# Etapa: Folgas, Férias e Duração Real dos Serviços

Arquivos criados/alterados na branch `feat/leticia-soares-cursos`.
Não foi apagado nem desativado o painel antigo.

## Atualização local
No VS Code, dentro da pasta do projeto, um comando por vez:

```powershell
git status
git pull --ff-only
node setup-next/ativar.js
```

O instalador adiciona `bloqueios-nuvem.js` ao painel existente e não
duplica scripts. Preserva backups do HTML.

## Banco de dados — 1 SQL
Abra `supabase/bloqueios-e-duracoes.sql`, copie todo o texto no
Supabase → SQL Editor → New query e clique **Run**.

**Depende de:** `agenda.sql`, `configuracoes.sql`,
`solicitacoes-agendamento.sql` já executados.

O que muda:
- Coluna `duration_minutes` adicionada a agendamentos (antigos = **60 min** por padrão).
- A tabela `schedule_blocks` guarda horários/dias bloqueados, leitura/escrita só pela administradora.
- Triggers evitam que agendamentos futuros se sobreponham, inclusive se forem salvos em dispositivos diferentes.
- A confirmação de solicitações usa a duração do serviço e respeita as folgas.
- Consulta pública `available_studio_slots` só devolve horários livres; **nunca** dados de clientes.

## Testes recomendados
1. No painel seguro, abra **Serviços** e confira se a duração de cada serviço está correta (mínimo 15 minutos).
2. Em **Agenda**, crie um agendamento de teste de 90 minutos, às 9h. Tente criar outro às 10h: deve ser recusado. Depois remova os testes.
3. Em **🚫 Folgas e bloqueios**, crie um bloqueio de horário sem atendimento marcado (exemplo: amanhã 13h às 16h).
4. No site público, escolha um serviço e esse dia. Os horários dentro do bloqueio ou sobrepostos a agendamentos existentes não devem aparecer.
5. Volte à aba de bloqueios e remova o bloqueio de teste.
6. Um bloqueio que incluir um atendimento já confirmado deve ser recusado — reagende primeiro.

## Limitações e segurança
- O tempo de pausa/intervalo entre atendimentos ainda não é configurável.
- Cada intervalo protege uma única profissional/agenda.
- Agendamentos criados *antes* desta migração recebem duração padrão de 60 minutos; corrija individualmente.
- Só o horário **de início** precisa estar cadastrado na lista de horários; a duração pode ir além do horário de funcionamento. Isso será refinado.
- A proteção antispam atual (limite por telefone e volume diário) é **básica**. Falta verificação CAPTCHA no servidor/Edge Function e limite por IP antes da divulgação.
- Não mude diretamente no SQL o status de solicitações para Aceito. Use o botão Confirmar no painel para criar o agendamento de forma protegida.
- O login antigo permanece preservado para uso local e não deve ser exposto como painel administrativo público.
- Se o SQL retornar erro, **pare** e envie o texto da mensagem antes de testar o painel.
