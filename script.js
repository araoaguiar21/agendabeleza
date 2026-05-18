/* ================================================
   BEAUTYFLOW — SCRIPT PRINCIPAL
   Funciona em index.html, login.html e admin.html
   ================================================ */

"use strict";

/* ================================================
   STORAGE — Chaves do localStorage
   ================================================ */
var CHAVE_AG    = "bf_agendamentos";  // array de agendamentos
var CHAVE_CFG   = "bf_cfg";           // config salva pelo admin
var CHAVE_HOR   = "bf_horarios";      // horários ativos

/* ================================================
   HELPERS
   ================================================ */

function toast(msg, tipo) {
  var el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.className = "toast show " + (tipo || "");
  clearTimeout(toast._t);
  toast._t = setTimeout(function(){ el.className = "toast"; }, 3000);
}

function hoje() {
  var d = new Date();
  var mm = String(d.getMonth()+1).padStart(2,"0");
  var dd = String(d.getDate()).padStart(2,"0");
  return d.getFullYear() + "-" + mm + "-" + dd;
}

function hojeTimestamp() {
  return new Date(hoje() + "T00:00:00").getTime();
}

/* Retorna config mesclada (localStorage sobrescreve CONFIG) */
function getCfg() {
  var salvo = {};
  try { salvo = JSON.parse(localStorage.getItem(CHAVE_CFG)) || {}; } catch(e){}
  return Object.assign({}, CONFIG, salvo);
}

/* Retorna lista de horários ativos */
function getHorarios() {
  var salvo = localStorage.getItem(CHAVE_HOR);
  if (salvo) {
    try { return JSON.parse(salvo); } catch(e){}
  }
  return CONFIG.timeSlots.slice();
}

/* Retorna agendamentos do localStorage */
function getAgendamentos() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_AG)) || [];
  } catch(e) { return []; }
}

/* Salva agendamentos */
function setAgendamentos(lista) {
  localStorage.setItem(CHAVE_AG, JSON.stringify(lista));
}

/* Máscara de telefone (21) 99999-9999 */
function mascararTelefone(input) {
  var v = input.value.replace(/\D/g,"").substring(0,11);
  if (v.length > 10) {
    v = "(" + v.slice(0,2) + ") " + v.slice(2,7) + "-" + v.slice(7);
  } else if (v.length > 6) {
    v = "(" + v.slice(0,2) + ") " + v.slice(2,6) + "-" + v.slice(6);
  } else if (v.length > 2) {
    v = "(" + v.slice(0,2) + ") " + v.slice(2);
  } else if (v.length > 0) {
    v = "(" + v;
  }
  input.value = v;
}

/* Extrai apenas números do telefone */
function somenteNumeros(str) {
  return (str || "").replace(/\D/g,"");
}

/* Verifica se horário está disponível */
function horarioDisponivel(data, horario, ignorarId) {
  var ags = getAgendamentos();
  for (var i=0; i<ags.length; i++) {
    var ag = ags[i];
    if (ag.id === ignorarId) continue;
    if (ag.data === data && ag.horario === horario && ag.status !== "Cancelado") {
      return false;
    }
  }
  return true;
}

/* Retorna data mínima (hoje) no formato YYYY-MM-DD */
function dataMinima() {
  return hoje();
}

/* ================================================
   DETECÇÃO DE PÁGINA
   ================================================ */

var pagina = (function() {
  var body = document.body;
  if (document.getElementById("formAgendamento")) return "index";
  if (document.getElementById("loginForm"))        return "login";
  if (document.getElementById("aba-dashboard"))    return "admin";
  return "outro";
})();

/* ================================================
   INDEX.HTML — LANDING PAGE
   ================================================ */

