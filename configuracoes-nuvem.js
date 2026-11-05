/* Painel Supabase: configurações públicas do Studio. */
(function(){
"use strict";
var db=window.studioDb,registro=null;
function q(id){return document.getElementById(id);}
function texto(msg,erro){var b=q("cfgCloudAviso");if(!b)return;b.hidden=!msg;b.className="ls-cloud-mensagem"+(erro?" erro":"");b.textContent=msg||"";}
function selecionar(){
document.querySelectorAll(".ls-cloud-secao").forEach(e=>e.hidden=true);
document.querySelectorAll(".ls-cloud-tabs button").forEach(e=>e.classList.remove("selecionado"));
q("secaoConfigCloud").hidden=false;q("botaoConfigCloud").classList.add("selecionado");
carregar().catch(e=>texto("Erro: "+e.message,true));
}
function montar(){
if(q("botaoConfigCloud"))return;
var nav=document.querySelector(".ls-cloud-tabs"),main=q("telaCloud");
if(!nav||!main)return;
var b=document.createElement("button");b.textContent="⚙️ Configurações";b.type="button";
b.id="botaoConfigCloud";b.addEventListener("click",selecionar);nav.appendChild(b);
nav.addEventListener("click",function(e){
if(!e.target.closest("#botaoConfigCloud")){
q("secaoConfigCloud").hidden=true;b.classList.remove("selecionado");
}
});
var s=document.createElement("section");
s.id="secaoConfigCloud";s.className="ls-cloud-secao";s.hidden=true;
s.innerHTML=`
<div class="ls-cloud-card">
<h2>Dados do Studio</h2>
<p class="ls-cloud-nota">Estas informações aparecem publicamente no site. A mudança fica salva no Supabase, acessível pelo celular e computador.</p>
<div id="cfgCloudAviso" class="ls-cloud-mensagem" hidden role="status"></div>
<form id="formConfigCloud">
<div class="ls-cloud-grid">
<label class="ls-cloud-full">Nome exibido no site *
<input id="cfgCloudNome" maxlength="100" required></label>
<label>Nome da profissional *
<input id="cfgCloudDona" maxlength="100" required></label>
<label>WhatsApp com DDI e DDD
<input id="cfgCloudWa" type="tel" placeholder="5521999999999"></label>
<label>Instagram
<input id="cfgCloudInsta" maxlength="100" placeholder="@studio"></label>
<label class="ls-cloud-full">Frase principal (slogan)
<input id="cfgCloudSlogan" maxlength="240"></label>
<label class="ls-cloud-full">Local/endereço público
<input id="cfgCloudEndereco" maxlength="240"></label>
<label>Cor principal do site
<input id="cfgCloudCor" type="color" value="#a83961"></label>
<label>Dias sem atendimento para Clientes Sumidas
<input id="cfgCloudDias" type="number" min="1" max="3650" value="21"></label>
<label class="ls-cloud-full">Horários oferecidos (um por linha, formato 09:00)
<textarea id="cfgCloudHorarios" rows="8" placeholder="09:00&#10;10:00&#10;11:00"></textarea>
</label>
</div>
<div class="ls-cloud-actions"><button class="ls-cloud-primary" type="submit" id="cfgCloudSalvar">Salvar configurações</button></div>
</form></div>`;
var rodape = main.querySelector(":scope > p.ls-cloud-nota");
if (rodape) {
  main.insertBefore(s, rodape);
  rodape.textContent = "Serviços, cursos, agenda, portfólio e configurações estão conectados ao Supabase. As solicitações públicas de horários ainda precisam da confirmação da Letícia.";
} else main.appendChild(s);
q("formConfigCloud").addEventListener("submit",salvar);
}
function preencher(d){
registro=d;
q("cfgCloudNome").value=d.salon_name||"";
q("cfgCloudDona").value=d.owner_name||"";
q("cfgCloudWa").value=d.whatsapp||"";
q("cfgCloudInsta").value=d.instagram||"";
q("cfgCloudSlogan").value=d.slogan||"";
q("cfgCloudEndereco").value=d.address||"";
q("cfgCloudCor").value=d.theme_color||"#a83961";
q("cfgCloudDias").value=d.inactive_days||21;
q("cfgCloudHorarios").value=Array.isArray(d.time_slots)?d.time_slots.join("\n"):"";
}
async function carregar(){
var r=await db.from("studio_settings").select("*").eq("id","main").single();
if(r.error)throw r.error;preencher(r.data);
}
async function salvar(e){
e.preventDefault();
var wa=q("cfgCloudWa").value.replace(/\D/g,"");
if(wa.length===11)wa="55"+wa;
if(wa&&(!/^\d{12,15}$/.test(wa))){texto("Confira o WhatsApp com DDI e DDD.",true);return;}
var slots=q("cfgCloudHorarios").value.split(/[\s,;]+/).map(x=>x.trim()).filter(Boolean);
slots=[...new Set(slots)].sort();
if(!slots.length||slots.length>48||slots.some(x=>!/^([01]\d|2[0-3]):[0-5]\d$/.test(x))){
texto("Preencha 1 a 48 horários válidos, um por linha (ex.: 09:00).",true);return;
}
var d=Number(q("cfgCloudDias").value);
if(!Number.isInteger(d)||d<1||d>3650){texto("Confira os dias de inatividade.",true);return;}
var update={
salon_name:q("cfgCloudNome").value.trim(),owner_name:q("cfgCloudDona").value.trim(),
whatsapp:wa,instagram:q("cfgCloudInsta").value.trim(),
slogan:q("cfgCloudSlogan").value.trim(),address:q("cfgCloudEndereco").value.trim(),
theme_color:q("cfgCloudCor").value,time_slots:slots,inactive_days:d,
updated_at:new Date().toISOString()
};
if(update.salon_name.length<2||update.owner_name.length<2){
texto("Preencha os nomes do Studio e da profissional.",true);return;}
var button=q("cfgCloudSalvar");button.disabled=true;texto("Salvando…");
try{
var r=await db.from("studio_settings").update(update).eq("id","main");
if(r.error)throw r.error;
await carregar();texto("Configurações salvas na nuvem! Atualize a página pública para conferir.");
}catch(err){texto("Falha ao salvar: "+err.message,true);}
finally{button.disabled=false;}
}
async function iniciar(){
if(!db||!q("telaCloud"))return;
try{
var user=await db.auth.getUser();if(user.error||!user.data?.user)return;
var perm=await db.rpc("can_manage_studio");if(perm.error||perm.data!==true)return;
montar();await carregar();
}catch(e){console.error("Configurações:",e);if(q("cfgCloudAviso"))texto(e.message,true);}
}
iniciar();
})();