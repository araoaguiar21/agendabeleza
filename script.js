/* ================================================
   BEAUTYFLOW — SCRIPT PRINCIPAL v3 (CORRIGIDO)
   Compativel com todos os navegadores
   ================================================ */
"use strict";

/* ---- CHAVES localStorage ---- */
var CHAVE_AG    = "bf_agendamentos";
var CHAVE_CFG   = "bf_cfg";
var CHAVE_HOR   = "bf_horarios";
var CHAVE_FOTOS = "bf_fotos";

/* ================================================
   POLYFILLS / HELPERS COMPATIVEIS
   ================================================ */

/* Substitui String.padStart */
function pad2(n) {
  return n < 10 ? "0" + n : "" + n;
}

/* Substitui Object.assign */
function mergeObj(alvo, fonte) {
  if (!fonte) return alvo;
  for (var k in fonte) {
    if (Object.prototype.hasOwnProperty.call(fonte, k)) {
      alvo[k] = fonte[k];
    }
  }
  return alvo;
}

/* Substitui Array.prototype.find */
function arrayFind(arr, fn) {
  for (var i = 0; i < arr.length; i++) {
    if (fn(arr[i], i)) return arr[i];
  }
  return undefined;
}

/* ================================================
   HELPERS GERAIS
   ================================================ */

function toast(msg, tipo) {
  var el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.className = "toast show " + (tipo || "");
  clearTimeout(toast._t);
  toast._t = setTimeout(function () { el.className = "toast"; }, 3200);
}

function hoje() {
  var d = new Date();
  return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
}

function getCfg() {
  var salvo = {};
  try { salvo = JSON.parse(localStorage.getItem(CHAVE_CFG)) || {}; } catch (e) { }
  return mergeObj(mergeObj({}, CONFIG), salvo);
}

function getHorarios() {
  try {
    var s = localStorage.getItem(CHAVE_HOR);
    if (s) return JSON.parse(s);
  } catch (e) { }
  return CONFIG.timeSlots.slice();
}

function getAgendamentos() {
  try { return JSON.parse(localStorage.getItem(CHAVE_AG)) || []; } catch (e) { return []; }
}

function setAgendamentos(lista) {
  localStorage.setItem(CHAVE_AG, JSON.stringify(lista));
}

function getFotos() {
  try { return JSON.parse(localStorage.getItem(CHAVE_FOTOS)) || []; } catch (e) { return []; }
}

function setFotos(lista) {
  localStorage.setItem(CHAVE_FOTOS, JSON.stringify(lista));
}

/* Máscara telefone */
function mascararTelefone(input) {
  var v = input.value.replace(/\D/g, "").substring(0, 11);
  if      (v.length > 10) { v = "(" + v.slice(0,2) + ") " + v.slice(2,7) + "-" + v.slice(7); }
  else if (v.length > 6)  { v = "(" + v.slice(0,2) + ") " + v.slice(2,6) + "-" + v.slice(6); }
  else if (v.length > 2)  { v = "(" + v.slice(0,2) + ") " + v.slice(2); }
  else if (v.length > 0)  { v = "(" + v; }
  input.value = v;
}

function somenteNumeros(str) { return (str || "").replace(/\D/g, ""); }

/* Formata data DD/MM/AAAA */
function formatarDataBR(iso) {
  if (!iso) return "";
  var p = iso.split("-");
  if (p.length < 3) return iso;
  return p[2] + "/" + p[1] + "/" + p[0];
}

/* Dia da semana */
function diaSemana(iso) {
  if (!iso) return "";
  var dias = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  var p = iso.split("-");
  var d = new Date(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2]));
  return dias[d.getDay()];
}

/* Formata mensagem substituindo {chaves} */
function formatarMensagem(tpl, dados) {
  if (!tpl) return "";
  var resultado = tpl;
  for (var k in dados) {
    if (Object.prototype.hasOwnProperty.call(dados, k)) {
      resultado = resultado.replace(new RegExp("\\{" + k + "\\}", "g"), dados[k]);
    }
  }
  return resultado;
}

/* Link WhatsApp */
function linkWhatsApp(numero, msg) {
  return "https://wa.me/" + numero + "?text=" + encodeURIComponent(msg);
}

/* Verifica disponibilidade */
function horarioDisponivel(data, horario, ignorarId) {
  var ags = getAgendamentos();
  for (var i = 0; i < ags.length; i++) {
    var ag = ags[i];
    if (ag.id === ignorarId) continue;
    if (ag.data === data && ag.horario === horario && ag.status !== "Cancelado") return false;
  }
  return true;
}

/* ================================================
   DETECÇÃO DE PÁGINA
   ================================================ */
var pagina = "outro";
if (document.getElementById("formAgendamento"))  pagina = "index";
else if (document.getElementById("loginForm"))   pagina = "login";
else if (document.getElementById("aba-dashboard")) pagina = "admin";