if (pagina === "index") {

  var cfg = getCfg();

  /* Preenche textos com config */
  document.title = cfg.salonName;
  var t;
  t = document.getElementById("pageTitle");   if(t) t.textContent = cfg.salonName;
  t = document.getElementById("heroSub");     if(t) t.textContent = cfg.slogan;
  t = document.getElementById("footerName");  if(t) t.textContent = cfg.salonName;
  t = document.getElementById("footerAddress");if(t) t.textContent = cfg.address || "";

  /* Título hero */
  var heroTitle = document.getElementById("heroTitle");
  if (heroTitle) {
    var partes = cfg.salonName.split(" ");
    if (partes.length >= 2) {
      heroTitle.innerHTML = partes[0] + "<em>" + partes.slice(1).join(" ") + "</em>";
    } else {
      heroTitle.textContent = cfg.salonName;
    }
  }

  /* Links WhatsApp */
  var waLink = "https://wa.me/" + cfg.whatsapp;
  var waBtn = document.getElementById("heroWaBtn");
  if(waBtn) waBtn.href = waLink;
  var waFixo = document.getElementById("waFixo");
  if(waFixo) waFixo.href = waLink;

  /* Preenche grid de serviços */
  var grid = document.getElementById("servicosGrid");
  if (grid) {
    grid.innerHTML = "";
    cfg.services.forEach(function(s) {
      grid.innerHTML +=
        '<div class="servico-card">' +
          '<span class="servico-emoji">' + s.emoji + '</span>' +
          '<h2>' + s.name + '</h2>' +
          '<p>' + s.desc + '</p>' +
          '<span class="servico-price">' + s.price + '</span>' +
        '</div>';
    });
  }

  /* Preenche select de serviços no form */
  var selServico = document.getElementById("servico");
  if (selServico) {
    selServico.innerHTML = '<option value="">Escolha um serviço...</option>';
    cfg.services.forEach(function(s) {
      selServico.innerHTML += '<option value="' + s.name + '">' + s.name + ' — ' + s.price + '</option>';
    });
  }

  /* Data mínima = hoje */
  var inputData = document.getElementById("data");
  if (inputData) inputData.min = dataMinima();

  /* Ao mudar a data, carrega horários disponíveis */
  if (inputData) {
    inputData.addEventListener("change", function() {
      carregarHorariosDisponiveis(this.value);
    });
  }

  function carregarHorariosDisponiveis(data) {
    var sel = document.getElementById("horario");
    var aviso = document.getElementById("avisoHorario");
    if (!sel) return;
    sel.innerHTML = "";
    var horarios = getHorarios();
    var disponiveis = [];
    horarios.forEach(function(h) {
      if (horarioDisponivel(data, h, null)) disponiveis.push(h);
    });
    if (disponiveis.length === 0) {
      sel.innerHTML = '<option value="">Sem horários neste dia</option>';
      if (aviso) {
        aviso.style.display = "block";
        aviso.textContent = "?? Todos os horários neste dia estão ocupados. Por favor, escolha outra data.";
      }
    } else {
      sel.innerHTML = '<option value="">Selecione um horário</option>';
      disponiveis.forEach(function(h) {
        sel.innerHTML += '<option value="' + h + '">' + h + '</option>';
      });
      if (aviso) aviso.style.display = "none";
    }
  }

  /* Submit do formulário de agendamento */
  var form = document.getElementById("formAgendamento");
  if (form) {
    form.addEventListener("submit", function(e) {
      e.preventDefault();

      var nome     = document.getElementById("nome").value.trim();
      var telefone = somenteNumeros(document.getElementById("telefone").value);
      var servico  = document.getElementById("servico").value;
      var data     = document.getElementById("data").value;
      var horario  = document.getElementById("horario").value;

      if (!nome || !telefone || !servico || !data || !horario) {
        toast("Preencha todos os campos!", "err");
        return;
      }

      if (telefone.length < 10) {
        toast("WhatsApp inválido! Inclua o DDD.", "err");
        return;
      }

      /* Verifica disponibilidade novamente antes de salvar */
      if (!horarioDisponivel(data, horario, null)) {
        toast("Esse horário acabou de ser ocupado. Escolha outro!", "err");
        carregarHorariosDisponiveis(data);
        return;
      }

      /* Cria agendamento */
      var ag = {
        id:               Date.now(),
        nome:             nome,
        telefone:         telefone,
        servico:          servico,
        data:             data,
        horario:          horario,
        status:           "Agendado",
        dataCriacao:      Date.now(),
        ultimoAtendimento:Date.now()
      };

      /* Busca o preço do serviço */
      cfg.services.forEach(function(s) {
        if (s.name === servico) ag.preco = s.priceNum || 0;
      });

      var ags = getAgendamentos();
      ags.push(ag);
      setAgendamentos(ags);

      /* Monta mensagem de confirmação */
      var msg = formatarMensagem(cfg.confirmationMsg, {
        nome:    nome,
        servico: servico,
        data:    formatarDataBR(data),
        horario: horario
      });

      /* Abre WhatsApp com a confirmação */
      var link = linkWhatsApp(cfg.whatsapp, msg);
      window.open(link, "_blank");

      toast("Agendamento confirmado! ??", "ok");
      form.reset();
      document.getElementById("horario").innerHTML = '<option value="">Selecione a data primeiro</option>';
    });
  }
}

