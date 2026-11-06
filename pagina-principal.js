/* Página principal da Letícia — apresentação, navegação, CTAs e experiência móvel.
   Trabalha SOBRE as seções existentes; dados e preços continuam vindo do Supabase. */
(function(){
"use strict";
var body=document.body;
var hero=document.querySelector("section.hero");
var servicos=document.getElementById("servicos");
var form=document.getElementById("formAgendamento");
if(!hero||!servicos||!form)return;
body.classList.add("ls-public");
function no(tag,valor,classe){
  var n=document.createElement(tag);
  if(valor!==undefined&&valor!==null)n.textContent=String(valor);
  if(classe)n.className=classe;
  return n;
}
function link(rotulo,destino,classe){
  var a=no("a",rotulo,classe);
  a.href=destino;
  return a;
}
function bloco(titulo,descricao,emoji){
  var a=no("article",null,"ls-about-card");
  a.appendChild(no("div",emoji,"ls-icon"));
  a.appendChild(no("h3",titulo));
  a.appendChild(no("p",descricao));
  return a;
}
function intro(rotulo,titulo,descricao){
  var wrap=no("div",null,"ls-section-intro");
  wrap.appendChild(no("p",rotulo,"ls-eyebrow"));
  wrap.appendChild(no("h2",titulo));
  wrap.appendChild(no("p",descricao));
  return wrap;
}
function config(){
  return window.LETICIA_PUBLIC_CONFIG ||
    window.cfg || (typeof CONFIG!=="undefined"?CONFIG:{});
}
function whatsapp(){
  var numero=String(config().whatsapp||"").replace(/\D/g,"");
  if(numero.length===11)numero="55"+numero;
  return /^\d{12,15}$/.test(numero)?"https://wa.me/"+numero:"";
}
function nomeStudio(){
  var c=config();
  return (c.salon_name||c.salonName||"Letícia Soares | Nail Designer")
    .split("|")[0].trim();
}
function atualizarContato(){
  var nome=nomeStudio();
  var logo=document.getElementById("ls-nome-menu");
  if(logo)logo.textContent=nome;
  var phone=whatsapp();
  var links=document.querySelectorAll("[data-ls-whatsapp]");
  links.forEach(function(a){
    if(phone){
      a.href=phone+"?text="+encodeURIComponent(
        "Olá, Letícia! Vi seu site e gostaria de saber mais sobre os atendimentos.");
      a.hidden=false;
      a.target="_blank";a.rel="noopener noreferrer";
    }else a.hidden=true;
  });
  var curso=document.getElementById("academiaWhatsApp");
  if(curso&&phone){
    curso.href=phone+"?text="+encodeURIComponent(
      "Olá, Letícia! Quero informações sobre os cursos da Academia.");
    curso.target="_blank";curso.rel="noopener noreferrer";
    curso.hidden=false;
  }
  var insta=document.getElementById("ls-instagram");
  if(insta){
    var raw=String(config().instagram||"").trim().replace(/^@/,"");
    if(/^[\w.]{1,30}$/.test(raw)){
      insta.href="https://www.instagram.com/"+raw+"/";
      insta.hidden=false;insta.target="_blank";insta.rel="noopener noreferrer";
    }else insta.hidden=true;
  }
}
function menu(){
  var header=no("header",null,"ls-topbar");
  var inner=no("div",null,"ls-header-inner");
  var logo=link("","#inicio","ls-logo");
  var monogram=no("span","LS","ls-monogram");
  var letras=no("span",null,"ls-logo-text");
  letras.appendChild(no("span","Letícia Soares")).id="ls-nome-menu";
  letras.appendChild(no("small","STUDIO & ACADEMIA"));
  logo.appendChild(monogram);logo.appendChild(letras);
  var mobile=no("button","☰ Menu","ls-menu-btn");
  mobile.type="button";mobile.setAttribute("aria-expanded","false");
  mobile.setAttribute("aria-controls","ls-navegacao");
  var nav=no("nav",null,"ls-nav");nav.id="ls-navegacao";
  nav.setAttribute("aria-label","Navegação principal");
  [
    ["Início","#inicio"],["Sobre","#sobre"],["Serviços","#servicos"],
    ["Portfólio","#portfolio"],["Cursos","#academia"],
    ["Agendar","#agendamento"]
  ].forEach(function(par){
    nav.appendChild(link(par[0],par[1]));
  });
  nav.appendChild(link("Fale com a Letícia","#contato","ls-nav-cta"));
  mobile.addEventListener("click",function(){
    var expandiu=mobile.getAttribute("aria-expanded")!=="true";
    mobile.setAttribute("aria-expanded",String(expandiu));
    mobile.textContent=expandiu?"✕ Fechar":"☰ Menu";
    nav.classList.toggle("is-open",expandiu);
  });
  nav.addEventListener("click",function(e){
    if(e.target.closest("a")){
      nav.classList.remove("is-open");
      mobile.setAttribute("aria-expanded","false");
      mobile.textContent="☰ Menu";
    }
  });
  document.addEventListener("keydown",function(e){
    if(e.key==="Escape"&&nav.classList.contains("is-open")){
      nav.classList.remove("is-open");mobile.setAttribute("aria-expanded","false");
      mobile.textContent="☰ Menu";mobile.focus();
    }
  });
  inner.appendChild(logo);inner.appendChild(mobile);inner.appendChild(nav);
  header.appendChild(inner);body.insertBefore(header,body.firstChild);
}
function melhorarHero(){
  hero.id="inicio";
  var div=no("div",null,"ls-hero-layout");
  var copy=no("div",null,"ls-hero-copy");
  ["hero-badge","heroTitle","heroSub"].forEach(function(classe){
    var el=classe==="hero-badge"?hero.querySelector(".hero-badge"):document.getElementById(classe);
    if(el)copy.appendChild(el);
  });
  var buttons=hero.querySelector(".hero-btns");
  if(buttons)copy.appendChild(buttons);
  var badge=copy.querySelector(".hero-badge");
  if(badge)badge.textContent="STUDIO LETÍCIA SOARES · NAIL DESIGN";
  var slogan=no("p","Atendimento em nail design e cursos presenciais.","ls-hero-tagline");
  copy.appendChild(slogan);

  var art=no("div",null,"ls-hero-art");
  var visual=no("div",null,"ls-hero-visual");
  var desenho=no("div",null,"ls-hero-illustration");
  desenho.appendChild(no("div","✦","ls-sparkle"));
  desenho.appendChild(no("div","Beleza nos detalhes","ls-illustration-label"));
  desenho.appendChild(no("div","Studio Letícia Soares","ls-illustration-mini"));
  visual.appendChild(desenho);
  art.appendChild(visual);
  var sticker=no("div",null,"ls-hero-sticker");
  sticker.appendChild(no("strong","Feito para você"));
  sticker.appendChild(no("span","Cuidados com as unhas e formação profissional"));
  art.appendChild(sticker);
  div.appendChild(copy);div.appendChild(art);
  hero.insertBefore(div,hero.firstChild);
  function usarFoto(){
    if(visual.classList.contains("has-photo"))return;
    var galeria=document.getElementById("galeriaPublica");
    var origem=galeria&&galeria.querySelector("img[src]");
    if(!origem)return;
    var img=no("img");
    img.alt="Trabalho de unhas publicado no portfólio";
    img.loading="lazy";
    img.addEventListener("load",function(){visual.classList.add("has-photo");});
    img.addEventListener("error",function(){img.remove();});
    img.src=origem.currentSrc||origem.src;
    visual.appendChild(img);
  }
  var area=document.getElementById("galeriaPublica");
  if(area){
    var observador=new MutationObserver(usarFoto);
    observador.observe(area,{childList:true,subtree:true});
    usarFoto();
  }
}
function sobre(){
  if(document.getElementById("sobre"))return;
  var s=no("section",null,"ls-about");s.id="sobre";
  s.appendChild(intro("Cuidado & técnica",
    "Seu momento de cuidado começa nos detalhes",
    "No Studio Letícia Soares você encontra serviços de nail design e também pode conhecer as formações presenciais da Academia."));
  var grid=no("div",null,"ls-about-grid");
  grid.appendChild(bloco("Serviços de nail design",
    "Veja os atendimentos disponíveis e escolha aquele que combina com o que você procura.","💅"));
  grid.appendChild(bloco("Inspiração real",
    "Explore o portfólio com fotos dos trabalhos publicados pela Letícia.","✨"));
  grid.appendChild(bloco("Aprenda uma profissão",
    "Conheça as turmas e as oportunidades de formação presencial na Academia.","🎓"));
  s.appendChild(grid);
  hero.insertAdjacentElement("afterend",s);
}
function academia(){
  var sec=document.getElementById("academia");
  if(!sec){
    sec=no("section",null,"section");sec.id="academia";
    var h=no("div",null,"section-header");
    h.appendChild(no("p","Para quem quer aprender","section-label"));
    h.appendChild(no("h2","Academia Letícia Soares","section-title"));
    h.appendChild(no("p","Cursos presenciais para desenvolver suas habilidades em nail design.","section-sub"));
    sec.appendChild(h);
    var courses=no("div",null,"ls-cursos-publicos");
    courses.appendChild(no("h3","Cursos disponíveis","ls-titulo-cursos"));
    var list=no("div",null,"ls-cursos-grid");list.id="listaCursosPublicos";
    courses.appendChild(list);sec.appendChild(courses);
    var box=no("div");box.style.textAlign="center";box.style.marginTop="26px";
    var c=link("Quero informações sobre os cursos","#contato","btn btn-primary");
    c.id="academiaWhatsApp";box.appendChild(c);sec.appendChild(box);
    var booking=document.getElementById("agendamento");
    if(booking)booking.insertAdjacentElement("beforebegin",sec);
  }
  sec.classList.add("ls-academia-section");
}
function passos(){
  if(document.getElementById("como-funciona"))return;
  var sec=no("section",null,"ls-steps");sec.id="como-funciona";
  sec.appendChild(intro("Simples e sem complicação","Como solicitar seu horário",
    "Você escolhe uma preferência e a Letícia confirma a disponibilidade antes do atendimento."));
  var grid=no("div",null,"ls-steps-grid");
  [
    ["01","Escolha um serviço","Consulte as opções e os valores publicados no site."],
    ["02","Envie sua solicitação","Selecione a data e o horário que deseja e envie o pedido."],
    ["03","Aguarde a confirmação","A Letícia avalia o pedido e confirma o atendimento pelo WhatsApp."]
  ].forEach(function(part){
    var card=no("article",null,"ls-step");
    card.appendChild(no("span",part[0]));
    card.appendChild(no("h3",part[1]));
    card.appendChild(no("p",part[2]));
    grid.appendChild(card);
  });
  sec.appendChild(grid);
  var booking=document.getElementById("agendamento");
  booking.insertAdjacentElement("beforebegin",sec);
}
function perguntas(){
  if(document.getElementById("duvidas"))return;
  var section=no("section",null,"ls-faq");section.id="duvidas";
  section.appendChild(intro("Dúvidas frequentes","Antes de agendar",
    "Algumas informações para facilitar seu primeiro contato."));
  var list=no("div",null,"ls-faq-list");
  [
    ["O horário é confirmado quando envio o formulário?",
     "Não. Seu pedido fica pendente até a Letícia confirmar pelo WhatsApp. O formulário não garante a reserva."],
    ["Como descubro o preço e a duração do serviço?",
     "Os preços e serviços disponíveis aparecem na seção de serviços. Para detalhes específicos, fale com a Letícia."],
    ["Como faço para participar de um curso?",
     "Confira as turmas publicadas na Academia e entre em contato para saber sobre inscrição, datas e disponibilidade."],
    ["Posso remarcar um atendimento?",
     "Para pedir alteração ou cancelamento, converse diretamente com a Letícia pelo WhatsApp."]
  ].forEach(function(par){
    var d=no("details"),sum=no("summary",par[0]);
    d.appendChild(sum);d.appendChild(no("p",par[1]));list.appendChild(d);
  });
  section.appendChild(list);
  document.getElementById("agendamento").insertAdjacentElement("afterend",section);
}
function contato(){
  if(document.getElementById("contato"))return;
  var s=no("section",null,"ls-contact-section");s.id="contato";
  s.appendChild(no("p","Vamos conversar?","ls-eyebrow"));
  s.appendChild(no("h2","Escolha seu próximo cuidado com a Letícia"));
  s.appendChild(no("p","Tire dúvidas sobre serviços, disponibilidade de horários ou cursos presenciais."));
  var actions=no("div",null,"ls-contact-actions");
  var wa=link("Conversar no WhatsApp","#","ls-contact-cta");
  wa.dataset.lsWhatsapp="1";actions.appendChild(wa);
  var insta=link("Ver Instagram","#","ls-contact-alt");insta.id="ls-instagram";
  actions.appendChild(insta);s.appendChild(actions);
  var footer=document.querySelector("footer");
  if(footer)footer.insertAdjacentElement("beforebegin",s);
  else body.appendChild(s);
}
function fim(){
  var footer=document.querySelector("footer");
  if(!footer)return;
  var old=footer.querySelector('a[href="login.html"]');
  if(old){old.href="login-nuvem.html";old.textContent="Painel da Letícia";}
  footer.querySelectorAll("p").forEach(function(p){
    if(p.textContent.includes("Sistema BeautyFlow")){
      p.replaceChildren();
      var a=link("Acesso administrativo","login-nuvem.html");
      p.appendChild(a);
    }
  });
  var rights=no("div",null,"ls-footer-links");
  rights.appendChild(link("Início","#inicio"));
  rights.appendChild(link("Serviços","#servicos"));
  rights.appendChild(link("Cursos","#academia"));
  rights.appendChild(link("Privacidade","privacidade.html"));
  footer.appendChild(rights);
  footer.appendChild(no("p","© "+new Date().getFullYear()+" Studio Letícia Soares. Informações sujeitas à confirmação.","ls-footer-disclaimer"));
}
function mobile(){
  var bar=no("div",null,"ls-mobile-bottom");
  bar.setAttribute("aria-label","Acesso rápido");
  bar.appendChild(link("Solicitar horário","#agendamento"));
  var wa=link("WhatsApp","#");wa.dataset.lsWhatsapp="1";
  bar.appendChild(wa);body.appendChild(bar);
}
function serviceButtons(){
  var grid=document.getElementById("servicosGrid");
  if(!grid)return;
  function refresh(){
    grid.querySelectorAll(".servico-card").forEach(function(card){
      if(card.querySelector(".ls-service-action"))return;
      var title=card.querySelector("h2");
      if(!title)return;
      var btn=no("button","Solicitar este serviço","ls-service-action");
      btn.type="button";
      btn.addEventListener("click",function(){
        var select=document.getElementById("servico");
        var option=Array.from(select.options).find(function(o){return o.value===title.textContent;});
        if(option){
          select.value=option.value;
          select.dispatchEvent(new Event("change",{bubbles:true}));
        }
        document.getElementById("agendamento").scrollIntoView({behavior:"smooth",block:"start"});
        select.focus({preventScroll:true});
      });
      card.appendChild(btn);
    });
  }
  var observer=new MutationObserver(refresh);
  observer.observe(grid,{childList:true});
  refresh();
}
menu();
melhorarHero();
sobre();
academia();
passos();
perguntas();
contato();
fim();
mobile();
serviceButtons();
document.addEventListener("studio-settings-loaded",atualizarContato);
atualizarContato();
})();