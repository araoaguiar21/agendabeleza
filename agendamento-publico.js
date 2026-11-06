/* Solicitações de agendamento: dados guardados no Supabase, não no navegador.
   O pedido só vira agendamento após aprovação da Letícia no painel.
   Nunca exibir resposta como "confirmado" antes da aprovação. */
(function () {
"use strict";
var form=document.getElementById("formAgendamento"),db=window.studioDb;
if(!form)return;
var data=document.getElementById("data");
var hora=document.getElementById("horario");
var botao=form.querySelector('button[type="submit"]');
if(!data||!hora||!botao)return;
botao.textContent="Enviar pedido de agendamento";

var explicacao=document.createElement("p");
explicacao.style.cssText="font-size:13px;margin:10px 0 14px;color:#79576a;line-height:1.5";
explicacao.textContent="Seu pedido vai para o painel da Letícia. O horário só fica confirmado quando ela aprovar e entrar em contato.";
botao.parentNode.insertBefore(explicacao,botao);

var label=document.createElement("label");
label.style.cssText="font-size:13px;display:flex;align-items:start;gap:9px;margin:9px 0 15px;line-height:1.5";
var aceite=document.createElement("input");
aceite.type="checkbox";aceite.required=true;aceite.style.cssText="width:auto;flex:none;margin-top:3px";
label.appendChild(aceite);
label.appendChild(document.createTextNode("Autorizo o envio do meu nome, WhatsApp e horário desejado ao Studio para contato sobre esta solicitação."));
botao.parentNode.insertBefore(label,botao);

var aviso=document.createElement("div");
aviso.setAttribute("role","status");
aviso.style.cssText="font-size:14px;line-height:1.5;margin:12px 0;white-space:pre-line";
botao.parentNode.insertBefore(aviso,botao);

var falar=document.createElement("a");
falar.textContent="Prefiro solicitar pelo WhatsApp";
falar.style.cssText="display:inline-block;margin:12px 0;font-size:13px;color:#86345a";
falar.target="_blank";falar.rel="noopener noreferrer";
botao.parentNode.insertBefore(falar,botao);
function config(){
return window.LETICIA_PUBLIC_CONFIG||window.cfg||
(typeof CONFIG!=="undefined"?CONFIG:{});
}
function whatsappUrl(){
var numero=String(config().whatsapp||"").replace(/\D/g,"");
if(numero.length===11)numero="55"+numero;
if(!numero)return "";
var nome=document.getElementById("nome").value.trim();
var telefone=document.getElementById("telefone").value.replace(/\D/g,"");
var servico=document.getElementById("servico").value;
var dia=data.value||"";
var p=dia.split("-");
var brasileira=p.length===3?p[2]+"/"+p[1]+"/"+p[0]:dia;
var msg="Olá, Letícia! Quero solicitar um horário.\n"+
"Nome: "+nome+"\nMeu WhatsApp: "+telefone+"\nServiço: "+servico+
"\nData: "+brasileira+"\nHorário: "+(hora.value||"a combinar")+
"\nPode confirmar a disponibilidade?";
return "https://wa.me/"+numero+"?text="+encodeURIComponent(msg);
}
function atualizarWhatsApp(){
var link=whatsappUrl();
falar.hidden=!link;
if(link)falar.href=link;
}
form.addEventListener("input",atualizarWhatsApp);
form.addEventListener("change",atualizarWhatsApp);
document.addEventListener("studio-settings-loaded",atualizarWhatsApp);
atualizarWhatsApp();

var requisicao=0;
async function atualizarHorarios(){
var dia=data.value, servico=document.getElementById("servico").value, id=++requisicao;
hora.disabled=true;hora.replaceChildren();
var vazio=document.createElement("option");
vazio.value="";
vazio.textContent=!servico?"Escolha um serviço primeiro":
(!dia?"Escolha uma data primeiro":"Consultando horários…");
hora.appendChild(vazio);
if(!dia||!servico)return;
if(!db){
aviso.textContent="Não foi possível conectar à agenda. Use o WhatsApp para solicitar.";
return;
}
try{
var resposta=await db.rpc("available_studio_slots",{p_day:dia,p_service:servico});
if(resposta.error)throw resposta.error;
if(id!==requisicao||data.value!==dia||
   document.getElementById("servico").value!==servico)return;
var disponiveis=(resposta.data||[]).map(x=>x.slot);
hora.replaceChildren();
var placeholder=document.createElement("option");placeholder.value="";
placeholder.textContent=disponiveis.length?"Escolha um horário":"Sem horários livres";
hora.appendChild(placeholder);
disponiveis.forEach(function(s){
var opt=document.createElement("option");opt.value=s;opt.textContent=s;hora.appendChild(opt);
});
hora.disabled=!disponiveis.length;
aviso.textContent=disponiveis.length
?"Horários calculados conforme a duração do serviço e as folgas; sujeitos à confirmação."
:"Não há horários livres para esse serviço na data selecionada.";
}catch(erro){
if(id!==requisicao)return;
hora.replaceChildren();
var opt=document.createElement("option");opt.value="";
opt.textContent="Agenda indisponível";hora.appendChild(opt);
aviso.textContent="Não foi possível verificar horários. Solicite pelo WhatsApp.";
console.error("Consulta de disponibilidade:",erro);
}
}
data.addEventListener("change",atualizarHorarios);
data.addEventListener("input",atualizarHorarios);
document.getElementById("servico").addEventListener("change",atualizarHorarios);
document.addEventListener("studio-settings-loaded",atualizarHorarios);
document.addEventListener("studio-services-loaded",atualizarHorarios);
atualizarHorarios();
// Intercepta o formulário legado ANTES do handler local, evitando gravação no localStorage.
form.addEventListener("submit",async function(e){
e.preventDefault();
e.stopImmediatePropagation();
var nome=document.getElementById("nome").value.trim();
var telefone=document.getElementById("telefone").value.replace(/\D/g,"");
var servico=document.getElementById("servico").value;
var dia=data.value, horario=hora.value;
if(!aceite.checked){aviso.textContent="Marque a autorização de contato.";return;}
if(nome.length<2||telefone.length<10||telefone.length>11||
!servico||!dia||!horario||hora.disabled){
aviso.textContent="Confira os campos, a data e o horário.";return;
}
if(!db){aviso.textContent="Sistema temporariamente indisponível. Solicite pelo WhatsApp.";return;}
botao.disabled=true;botao.textContent="Enviando solicitação…";
try{
var resposta=await db.rpc("request_studio_appointment",{
p_name:nome,p_phone:telefone,p_service:servico,p_day:dia,p_time:horario
});
if(resposta.error)throw resposta.error;
var resultado=resposta.data;
if(!resultado||resultado.ok!==true){
aviso.textContent=(resultado&&resultado.message)||"Não foi possível registrar. Tente novamente.";
return;
}
aviso.textContent="✅ Pedido enviado ao Studio! Ainda não está confirmado. Aguarde a resposta da Letícia.";
form.reset();atualizarHorarios();atualizarWhatsApp();
}catch(erro){
console.error("Falha no pedido de agendamento:",erro);
aviso.textContent="Não foi possível registrar o pedido na nuvem. " +
"Você pode falar diretamente pelo WhatsApp.";
}finally{
botao.disabled=false;botao.textContent="Enviar pedido de agendamento";
}
},true);
})();