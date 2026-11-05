/* Galeria protegida no painel Supabase. Apenas imagens públicas autorizadas. */
(function(){
"use strict";
var db=window.studioDb,BUCKET="leticia-portfolio",fotos=[];
var q=id=>document.getElementById(id);
function elem(tag,content,klass){var x=document.createElement(tag);if(content!=null)x.textContent=String(content);if(klass)x.className=klass;return x;}
function btn(label,click){var b=elem("button",label);b.type="button";b.addEventListener("click",click);return b;}
function aviso(msg,err){var x=q("galeriaAviso");if(!x)return;x.hidden=!msg;x.className="ls-cloud-mensagem"+(err?" erro":"");x.textContent=msg||"";}
function publicUrl(path){return db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;}
function abrirGaleria(){
document.querySelectorAll(".ls-cloud-secao").forEach(x=>x.hidden=true);
document.querySelectorAll(".ls-cloud-tabs button").forEach(x=>x.classList.remove("selecionado"));
q("secaoGaleriaCloud").hidden=false;q("botaoGaleriaCloud").classList.add("selecionado");
buscar().catch(e=>aviso(e.message,true));
}
function interface(){
if(q("botaoGaleriaCloud"))return;
var nav=document.querySelector(".ls-cloud-tabs"),main=q("telaCloud");
if(!nav||!main)return;
var aba=btn("📸 Portfólio / Fotos",abrirGaleria);aba.id="botaoGaleriaCloud";nav.appendChild(aba);
nav.addEventListener("click",function(e){if(!e.target.closest("#botaoGaleriaCloud")){q("secaoGaleriaCloud").hidden=true;aba.classList.remove("selecionado");}});
var sec=document.createElement("section");sec.className="ls-cloud-secao";sec.id="secaoGaleriaCloud";sec.hidden=true;
sec.innerHTML=`
<div class="ls-cloud-card">
<h2>Adicionar foto</h2>
<p class="ls-cloud-nota">JPG, PNG ou WebP de até 5 MB. Use apenas imagens autorizadas para divulgação. Fotos enviadas a este bucket poderão ser acessadas por quem tiver o link, mesmo se depois forem ocultadas do site.</p>
<form id="formGaleriaCloud">
<div class="ls-cloud-grid">
<label class="ls-cloud-full">Foto *
<input id="arquivoGaleriaCloud" type="file" accept="image/jpeg,image/png,image/webp" required></label>
<label class="ls-cloud-full">Legenda
<input id="legendaGaleriaCloud" maxlength="240" placeholder="Ex.: Alongamento em gel"></label>
</div>
<label class="ls-cloud-check"><input id="publicarGaleriaCloud" type="checkbox" checked> Aparecer no site</label>
<div class="ls-cloud-actions"><button class="ls-cloud-primary" id="enviarGaleriaCloud" type="submit">Enviar foto</button></div>
</form></div>
<div class="ls-cloud-card">
<h2>Fotos cadastradas</h2>
<div id="galeriaAviso" class="ls-cloud-mensagem" role="status" hidden></div>
<div id="listaGaleriaCloud" class="ls-galeria-lista"></div>
</div>`;
main.insertBefore(sec,main.querySelector(".ls-cloud-nota"));
var style=document.createElement("style");
style.textContent=".ls-galeria-lista{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:14px}.ls-galeria-card{border:1px solid #edd6e0;padding:11px;border-radius:12px}.ls-galeria-card img{width:100%;height:170px;object-fit:cover;border-radius:8px}.ls-galeria-card p{margin:9px 0;font-size:14px;overflow-wrap:anywhere}.ls-galeria-card small{font-size:12px;color:#795d6b}.ls-galeria-acoes{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px}.ls-galeria-acoes button{border:1px solid #ebcada;background:#fff6f9;border-radius:8px;padding:8px;font-size:12px;cursor:pointer}";
document.head.appendChild(style);
q("formGaleriaCloud").addEventListener("submit",enviar);
}
function render(){
var lista=q("listaGaleriaCloud");lista.replaceChildren();
if(!fotos.length){lista.appendChild(elem("p","Nenhuma foto cadastrada."));return;}
fotos.forEach(function(f){
var card=elem("article",null,"ls-galeria-card"),img=elem("img");img.src=publicUrl(f.storage_path);img.alt=f.caption||"Trabalho";img.loading="lazy";card.appendChild(img);
card.appendChild(elem("p",f.caption||"Sem legenda"));card.appendChild(elem("small",f.published?"Publicada":"Oculta"));
var buttons=elem("div",null,"ls-galeria-acoes");
buttons.appendChild(btn("Legenda",()=>alterarLegenda(f)));
buttons.appendChild(btn(f.published?"Ocultar":"Publicar",()=>alterarPublicacao(f)));
buttons.appendChild(btn("Excluir",()=>excluir(f)));
card.appendChild(buttons);lista.appendChild(card);
});
}
async function buscar(){
var r=await db.from("portfolio_photos").select("*").order("created_at",{ascending:false}).limit(100);
if(r.error)throw r.error;fotos=r.data||[];render();
if(fotos.length===100)aviso("Mostrando as 100 fotos mais recentes. Paginação pendente.");
}
async function enviar(e){
e.preventDefault();
var file=q("arquivoGaleriaCloud").files[0],
ext=({"image/jpeg":"jpg","image/png":"png","image/webp":"webp"})[file&&file.type];
if(!ext||!file.size||file.size>5242880){aviso("Escolha JPG, PNG ou WebP de até 5 MB.",true);return;}
var id=crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+"_"+Math.random().toString(36).slice(2);
var path="works/"+id+"."+ext,submit=q("enviarGaleriaCloud");submit.disabled=true;aviso("Enviando foto…");
try{
var r=await db.storage.from(BUCKET).upload(path,file,{contentType:file.type,upsert:false});
if(r.error)throw r.error;
var meta=await db.from("portfolio_photos").insert({storage_path:path,caption:q("legendaGaleriaCloud").value.trim(),published:q("publicarGaleriaCloud").checked});
if(meta.error){await db.storage.from(BUCKET).remove([path]);throw meta.error;}
q("formGaleriaCloud").reset();q("publicarGaleriaCloud").checked=true;await buscar();aviso("Foto enviada!");
}catch(err){aviso("Falha ao enviar: "+err.message,true);}finally{submit.disabled=false;}
}
async function alterarLegenda(f){
var legenda=prompt("Nova legenda (até 240 caracteres):",f.caption);if(legenda===null)return;
legenda=legenda.trim();if(legenda.length>240){aviso("Legenda muito longa.",true);return;}
try{var r=await db.from("portfolio_photos").update({caption:legenda}).eq("id",f.id);if(r.error)throw r.error;await buscar();aviso("Legenda alterada.");}catch(e){aviso(e.message,true);}
}
async function alterarPublicacao(f){
try{var r=await db.from("portfolio_photos").update({published:!f.published}).eq("id",f.id);if(r.error)throw r.error;await buscar();aviso("Visibilidade alterada.");}catch(e){aviso(e.message,true);}
}
async function excluir(f){
if(!confirm("Excluir permanentemente esta foto?"))return;
try{
var r=await db.from("portfolio_photos").delete().eq("id",f.id);if(r.error)throw r.error;
var storage=await db.storage.from(BUCKET).remove([f.storage_path]);
await buscar();aviso(storage.error?"Foto retirada da lista, mas arquivo não pôde ser excluído: "+storage.error.message:"Foto excluída.",!!storage.error);
}catch(e){aviso(e.message,true);}
}
async function iniciar(){
if(!db||!q("telaCloud"))return;
try{
var user=await db.auth.getUser();if(user.error||!user.data?.user)return;
var check=await db.rpc("can_manage_studio");if(check.error||check.data!==true)return;
interface();await buscar();
}catch(e){console.error("Portfólio:",e);if(q("galeriaAviso"))aviso(e.message,true);}
}
iniciar();
})();