/* Configurações públicas do Studio, atualizadas a partir do Supabase. */
(function(){
"use strict";
var db=window.studioDb;if(!document.getElementById("heroTitle")||!db)return;
function t(id,value){var e=document.getElementById(id);if(e)e.textContent=value||"";}
function atualizarNome(nome){
var hero=document.getElementById("heroTitle");if(!hero)return;
hero.replaceChildren();
var partes=nome.split(" ");if(partes.length<2){hero.textContent=nome;return;}
hero.appendChild(document.createTextNode(partes[0]+" "));
var em=document.createElement("em");em.textContent=partes.slice(1).join(" ");hero.appendChild(em);
}
async function carregar(){
try{
var r=await db.from("studio_settings").select("*").eq("id","main").maybeSingle();
if(r.error)throw r.error;
if(!r.data)return;
var s=r.data;window.LETICIA_PUBLIC_CONFIG=s;
var cfg=window.cfg||(typeof CONFIG!=="undefined"?CONFIG:null);
if(cfg){
if(s.salon_name)cfg.salonName=s.salon_name;
if(s.owner_name)cfg.ownerName=s.owner_name;
if(s.slogan)cfg.slogan=s.slogan;
if(s.whatsapp)cfg.whatsapp=s.whatsapp;
if(s.instagram)cfg.instagram=s.instagram;
if(s.address)cfg.address=s.address;
}
if(s.salon_name){
document.title=s.salon_name;atualizarNome(s.salon_name);
t("footerName",s.salon_name);
}
if(s.slogan)t("heroSub",s.slogan);
t("footerAddress",s.address);
t("footerInsta",s.instagram);
var numero=String(s.whatsapp||cfg?.whatsapp||"").replace(/\D/g,"");
if(numero){
["waFixo","heroWaBtn"].forEach(function(id){
var a=document.getElementById(id);if(a){a.href="https://wa.me/"+numero;a.rel="noopener noreferrer";}});
var academia=document.getElementById("academiaWhatsApp");
if(academia){
academia.href="https://wa.me/"+numero+"?text="+encodeURIComponent("Olá, Letícia! Gostaria de saber mais sobre os cursos.");
academia.style.display="";
}
}
var color=s.theme_color||"";
if(/^#[0-9a-f]{6}$/i.test(color))document.documentElement.style.setProperty("--primary",color);
document.dispatchEvent(new Event("studio-settings-loaded"));
}catch(e){console.error("Erro ao carregar configurações públicas:",e);}
}
carregar();
})();