# Etapa seguinte — Letícia Soares (Studio + Academia)

Este pacote adiciona **Portfólio/Fotos**, **Configurações do Studio** e **Solicitação de horário via WhatsApp** ao projeto existente, sem substituir seu HTML original.

## Antes de começar
- Trabalhe na branch `feat/leticia-soares-cursos`.
- Salve e faça commit de alterações locais antes de `git pull`.
- **Não inclua senhas de banco, service_role ou chaves secretas no código.** A chave `sb_publishable_` é publicável.
- Faça testes localmente. **Não divulgue o projeto ainda**: a agenda pública ainda exige confirmação manual e páginas do painel antigo permanecem no repositório.

## 1 — Atualizar arquivos no VS Code
Na pasta `agendabeleza`, execute **um comando por vez**:
```powershell
git status
git pull
node setup-next/ativar.js
```
O instalador altera apenas `index.html` e `painel-nuvem.html`, cria arquivos `.antes-da-nuvem.bak` e não duplica as inclusões de scripts. Também substitui o link público para o login seguro e remove a renderização local de cursos do site público.

Se `git pull` avisar que `galeria-nuvem.js` ou `galeria-nuvem-publico.js` já existe como arquivo **não rastreado**, mova esses arquivos para uma pasta de backup fora de `agendabeleza`, repita o `git pull` e execute o instalador. Não apague seus arquivos originais. Se houver outros conflitos, veja `git status` antes de prosseguir.

## 2 — Executar três scripts SQL no Supabase
Dashboard Supabase → projeto `leticia-soares` → **SQL Editor → New query → Run**:

1. `supabase/portfolio.sql` — cria tabela + bucket para galeria.
2. `supabase/configuracoes.sql` — cria tabela para dados e horários públicos.
3. `supabase/horarios-publicos.sql` — permite consultar apenas horários ocupados sem revelar dados de clientes.

Eles dependem dos scripts `schema.sql`, `secure-policies.sql`, `check-admin.sql` e `agenda.sql` já executados antes. Se um SQL falhar, pare e anote a mensagem exata.

## 3 — Testar o painel
Abra `login-nuvem.html` e entre com o e-mail e a senha cadastrados no Supabase (não é o login antigo).
Verifique:
- **Portfólio / Fotos**: enviar JPG/PNG/WebP até 5 MB, legenda, publicar/ocultar, excluir.
- **Importar fotos da galeria antiga**: só execute uma vez, com galeria da nuvem vazia; os originais do navegador ficam preservados.
- **Configurações**: alterar nome, contato, endereço, slogan, cor e horários. Salvar.
- **Agenda**: cadastrar atendimento manual na nuvem, concluir ou cancelar.

## 4 — Testar o site público
Abra `index.html` e atualize:
- Verifique nome e WhatsApp após salvar configurações.
- Confirme que fotos publicadas aparecem e fotos ocultas saem da lista.
- Teste o formulário de agendamento: agora ele só **solicita** pelo WhatsApp. A Letícia precisa confirmar e registrar na agenda do painel.
- Horários ocupados são consultados no banco. As consultas não incluem nomes nem telefones; um horário livre durante a consulta **não garante disponibilidade** até a confirmação.

## 5 — Salvar suas alterações
Após os testes:
```powershell
git add index.html painel-nuvem.html
git commit -m "Ativa galeria configuracoes e solicitacao de horarios"
git push
```

## Limitações importantes
- Fotos em um bucket **público** podem ser abertas por quem tiver a URL mesmo após ocultá-las na lista; não use fotos privadas.
- O botão de WhatsApp **não cadastra o atendimento automaticamente**; evita prometer um horário não confirmado.
- A consulta de disponibilidade verifica o mesmo horário de início, não ainda a duração e possíveis sobreposições.
- O login local antigo e as páginas antigas ainda precisam ser desativados antes de publicar para clientes.
- Migrar fotos ou agendamentos locais exige confirmar qual navegador contém os dados.
- Para produção, configurar domínio, HTTPS, origens de autenticação, proteção contra spam e testes de permissões.

**Se aparecer algum erro, envie a mensagem exata e não continue os passos seguintes.**
