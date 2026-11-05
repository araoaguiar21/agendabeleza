/* Agendamento público: solicita por WhatsApp; não salva dados pessoais no browser.
   Consulta apenas horários ocupados. A Letícia confirma e registra no painel. */
(function(){
"use strict";
var form=document.getElementById("formAgendamento");
if(!form)return;
var db=window.studioDb,date=document.getElementById("data"),
hora=document.getElementById("horario"),botao=form.querySelector('button[type="submit"]');
if(!date||!hora||!botao)return;
botao.textContent="Solicitar horário pelo WhatsApp";
var nota=document.createElement("p");
nota.style.cssText="font-size:13px;margin:12px 0 16px;color:#79576a;line-height:1.5";
nota.textContent="Esta é uma solicitação, não um agendamento confirmado. A Letícia confirma a disponibilidade pelo WhatsApp.";
botao.parentNode.insertBefore(nota,botao);
var aviso=document.createElement("p");aviso.setAttribute("role","status");
aviso.style.cssText="font-size:13px;margin:8px 0;color:#93516c";
nota.parentNode.insertBefore(aviso,nota);
function slots(){
var s=window.LETICIA_PUBLIC_CONFIG?.time_slots;
if(!Array.isArray(s)||!s.length){
s=typeof getHorarios==="function"?getHorarios():
(typeof CONFIG!=="undefined"&&CONFIG.timeSlots?CONFIG.timeSlots:[]);
}
return [...new Set(s)].filter(x=>/^([01]\d|2[0-3]):[0-5]\d$/.test(x)).sort();
}
var seq=0;
async function atualizar(){
var data=date.value,id=++seq;
hora.disabled=true;hora.replaceChildren();
var placeholder=document.createElement("option");placeholder.value="";
placeholder.textContent=data?"Buscando horários…":"Escolha uma data primeiro";
hora.appendChild(placeholder);
if(!data)return;
var ocupados=new Set(),consultaOk=false;
if(db){
try{
var result=await db.rpc("booked_slots",{p_day:data});
if(result.error)throw result.error;
if(id!==seq||date.value!==data)return;
(result.data||[]).forEach(x=>ocupados.add(x.slot));
consultaOk=true;
}catch(e){if(id!==seq)return;console.warn("Horários não confirmados:",e);}
}
hora.replaceChildren();
var inicial=document.createElement("option");inicial.value="";
inicial.textContent="Escolha um horário de preferência";hora.appendChild(inicial);
var livres=slots().filter(s=>!ocupados.has(s));
livres.forEach(function(s){
var opt=document.createElement("option");opt.value=s;opt.textContent=s;
hora.appendChild(opt);
});
hora.disabled=!livres.length;
aviso.textContent=!consultaOk
?"Não foi possível verificar a agenda. O horário escolhido será apenas uma preferência."
:livres.length?"Horários livres no momento da consulta, sujeitos à confirmação."
:"Não encontramos horários livres nesta data.";
}
date.addEventListener("change",atualizar);
date.addEventListener("input",atualizar);
document.addEventListener("studio-settings-loaded",atualizar);
atualizar();
// Capture intercepta o handler LOCAL antigo, que dizia "confirmado" e usava localStorage.
form.addEventListener("submit",function(e){
e.preventDefault();e.stopImmediatePropagation();
var nome=document.getElementById("nome").value.trim();
var tel=document.getElementById("telefone").value.replace(/\D/g,"");
var servico=document.getElementById("servico").value;
var dia=date.value,horario=hora.value;
if(nome.length<2||tel.length<10||tel.length>11||!servico||!dia||!horario){
aviso.textContent="Confira nome, WhatsApp com DDD, serviço, data e horário.";return;
}
var cfg=window.LETICIA_PUBLIC_CONFIG||window.cfg||
(typeof CONFIG!=="undefined"?CONFIG:{});
var w=String(cfg.whatsapp||"").replace(/\D/g,"");
if(w.length===11)w="55"+w;
if(!w){aviso.textContent="WhatsApp do Studio não configurado.";return;}
var partes=dia.split("-");
var dataBr=partes[2]+"/"+partes[1]+"/"+partes[0];
var msg="Olá, Letícia! Gostaria de solicitar um horário no Studio.\n"+
"Nome: "+nome+"\nWhatsApp: "+tel+"\nServiço: "+servico+
"\nData desejada: "+dataBr+"\nHorário desejado: "+horario+
"\nSe estiver disponível, pode confirmar meu agendamento?";
var link="https://wa.me/"+w+"?text="+encodeURIComponent(msg);
window.open(link,"_blank","noopener,noreferrer");
aviso.textContent="Solicitação preparada no WhatsApp. Envie a mensagem e aguarde a confirmação da Letícia.";
},true);
})();