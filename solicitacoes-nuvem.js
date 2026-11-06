/* Pedidos vindos do site. Somente contas em admin_users podem ler/confirmar.
   A confirmação usa uma função atômica no banco, evitando horários duplicados. */
(function(){
"use strict";
var db=window.studioDb, pedidos=[];
function el(id){return document.getElementById(id);}
function node(tag,value,classe){
var n=document.createElement(tag);if(value!=null)n.textContent=String(value);
if(classe)n.className=classe;return n;
}
function dateBR(s){if(!s)return"";var a=s.split("-");return a[2]+"/"+a[1]+"/"+a[0];}
function telefone(s){return String(s||"").replace(/\D/g,"");}
function status(msg,erro){
var e=el("solicitacoesAviso");if(!e)return;e.hidden=!msg;e.textContent=msg||"";
e.className="ls-cloud-mensagem"+(erro?" erro":"");
}
function ativar(){
document.querySelectorAll(".ls-cloud-secao").forEach(e=>e.hidden=true);
document.querySelectorAll(".ls-cloud-tabs button").forEach(e=>e.classList.remove("selecionado"));
el("secaoSolicitacoes").hidden=false;el("botaoSolicitacoes").classList.add("selecionado");
carregar().catch(e=>status("Não foi possível consultar os pedidos: "+e.message,true));
}
function montar(){
if(el("secaoSolicitacoes"))return;
var nav=document.querySelector(".ls-cloud-tabs"),main=el("telaCloud");
if(!nav||!main)return;
var b=node("button","📥 Solicitações");b.type="button";b.id="botaoSolicitacoes";
b.addEventListener("click",ativar);nav.insertBefore(b,nav.firstChild);
nav.addEventListener("click",function(event){
if(!event.target.closest("#botaoSolicitacoes")){
el("secaoSolicitacoes").hidden=true;b.classList.remove("selecionado");
}
});
var sec=node("section",null,"ls-cloud-secao");sec.id="secaoSolicitacoes";sec.hidden=true;
sec.innerHTML=`
<div class="ls-cloud-card">
<h2>Solicitações de agendamento</h2>
<p class="ls-cloud-nota">Os pedidos recebidos pelo site aparecem aqui como
<strong>pendentes</strong>. Confirmar cria um agendamento na agenda da nuvem;
recusar não ocupa nenhum horário. Se confirmar, avise a cliente pelo WhatsApp.</p>
<div id="solicitacoesAviso" class="ls-cloud-mensagem" role="status" hidden></div>
<div class="ls-pedidos-filtros">
  <label>Exibir
    <select id="filtrarSolicitacoes">
      <option value="Pendente">Pendentes</option>
      <option value="Aceito">Confirmadas</option>
      <option value="Recusado">Recusadas</option>
      <option value="">Todas</option>
    </select>
  </label>
  <button type="button" class="ls-cloud-secondary" id="recarregarSolicitacoes">Atualizar lista</button>
</div>
<p id="solicitacoesTotal" class="ls-cloud-nota"></p>
<div id="listaSolicitacoes"></div>
</div>`;
var rodape=main.querySelector(":scope > p.ls-cloud-nota");
if(rodape)main.insertBefore(sec,rodape);else main.appendChild(sec);
var style=node("style");
style.textContent=".ls-pedidos-filtros{display:flex;align-items:end;gap:12px;flex-wrap:wrap;margin:12px 0 18px}.ls-pedidos-filtros label{font-size:13px;display:flex;flex-direction:column;gap:6px}.ls-pedidos-filtros select{border:1px solid #e4d3d9;padding:10px;border-radius:9px;background:white}.ls-pedido{display:flex;justify-content:space-between;align-items:center;gap:16px;border-top:1px solid #f0dce5;padding:15px 0}.ls-pedido strong{display:block}.ls-pedido small{display:block;margin-top:5px;color:#7b6270}.ls-pedido-acoes{display:flex;gap:8px;flex-wrap:wrap}.ls-pedido-acoes button,.ls-pedido-acoes a{font:inherit;font-size:12px;padding:8px 10px;cursor:pointer;border:1px solid #e7cbda;border-radius:8px;background:#fff7fa;color:#7b2b4f;text-decoration:none}.ls-pedido-acoes button:disabled{opacity:.4;cursor:wait}@media(max-width:600px){.ls-pedido{flex-direction:column;align-items:start}.ls-pedido-acoes{width:100%}}";
document.head.appendChild(style);
el("filtrarSolicitacoes").addEventListener("change",renderizar);
el("recarregarSolicitacoes").addEventListener("click",function(){
carregar().then(()=>status("Solicitações atualizadas.")).catch(e=>status(e.message,true));
});
}
function botao(rotulo,acao){
var b=node("button",rotulo);b.type="button";b.addEventListener("click",acao);return b;
}
function whatsapp(p){
var link=node("a","WhatsApp");
var tel=telefone(p.phone);
link.href="https://wa.me/"+(tel.length===11?"55":"")+tel+
"?text="+encodeURIComponent("Olá, "+p.customer_name+
"! Aqui é a Letícia Soares. Sobre seu pedido de atendimento no dia "+
dateBR(p.appointment_date)+" às "+String(p.appointment_time).slice(0,5)+".");
link.target="_blank";link.rel="noopener noreferrer";return link;
}
async function carregar(){
var r=await db.from("appointment_requests").select("*")
.order("created_at",{ascending:false}).limit(250);
if(r.error)throw r.error;pedidos=r.data||[];renderizar();
if(pedidos.length===250)status("Mostrando somente os 250 pedidos mais recentes. Paginação pendente.",true);
}
async function aceitar(p,b){
if(!confirm("Confirmar "+p.customer_name+" em "+dateBR(p.appointment_date)+
" às "+String(p.appointment_time).slice(0,5)+"?")){
return;
}
b.disabled=true;status("Confirmando horário no banco…");
try{
var r=await db.rpc("accept_studio_appointment",{p_request_id:p.id});
if(r.error)throw r.error;
if(!r.data||r.data.ok!==true){status((r.data&&r.data.message)||"Não foi possível confirmar.",true);return;}
await carregar();status("✅ Agendamento confirmado! Agora avise a cliente pelo WhatsApp.");
document.dispatchEvent(new Event("studio-appointment-changed"));
}catch(e){status("Erro ao confirmar: "+e.message,true);}
finally{b.disabled=false;}
}
async function recusar(p,b){
if(!confirm("Recusar pedido de "+p.customer_name+"?"))return;
b.disabled=true;
try{
var r=await db.from("appointment_requests").update({status:"Recusado"}).eq("id",p.id).eq("status","Pendente");
if(r.error)throw r.error;
await carregar();status("Solicitação recusada. Avise a cliente, se necessário.");
}catch(e){status("Erro ao recusar: "+e.message,true);}
finally{b.disabled=false;}
}
async function excluir(p,b){
if(!confirm("Excluir permanentemente o pedido de "+p.customer_name+
"? Isso NÃO exclui eventual agendamento já confirmado."))return;
b.disabled=true;
try{
var r=await db.from("appointment_requests").delete().eq("id",p.id);
if(r.error)throw r.error;
await carregar();status("Solicitação excluída.");
}catch(e){status("Erro ao excluir: "+e.message,true);}
finally{b.disabled=false;}
}
function renderizar(){
var lista=el("listaSolicitacoes");if(!lista)return;
lista.replaceChildren();
var filtro=el("filtrarSolicitacoes").value;
var itens=pedidos.filter(p=>!filtro||p.status===filtro);
var pendentes=pedidos.filter(p=>p.status==="Pendente").length;
el("solicitacoesTotal").textContent=pendentes+" pedido(s) pendente(s) · "+
itens.length+" exibido(s)";
if(!itens.length){lista.appendChild(node("p","Nenhuma solicitação neste filtro."));return;}
itens.forEach(function(p){
var row=node("article",null,"ls-pedido"),infos=node("div"),acoes=node("div",null,"ls-pedido-acoes");
infos.appendChild(node("strong",p.customer_name+" · "+p.service_name));
infos.appendChild(node("small",dateBR(p.appointment_date)+" às "+
String(p.appointment_time).slice(0,5)+" · "+p.status));
infos.appendChild(node("small","WhatsApp: "+p.phone));
acoes.appendChild(whatsapp(p));
if(p.status==="Pendente"){
var a=botao("Confirmar",function(){aceitar(p,a);});
var r=botao("Recusar",function(){recusar(p,r);});
acoes.appendChild(a);acoes.appendChild(r);
}
var excluirBtn=botao("Excluir",function(){excluir(p,excluirBtn);});
acoes.appendChild(excluirBtn);row.appendChild(infos);row.appendChild(acoes);
lista.appendChild(row);
});
}
async function iniciar(){
if(!db||!el("telaCloud"))return;
try{
var u=await db.auth.getUser();if(u.error||!u.data?.user)return;
var perm=await db.rpc("can_manage_studio");if(perm.error||perm.data!==true)return;
montar();await carregar();
}catch(e){console.error("Solicitações:",e);
if(el("solicitacoesAviso"))status("Falha ao carregar pedidos: "+e.message,true);
}
}
iniciar();
})();