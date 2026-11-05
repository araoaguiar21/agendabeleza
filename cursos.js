/* Academia Letícia Soares — protótipo local (antes da integração com a nuvem).
   Este módulo NÃO substitui autenticação nem banco de dados. */
(function () {
  "use strict";

  var STORAGE = "bf_cursos";

  function carregarCursos() {
    try {
      var valor = JSON.parse(localStorage.getItem(STORAGE) || "[]");
      return Array.isArray(valor) ? valor : [];
    } catch (erro) {
      return [];
    }
  }

  function salvarCursos(cursos) {
    try {
      localStorage.setItem(STORAGE, JSON.stringify(cursos));
      return true;
    } catch (erro) {
      alert("Não foi possível salvar os cursos neste navegador.");
      return false;
    }
  }

  function texto(tag, conteudo, classe) {
    var el = document.createElement(tag);
    el.textContent = conteudo == null ? "" : String(conteudo);
    if (classe) el.className = classe;
    return el;
  }

  function dataBR(iso) {
    if (!iso) return "Data a confirmar";
    var p = iso.split("-");
    return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : iso;
  }

  function periodo(curso) {
    if (curso.formato === "continuo") return "Inscrições contínuas · data a combinar";
    return dataBR(curso.inicio) +
      (curso.fim && curso.fim !== curso.inicio ? " a " + dataBR(curso.fim) : "");
  }

  function horario(curso) {
    if (!curso.horaInicio) return "";
    return curso.horaInicio +
      (curso.horaFim ? " às " + curso.horaFim : "");
  }

  function preco(curso) {
    return curso.preco === null || curso.preco === undefined
      ? "Valor sob consulta"
      : Number(curso.preco).toLocaleString("pt-BR", {style:"currency",currency:"BRL"});
  }

  function numeroWhatsApp() {
    var cfg = typeof getCfg === "function" ? getCfg() :
      (typeof CONFIG !== "undefined" ? CONFIG : {});
    return String(cfg.whatsapp || "").replace(/\D/g, "");
  }

  function carregarEstilos() {
    if (document.querySelector('link[href="cursos.css"]')) return;
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "cursos.css";
    document.head.appendChild(link);
  }

  function renderizarPublico() {
    var secao = document.getElementById("academia");
    if (!secao) return;

    var lista = document.getElementById("listaCursosPublicos");
    if (!lista) {
      var bloco = document.createElement("div");
      bloco.className = "ls-cursos-publicos";
      bloco.appendChild(texto("h3", "Cursos disponíveis", "ls-titulo-cursos"));
      lista = document.createElement("div");
      lista.id = "listaCursosPublicos";
      lista.className = "ls-cursos-grid";
      bloco.appendChild(lista);
      var botao = document.getElementById("academiaWhatsApp");
      var antes = botao ? botao.parentNode : null;
      secao.insertBefore(bloco, antes || null);
    }

    lista.replaceChildren();
    var cursos = carregarCursos().filter(function (c) { return !!c.publicado; });
    if (!cursos.length) {
      lista.appendChild(texto("p", "Novas turmas serão anunciadas em breve. Entre em contato para informações.", "ls-aviso-vazio"));
      return;
    }

    cursos.forEach(function (c) {
      var card = document.createElement("article");
      card.className = "ls-curso-card";
      card.appendChild(texto("span", "CURSO PRESENCIAL", "ls-curso-etiqueta"));
      card.appendChild(texto("h4", c.nome, "ls-curso-nome"));
      card.appendChild(texto("p", periodo(c), "ls-curso-data"));
      card.appendChild(texto("p", c.descricao, "ls-curso-descricao"));

      var detalhes = document.createElement("div");
      detalhes.className = "ls-curso-detalhes";
      if (c.dias) detalhes.appendChild(texto("p", "📆 " + c.dias));
      if (horario(c)) detalhes.appendChild(texto("p", "🕒 " + horario(c)));
      if (c.local) detalhes.appendChild(texto("p", "📍 " + c.local));
      if (c.vagas) detalhes.appendChild(texto("p", "🎓 Até " + c.vagas + " vagas"));
      card.appendChild(detalhes);
      card.appendChild(texto("strong", preco(c), "ls-curso-preco"));

      var numero = numeroWhatsApp();
      if (numero) {
        var mensagem = "Olá, Letícia! Tenho interesse no curso " +
          c.nome + " (" + periodo(c) + "). Pode me passar mais informações?";
        var a = texto("a", "Quero informações", "btn btn-primary ls-curso-botao");
        a.href = "https://wa.me/" + numero + "?text=" + encodeURIComponent(mensagem);
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        card.appendChild(a);
      }
      lista.appendChild(card);
    });
  }

  function iniciarAdmin() {
    var menu = document.querySelector(".sidebar-nav");
    var principal = document.querySelector(".admin-main");
    if (!menu || !principal || document.getElementById("aba-cursos")) return;

    var item = document.createElement("li");
    var link = texto("a", "🎓 Academia / Cursos");
    link.href = "#";
    item.appendChild(link);
    menu.insertBefore(item, menu.children[3] || null);

    var painel = document.createElement("section");
    painel.className = "aba";
    painel.id = "aba-cursos";
    painel.innerHTML = `
      <div class="card">
        <div class="card-header"><h2>Academia Letícia Soares</h2></div>
        <p class="ls-aviso">Versão de testes: cursos salvos somente neste navegador.
          Antes de publicar para clientes, vamos configurar autenticação e banco de dados.</p>
        <form id="ls-form-curso">
          <input type="hidden" id="ls-id">
          <div class="config-grid">
            <div class="form-group config-full">
              <label for="ls-nome">Nome do curso *</label>
              <input id="ls-nome" maxlength="100" required placeholder="Ex.: Curso de alongamento em gel">
            </div>
            <div class="form-group config-full">
              <label for="ls-descricao">O que a aluna vai aprender? *</label>
              <textarea id="ls-descricao" maxlength="1500" rows="4" required
                placeholder="Conteúdo, técnicas e informações importantes"></textarea>
            </div>
            <div class="form-group">
              <label for="ls-formato">Tipo de inscrição *</label>
              <select id="ls-formato">
                <option value="turma">Turma com data definida</option>
                <option value="continuo">Inscrições contínuas</option>
              </select>
            </div>
            <div class="form-group">
              <label for="ls-preco">Preço (R$)</label>
              <input id="ls-preco" type="number" min="0" step="0.01" placeholder="350.00">
            </div>
            <div class="form-group ls-turma-only">
              <label for="ls-inicio">Data de início *</label>
              <input id="ls-inicio" type="date">
            </div>
            <div class="form-group ls-turma-only">
              <label for="ls-fim">Data de término (opcional)</label>
              <input id="ls-fim" type="date">
            </div>
            <div class="form-group">
              <label for="ls-dias">Dias da semana</label>
              <input id="ls-dias" maxlength="120" placeholder="Ex.: sábados e domingos">
            </div>
            <div class="form-group">
              <label for="ls-hora-inicio">Horário de início</label>
              <input id="ls-hora-inicio" type="time">
            </div>
            <div class="form-group">
              <label for="ls-hora-fim">Horário de término</label>
              <input id="ls-hora-fim" type="time">
            </div>
            <div class="form-group">
              <label for="ls-vagas">Quantidade máxima de vagas</label>
              <input id="ls-vagas" type="number" min="1" step="1" placeholder="Ex.: 8">
            </div>
            <div class="form-group config-full">
              <label for="ls-local">Local do curso</label>
              <input id="ls-local" maxlength="150" placeholder="Ex.: Realengo — Rio de Janeiro">
            </div>
            <label class="ls-checkbox config-full" for="ls-publicado">
              <input id="ls-publicado" type="checkbox" checked>
              Exibir este curso no site
            </label>
          </div>
          <div class="ls-acoes-form">
            <button type="submit" class="btn btn-primary">Salvar curso</button>
            <button type="button" id="ls-limpar" class="btn-sm btn-del">Limpar formulário</button>
          </div>
        </form>
      </div>
      <div class="card">
        <div class="card-header"><h2>Cursos cadastrados</h2>
          <span id="ls-total-cursos"></span></div>
        <div id="ls-lista-admin"></div>
      </div>`;
    principal.appendChild(painel);

    var form = document.getElementById("ls-form-curso");
    function campo(nome) { return document.getElementById("ls-" + nome); }
    function atualizarDatas() {
      var turma = campo("formato").value === "turma";
      painel.querySelectorAll(".ls-turma-only").forEach(function (el) {
        el.hidden = !turma;
      });
      campo("inicio").required = turma;
      if (!turma) {
        campo("inicio").value = "";
        campo("fim").value = "";
      }
    }

    function limpar() {
      form.reset();
      campo("id").value = "";
      atualizarDatas();
      campo("nome").focus();
    }

    function listar() {
      var lista = campo("lista-admin");
      lista.replaceChildren();
      var cursos = carregarCursos();
      campo("total-cursos").textContent = cursos.length + " curso(s)";
      if (!cursos.length) {
        lista.appendChild(texto("p", "Nenhum curso cadastrado ainda.", "ls-aviso-vazio"));
        return;
      }
      cursos.forEach(function (c) {
        var linha = document.createElement("div");
        linha.className = "ls-admin-curso";
        var info = document.createElement("div");
        info.appendChild(texto("strong", c.nome));
        info.appendChild(texto("p", periodo(c)));
        info.appendChild(texto("small", c.publicado ? "Publicado" : "Oculto"));
        var acoes = document.createElement("div");
        acoes.className = "ls-acoes-admin";

        var editar = texto("button", "Editar", "btn-sm btn-del");
        editar.type = "button";
        editar.addEventListener("click", function () {
          campo("id").value = c.id;
          campo("nome").value = c.nome || "";
          campo("descricao").value = c.descricao || "";
          campo("formato").value = c.formato || "turma";
          atualizarDatas();
          campo("preco").value = c.preco == null ? "" : c.preco;
          campo("inicio").value = c.inicio || "";
          campo("fim").value = c.fim || "";
          campo("dias").value = c.dias || "";
          campo("hora-inicio").value = c.horaInicio || "";
          campo("hora-fim").value = c.horaFim || "";
          campo("vagas").value = c.vagas == null ? "" : c.vagas;
          campo("local").value = c.local || "";
          campo("publicado").checked = !!c.publicado;
          form.scrollIntoView({behavior:"smooth"});
        });

        var excluir = texto("button", "Excluir", "btn-sm btn-cancel");
        excluir.type = "button";
        excluir.addEventListener("click", function () {
          if (!confirm('Excluir definitivamente o curso "' + c.nome + '"?')) return;
          var restantes = carregarCursos().filter(function (x) { return x.id !== c.id; });
          if (salvarCursos(restantes)) { listar(); limpar(); }
        });

        acoes.appendChild(editar);
        acoes.appendChild(excluir);
        linha.appendChild(info);
        linha.appendChild(acoes);
        lista.appendChild(linha);
      });
    }

    form.addEventListener("submit", function (evento) {
      evento.preventDefault();
      var formato = campo("formato").value;
      var inicio = campo("inicio").value;
      var fim = campo("fim").value;
      var hIni = campo("hora-inicio").value;
      var hFim = campo("hora-fim").value;
      var valor = campo("preco").value;
      var vagas = campo("vagas").value;
      if (formato === "turma" && !inicio) {
        alert("Informe a data de início da turma."); return;
      }
      if (formato === "turma" && fim && fim < inicio) {
        alert("A data de término não pode ser anterior à data de início."); return;
      }
      if (hIni && hFim && hFim <= hIni) {
        alert("O horário final precisa ser posterior ao inicial."); return;
      }

      var cursos = carregarCursos();
      var id = campo("id").value ||
        "curso-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
      var curso = {
        id: id,
        nome: campo("nome").value.trim(),
        descricao: campo("descricao").value.trim(),
        formato: formato,
        preco: valor === "" ? null : Number(valor),
        inicio: formato === "turma" ? inicio : "",
        fim: formato === "turma" ? fim : "",
        dias: campo("dias").value.trim(),
        horaInicio: hIni,
        horaFim: hFim,
        vagas: vagas === "" ? null : Number(vagas),
        local: campo("local").value.trim(),
        publicado: campo("publicado").checked
      };
      if (!curso.nome || !curso.descricao) {
        alert("Preencha o nome e a descrição."); return;
      }
      var indice = cursos.findIndex(function (c) { return c.id === id; });
      if (indice >= 0) cursos[indice] = curso;
      else cursos.push(curso);
      if (!salvarCursos(cursos)) return;
      limpar();
      listar();
      alert(indice >= 0 ? "Curso atualizado!" : "Curso cadastrado!");
    });

    link.addEventListener("click", function (evento) {
      evento.preventDefault();
      if (typeof window.trocarAba === "function") window.trocarAba("cursos", link);
      if (typeof window.fecharMenu === "function") window.fecharMenu();
      listar();
    });
    campo("formato").addEventListener("change", atualizarDatas);
    campo("limpar").addEventListener("click", limpar);
    atualizarDatas();
    listar();
  }

  function iniciar() {
    carregarEstilos();
    if (document.getElementById("aba-dashboard")) iniciarAdmin();
    if (document.getElementById("academia")) renderizarPublico();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
