/* Atualiza os HTMLs existentes sem substituir o trabalho local.
   Execute: node setup-next/ativar.js   (na pasta agendabeleza).
   Faz backup dos arquivos alterados, evita linhas duplicadas. */
"use strict";
const fs=require("node:fs"),path=require("node:path");
const raiz=path.resolve(__dirname,"..");
function alterar(nome,funcao){
  const arquivo=path.join(raiz,nome);
  if(!fs.existsSync(arquivo)){console.error("Não encontrei",nome);process.exitCode=1;return;}
  const atual=fs.readFileSync(arquivo,"utf8"),novo=funcao(atual);
  if(novo===atual){console.log("Sem mudanças:",nome);return;}
  const backup=arquivo+(nome==="index.html" ? ".antes-da-pagina-principal.bak" : ".antes-da-nuvem.bak");
  if(!fs.existsSync(backup))fs.copyFileSync(arquivo,backup);
  fs.writeFileSync(arquivo,novo,"utf8");
  console.log("Atualizado:",nome,"(backup preservado)");
}
function incluir(html,tag,marcador){
  if(html.includes(marcador))return html;
  if(!html.includes("</body>"))throw Error("Não encontrei </body>");
  return html.replace("</body>","  "+tag+"\n</body>");
}
function script(html,nome){
  return incluir(html,'<script src="'+nome+'"></script>','src="'+nome+'"');
}
alterar("index.html",function(html){
  if(!html.includes("servicosGrid"))throw Error("index.html não parece ser o site correto");
  // Evita que o módulo de cursos locais preencha a página e gere duplicação.
  html=html.replace(/<script\s+src=["']cursos\.js["']><\/script>/gmi,"");
  if(!html.includes('href="cursos.css"')){
    html=html.replace("</head>",'  <link rel="stylesheet" href="cursos.css">\n</head>');
  }
  if(!html.includes('src="brand.js"')&&html.includes('src="config.js"')){
    html=html.replace(/(<script src="config\.js"><\/script>)/,"$1\n  <script src=\"brand.js\"></script>");
  }
  [
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2",
    "supabase-config.js","nuvem-cliente.js","nuvem-publico.js",
    "galeria-nuvem-publico.js","configuracoes-publicas.js","agendamento-publico.js"
  ].forEach(nome=>{html=script(html,nome);});
  html=html.replace(/href=(["'])login\.html\1/gi,'href="login-nuvem.html"');
  // Garante que a Academia exista ANTES de carregar os cursos do Supabase.
  if(!/id=["']academia["']/i.test(html)){
    const academia = [
      '<section class="section ls-academia-section" id="academia">',
      '  <div class="section-header">',
      '    <p class="section-label">Formação profissional</p>',
      '    <h2 class="section-title">Academia Letícia Soares</h2>',
      '    <p class="section-sub">Cursos presenciais de nail design. Conheça as turmas e datas disponíveis.</p>',
      '  </div>',
      '  <div class="ls-cursos-publicos">',
      '    <h3 class="ls-titulo-cursos">Cursos disponíveis</h3>',
      '    <div id="listaCursosPublicos" class="ls-cursos-grid"></div>',
      '  </div>',
      '  <div style="text-align:center;margin-top:30px">',
      '    <a class="btn btn-primary" id="academiaWhatsApp" href="#contato">Informações sobre cursos</a>',
      '  </div>',
      '</section>'
    ].join("\n");
    html=html.replace(/(?=<section\b[^>]*\bid=["']agendamento["'])/i,academia+"\n");
  }

  // Descrição para mecanismos de busca (sem inventar preços, endereço ou avaliações).
  if(!/name=["']description["']/i.test(html)){
    html=html.replace(/<\/head>/i,
      '  <meta name="description" content="Studio Letícia Soares: serviços de nail design, portfólio de trabalhos, cursos presenciais e solicitação de horários.">\n</head>');
  }
  if(!html.includes('href="pagina-principal.css"')){
    html=html.replace(/<\/head>/i,'  <link rel="stylesheet" href="pagina-principal.css">\n</head>');
  }
  html=script(html,"pagina-principal.js");
  return html;
});
alterar("painel-nuvem.html",function(html){
  if(!html.includes("formCloudServico"))throw Error("painel-nuvem.html não parece correto");
  ["agenda-nuvem.js","solicitacoes-nuvem.js","bloqueios-nuvem.js","galeria-nuvem.js","importar-fotos-antigas.js","configuracoes-nuvem.js"]
    .forEach(nome=>{html=script(html,nome);});
  return html;
});
console.log("\nPronto! Agora rode o site via servidor local e atualize o navegador.");
