/* Inicialização pública sem o código/admin antigo e sem armazenamento de clientes no navegador. */
(function(){
"use strict";
var cfg=(typeof CONFIG!=="undefined"?CONFIG:{});
window.cfg=cfg;
function inicializar(){
  var titulo=cfg.salonName||"Studio Letícia Soares";
  document.title=titulo+" | Serviços e cursos de nail design";
  var hero=document.getElementById("heroTitle");
  if(hero){
    hero.replaceChildren();
    var palavras=titulo.split(" ");
    if(palavras.length>1){
      hero.appendChild(document.createTextNode(palavras.shift()+" "));
      var em=document.createElement("em");em.textContent=palavras.join(" ");
      hero.appendChild(em);
    }else hero.textContent=titulo;
  }
  var sub=document.getElementById("heroSub");
  if(sub)sub.textContent=cfg.slogan||"Nail design e formação profissional";
  var rodape=document.getElementById("footerName");
  if(rodape)rodape.textContent=titulo;
  var data=document.getElementById("data");
  if(data){
    function hoje(){
      return new Date().toLocaleDateString("sv-SE",{timeZone:"America/Sao_Paulo"});
    }
    data.min=hoje();
  }
}
window.mascararTelefone=function(input){
  var v=String(input.value||"").replace(/\D/g,"").slice(0,11);
  if(v.length>10)v="("+v.slice(0,2)+") "+v.slice(2,7)+"-"+v.slice(7);
  else if(v.length>6)v="("+v.slice(0,2)+") "+v.slice(2,6)+"-"+v.slice(6);
  else if(v.length>2)v="("+v.slice(0,2)+") "+v.slice(2);
  else if(v.length>0)v="("+v;
  input.value=v;
};
inicializar();
})();