/* ================================================
   ADMIN.HTML
   ================================================ */

if (pagina === "admin") {

  /* Verificação de login */
  if (sessionStorage.getItem("bf_logado") !== "1") {
    window.location.href = "login.html";
  }

  var cfg = getCfg();

  /* Preenche textos */
  document.title = "Admin — " + cfg.salonName;
  var t;
  t = document.getElementById("sidebarNome"); if(t) t.textContent = cfg.salonName;
  t = document.getElementById("headerNome");  if(t) t.textContent = cfg.salonName;
  t = document.getElementById("diasInativos");if(t) t.textContent = cfg.inactiveDays;

  /* Relógio */
  function atualizarRelogio() {
    var el = document.getElementById("relogio");
    if (!el) return;
    var now = new Date();
    var h = String(now.getHours()).padStart(2,"0");
    var m = String(now.getMinutes()).padStart(2,"0");
    var s = String(now.getSeconds()).padStart(2,"0");
    var dias = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
    el.textContent = dias[now.getDay()] + "  " + h+":"+m+":"+s;
  }
  atualizarRelogio();
  setInterval(atualizarRelogio, 1000);

  /* SISTEMA DE ABAS */
  window.trocarAba = function(aba, link) {
    document.querySelectorAll(".aba").forEach(function(el) {
      el.classList.remove("ativa");
    });
    document.querySelectorAll(".sidebar-nav a").forEach(function(el) {
      el.classList.remove("ativo");
    });
    var el = document.getElementById("aba-" + aba);
    if (el) el.classList.add("ativa");
    if (link) link.classList.add("ativo");

    if (aba === "agenda")   renderizarAgenda();
    if (aba === "sumidas")  renderizarSumidas();
    if (aba === "config")   carregarFormConfig();
    if (aba === "dashboard") renderizarDashboard();

    return false;
  };

  /* ======= DASHBOARD ======= */

  function renderizarDashboard() {
    var ags = getAgendamentos();
    var hoje_str = hoje();
    var agHoje = ags.filter(function(a) { return a.data === hoje_str; });
    var concluidos = ags.filter(function(a) { return a.status === "Concluído"; });
    var faturamento = concluidos.reduce(function(acc, a) { return acc + (a.preco||0); }, 0);
    var sumidas = calcularSumidas();

    var el;
    el = document.getElementById("statTotal");       if(el) el.textContent = ags.length;
    el = document.getElementById("statHoje");        if(el) el.textContent = agHoje.length;
    el = document.getElementById("statConcluidos");  if(el) el.textContent = concluidos.length;
    el = document.getElementById("statFaturamento"); if(el) el.textContent = "R$" + faturamento;
    el = document.getElementById("statSumidas");     if(el) el.textContent = sumidas.length;

    /* Badge sumidas na sidebar */
    var badge = document.getElementById("badgeSumidas");
    if (badge) {
      if (sumidas.length > 0) {
        badge.style.display = "inline";
        badge.textContent = sumidas.length;
      } else {
        badge.style.display = "none";
      }
    }

    /* Agenda de hoje no dashboard */
    var container = document.getElementById("agendaHoje");
    if (!container) return;
    var agAtivos = agHoje.filter(function(a){ return a.status !== "Cancelado"; });
    agAtivos.sort(function(a,b){ return a.horario.localeCompare(b.horario); });

    if (agAtivos.length === 0) {
      container.innerHTML =
        '<div class="empty"><span class="empty-icon">??</span><p>Nenhum agendamento para hoje</p></div>';
    } else {
      container.innerHTML = "";
      agAtivos.forEach(function(ag) {
        container.innerHTML += criarCardHTML(ag);
      });
    }
  }

  /* ======= AGENDA COMPLETA ======= */

  /* Preenche select de serviços no filtro */
  var filtroServEl = document.getElementById("filtroServico");
  if (filtroServEl) {
    filtroServEl.innerHTML = '<option value="">Todos os serviços</option>';
    cfg.services.forEach(function(s) {
      filtroServEl.innerHTML += '<option value="' + s.name + '">' + s.name + '</option>';
    });
  }

  window.renderizarAgenda = function() {
    var ags = getAgendamentos();
    var filtroData    = (document.getElementById("filtroData")    || {}).value || "";
    var filtroStatus  = (document.getElementById("filtroStatus")  || {}).value || "";
    var filtroServico = (document.getElementById("filtroServico") || {}).value || "";
    var filtroBusca   = ((document.getElementById("filtroBusca")  || {}).value || "").toLowerCase();

    /* Filtra */
    if (filtroData)    ags = ags.filter(function(a){ return a.data === filtroData; });
    if (filtroStatus)  ags = ags.filter(function(a){ return a.status === filtroStatus; });
    if (filtroServico) ags = ags.filter(function(a){ return a.servico === filtroServico; });
    if (filtroBusca)   ags = ags.filter(function(a){ return a.nome.toLowerCase().indexOf(filtroBusca) >= 0; });

    /* Ordena por data+horário */
    ags.sort(function(a,b){
      var x = a.data+a.horario, y = b.data+b.horario;
      return x < y ? -1 : x > y ? 1 : 0;
    });

    var container = document.getElementById("listaAgendamentos");
    if (!container) return;

    if (ags.length === 0) {
      container.innerHTML =
        '<div class="empty"><span class="empty-icon">??</span><p>Nenhum resultado encontrado</p></div>';
      return;
    }

    /* Agrupa por data */
    var grupos = {};
    ags.forEach(function(ag) {
      if (!grupos[ag.data]) grupos[ag.data] = [];
      grupos[ag.data].push(ag);
    });

    var html = "";
    var datas = Object.keys(grupos).sort();
    datas.forEach(function(data) {
      html += '<div class="data-titulo">' +
        formatarDataBR(data) +
        '<span class="dia-semana-badge">' + diaSemana(data) + '</span>' +
      '</div>';
      grupos[data].forEach(function(ag) {
        html += criarCardHTML(ag);
      });
    });

    container.innerHTML = html;
  };

  /* Cria HTML do card de agendamento */
  function criarCardHTML(ag) {
    var classe = ag.status === "Concluído" ? "concluido" : ag.status === "Cancelado" ? "cancelado" : "";
    var pillClasse = ag.status === "Concluído" ? "pill-concluido" : ag.status === "Cancelado" ? "pill-cancelado" : "pill-agendado";

    var botoesAcao = "";
    if (ag.status === "Agendado") {
      botoesAcao +=
        '<button class="btn-sm btn-ok"     onclick="concluir(' + ag.id + ')">? Concluir</button>' +
        '<button class="btn-sm btn-cancel" onclick="cancelar(' + ag.id + ')">? Cancelar</button>';
    }
    botoesAcao +=
      '<button class="btn-sm btn-wa"  onclick="whatsappCliente(' + ag.id + ')">?? WhatsApp</button>' +
      '<button class="btn-sm btn-del" onclick="remover(' + ag.id + ')">??? Remover</button>';

    return '<div class="ag-card ' + classe + '" id="ag-' + ag.id + '">' +
      '<div class="hr-badge">' + ag.horario + '</div>' +
      '<div class="ag-nome">' + ag.nome + '</div>' +
      '<p class="ag-info"><strong>Serviço:</strong> ' + ag.servico + '</p>' +
      '<p class="ag-info"><strong>WhatsApp:</strong> ' + ag.telefone + '</p>' +
      (ag.preco ? '<p class="ag-info"><strong>Valor:</strong> R$ ' + ag.preco + '</p>' : '') +
      '<span class="status-pill ' + pillClasse + '">' + ag.status + '</span>' +
      '<div class="ag-acoes">' + botoesAcao + '</div>' +
    '</div>';
  }

  /* ======= AÇÕES EM AGENDAMENTOS ======= */

  window.concluir = function(id) {
    var ags = getAgendamentos();
    ags.forEach(function(ag) {
      if (ag.id === id) {
        ag.status = "Concluído";
        ag.ultimoAtendimento = Date.now();
      }
    });
    setAgendamentos(ags);
    renderizarDashboard();
    renderizarAgenda();
    toast("Concluído! ?", "ok");
  };

  window.cancelar = function(id) {
    confirmar(
      "Cancelar agendamento",
      "Deseja realmente cancelar este agendamento?",
      function() {
        var ags = getAgendamentos();
        ags.forEach(function(ag) { if(ag.id === id) ag.status = "Cancelado"; });
        setAgendamentos(ags);
        renderizarDashboard();
        renderizarAgenda();
        toast("Agendamento cancelado.", "err");
      }
    );
  };

  window.remover = function(id) {
    confirmar(
      "Remover agendamento",
      "Deseja remover este agendamento permanentemente?",
      function() {
        var ags = getAgendamentos().filter(function(ag){ return ag.id !== id; });
        setAgendamentos(ags);
        renderizarDashboard();
        renderizarAgenda();
        toast("Removido.");
      }
    );
  };

  window.whatsappCliente = function(id) {
    var ag = getAgendamentos().find(function(a){ return a.id === id; });
    if (!ag) return;
    var cfgAtual = getCfg();
    var msg = formatarMensagem(cfgAtual.reminderMsg, { nome: ag.nome });
    var link = "https://wa.me/55" + ag.telefone + "?text=" + encodeURIComponent(msg);
    window.open(link, "_blank");
  };

  /* ======= CLIENTES SUMIDAS ======= */

  function calcularSumidas() {
    var cfgAtual = getCfg();
    var dias = cfgAtual.inactiveDays || 21;
    var corte = Date.now() - (dias * 24 * 60 * 60 * 1000);
    var ags = getAgendamentos();

    /* Mapeia último atendimento por telefone */
    var ultimos = {};
    var nomes   = {};
    ags.forEach(function(ag) {
      if (ag.status === "Concluído") {
        var tel = ag.telefone;
        if (!ultimos[tel] || ag.ultimoAtendimento > ultimos[tel]) {
          ultimos[tel] = ag.ultimoAtendimento;
          nomes[tel]   = ag.nome;
        }
      }
    });

    var sumidas = [];
    Object.keys(ultimos).forEach(function(tel) {
      if (ultimos[tel] < corte) {
        sumidas.push({
          telefone: tel,
          nome:     nomes[tel],
          diasPassados: Math.floor((Date.now() - ultimos[tel]) / (1000*60*60*24))
        });
      }
    });

    return sumidas;
  }

  function renderizarSumidas() {
    var sumidas = calcularSumidas();
    var cfgAtual = getCfg();
    var container = document.getElementById("listaSumidas");
    var labelEl   = document.getElementById("labelSumidas");
    if (!container) return;

    if (labelEl) labelEl.textContent = sumidas.length + " cliente(s)";

    if (sumidas.length === 0) {
      container.innerHTML =
        '<div class="empty"><span class="empty-icon">??</span><p>Todas retornaram recentemente!</p></div>';
      return;
    }

    sumidas.sort(function(a,b){ return b.diasPassados - a.diasPassados; });

    var html = "";
    sumidas.forEach(function(c) {
      var msg = formatarMensagem(cfgAtual.reminderMsg, { nome: c.nome });
      var link = "https://wa.me/55" + c.telefone + "?text=" + encodeURIComponent(msg);
      html +=
        '<div class="ag-card">' +
          '<div class="ag-nome">' + c.nome + '</div>' +
          '<p class="ag-info"><strong>WhatsApp:</strong> ' + c.telefone + '</p>' +
          '<p class="ag-info" style="color:var(--warning);"><strong>' + c.diasPassados + ' dias</strong> sem retorno</p>' +
          '<div class="ag-acoes">' +
            '<a href="' + link + '" target="_blank"><button class="btn-sm btn-wa">?? Chamar no WhatsApp</button></a>' +
          '</div>' +
        '</div>';
    });
    container.innerHTML = html;
  }

  /* ======= CONFIGURAÇÕES ======= */

  function carregarFormConfig() {
    var cfgAtual = getCfg();
    var set = function(id, val) { var el = document.getElementByI
