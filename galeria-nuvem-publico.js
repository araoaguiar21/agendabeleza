/* Galeria pública baseada apenas em registros publicados no Supabase. */
(function(){
"use strict";
var db=window.studioDb,area=document.getElementById("galeriaPublica"),
vazia=document.getElementById("galeriaVazia");
if(!area)return;
function aviso(msg){area.replaceChildren();var p=document.createElement("p");p.textContent=msg;area.appendChild(p);if(vazia)vazia.style.display="none";}
function visualizar(url,legenda){
var dialog=document.getElementById("ls-foto-dialog");
if(!dialog){
dialog=document.createElement("dialog");dialog.id="ls-foto-dialog";
dialog.className="ls-foto-dialog";
var close=document.createElement("button");close.textContent="Fechar ✕";close.type="button";
close.addEventListener("click",()=>dialog.close());
dialog.appendChild(close);dialog.appendChild(document.createElement("img"));
dialog.appendChild(document.createElement("p"));
dialog.addEventListener("click",e=>{if(e.target===dialog)dialog.close();});
document.body.appendChild(dialog);
var style=document.createElement("style");
style.textContent=".ls-foto-dialog{max-width:min(95vw,900px);max-height:93vh;padding:15px;border:0;border-radius:15px;background:white}.ls-foto-dialog::backdrop{background:#20111ddd}.ls-foto-dialog img{max-width:100%;max-height:74vh;display:block;margin:auto;object-fit:contain}.ls-foto-dialog button{margin:0 0 10px auto;display:block;border:0;padding:8px 12px;border-radius:8px;cursor:pointer}.ls-foto-dialog p{text-align:center;margin-top:10px}.galeria-item.ls-click-foto{display:block;width:100%;border:0;padding:0;cursor:pointer;text-align:left}";
document.head.appendChild(style);
}
dialog.querySelector("img").src=url;
dialog.querySelector("img").alt=legenda||"Foto do trabalho";
dialog.querySelector("p").textContent=legenda||"";
dialog.showModal();
}
async function iniciar(){
aviso("Carregando fotos…");
if(!db){aviso("Não foi possível carregar as fotos agora.");return;}
try{
var r=await db.from("portfolio_photos").select("storage_path,caption")
.eq("published",true).order("created_at",{ascending:false}).limit(60);
if(r.error)throw r.error;
area.replaceChildren();
if(vazia)vazia.style.display=r.data.length?"none":"block";
for(const foto of r.data){
var url=db.storage.from("leticia-portfolio").getPublicUrl(foto.storage_path).data.publicUrl;
var card=document.createElement("button");card.type="button";card.className="galeria-item ls-click-foto";
card.setAttribute("aria-label","Abrir foto: "+(foto.caption||"trabalho"));
var img=document.createElement("img");img.src=url;img.alt=foto.caption||"Foto do trabalho";img.loading="lazy";
var overlay=document.createElement("div");overlay.className="galeria-item-overlay";
var txt=document.createElement("span");txt.textContent=foto.caption||"Ver foto";
overlay.appendChild(txt);card.appendChild(img);card.appendChild(overlay);
card.addEventListener("click",()=>visualizar(url,foto.caption));
area.appendChild(card);
}
}catch(e){aviso("Não foi possível carregar as fotos. Tente atualizar a página.");console.error("Galeria pública:",e);}
}
iniciar();
})();