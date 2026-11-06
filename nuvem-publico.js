/* Conteúdo público do Supabase — apenas leitura de serviços ativos e cursos publicados. */
(function () {
  "use strict";

  if (!document.getElementById("servicosGrid")) return;

  var db = window.studioDb;
  var grid = document.getElementById("servicosGrid");
  var escolha = document.getElementById("servico");

  function texto(tag, valor, classe) {
    var elem = document.createElement(tag);
    elem.textContent = valor == null ? "" : String(valor);
    if (classe) elem.className = classe;
    return elem;
  }

  function moeda(centavos) {
    if (centavos === null || centavos === undefined) return "Valor sob consulta";
    return (Number(centavos) / 100).toLocaleString("pt-BR", {
      style: "currency",currency: "BRL"
    });
  }

  function dataBR(iso) {
    if (!iso) return "A combinar";
    var p = iso.split("-");
    return p[2] + "/" + p[1] + "/" + p[0];
  }

  function avisoNoGrid(destino, mensagem) {
    destino.replaceChildren(texto("p", mensagem));
  }

  function bloquearAgendamento(mensagem) {
    if (escolha) {
      escolha.replaceChildren();
      var option = texto("option", mensagem);
      option.value = "";
      escolha.appendChild(option);
      escolha.disabled = true;
    }
  }

  function renderizarServicos(dados) {
    grid.replaceChildren();
    if (escolha) {
      escolha.replaceChildren();
      var vazio = texto("option", "Escolha um serviço...");
      vazio.value = "";
      escolha.appendChild(vazio);
      escolha.disabled = !dados.length;
    }
    if (!dados.length) {
      grid.appendChild(texto("p", "Não há serviços disponíveis no momento."));
    }

    var mapeados = [];
    dados.forEach(function (s) {
      var m = {
        name: s.name,
        desc: s.description || "",
        price: moeda(s.price_cents),
        priceNum: (s.price_cents || 0) / 100,
        duration: s.duration_minutes,
        emoji: s.emoji || "💅"
      };
      mapeados.push(m);

      var card = document.createElement("div");
      card.className = "servico-card";
      card.appendChild(texto("span", m.emoji, "servico-emoji"));
      card.appendChild(texto("h2", m.name));
      card.appendChild(texto("p", m.desc));
      card.appendChild(texto("span", m.price, "servico-price"));
      grid.appendChild(card);

      if (escolha) {
        var opt = texto("option", m.name + " — " + m.price);
        opt.value = m.name;
        escolha.appendChild(opt);
      }
    });

    // O formulário de agendamento existente usa esta variável de script.js
    // para encontrar o preço do serviço escolhido.
    if (window.cfg && typeof window.cfg === "object") {
      window.cfg.services = mapeados;
    }
  }

  function acharListaCursos() {
    var secao = document.getElementById("academia");
    if (!secao) return null;
    var lista = document.getElementById("listaCursosPublicos");
    if (lista) return lista;
    var bloco = document.createElement("div");
    bloco.className = "ls-cursos-publicos";
    bloco.appendChild(texto("h3", "Cursos disponíveis", "ls-titulo-cursos"));
    lista = document.createElement("div");
    lista.className = "ls-cursos-grid";
    lista.id = "listaCursosPublicos";
    bloco.appendChild(lista);
    var botao = document.getElementById("academiaWhatsApp");
    var blocoBotao = botao ? botao.parentNode : null;
    secao.insertBefore(bloco, blocoBotao || null);
    return lista;
  }

  function whatsapp() {
    var origem = window.cfg || (typeof CONFIG !== "undefined" ? CONFIG : {});
    return String(origem.whatsapp || "").replace(/\D/g,"");
  }

  function renderizarCursos(cursos) {
    var lista = acharListaCursos();
    if (!lista) return;
    lista.replaceChildren();
    if (!cursos.length) {
      lista.appendChild(texto("p", "Novas turmas serão anunciadas em breve.",
        "ls-aviso-vazio"));
      return;
    }

    cursos.forEach(function (c) {
      var cartao = document.createElement("article");
      cartao.className = "ls-curso-card";
      cartao.appendChild(texto("span","FORMAÇÃO PRESENCIAL","ls-curso-etiqueta"));
      cartao.appendChild(texto("h4",c.title,"ls-curso-nome"));
      var periodo = c.format === "continuo" ? "Inscrições contínuas · data a combinar" :
        dataBR(c.start_date) + (c.end_date && c.end_date !== c.start_date
        ? " a " + dataBR(c.end_date) : "");
      cartao.appendChild(texto("p",periodo,"ls-curso-data"));
      cartao.appendChild(texto("p",c.description || "","ls-curso-descricao"));
      var detalhes = document.createElement("div");
      detalhes.className = "ls-curso-detalhes";
      if (c.days_description) detalhes.appendChild(texto("p","📆 " + c.days_description));
      if (c.start_time) {
        var horario = c.start_time.slice(0,5) +
          (c.end_time ? " às " + c.end_time.slice(0,5) : "");
        detalhes.appendChild(texto("p","🕒 " + horario));
      }
      if (c.location) detalhes.appendChild(texto("p","📍 " + c.location));
      if (c.capacity) detalhes.appendChild(texto("p","🎓 Até " + c.capacity + " vagas"));
      cartao.appendChild(detalhes);
      cartao.appendChild(texto("strong",moeda(c.price_cents),"ls-curso-preco"));

      var numero = whatsapp();
      if (numero) {
        var mensagem = "Olá, Letícia! Tenho interesse no curso " +
          c.title + " (" + periodo + "). Pode me passar informações?";
        var botao = texto("a", "Quero informações", "btn btn-primary ls-curso-botao");
        botao.href = "https://wa.me/" + numero + "?text=" + encodeURIComponent(mensagem);
        botao.target = "_blank";
        botao.rel = "noopener noreferrer";
        cartao.appendChild(botao);
      }
      lista.appendChild(cartao);
    });
  }

  async function carregarServicos() {
    var resposta = await db.from("services")
      .select("id,name,description,price_cents,duration_minutes,emoji,sort_order")
      .eq("active",true).order("sort_order",{ascending:true});
    if (resposta.error) throw resposta.error;
    renderizarServicos(resposta.data || []);
  }

  async function carregarCursos() {
    var resposta = await db.from("courses")
      .select("id,title,description,format,price_cents,start_date,end_date,days_description,start_time,end_time,capacity,location")
      .eq("published",true).order("created_at",{ascending:false});
    if (resposta.error) throw resposta.error;
    renderizarCursos(resposta.data || []);
  }

  async function iniciar() {
    avisoNoGrid(grid, "Carregando serviços disponíveis…");
    bloquearAgendamento("Carregando serviços…");
    var listaCursos = acharListaCursos();
    if (listaCursos) avisoNoGrid(listaCursos,"Carregando cursos…");

    if (!db) {
      avisoNoGrid(grid,"Serviços indisponíveis. Entre em contato pelo WhatsApp.");
      if (listaCursos) avisoNoGrid(listaCursos,"Cursos indisponíveis.");
      bloquearAgendamento("Indisponível no momento");
      return;
    }

    // Buscas independentes, para cursos não bloquearem serviços e vice-versa.
    try {
      await carregarServicos();
      document.dispatchEvent(new Event("studio-services-loaded"));
    } catch (erro) {
      avisoNoGrid(grid,"Não foi possível carregar os serviços. Tente novamente.");
      bloquearAgendamento("Indisponível no momento");
      console.error("Erro na consulta pública de serviços:",erro);
    }
    if (listaCursos) {
      try {
        await carregarCursos();
      } catch (erro) {
        avisoNoGrid(listaCursos,"Não foi possível carregar os cursos. Tente novamente.");
        console.error("Erro na consulta pública de cursos:",erro);
      }
    }
  }

  iniciar();
})();
