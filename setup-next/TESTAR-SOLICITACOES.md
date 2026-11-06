# Solicitações de agendamento na nuvem — instalação e teste

Esta etapa mantém os dados pessoais das clientes somente em tabelas protegidas do Supabase.
Um pedido **Pendente** não é um horário confirmado.

## 1. Antes de atualizar
No terminal do VS Code, na pasta `agendabeleza`:
```powershell
git status
git pull --ff-only
node setup-next/ativar.js
```
Se o Git mostrar conflito, pare. Não execute `git reset` ou apague arquivos.

## 2. No Supabase
No projeto Letícia Soares, em **SQL Editor → New query**, copie e execute
`supabase/solicitacoes-agendamento.sql`. O script depende de
`supabase/agenda.sql`, `supabase/configuracoes.sql` e
`supabase/secure-policies.sql` executados anteriormente.

O SQL cria a tabela `appointment_requests` com RLS de leitura só para a administração,
uma função pública que aceita pedidos sem permitir consulta dos dados pessoais, e
uma função de aprovação que cria o agendamento de maneira atômica.

## 3. Teste do site público
- Abra `index.html` servido via servidor local.
- Escolha um serviço ativo, data e horário futuro.
- Preencha dados de teste e marque a autorização de contato.
- Clique em **Enviar pedido de agendamento**.
- Resultado esperado: **Pedido enviado ao Studio! Ainda não está confirmado**.
- O mesmo telefone só pode enviar **um pedido a cada 15 minutos** nesta versão.

## 4. Teste do painel
- Abra `login-nuvem.html` e entre com a conta autorizada.
- Abra **📥 Solicitações** e confirme que o pedido aparece como `Pendente`.
- Clique em **Confirmar**; o pedido ficará `Aceito` e surgirá na Agenda.
- Avisar a cliente por WhatsApp é uma etapa manual.
- Teste **Recusar** com outro pedido de teste (não com o mesmo telefone antes de 15 min).

## Segurança e limitações
- Visitantes **não conseguem consultar** os nomes, telefones ou pedidos de outras clientes.
- Solicitações pendentes não bloqueiam automaticamente horários. A confirmação
  bloqueia apenas o mesmo par data + horário; sobreposições por duração ainda serão tratadas.
- Para divulgação ao público é necessário acrescentar proteção antispam (CAPTCHA e
  limites por IP), aviso de privacidade e política de retenção dos dados.
- Ainda existem páginas antigas de login/admin com armazenamento local no repositório;
  o lançamento requer desativar essas páginas e remover credenciais antigas do código.
- Os dados existentes nas tabelas e no navegador **não são apagados** por esta instalação.
