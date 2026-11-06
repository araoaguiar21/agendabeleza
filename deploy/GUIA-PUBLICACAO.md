# Publicação do Studio Letícia Soares na Netlify

## O que já está pronto no GitHub
- `netlify.toml` manda gerar o site com `node deploy/build.js` e publicar apenas `dist`.
- O build usa `setup-next/ativar.js` para gerar a página principal e adicionar os recursos novos.
- Ele **não publica** `admin.html`, `login.html`, `script.js`, `config.js`, SQL, backups nem senhas antigas.
- O login novo `login-nuvem.html` e `painel-nuvem.html` são publicados com autenticação Supabase e RLS. A autenticação é a proteção do painel; esconder as páginas não é o controle de acesso.
- No site público, `publico-base.js` substitui o `script.js` antigo e evita salvar clientes no armazenamento local.
- O build exige configurações do Supabase e **falha** se não forem fornecidas.

## 1. Atualize seu repositório
No terminal do VS Code:
```powershell
git status
git pull --ff-only
```
Se houver conflito, não apague suas alterações nem use reset.
Uma versão local de `supabase-config.js` pode conter a chave publicável correta,
mas o arquivo do GitHub contém dados de exemplo. **Não publique arquivo
de configuração com service_role, secret key ou senha do banco.**

## 2. Criar a hospedagem na Netlify
1. Acesse https://app.netlify.com/ e entre com sua conta.
2. Clique **Add new project → Import an existing project → GitHub**.
3. Autorize e selecione `araoaguiar21/agendabeleza`.
4. Escolha a branch `feat/leticia-soares-cursos` para produção
   (ela contém as atualizações; se usar `main`, o site pode ficar desatualizado).
5. O arquivo `netlify.toml` define:
   - **Build command:** `node deploy/build.js`
   - **Publish directory:** `dist`
6. Antes do deploy, cadastre as variáveis de ambiente:
   - `SUPABASE_URL`: URL HTTPS pública do projeto Supabase.
   - `SUPABASE_PUBLISHABLE_KEY`: apenas chave `sb_publishable_...` do Supabase.
   Encontre esses valores em **Supabase → Project Settings → API Keys**.
   A chave publicável é própria para navegador, mas as políticas RLS precisam continuar ativas.
   **Nunca use** `service_role`, `sb_secret_`, senha do banco ou senha do painel.
7. Clique **Deploy/Publish**. A Netlify fornecerá um endereço `*.netlify.app`.
8. Não divulgue para clientes ainda: use inicialmente como prévia.

## 3. Testar no domínio Netlify
- Abrir a home em um celular e em uma janela anônima.
- Confirmar serviços, preços, duração, cursos e fotos do Supabase.
- Confirmar WhatsApp e Instagram no painel.
- Abrir login seguro, editar um serviço e atualizar a home.
- Enviar um pedido fictício, confirmar na aba Solicitações e excluir os dados de teste.
- Testar folga/bloqueio e horário ocupado.
- Verificar que `/admin.html` e `/login.html` resultam em **404** na hospedagem.
- Verificar que o navegador consegue acessar `/login-nuvem.html`.
- Testar `/privacidade.html`.
- Conferir os logs do deploy e erros do navegador.

## 4. Supabase Authentication — URL Configuration
Em **Supabase → Authentication → URL Configuration**:
- **Site URL:** `https://SEU-SITE.netlify.app`.
- Redirecionamentos permitidos: use o domínio HTTPS exato e caminhos apropriados,
  especialmente se ativar recuperação de senha, confirmação por e-mail ou OAuth.
- Se trocar para um domínio próprio, atualize o Site URL e redirects.

## 5. Não divulgar até fechar estes pontos
1. **Proteção antispam:** o formulário público atual ainda chama uma função RPC
   acessível por anônimos. O limite por telefone é básico. Para lançamento, exigir
   Turnstile/CAPTCHA validado no servidor e proteção por IP; o widget sozinho não resolve.
2. **Privacidade:** revisar `privacidade.html` com uma política de retenção de dados,
   canal de contato e responsabilidade pelo tratamento conforme LGPD.
3. **Identidade:** fotos reais autorizadas, endereço, nome, redes sociais e WhatsApp corretos.
4. **Senha antiga:** `config.js` permanece no código-fonte (não no deploy).
   A senha local antiga não protege dados da nuvem e não deve ser reutilizada.
5. **Domínio/HTTPS:** Netlify oferece HTTPS no domínio provisionado. Um domínio próprio
   é opcional, mas requer configuração de DNS/HTTPS.
6. **Verificação real:** não apenas o código, mas o site publicado deve ser testado.

## 6. Comandos úteis para teste do build no Windows
Você pode fazer um build local configurando variáveis de ambiente na sessão do terminal
(sem compartilhá-las no chat nem gravá-las no GitHub):
```powershell
$env:SUPABASE_URL = "https://SEU-PROJETO.supabase.co"
$env:SUPABASE_PUBLISHABLE_KEY = "sb_publishable_SUA_CHAVE_PUBLICA"
node deploy/build.js
```
A pasta `dist` é recriada automaticamente e fica ignorada pelo Git.
Seu `index.html` e `painel-nuvem.html` são preservados pelo instalador com backup.

## Observação sobre o login antigo
Os arquivos antigos continuam no repositório e no seu computador, como solicitado,
mas foram omitidos da pasta `dist`. Se o repositório for público, o conteúdo
dele (incluindo `config.js`) continua visível no GitHub. Não use a mesma senha do
login antigo em nenhum serviço real.
