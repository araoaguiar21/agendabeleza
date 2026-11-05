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
  const backup=arquivo+".antes-da-nuvem.bak";
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
  return html;
});
alterar("painel-nuvem.html",function(html){
  if(!html.includes("formCloudServico"))throw Error("painel-nuvem.html não parece correto");
  ["agenda-nuvem.js","galeria-nuvem.js","configuracoes-nuvem.js"]
    .forEach(nome=>{html=script(html,nome);});
  return html;
});
console.log("\nPronto! Agora rode o site via servidor local e atualize o navegador.");
