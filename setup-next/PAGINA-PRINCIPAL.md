# Página principal da Letícia — instalação e checklist

## Instalar sem apagar suas alterações

No terminal do VS Code, dentro da pasta `agendabeleza`, execute **um comando de cada vez**:

```powershell
git status
git pull --ff-only
node setup-next/ativar.js
```

O instalador não sobrescreve o conteúdo que você já editou no `index.html`;
adiciona arquivos e seções que estiverem faltando. Cria uma cópia de segurança
`index.html.antes-da-pagina-principal.bak` antes de modificar.

Ele adiciona:
- `pagina-principal.css` — novo visual responsivo.
- `pagina-principal.js` — menu, apresentação, botões e perguntas frequentes.
- `privacidade.html` — resumo informativo sobre uso de dados, sujeito a revisão.
- Se a seção Academia ainda não existir, cria uma versão compatível com cursos do Supabase.

**Importante:** o `login.html` antigo e o `admin.html` antigo não serão apagados.

## Teste do site

Abra `index.html` no servidor local e pressione `Ctrl + F5`.

Confira:
- [ ] Menu navega até Serviços, Portfólio, Cursos e Agendamento.
- [ ] Na tela do celular, o menu abre e fecha.
- [ ] Nome do Studio e o WhatsApp estão certos.
- [ ] Serviços mostram **valores atuais do Supabase**.
- [ ] O botão "Solicitar este serviço" seleciona o serviço no formulário.
- [ ] A Academia lista os **cursos publicados**.
- [ ] A galeria mostra fotos publicadas e permite ampliar.
- [ ] O formulário registra um pedido **pendente**, não confirmado.
- [ ] Há um resumo de privacidade no rodapé.
- [ ] A capa utiliza a primeira foto publicada do Portfólio; sem fotos, apresenta a arte gráfica provisória.

## O que falta para publicar

- Colocar fotos reais autorizadas no Portfólio.
- Revisar nomes, descrições, preços, horários, endereço e contato no painel.
- Testar o fluxo completo com um pedido fictício, verificar a aba Solicitações e remover o teste.
- Adicionar antispam no servidor (CAPTCHA com verificação server-side e rate limit por IP), política de privacidade final e regras de retenção dos dados.
- Configurar hospedagem, HTTPS e domínio.
- Preservar `login.html` e `admin.html` para testes, mas **não publicá-los como entrada administrativa pública**. Não inclua senhas de teste nem chaves secretas na hospedagem.

Não execute `git reset --hard` e não apague `supabase-config.js`.
Se o `git pull` mostrar conflito, pare e compartilhe o erro antes de continuar.
