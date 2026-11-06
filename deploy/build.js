/* Build para Netlify: publica apenas a página pública e o painel Supabase.
   NÃO inclui admin.html, login.html, script.js, config.js, SQL ou arquivos de backup.
   Os valores publicáveis do Supabase vêm de variáveis de ambiente da hospedagem. */
"use strict";

const fs=require("node:fs");
const path=require("node:path");
const {execFileSync}=require("node:child_process");
const root=path.resolve(__dirname,"..");
const dist=path.join(root,"dist");
function fail(message){throw new Error("[PUBLICAÇÃO INTERROMPIDA] "+message);}
function exists(name){return fs.existsSync(path.join(root,name));}
function copy(name){
  if(!exists(name))fail("Arquivo necessário ausente: "+name);
  fs.copyFileSync(path.join(root,name),path.join(dist,name));
}
function modify(name, fn){
  const p=path.join(dist,name);
  fs.writeFileSync(p,fn(fs.readFileSync(p,"utf8")),"utf8");
}
function replaceScript(html,origem,destino){
  const rx=new RegExp('(<script\\s+[^>]*src=["\\\'])'+origem.replace(/[.*+?^$\u007b\u007d()|[\]\\]/g,"\\$&")+'(["\\\'][^>]*><\\/script>)',"gi");
  const novo=html.replace(rx,"$1"+destino+"$2");
  if(novo===html)fail("Não foi possível substituir "+origem+" no HTML.");
  return novo;
}
const url=String(process.env.SUPABASE_URL||"").trim();
const publishable=String(process.env.SUPABASE_PUBLISHABLE_KEY||"").trim();
if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url))
  fail("Configure SUPABASE_URL nas variáveis de ambiente do Netlify.");
if(!/^sb_publishable_[A-Za-z0-9_-]+$/.test(publishable))
  fail("Configure SUPABASE_PUBLISHABLE_KEY (apenas chave publicável) no Netlify.");

// Netlify recebe um checkout temporário. Instala as seções que não constam
// do index.html original sem alterar o repositório no GitHub.
execFileSync(process.execPath,[path.join(root,"setup-next/ativar.js")],
             {cwd:root,stdio:"inherit"});

fs.rmSync(dist,{recursive:true,force:true});
fs.mkdirSync(dist,{recursive:true});
const publication=[
 "index.html","privacidade.html","login-nuvem.html","painel-nuvem.html",
 "style.css","cursos.css","painel-nuvem.css","pagina-principal.css",
 "publico-base.js","brand.js","nuvem-cliente.js","nuvem-publico.js",
 "galeria-nuvem-publico.js","configuracoes-publicas.js","agendamento-publico.js",
 "pagina-principal.js","painel-nuvem.js","agenda-nuvem.js","solicitacoes-nuvem.js",
 "bloqueios-nuvem.js","galeria-nuvem.js","importar-fotos-antigas.js",
 "configuracoes-nuvem.js"
];
publication.forEach(copy);

modify("index.html",html=>{
  html=replaceScript(html,"config.js","config-publico.js");
  html=replaceScript(html,"script.js","publico-base.js");
  // O formulário público usa a API de pedidos atual, ainda sem CAPTCHA de servidor:
  // NÃO divulgue amplamente este deploy até concluir proteção antispam.
  return html;
});
for(const page of ["painel-nuvem.html","login-nuvem.html"]){
  modify(page,html=>{
    if(!/name=["']robots["']/.test(html)){
      html=html.replace(/<\/head>/i,
        '  <meta name="robots" content="noindex,nofollow">\n</head>');
    }
    return html;
  });
}

// Nunca copie config.js original: ele contém dados do login local legado.
// Publicamos somente dados neutros e a chave *publicável* do Supabase.
const publicConfig={
  salonName:"Letícia Soares | Nail Designer",
  ownerName:"Letícia Soares",slogan:"Nail design e formação profissional",
  address:"",instagram:"",whatsapp:"",services:[],
  timeSlots:[],inactiveDays:21
};
fs.writeFileSync(path.join(dist,"config-publico.js"),
  "/* Configuração pública — sem credenciais administrativas */\nconst CONFIG = "+
    JSON.stringify(publicConfig,null,2)+";\n","utf8");
fs.writeFileSync(path.join(dist,"supabase-config.js"),
  "/* URL e chave publicável — ambas visíveis para quem usa o site. */\n"+
  "window.LETICIA_SUPABASE_CONFIG = "+JSON.stringify({
    url:url,publishableKey:publishable
  },null,2)+";\n","utf8");

// Configuração de cabeçalhos de navegação; não substitui controle de acesso via RLS.
fs.writeFileSync(path.join(dist,"_headers"),
  "/*\n  X-Content-Type-Options: nosniff\n"+
  "  Referrer-Policy: strict-origin-when-cross-origin\n"+
  "  X-Frame-Options: DENY\n"+
  "  Permissions-Policy: camera=(), microphone=(), geolocation=()\n"+
  "/supabase-config.js\n  Cache-Control: no-store\n"+
  "/login-nuvem.html\n  Cache-Control: no-store\n"+
  "/painel-nuvem.html\n  Cache-Control: no-store\n","utf8");
fs.writeFileSync(path.join(dist,"robots.txt"),
  "User-agent: *\nDisallow: /login-nuvem.html\nDisallow: /painel-nuvem.html\n",
  "utf8");

// Verifica que todas as dependências locais HTML realmente foram publicadas.
for(const page of ["index.html","login-nuvem.html","painel-nuvem.html"]){
 const html=fs.readFileSync(path.join(dist,page),"utf8");
 for(const match of html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)=["']([^"']+)["']/gi)){
   const ref=match[1];
   if(ref.startsWith("https://")||ref.startsWith("http://")||ref.startsWith("#"))continue;
   if(!fs.existsSync(path.join(dist,ref)))
     fail("Dependência ausente em "+page+": "+ref);
 }
}
for(const blocked of ["config.js","script.js","admin.html","login.html","supabase-config.local.js"]){
 if(fs.existsSync(path.join(dist,blocked)))fail("Arquivo antigo incluído indevidamente: "+blocked);
}
console.log("Publicação estática gerada em dist/ (sem painel/login antigos).");
console.log("Atenção: formulário público ainda exige CAPTCHA validado no servidor para lançamento.");
