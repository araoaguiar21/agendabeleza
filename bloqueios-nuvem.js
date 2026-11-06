/* Folgas, férias e horários indisponíveis no Supabase.
   Os dados são acessíveis só à administradora via RLS. */
(function () {
"use strict";
var db=window.studioDb, bloqueios=[];
function el(id){return document.getElementById(id);}
function texto(tag,val,classe){
 var n=document.createElement(tag);n.textContent=val==null?"":String(val);
 if(classe)n.className=classe;return n;
}
function msg(value,erro){
 var a=el("bloqueiosMensagem");if(!a)return;
 a.hidden=!value;a.textContent=value||"";
 a.className="ls-cloud-mensagem"+(erro?" erro":"");
}
function pad(n){return String(n).padStart(2,"0");}
function dateISO(data){return data.getFullYear()+"-"+pad(data.getMonth()+1)+"-"+pad(data.getDate());}
function diaSeguinte(iso){
 var p=iso.split("-").map(Number);
 return dateISO(new Date(p[0],p[1]-1,p[2]+1));
}
function dataBR(iso){if(!iso)return "";var x=iso.slice(0,10).split("-");return x[2]+"/"+x[1]+"/"+x[0];}
function mostrar(){
 document.querySelectorAll(".ls-cloud-secao").forEach(function(s){s.hidden=true;});
 document.querySelectorAll(".ls-cloud-tabs button").forEach(function(b){b.classList.remove("selecionado");});
 el("secaoBloqueios").hidden=false;
 el("botaoBloqueios").classList.add("selecionado");
 carregar().catch(function(e){msg("Não foi possível buscar os bloqueios: "+e.message,true);});
}
function montar(){
 if(el("secaoBloqueios"))return;
 var duracaoServico=el("servicoCloudDuracao");
 if(duracaoServico){
  duracaoServico.min="15";
  duracaoServico.required=true;
  duracaoServico.title="Informe ao menos 15 minutos para calcular horários livres.";
 }
 var nav=document.querySelector(".ls-cloud-tabs");
 var main=el("telaCloud");
 if(!nav||!main)return;
 var btn=texto("button","🚫 Folgas e bloqueios");btn.type="button";btn.id="botaoBloqueios";
 btn.addEventListener("click",mostrar);nav.appendChild(btn);
 nav.addEventListener("click",function(event){
  if(!event.target.closest("#botaoBloqueios")){
   el("secaoBloqueios").hidden=true;
   btn.classList.remove("selecionado");
  }
 });
 var sec=document.createElement("section");sec.id="secaoBloqueios";
 sec.className="ls-cloud-secao";sec.hidden=true;
 sec.innerHTML=`
<div class="ls-cloud-card">
<h2>Bloquear folga, férias ou horário pessoal</h2>
<p class="ls-cloud-nota">Escolha um intervalo para impedir novos agendamentos.
Se já houver um atendimento confirmado, reagende-o antes de criar o bloqueio.</p>
<form id="formBloqueios">
 <div class="ls-cloud-grid">
  <label>Data inicial *<input type="date" id="blkDataInicio" required></label>
  <label>Data final (inclusive) *<input type="date" id="blkDataFim" required></label>
  <label class="blk-horario">Hora inicial *
   <input type="time" id="blkHoraInicio" value="09:00" required>
  </label>
  <label class="blk-horario">Hora final *
   <input type="time" id="blkHoraFim" value="18:00" required>
  </label>
  <label class="ls-cloud-full">Motivo (opcional)
   <input type="text" id="blkMotivo" maxlength="160"
     placeholder="Ex.: férias, folga, consulta pessoal">
  </label>
 </div>
 <label class="ls-cloud-check">
  <input type="checkbox" id="blkDiaInteiro"> Bloquear dia(s) inteiro(s)
 </label>
 <div class="ls-cloud-actions">
  <button type="submit" id="blkSalvar" class="ls-cloud-primary">Salvar bloqueio</button>
  <button type="button" id="blkLimpar" class="ls-cloud-secondary">Limpar</button>
 </div>
</form>
</div>
<div class="ls-cloud-card">
 <h2>Períodos bloqueados</h2>
 <div id="bloqueiosMensagem" class="ls-cloud-mensagem" role="status" hidden></div>
 <div id="listaBloqueios"></div>
</div>`;
 var rodape=main.querySelector(":scope > p.ls-cloud-nota");
 if(rodape)main.insertBefore(sec,rodape);else main.appendChild(sec);
 var css=document.createElement("style");
 css.textContent=".ls-blk-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:15px 0;border-top:1px solid #f1e1e8}.ls-blk-row strong{display:block}.ls-blk-row small{display:block;color:#826676;margin-top:4px}.ls-blk-row button{border:1px solid #e5c9d7;background:#fff6fa;padding:9px 12px;border-radius:8px;cursor:pointer;color:#7e3456}@media(max-width:600px){.ls-blk-row{flex-direction:column;align-items:start}}";
 document.head.appendChild(css);
 el("formBloqueios").addEventListener("submit",salvar);
 el("blkLimpar").addEventListener("click",limpar);
 el("blkDiaInteiro").addEventListener("change",atualizarHoras);
 limpar();
}
function limpar(){
 el("formBloqueios").reset();
 var hoje=new Date();
 el("blkDataInicio").value=dateISO(hoje);
 el("blkDataFim").value=dateISO(hoje);
 el("blkHoraInicio").value="09:00";
 el("blkHoraFim").value="18:00";
 atualizarHoras();
}
function atualizarHoras(){
 var dia=el("blkDiaInteiro").checked;
 document.querySelectorAll(".blk-horario").forEach(function(l){l.hidden=dia;});
 el("blkHoraInicio").required=!dia;
 el("blkHoraFim").required=!dia;
}
function dataHora(iso){
 return dataBR(iso)+" "+iso.slice(11,16);
}
function render(){
 var lista=el("listaBloqueios");lista.replaceChildren();
 if(!bloqueios.length){lista.appendChild(texto("p","Nenhuma folga ou período bloqueado."));return;}
 bloqueios.forEach(function(b){
  var row=document.createElement("div");row.className="ls-blk-row";
  var inf=document.createElement("div");
  inf.appendChild(texto("strong",(b.reason||"Indisponível")));
  inf.appendChild(texto("small",dataHora(b.start_at)+" até "+dataHora(b.end_at)));
  var action=texto("button","Remover bloqueio");action.type="button";
  action.addEventListener("click",function(){remover(b,action);});
  row.appendChild(inf);row.appendChild(action);lista.appendChild(row);
 });
}
async function carregar(){
 var r=await db.from("schedule_blocks").select("*")
   .order("start_at",{ascending:true}).limit(250);
 if(r.error)throw r.error;
 bloqueios=r.data||[];render();
 if(bloqueios.length===250)msg("Mostrando apenas 250 bloqueios. Paginação pendente.",true);
}
async function salvar(event){
 event.preventDefault();
 var i=el("blkDataInicio").value,f=el("blkDataFim").value;
 var inteiro=el("blkDiaInteiro").checked;
 var hi=inteiro?"00:00":el("blkHoraInicio").value;
 var hf=inteiro?"00:00":el("blkHoraFim").value;
 if(!i||!f||f<i||!hi||!hf){msg("Confira as datas e os horários.",true);return;}
 var start=i+"T"+hi+":00";
 var end=(inteiro?diaSeguinte(f):f)+"T"+hf+":00";
 if(end<=start){msg("O término precisa acontecer depois do início.",true);return;}
 var dias=(new Date(end)-new Date(start))/86400000;
 if(!Number.isFinite(dias)||dias>366){msg("O período máximo é de 366 dias.",true);return;}
 var btn=el("blkSalvar");btn.disabled=true;msg("Salvando bloqueio…");
 try{
  var r=await db.from("schedule_blocks").insert({
   start_at:start,end_at:end,reason:el("blkMotivo").value.trim()
  });
  if(r.error)throw r.error;
  await carregar();limpar();msg("Bloqueio salvo na nuvem. O site não oferecerá esse período.");
 }catch(e){msg("Falha ao bloquear: "+e.message,true);}
 finally{btn.disabled=false;}
}
async function remover(b,btn){
 if(!confirm("Remover o bloqueio "+(b.reason||"sem motivo")+"?"))return;
 btn.disabled=true;
 try{
  var r=await db.from("schedule_blocks").delete().eq("id",b.id);
  if(r.error)throw r.error;
  await carregar();msg("Bloqueio removido.");
 }catch(e){msg("Erro ao remover: "+e.message,true);btn.disabled=false;}
}
async function iniciar(){
 if(!db||!el("telaCloud"))return;
 try{
  var user=await db.auth.getUser();if(user.error||!user.data?.user)return;
  var perm=await db.rpc("can_manage_studio");if(perm.error||perm.data!==true)return;
  montar();await carregar();
 }catch(e){console.error("Bloqueios:",e);if(el("bloqueiosMensagem"))msg(e.message,true);}
}
iniciar();
})();