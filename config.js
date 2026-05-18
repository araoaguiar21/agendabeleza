/* ================================================
   BEAUTYFLOW - ARQUIVO DE CONFIGURAÇÃO
   ================================================
   Para personalizar o sistema para outro salão,
   edite APENAS este arquivo!
   ================================================ */

const CONFIG = {

  /* ---- INFORMAÇÕES DO SALÃO ---- */
  salonName:   "BeautyFlow Studio",
  ownerName:   "Leticia Soares",
  slogan:      "Beleza que transforma ✨",
  address:     "Rio de Janeiro, RJ",
  instagram:   "@leticiasoares.nails",

  /* ---- CONTATO ---- */
  /* Coloque o número com DDI+DDD sem espaços: 5521... */
  whatsapp: "5521977730274",

  /* ---- ACESSO ADMINISTRADOR ---- */
  adminUser:     "admin",
  adminPassword: "123456",

  /* ---- SERVIÇOS ----
     name     : nome do serviço
     price    : preço exibido
     priceNum : valor numérico para faturamento
     duration : duração em minutos
     desc     : descrição curta
     emoji    : ícone decorativo
  -------------------------------------------------------- */
  services: [
    { name: "Alongamento",          price: "R$ 80",  priceNum: 80,  duration: 90, desc: "Unhas lindas e duradouras com gel ou fibra.",        emoji: "💅" },
    { name: "Banho de Gel",         price: "R$ 60",  priceNum: 60,  duration: 60, desc: "Brilho intenso e resistência para suas unhas.",      emoji: "✨" },
    { name: "Manutenção",           price: "R$ 40",  priceNum: 40,  duration: 60, desc: "Manutenção completa do alongamento.",                 emoji: "🔧" },
    { name: "Corte",                price: "R$ 50",  priceNum: 50,  duration: 45, desc: "Cortes modernos e super estilosos.",                  emoji: "✂️" },
    { name: "Esc",               price: "R$ 35",  priceNum: 35,  duration: 30, desc: "Escova lisa, babyliss ou com volume.",                emoji: "💆" },
    { name: "Design de Sobrancelha",price: "R$ 25",  priceNum: 25,  duration: 20, desc: "Design perfeito para realçar sua beleza.",            emoji: "🌿" },
  ],

  /* ---- HORÁRIOS DISPONÍVEIS ---- */
  timeSlots: [
    "08:00","09:00","10:00","11:00",
    "12:00","13:00","14:00","15:00",
    "16:00","17:00","18:00","19:00"
  ],

  /* ---- DIAS PARA CONSIDERAR CLIENTE "SUMIDA" ---- */
  inactiveDays: 21,

  /* ---- MENSAGEM DE CONFIRMAÇÃO WHATSAPP ---- */
  /* {nome}, {servico}, {data}, {horario} são substituídos automaticamente */
  confirmationMsg:
    "Olá {nome}! 💅\n" +
    "Seu agendamento está *confirmado*!\n\n" +
    "📋 *Serviço:* {servico}\n" +
    "📅 *Data:* {data}\n" +
    "⏰ *Horário:* {horario}\n\n" +
    "Te esperamos! ✨",

  /* ---- MENSAGEM DE LEMBRETE (clientes sumidas) ---- */
  reminderMsg:
    "Oi {nome}! 🌸\n" +
    "Saudade de você por aqui!\n" +
    "Já faz um tempinho desde o seu último atendimento.\n\n" +
    "Temos horários disponíveis esta semana. 💅\n" +
    "Que tal agendar? Responda esta mensagem! ✨",

};

/* ================================================
   FUNÇÕES AUXILIARES GLOBAIS
   ================================================ */

/* Formata "2024-07-15" → "15/07/2024" */
function formatarDataBR(dataISO) {
  if (!dataISO) return "";
  const p = dataISO.split("-");
  return p[2] + "/" + p[1] + "/" + p[0];
}

/* Retorna dia da semana em português */
function diaSemana(dataISO) {
  var dias = ["Domingo","Segunda-feira","Terça-feira",
              "Quarta-feira","Quinta-feira","Sexta-feira","Sábado"];
  var d = new Date(dataISO + "T12:00:00");
  return dias[d.getDay()];
}

/* Formata mensagem substituindo {variáveis} */
function formatarMensagem(template, vars) {
  var msg = template;
  for (var chave in vars) {
    msg = msg.replace(new RegExp("{" + chave + "}", "g"), vars[chave]);
  }
  return msg;
}

/* Gera link WhatsApp */
function linkWhatsApp(numero, mensagem) {
  return "https://wa.me/55" + numero.replace(/\D/g,"") +
         "?text=" + encodeURIComponent(mensagem);
}