/* ================================================
   INDEX.HTML
   ================================================ */
if (pagina === "index") {

  var cfg = getCfg();

  /* Preenche textos */
  document.title = cfg.salonName || "BeautyFlow";
  var _t;
  function setTxtIdx(id, v) { _t = document.getElementById(id); if (_t) _t.textContent = v; }

  setTxtIdx("pageTitle",     cfg.salonName);
  setTxtIdx("heroSub",       cfg.slogan);
  setTxtIdx("footerName",    cfg.salonName);
  setTxtIdx("footerAddress", cfg.address || "");
  setTxtIdx("footerInsta",   cfg.instagram || "");

  /* Título hero com itálico na segunda palavra */
  var heroTitle = document.getElementById("heroTitle");
  if (heroTitle && cfg.salonName) {
    var partes = cfg.salonName.split(" ");
    heroTitle.innerHTML = partes.length >= 2
      ? partes[0] + " <em>" + partes.slice(1).join(" ") + "</em>"
      : cfg.salonName;
  }

  /* Links WhatsApp */
  var waLink = "https://wa.me/" + (cfg.whatsapp || "");
  _t = document.getElementById("heroWaBtn"); if (_t) _t.href = waLink;
  _t = document.getElementById("waFixo");    if (_t) _t.href = waLink;

  /* Grid de serviços */
  var grid = document.getElementById("servicosGrid");
  if (grid && cfg.services) {
    grid.innerHTML = "";
    for (var i = 0; i < cfg.services.length; i++) {
      var s = cfg.services[i];
      grid.innerHTML +=
        '<div class="servico-card">' +
          '<span class="servico-emoji">' + (s.emoji || "") + '</span>' +
          '<h2>' + s.name + '</h2>' +
          '<p>' + s.desc + '</p>' +
          '<span class="servico-price">' + s.price + '</span>' +
        '</div>';
    }
  }

  /* Select de serviços no form */
  var selServ = document.getElementById("servico");
  if (selServ && cfg.services) {
    selServ.innerHTML = '<option value="">Escolha um serviço...</option>';
    for (var i = 0; i < cfg.services.length; i++) {
      var s = cfg.services[i];
      selServ.innerHTML += '<option value="' + s.name + '">' + s.name + ' — ' + s.price + '</option>';
    }
  }

  /* Data mínima = hoje */
  var inputData = document.getElementById("data");
  if (inputData) {
    inputData.min = hoje();
    inputData.addEventListener("change", function () { carregarHorarios(this.value); });
    inputData.addEventListener("input",  function () { carregarHorarios(this.value); });
  }

  /* ---- Carrega horários disponíveis ---- */
  function carregarHorarios(data) {
    var sel   = document.getElementById("horario");
    var aviso = document.getElementById("avisoHorario");
    if (!sel) return;

    if (!data) {
      sel.innerHTML = '<option value="">Selecione a data primeiro</option>';
      return;
    }

    var todos       = getHorarios();
    var disponiveis = [];
    for (var i = 0; i < todos.length; i++) {
      if (horarioDisponivel(data, todos[i], null)) {
        disponiveis.push(todos[i]);
      }
    }

    sel.innerHTML = "";

    if (disponiveis.length === 0) {
      sel.innerHTML = '<option value="">Sem horários neste dia</option>';
      if (aviso) {
        aviso.style.display = "block";
        aviso.textContent = "Todos os horários deste dia estão ocupados. Escolha outra data.";
      }
    } else {
      sel.innerHTML = '<option value="">Selecione um horário</option>';
      for (var i = 0; i < disponiveis.length; i++) {
        sel.innerHTML += '<option value="' + disponiveis[i] + '">' + disponiveis[i] + '</option>';
      }
      if (aviso) aviso.style.display = "none";
    }
  }

  /* ---- Galeria pública ---- */
  function renderizarGaleriaPublica() {
    var fotos     = getFotos();
    var container = document.getElementById("galeriaPublica");
    var vazia     = document.getElementById("galeriaVazia");
    if (!container) return;

    if (fotos.length === 0) {
      container.innerHTML = "";
      if (vazia) vazia.style.display = "block";
      return;
    }
    if (vazia) vazia.style.display = "none";

    container.innerHTML = "";
    for (var idx = 0; idx < fotos.length; idx++) {
      (function (i) {
        container.innerHTML +=
          '<div class="galeria-item" onclick="abrirLightbox(' + i + ')">' +
            '<img src="' + fotos[i].src + '" alt="' + (fotos[i].legenda || "Trabalho") + '"/>' +
            '<div class="galeria-item-overlay">' +
              '<span>' + (fotos[i].legenda || "Ver foto") + '</span>' +
            '</div>' +
          '</div>';
      })(idx);
    }
  }
  renderizarGaleriaPublica();

  /* ---- Lightbox ---- */
  var _lbIdx = 0;

  window.abrirLightbox = function (idx) {
    var fotos = getFotos();
    if (!fotos.length) return;
    _lbIdx = idx;
    mostrarFotoLb(fotos, _lbIdx);
    var lb = document.getElementById("lightbox");
    if (lb) lb.classList.add("open");
    document.body.style.overflow = "hidden";
  };

  function mostrarFotoLb(fotos, idx) {
    if (!fotos[idx]) return;
    var imgEl = document.getElementById("lbImg");
    var cap   = document.getElementById("lbCaption");
    if (imgEl) imgEl.src = fotos[idx].src;
    if (cap)   cap.textContent = fotos[idx].legenda || "";
  }

  _t = document.getElementById("lbClose");
  if (_t) _t.onclick = fecharLightbox;

  _t = document.getElementById("lbOverlay");
  if (_t) _t.onclick = fecharLightbox;

  _t = document.getElementById("lbPrev");
  if (_t) _t.onclick = function () {
    var fotos = getFotos();
    _lbIdx = (_lbIdx - 1 + fotos.length) % fotos.length;
    mostrarFotoLb(fotos, _lbIdx);
  };

  _t = document.getElementById("lbNext");
  if (_t) _t.onclick = function () {
    var fotos = getFotos();
    _lbIdx = (_lbIdx + 1) % fotos.length;
    mostrarFotoLb(fotos, _lbIdx);
  };

  function fecharLightbox() {
    var lb = document.getElementById("lightbox");
    if (lb) lb.classList.remove("open");
    document.body.style.overflow = "";
  }

  document.addEventListener("keydown", function (e) {
    var key = e.key || e.keyCode;
    if (key === "Escape" || key === 27) fecharLightbox();
    if (key === "ArrowLeft" || key === 37) {
      var btn = document.getElementById("lbPrev");
      if (btn) btn.onclick();
    }
    if (key === "ArrowRight" || key === 39) {
      var btn = document.getElementById("lbNext");
      if (btn) btn.onclick();
    }
  });

  /* ---- Submit do formulário ---- */
  var form = document.getElementById("formAgendamento");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var nome     = document.getElementById("nome").value.replace(/^\s+|\s+$/g, "");
      var telefone = somenteNumeros(document.getElementById("telefone").value);
      var servico  = document.getElementById("servico").value;
      var data     = document.getElementById("data").value;
      var horario  = document.getElementById("horario").value;

      if (!nome || !telefone || !servico || !data || !horario) {
        toast("Preencha todos os campos!", "err"); return;
      }
      if (telefone.length < 10) {
        toast("WhatsApp inválido! Inclua o DDD.", "err"); return;
      }
      if (!horarioDisponivel(data, horario, null)) {
        toast("Este horário acabou de ser ocupado. Escolha outro!", "err");
        carregarHorarios(data); return;
      }

      /* Cria agendamento */
      var ag = {
        id:                Date.now(),
        nome:              nome,
        telefone:          telefone,
        servico:           servico,
        data:              data,
        horario:           horario,
        status:            "Agendado",
        dataCriacao:       Date.now(),
        ultimoAtendimento: Date.now(),
        preco:             0
      };

      /* Busca preço */
      if (cfg.services) {
        for (var i = 0; i < cfg.services.length; i++) {
          if (cfg.services[i].name === servico) {
            ag.preco = cfg.services[i].priceNum || 0;
          }
        }
      }

      var ags = getAgendamentos();
      ags.push(ag);
      setAgendamentos(ags);

      /* Monta mensagem e abre WhatsApp */
      var msg = formatarMensagem(cfg.confirmationMsg || "Olá {nome}! Agendamento confirmado: {servico} em {data} às {horario}.", {
        nome:    nome,
        servico: servico,
        data:    formatarDataBR(data),
        horario: horario
      });
      window.open(linkWhatsApp(cfg.whatsapp, msg), "_blank");

      toast("Agendamento confirmado!", "ok");
      form.reset();
      var selHor = document.getElementById("horario");
      if (selHor) selHor.innerHTML = '<option value="">Selecione a data primeiro</option>';
    });
  }

} /* fim index */

