/* Importa fotos do portfólio local antigo para o Supabase.
   Só habilita após login admin, evita importação em galeria não vazia.
   Não apaga bf_fotos e não reenvia automaticamente. */
(function(){
"use strict";
var db=window.studioDb, BUCKET="leticia-portfolio", botao=null;
function q(id){return document.getElementById(id);}
function informar(msg,erro){
var e=q("galeriaAviso");if(!e)return;
e.hidden=false;e.className="ls-cloud-mensagem"+(erro?" erro":"");e.textContent=msg;
}
function ler(){
try{var arr=JSON.parse(localStorage.getItem("bf_fotos")||"[]");return Array.isArray(arr)?arr:[];}
catch(e){return[];}
}
async function importar(){
var antigas=ler();
if(!antigas.length){informar("Não há fotos da galeria antiga neste navegador.",true);return;}
var r=await db.from("portfolio_photos").select("id").limit(1);
if(r.error){informar("Erro ao verificar fotos atuais: "+r.error.message,true);return;}
if(r.data.length){informar("A galeria da nuvem já possui fotos. Para evitar duplicações, a importação automática fica bloqueada. As fotos antigas permanecem salvas no navegador.",true);return;}
if(!confirm("Importar "+antigas.length+" fotos antigas para a galeria PÚBLICA da nuvem? Envie apenas trabalhos com autorização de divulgação. Os originais não serão apagados."))return;
botao.disabled=true;
var importadas=0;
try{
for(var i=0;i<antigas.length;i++){
var antiga=antigas[i],src=antiga&&antiga.src||"";
var mime=src.match(/^data:(image\/(?:jpeg|png|webp));base64,/i);
if(!mime){informar("Foto "+(i+1)+" não é um JPG, PNG ou WebP em base64. Importe as restantes manualmente.",true);break;}
var resposta=await fetch(src),blob=await resposta.blob();
if(blob.size>5*1024*1024||!blob.size){informar("Foto "+(i+1)+" ultrapassa 5 MB ou está vazia. Reduza o tamanho e tente manualmente.",true);break;}
var ext=mime[1].toLowerCase()==="image/jpeg"?"jpg":mime[1].split("/")[1];
var id=(window.crypto&&crypto.randomUUID)?crypto.randomUUID():Date.now().toString(36)+"_"+i;
var caminho="works/"+id+"."+ext;
var up=await db.storage.from(BUCKET).upload(caminho,blob,{contentType:mime[1],upsert:false});
if(up.error)throw up.error;
var grava=await db.from("portfolio_photos").insert({
storage_path:caminho,caption:String(antiga.legenda||"").slice(0,240),published:true
});
if(grava.error){await db.storage.from(BUCKET).remove([caminho]);throw grava.error;}
importadas++;
informar("Importando foto "+(i+1)+" de "+antigas.length+"…");
}
informar(importadas+" foto(s) enviadas! As fotos antigas continuam no navegador. Reabra a aba Portfólio para atualizar.");
}catch(e){informar("Importação parou após "+importadas+" fotos: "+e.message+". Não repita sem verificar duplicações.",true);}
finally{botao.disabled=false;}
}
async function iniciar(){
if(!db||!q("telaCloud"))return;
try{
var user=await db.auth.getUser();if(user.error||!user.data?.user)return;
var perm=await db.rpc("can_manage_studio");if(perm.error||perm.data!==true)return;
var sec=q("secaoGaleriaCloud");if(!sec)return;
botao=document.createElement("button");botao.type="button";
botao.className="ls-cloud-secondary";botao.textContent="Importar fotos da galeria antiga";
var card=sec.querySelector(".ls-cloud-card");
if(card)card.appendChild(botao);
botao.addEventListener("click",importar);
}catch(e){console.error("Importação de fotos:",e);}
}
iniciar();
})();