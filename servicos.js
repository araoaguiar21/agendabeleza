/* Letícia Soares — gerenciamento local de serviços e preços.
   Etapa de desenvolvimento: substituir armazenamento local por Supabase antes da publicação. */
(function () {
  "use strict";

  if (!document.getElementById("aba-dashboard")) return;

  var CHAVE_CATALOGO = "bf_servicos_catalogo";
  var CHAVE_CONFIG = "bf_cfg";

  function leJson(chave, padrao) {
    try {
      var json = localStorage.getItem(chave);
      return json ? JSON.parse(json) : padrao;
    } catch (erro) {
      return padrao;
    }
  }

  function catalogo() {
    var guardados = leJson(CHAVE_CATALOGO, null);
    if (Array.isArray(guardados)) return guardados;
    var cfg = typeof getCfg === "function" ? getCfg() : CONFIG;
    return (cfg.services || []).map(function (servico, i) {
      return {
        id: "servico-original-" + i,
        name: servico.name || "",
        desc: servico.desc || "",
        priceNum: Number(servico.priceNum || 0),
        duration: Number(servico.duration || 0),
        emoji: servico.emoji || "💅",
        ativo: true
      };
    });
  }

  function precoParaTexto(n) {
    return Number(n) > 0
      ? Number(n).toLocaleString("pt-BR", {style: "currency", currency: "BRL"})
      : "Sob consulta";
  }

  function salvar(lista) {
    var cfg = leJson(CHAVE_CONFIG, {});
    if (!cfg || typeof cfg !== "object" || Array.isArray(cfg)) cfg = {};
    cfg.services = lista.filter(function (s) { return s.ativo; }).map(function (s) {
      return {
        name: s.name,
        desc: s.desc,
        price: precoParaTexto(s.priceNum),
        priceNum: s.priceNum,
        duration: s.duration,
        emoji: s.emoji
      };
    });
    try {
      localStorage.setItem(CHAVE_CATALOGO, JSON.stringify(lista));
      localStorage.setItem(CHAVE_CONFIG, JSON.stringify(cfg));
      return true;
    } catch (erro) {
      alert("Não foi possível salvar. Verifique o espaço de armazenamento do navegador.");
      return false;
    }
  }

  function el(id) { return document.getElementById("ls-serv-" + id); }

  function criarTexto(tag, conteudo, classe) {
    var no = document.createElement(tag);
    no.textContent = conteudo == null ? "" : String(conteudo);
    if (classe) no.className = classe;
    return no;
  }

  function iniciar() {
    var menu = document.querySelector(".sidebar-nav");
    var main = document.querySelector(".admin-main");
    if (!menu || !main || document.getElementById("aba-servicos")) return;

    var style = document.createElement("style");
    style.textContent =
      ".ls-serv-aviso{font-size:13px;color:#795c27;background:#fff6e9;border:1px solid #f0d8a8;padding:12px 14px;border-radius:10px;margin-bottom:20px}" +
      ".ls-serv-lista{display:flex;flex-direction:column;gap:12px}" +
      ".ls-serv-linha{display:flex;align-items:center;justify-content:space-between;gap:16px;border:1px solid var(--border);border-radius:12px;padding:14px}" +
      ".ls-serv-info{min-width:0}.ls-serv-info strong{display:block;font-size:16px}" +
      ".ls-serv-info small{display:block;color:var(--text-muted);margin-top:3px}" +
      ".ls-serv-acoes{display:flex;flex-wrap:wrap;gap:7px}" +
      ".ls-serv-inativo{opacity:.55}" +
      ".ls-serv-check{display:flex;align-items:center;gap:10px;font-size:14px}" +
      ".ls-serv-check input{width:auto}" +
      ".ls-serv-form-acoes{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:18px}" +
      "@media(max-width:600px){.ls-serv-linha{flex-direction:column;align-items:flex-start}.ls-serv-acoes{width:100%}#aba-servicos .config-grid{grid-template-columns:1fr}#aba-servicos .config-full{grid-column:auto}}";
    document.head.appendChild(style);

    var item = document.createElement("li");
    var link = criarTexto("a", "💅 Serviços e Preços");
    link.href = "#";
    item.appendChild(link);
    menu.insertBefore(item, menu.children[2] || null);

    var painel = document.createElement("section");
    painel.id = "aba-servicos";
    painel.className = "aba";
    painel.innerHTML = `
      <div class="card">
        <div class="card-header"><h2>Gerenciar Serviços e Preços</h2></div>
        <p class="ls-serv-aviso">
          Modo de testes: as alterações só ficam salvas neste navegador.
          A sincronização entre clientes e dispositivos será feita com Supabase.
        </p>
        <form id="ls-serv-form">
          <input id="ls-serv-id" type="hidden">
          <div class="config-grid">
            <div class="form-group config-full">
              <label for="ls-serv-nome">Nome do serviço *</label>
              <input id="ls-serv-nome" maxlength="90" required
                placeholder="Ex.: Alongamento em gel">
            </div>
            <div class="form-group">
              <label for="ls-serv-preco">Preço em reais (R$) *</label>
              <input id="ls-serv-preco" type="number" min="0" step="0.01" required
                placeholder="Ex.: 80,00">
            </div>
            <div class="form-group">
              <label for="ls-serv-duracao">Duração (minutos)</label>
              <input id="ls-serv-duracao" type="number" min="0" step="5"
                placeholder="Ex.: 90">
            </div>
            <div class="form-group config-full">
              <label for="ls-serv-descricao">Descrição</label>
              <textarea id="ls-serv-descricao" rows="3" maxlength="600"
                placeholder="Explique o atendimento"></textarea>
            </div>
            <div class="form-group">
              <label for="ls-serv-emoji">Ícone (emoji)</label>
              <input id="ls-serv-emoji" maxlength="8" placeholder="💅">
            </div>
            <label class="ls-serv-check" for="ls-serv-ativo">
              <input id="ls-serv-ativo" type="checkbox" checked> Disponível no site
            </label>
          </div>
          <div class="ls-serv-form-acoes">
            <button type="submit" class="btn btn-primary">Salvar serviço</button>
            <button type="button" id="ls-serv-limpar" class="btn-sm btn-del">Novo / Limpar</button>
          </div>
        </form>
      </div>
      <div class="card">
        <div class="card-header">
          <h2>Serviços cadastrados</h2><span id="ls-serv-contador"></span>
        </div>
        <div id="ls-serv-lista" class="ls-serv-lista"></div>
      </div>`;
    main.appendChild(painel);

    var form = el("form");
    function limpar() {
      form.reset();
      el("id").value = "";
      el("ativo").checked = true;
    }

    function editar(servico) {
      el("id").value = servico.id;
      el("nome").value = servico.name;
      el("descricao").value = servico.desc || "";
      el("preco").value = servico.priceNum || 0;
      el("duracao").value = servico.duration || 0;
      el("emoji").value = servico.emoji || "💅";
      el("ativo").checked = !!servico.ativo;
      form.scrollIntoView({behavior: "smooth", block: "start"});
      el("nome").focus();
    }

    function alternar(id) {
      var todos = catalogo();
      todos.forEach(function (s) {
        if (s.id === id) s.ativo = !s.ativo;
      });
      if (salvar(todos)) listar();
    }

    function listar() {
      var todos = catalogo();
      var lista = el("lista");
      lista.replaceChildren();
      el("contador").textContent = todos.length + " cadastrado(s)";
      if (!todos.length) {
        lista.appendChild(criarTexto("p", "Nenhum serviço cadastrado."));
        return;
      }
      todos.forEach(function (s) {
        var linha = document.createElement("div");
        linha.className = "ls-serv-linha" + (s.ativo ? "" : " ls-serv-inativo");
        var info = document.createElement("div");
        info.className = "ls-serv-info";
        info.appendChild(criarTexto("strong", (s.emoji || "💅") + " " + s.name));
        info.appendChild(criarTexto("small",
          precoParaTexto(s.priceNum) + " · " +
          (s.duration ? s.duration + " min · " : "") +
          (s.ativo ? "Disponível" : "Desativado")));
        var acoes = document.createElement("div");
        acoes.className = "ls-serv-acoes";
        var bEditar = criarTexto("button", "Editar", "btn-sm btn-del");
        bEditar.type = "button";
        bEditar.addEventListener("click", function () { editar(s); });
        var bAtivo = criarTexto("button", s.ativo ? "Desativar" : "Ativar",
          "btn-sm " + (s.ativo ? "btn-cancel" : "btn-ok"));
        bAtivo.type = "button";
        bAtivo.addEventListener("click", function () { alternar(s.id); });
        acoes.appendChild(bEditar);
        acoes.appendChild(bAtivo);
        linha.appendChild(info);
        linha.appendChild(acoes);
        lista.appendChild(linha);
      });
    }

    form.addEventListener("submit", function (evento) {
      evento.preventDefault();
      var name = el("nome").value.trim();
      var valor = Number(el("preco").value);
      var duration = Number(el("duracao").value || 0);
      if (!name || !Number.isFinite(valor) || valor < 0 ||
          !Number.isFinite(duration) || duration < 0) {
        alert("Confira o nome, o preço e a duração do serviço.");
        return;
      }
      var todos = catalogo();
      var id = el("id").value ||
        "servico-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
      var itemNovo = {
        id: id,
        name: name,
        desc: el("descricao").value.trim(),
        priceNum: valor,
        duration: duration,
        emoji: el("emoji").value.trim() || "💅",
        ativo: el("ativo").checked
      };
      var i = todos.findIndex(function (s) { return s.id === id; });
      if (i >= 0) todos[i] = itemNovo;
      else todos.push(itemNovo);
      if (!salvar(todos)) return;
      limpar();
      listar();
      alert("Serviço salvo! Atualize a página pública para ver as mudanças.");
    });

    el("limpar").addEventListener("click", limpar);
    link.addEventListener("click", function (evento) {
      evento.preventDefault();
      if (typeof window.trocarAba === "function") window.trocarAba("servicos", link);
      if (typeof window.fecharMenu === "function") window.fecharMenu();
      listar();
    });
    listar();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