/* ================================================
   LOGIN.HTML
   ================================================ */
if (pagina === "login") {

  var loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var cfgAtual  = getCfg();
      var usuario   = (document.getElementById("usuario") || {}).value || "";
      var senha     = (document.getElementById("senha")   || {}).value || "";
      var senhaCorr = localStorage.getItem("bf_senha") || cfgAtual.adminPassword || "admin123";
      var userCorr  = localStorage.getItem("bf_user")  || cfgAtual.adminUser     || "admin";

      if (usuario === userCorr && senha === senhaCorr) {
        sessionStorage.setItem("bf_logado", "1");
        window.location.href = "admin.html";
      } else {
        var err = document.getElementById("loginErro");
        if (err) { err.style.display = "block"; err.textContent = "Usuário ou senha incorretos."; }
      }
    });
  }

} /* fim login */

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
  document.title = "Admin — " + (cfg.salonName || "BeautyFlow");

  function setTxt(id, v) {
    var el = document.getElementById(id);
    if (el) el.textContent = v;
  }

  setTxt("sidebarNome", cfg.salonName);
  setTxt("topbarNome",  cfg.salonName);
  setTxt("headerNome",  cfg.salonName);
  setTxt("diasInativos", cfg.inactiveDays || 21);

  /* ---- RELÓGIO ---- */
  function atualizarRelogio() {
    var el = document.getElementById("relogio");
    if (!el) return;
    var n    = new Date();
    var dias = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    el.textContent = dias[n.getDay()] + "  " + pad2(n.getHours()) + ":" + pad2(n.getMinutes()) + ":" + pad2(n.getSeconds());
  }
  atualizarRelogio();
  setInterval(atualizarRelogio, 1000);

  /* ---- MENU HAMBURGUER ---- */
  window.toggleMenu = function () {
    var sidebar = document.getElementById("sidebar");
    var overlay = document.getElementById("sidebarOverlay");
    var burger  = document.getElementById("hamburger");
    if (!sidebar) return;
    var aberta = sidebar.classList.toggle("aberta");
    if (burger)  burger.classList[aberta ? "add" : "remove"]("aberto");
    if (overlay) overlay.classList[aberta ? "add" : "remove"]("visivel");
  };

  window.fecharMenu = function () {
    var sidebar = document.getElementById("sidebar");
    var overlay = document.getElementById("sidebarOverlay");
    var burger  = document.getElementById("hamburger");
    if (sidebar) sidebar.classList.remove("aberta");
    if (burger)  burger.classList.remove("aberto");
    if (overlay) overlay.classList.remove("visivel");
  };

  /* ---- ABAS ---- */
  window.trocarAba = function (aba, link) {
    /* Remove classe ativa de todas as abas */
    var todasAbas = document.querySelectorAll(".aba");
    for (var i = 0; i < todasAbas.length; i++) {
      todasAbas[i].classList.remove("ativa");
    }
    /* Remove classe ativo de todos os links */
    var todosLinks = document.querySelectorAll(".sidebar-nav a");
    for (var i = 0; i < todosLinks.length; i++) {
      todosLinks[i].classList.remove("ativo");
    }

    var el = document.getElementById("aba-" + aba);
    if (el) el.classList.add("ativa");
    if (link) link.classList.add("ativo");

    /* Renderiza o conteúdo da aba selecionada */
    if (aba === "dashboard") renderizarDashboard();
    if (aba === "agenda")    renderizarAgenda();
    if (aba === "galeria")   renderizarGaleriaAdmin();
    if (aba === "sumidas")   renderizarSumidas();
    if (aba === "config")    carregarFormConfig();
  };

  /* ---- DASHBOARD ---- */
  function renderizarDashboard() {
    var ags        = getAgendamentos();
    var hoje_str   = hoje();
    var agHoje     = [];
    var concluidos = [];
    var fat        = 0;

    for (var i = 0; i < ags.length; i++) {
      if (ags[i].data === hoje_str) agHoje.push(ags[i]);
      if (ags[i].status === "Concluido") {
        concluidos.push(ags[i]);
        fat += ags[i].preco || 0;
      }
    }

    var sumidas = calcularSumidas();

    setTxt("statTotal",       ags.length);
    setTxt("statHoje",        agHoje.length);
    setTxt("statConcluidos",  concluidos.length);
    setTxt("statFaturamento", "R$" + fat);
    setTxt("statSumidas",     sumidas.length);

    var badge = document.getElementById("badgeSumidas");
    if (badge) {
      badge.style.display = sumidas.length > 0 ? "inline" : "none";
      badge.textContent   = sumidas.length;
    }

    var container = document.getElementById("agendaHoje");
    if (!container) return;

    var ativos = [];
    for (var i = 0; i < agHoje.length; i++) {
      if (agHoje[i].status !== "Cancelado") ativos.push(agHoje[i]);
    }
    ativos.sort(function (a, b) { return a.horario < b.horario ? -1 : a.horario > b.horario ? 1 : 0; });

    if (ativos.length === 0) {
      container.innerHTML = '<div class="empty"><span class="empty-icon">&#x1F4C5;</span><p>Nenhum agendamento para hoje</p></div>';
    } else {
      container.innerHTML = "";
      for (var i = 0; i < ativos.length; i++) {
        container.innerHTML += criarCardHTML(ativos[i]);
      }
    }
  }

  /* Renderiza dashboard ao carregar */
  renderizarDashboard();

  /* ---- AGENDA COMPLETA ---- */

  /* Preenche filtro de serviços */
  var filtroServEl = document.getElementById("filtroServico");
  if (filtroServEl && cfg.services) {
    filtroServEl.innerHTML = '<option value="">Todos os serviços</option>';
    for (var i = 0; i < cfg.services.length; i++) {
      filtroServEl.innerHTML += '<option value="' + cfg.services[i].name + '">' + cfg.services[i].name + '</option>';
    }
  }

  window.renderizarAgenda = function () {
    var ags   = getAgendamentos();
    var fData = document.getElementById("filtroData")    ? document.getElementById("filtroData").value    : "";
    var fStat = document.getElementById("filtroStatus")  ? document.getElementById("filtroStatus").value  : "";
    var fServ = document.getElementById("filtroServico") ? document.getElementById("filtroServico").value : "";
    var fBusc = document.getElementById("filtroBusca")   ? document.getElementById("filtroBusca").value.toLowerCase() : "";

    var filtrados = [];
    for (var i = 0; i < ags.length; i++) {
      var ag = ags[i];
      if (fData && ag.data    !== fData)    continue;
      if (fStat && ag.status  !== fStat)    continue;
      if (fServ && ag.servico !== fServ)    continue;
      if (fBusc && ag.nome.toLowerCase().indexOf(fBusc) < 0) continue;
      filtrados.push(ag);
    }

    filtrados.sort(function (a, b) {
      var x = a.data + a.horario, y = b.data + b.horario;
      return x < y ? -1 : x > y ? 1 : 0;
    });

    var container = document.getElementById("listaAgendamentos");
    if (!container) return;

    if (filtrados.length === 0) {
      container.innerHTML = '<div class="empty"><span class="empty-icon">&#x1F50D;</span><p>Nenhum resultado encontrado</p></div>';
      return;
    }

    /* Agrupa por data */
    var grupos = {}, datas = [];
    for (var i = 0; i < filtrados.length; i++) {
      var d = filtrados[i].data;
      if (!grupos[d]) { grupos[d] = []; datas.push(d); }
      grupos[d].push(filtrados[i]);
    }
    datas.sort();

    var html = "";
    for (var i = 0; i < datas.length; i++) {
      var d = datas[i];
      html += '<div class="data-titulo">' + formatarDataBR(d) +
              '<span class="dia-semana-badge">' + diaSemana(d) + '</span></div>';
      for (var j = 0; j < grupos[d].length; j++) {
        html += criarCardHTML(grupos[d][j]);
      }
    }
    container.innerHTML = html;
  };

  /* Cria HTML de um card de agendamento */
  function criarCardHTML(ag) {
    var cls  = ag.status === "Concluido" ? "concluido" : ag.status === "Cancelado" ? "cancelado" : "";
    var pill = ag.status === "Concluido" ? "pill-concluido" : ag.status === "Cancelado" ? "pill-cancelado" : "pill-agendado";

    var acoes = "";
    if (ag.status === "Agendado") {
      acoes += '<button class="btn-sm btn-ok"     onclick="concluir(' + ag.id + ')">Concluir</button>' +
               '<button class="btn-sm btn-cancel" onclick="cancelar(' + ag.id + ')">Cancelar</button>';
    }
    acoes += '<button class="btn-sm btn-wa"  onclick="whatsappCliente(' + ag.id + ')">WhatsApp</button>' +
             '<button class="btn-sm btn-del" onclick="remover(' + ag.id + ')">Remover</button>';

    return '<div class="ag-card ' + cls + '" id="ag-' + ag.id + '">' +
      '<div class="hr-badge">' + (ag.horario || "--:--") + '</div>' +
      '<div class="ag-nome">' + ag.nome + '</div>' +
      '<p class="ag-info"><strong>Serviço:</strong> ' + (ag.servico || "—") + '</p>' +
      '<p class="ag-info"><strong>WhatsApp:</strong> ' + (ag.telefone || "—") + '</p>' +
      '<p class="ag-info"><strong>Data:</strong> ' + formatarDataBR(ag.data) + '</p>' +
      (ag.preco ? '<p class="ag-info"><strong>Valor:</strong> R$ ' + ag.preco + '</p>' : '') +
      '<span class="status-pill ' + pill + '">' + ag.status + '</span>' +
      '<div class="ag-acoes">' + acoes + '</div>' +
    '</div>';
  }

  /* ---- AÇÕES EM AGENDAMENTOS ---- */

  window.concluir = function (id) {
    var ags = getAgendamentos();
    for (var i = 0; i < ags.length; i++) {
      if (ags[i].id === id) {
        ags[i].status = "Concluido";
        ags[i].ultimoAtendimento = Date.now();
      }
    }
    setAgendamentos(ags);
    renderizarDashboard(); renderizarAgenda();
    toast("Concluído!", "ok");
  };

  window.cancelar = function (id) {
    confirmar("Cancelar agendamento", "Deseja realmente cancelar?", function () {
      var ags = getAgendamentos();
      for (var i = 0; i < ags.length; i++) {
        if (ags[i].id === id) ags[i].status = "Cancelado";
      }
      setAgendamentos(ags);
      renderizarDashboard(); renderizarAgenda();
      toast("Agendamento cancelado.", "err");
    });
  };

  window.remover = function (id) {
    confirmar("Remover agendamento", "Deseja remover permanentemente?", function () {
      var lista = getAgendamentos();
      var nova  = [];
      for (var i = 0; i < lista.length; i++) {
        if (lista[i].id !== id) nova.push(lista[i]);
      }
      setAgendamentos(nova);
      renderizarDashboard(); renderizarAgenda();
      toast("Removido.");
    });
  };

  window.whatsappCliente = function (id) {
    var ags = getAgendamentos();
    var ag  = arrayFind(ags, function (a) { return a.id === id; });
    if (!ag) return;
    var cfgAtual = getCfg();
    var msg = formatarMensagem(cfgAtual.reminderMsg || "Olá {nome}! Sentimos sua falta. Que tal agendar um horário?", { nome: ag.nome });
    window.open("https://wa.me/55" + ag.telefone + "?text=" + encodeURIComponent(msg), "_blank");
  };

  /* ---- GALERIA / PORTFÓLIO ADMIN ---- */

  function renderizarGaleriaAdmin() {
    var fotos    = getFotos();
    var grid     = document.getElementById("galeriaAdminGrid");
    var vazia    = document.getElementById("galeriaAdminVazia");
    var contador = document.getElementById("contadorFotos");
    if (!grid) return;

    if (contador) contador.textContent = fotos.length + " foto(s)";

    if (fotos.length === 0) {
      grid.innerHTML = "";
      if (vazia) vazia.style.display = "block";
      return;
    }
    if (vazia) vazia.style.display = "none";

    grid.innerHTML = "";
    for (var idx = 0; idx < fotos.length; idx++) {
      (function (i) {
        grid.innerHTML +=
          '<div class="foto-admin-item">' +
            '<img src="' + fotos[i].src + '" alt="foto"/>' +
            '<div class="foto-admin-overlay">' +
              '<input type="text" placeholder="Legenda..." value="' + (fotos[i].legenda || "") + '" ' +
                'onchange="atualizarLegenda(' + i + ', this.value)">' +
              '<button class="btn-del-foto" onclick="removerFoto(' + i + ')">Remover</button>' +
            '</div>' +
          '</div>';
      })(idx);
    }
  }

  window.adicionarFotos = function (input) {
    var arquivos = input.files;
    if (!arquivos || !arquivos.length) return;

    var fotos    = getFotos();
    var total    = arquivos.length;
    var lidos    = 0;
    var novas    = [];

    for (var i = 0; i < arquivos.length; i++) {
      (function (arquivo) {
        var reader = new FileReader();
        reader.onload = function (ev) {
          novas.push({ src: ev.target.result, legenda: "" });
          lidos++;
          if (lidos === total) {
            for (var j = 0; j < novas.length; j++) fotos.push(novas[j]);
            setFotos(fotos);
            renderizarGaleriaAdmin();
            toast(total + " foto(s) adicionada(s)!", "ok");
          }
        };
        reader.readAsDataURL(arquivo);
      })(arquivos[i]);
    }
    input.value = "";
  };

  window.atualizarLegenda = function (idx, legenda) {
    var fotos = getFotos();
    if (fotos[idx]) {
      fotos[idx].legenda = legenda;
      setFotos(fotos);
    }
  };

  window.removerFoto = function (idx) {
    confirmar("Remover foto", "Deseja remover esta foto?", function () {
      var fotos = getFotos();
      fotos.splice(idx, 1);
      setFotos(fotos);
      renderizarGaleriaAdmin();
      toast("Foto removida.");
    });
  };

  /* Drag and drop na zona de upload */
  var uploadZone = document.getElementById("uploadZone");
  if (uploadZone) {
    uploadZone.addEventListener("dragover", function (e) {
      e.preventDefault();
      this.classList.add("drag");
    });
    uploadZone.addEventListener("dragleave", function () {
      this.classList.remove("drag");
    });
    uploadZone.addEventListener("drop", function (e) {
      e.preventDefault();
      this.classList.remove("drag");
      var inputFake = { files: e.dataTransfer.files };
      window.adicionarFotos(inputFake);
    });
  }

  /* ---- CLIENTES SUMIDAS ---- */

  function calcularSumidas() {
    var ags        = getAgendamentos();
    var cfgAtual   = getCfg();
    var diasLimit  = parseInt(cfgAtual.inactiveDays || 21, 10);
    var agora      = Date.now();
    var limite     = diasLimit * 24 * 60 * 60 * 1000;

    /* Agrupa por telefone, pega o mais recente */
    var porTel = {};
    for (var i = 0; i < ags.length; i++) {
      var ag = ags[i];
      if (ag.status === "Cancelado") continue;
      var tel = ag.telefone;
      var ts  = ag.ultimoAtendimento || ag.dataCriacao || 0;
      if (!porTel[tel] || ts > porTel[tel].ts) {
        porTel[tel] = { nome: ag.nome, telefone: tel, ts: ts };
      }
    }

    var sumidas = [];
    for (var tel in porTel) {
      if (Object.prototype.hasOwnProperty.call(porTel, tel)) {
        var cliente = porTel[tel];
        if (agora - cliente.ts >= limite) {
          sumidas.push(cliente);
        }
      }
    }
    return sumidas;
  }

  function renderizarSumidas() {
    var sumidas   = calcularSumidas();
    var container = document.getElementById("listaSumidas");
    var label     = document.getElementById("labelSumidas");
    if (!container) return;

    if (label) label.textContent = sumidas.length + " cliente(s)";

    if (sumidas.length === 0) {
      container.innerHTML = '<div class="empty"><span class="empty-icon">&#x1F389;</span><p>Todas as clientes retornaram recentemente!</p></div>';
      return;
    }

    container.innerHTML = "";
    for (var i = 0; i < sumidas.length; i++) {
      var c = sumidas[i];
      var diasPassados = Math.floor((Date.now() - c.ts) / (24 * 60 * 60 * 1000));
      container.innerHTML +=
        '<div class="ag-card" style="border-left-color:#D48A0A;">' +
          '<div class="ag-nome">' + c.nome + '</div>' +
          '<p class="ag-info"><strong>WhatsApp:</strong> ' + c.telefone + '</p>' +
          '<p class="ag-info"><strong>Última visita:</strong> há ' + diasPassados + ' dias</p>' +
          '<div class="ag-acoes">' +
            '<button class="btn-sm btn-wa" onclick="whatsappSumida(\'' + c.telefone + '\',\'' + c.nome + '\')">Enviar WhatsApp</button>' +
          '</div>' +
        '</div>';
    }
  }

  window.whatsappSumida = function (telefone, nome) {
    var cfgAtual = getCfg();
    var msg = formatarMensagem(cfgAtual.reminderMsg || "Olá {nome}! Sentimos sua falta. Que tal agendar um horário?", { nome: nome });
    window.open("https://wa.me/55" + somenteNumeros(telefone) + "?text=" + encodeURIComponent(msg), "_blank");
  };

  /* ---- CONFIGURAÇÕES ---- */

  function carregarFormConfig() {
    var cfgAtual = getCfg();

    function setVal(id, v) { var el = document.getElementById(id); if (el) el.value = v || ""; }

    setVal("cfgNome",     cfgAtual.salonName  || "");
    setVal("cfgDona",     cfgAtual.ownerName  || "");
    setVal("cfgWA",       cfgAtual.whatsapp   || "");
    setVal("cfgInsta",    cfgAtual.instagram  || "");
    setVal("cfgEndereco", cfgAtual.address    || "");
    setVal("cfgSlogan",   cfgAtual.slogan     || "");

    /* Horários */
    var horariosEl = document.getElementById("horariosConfig");
    if (horariosEl) {
      var todos      = CONFIG.timeSlots;
      var ativos     = getHorarios();
      horariosEl.innerHTML = "";
      for (var i = 0; i < todos.length; i++) {
        var h       = todos[i];
        var checked = ativos.indexOf(h) >= 0 ? "checked" : "";
        horariosEl.innerHTML +=
          '<label style="display:flex;align-items:center;gap:6px;cursor:pointer;' +
          'background:white;border:1px solid var(--border);border-radius:8px;' +
          'padding:8px 14px;font-size:14px;">' +
            '<input type="checkbox" value="' + h + '" ' + checked + ' ' +
            'style="width:auto;accent-color:var(--primary);"> ' + h +
          '</label>';
      }
    }
  }

  window.salvarConfig = function () {
    var cfgAtual = getCfg();

    function getVal(id) { var el = document.getElementById(id); return el ? el.value : ""; }

    cfgAtual.salonName = getVal("cfgNome")     || cfgAtual.salonName;
    cfgAtual.ownerName = getVal("cfgDona")     || cfgAtual.ownerName;
    cfgAtual.whatsapp  = getVal("cfgWA")       || cfgAtual.whatsapp;
    cfgAtual.instagram = getVal("cfgInsta");
    cfgAtual.address   = getVal("cfgEndereco");
    cfgAtual.slogan    = getVal("cfgSlogan")   || cfgAtual.slogan;

    localStorage.setItem(CHAVE_CFG, JSON.stringify(cfgAtual));

    setTxt("sidebarNome", cfgAtual.salonName);
    setTxt("topbarNome",  cfgAtual.salonName);
    setTxt("headerNome",  cfgAtual.salonName);

    toast("Configurações salvas!", "ok");
  };

  window.salvarSenha = function () {
    var nova   = (document.getElementById("cfgSenha")  || {}).value || "";
    var nova2  = (document.getElementById("cfgSenha2") || {}).value || "";
    var user   = (document.getElementById("cfgUser")   || {}).value || "";

    if (!nova || !nova2) { toast("Preencha os campos de senha!", "err"); return; }
    if (nova !== nova2)  { toast("Senhas não coincidem!", "err"); return; }
    if (nova.length < 4) { toast("Senha muito curta (mínimo 4 caracteres).", "err"); return; }

    if (user) localStorage.setItem("bf_user",  user);
    localStorage.setItem("bf_senha", nova);
    toast("Senha alterada com sucesso!", "ok");

    var el = document.getElementById("cfgSenha");  if (el) el.value = "";
    el     = document.getElementById("cfgSenha2"); if (el) el.value = "";
  };

  window.salvarHorarios = function () {
    var checks = document.querySelectorAll("#horariosConfig input[type=checkbox]");
    var selecionados = [];
    for (var i = 0; i < checks.length; i++) {
      if (checks[i].checked) selecionados.push(checks[i].value);
    }
    if (selecionados.length === 0) { toast("Selecione ao menos um horário!", "err"); return; }
    localStorage.setItem(CHAVE_HOR, JSON.stringify(selecionados));
    toast("Horários salvos!", "ok");
  };

  /* ---- EXPORTAR CSV ---- */
  window.exportarCSV = function () {
    var ags  = getAgendamentos();
    var csv  = "Nome,Telefone,Serviço,Data,Horário,Status,Valor\n";
    for (var i = 0; i < ags.length; i++) {
      var ag = ags[i];
      csv += '"' + ag.nome + '",' + ag.telefone + ',"' + ag.servico + '",' +
             ag.data + ',' + ag.horario + ',' + ag.status + ',' + (ag.preco || 0) + "\n";
    }
    var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    var url  = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href     = url;
    link.download = "agendamentos.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  /* ---- EXPORTAR / IMPORTAR JSON ---- */
  window.exportarJSON = function () {
    var dados = {
      agendamentos: getAgendamentos(),
      fotos:        getFotos(),
      config:       getCfg(),
      horarios:     getHorarios()
    };
    var blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
    var url  = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href     = url;
    link.download = "beautyflow-backup.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  window.processarImport = function (input) {
    var arquivo = input.files[0];
    if (!arquivo) return;
    var reader = new FileReader();
    reader.onload = function (ev) {
      try {
        var dados = JSON.parse(ev.target.result);
        if (dados.agendamentos) setAgendamentos(dados.agendamentos);
        if (dados.fotos)        setFotos(dados.fotos);
        if (dados.horarios)     localStorage.setItem(CHAVE_HOR, JSON.stringify(dados.horarios));
        if (dados.config)       localStorage.setItem(CHAVE_CFG, JSON.stringify(dados.config));
        toast("Backup importado com sucesso!", "ok");
        renderizarDashboard();
      } catch (e) {
        toast("Arquivo inválido!", "err");
      }
    };
    reader.readAsText(arquivo);
    input.value = "";
  };

  /* ---- LIMPAR TUDO ---- */
  window.limparTudo = function () {
    confirmar("Apagar todos os dados", "ATENÇÃO: todos os agendamentos, fotos e configurações serão apagados. Deseja continuar?", function () {
      localStorage.removeItem(CHAVE_AG);
      localStorage.removeItem(CHAVE_FOTOS);
      localStorage.removeItem(CHAVE_CFG);
      localStorage.removeItem(CHAVE_HOR);
      toast("Todos os dados foram apagados.", "err");
      renderizarDashboard();
    });
  };

  /* ---- SAIR ---- */
  window.sair = function () {
    sessionStorage.removeItem("bf_logado");
    window.location.href = "login.html";
  };

  /* ---- MODAL DE CONFIRMAÇÃO ---- */
  function confirmar(titulo, texto, callback) {
    var overlay = document.getElementById("modalOverlay");
    var tit     = document.getElementById("modalTitulo");
    var txt     = document.getElementById("modalTexto");
    var btn     = document.getElementById("modalConfirmar");
    if (!overlay) { if (confirm(texto)) callback(); return; }

    if (tit) tit.textContent = titulo;
    if (txt) txt.textContent = texto;

    overlay.style.opacity = "1";
    overlay.style.pointerEvents = "all";

    if (btn) {
      btn.onclick = function () {
        fecharModal();
        callback();
      };
    }
  }

  window.fecharModal = function () {
    var overlay = document.getElementById("modalOverlay");
    if (overlay) {
      overlay.style.opacity = "0";
      overlay.style.pointerEvents = "none";
    }
  };

  /* Fecha modal clicando no overlay */
  var modalOverlay = document.getElementById("modalOverlay");
  if (modalOverlay) {
    modalOverlay.addEventListener("click", function (e) {
      if (e.target === modalOverlay) window.fecharModal();
    });
  }

} /* fim admin */
