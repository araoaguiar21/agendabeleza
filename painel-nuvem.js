/* Painel de gerenciamento remoto — Supabase, com RLS por administradora. */
(function () {
  "use strict";

  var db = window.studioDb;
  var servicos = [];
  var cursos = [];

  function el(id) { return document.getElementById(id); }

  function mensagem(texto, erro) {
    var aviso = el("cloudMensagem");
    aviso.hidden = !texto;
    aviso.textContent = texto || "";
    aviso.className = "ls-cloud-mensagem" + (erro ? " erro" : "");
  }

  function texto(tag, valor, classe) {
    var no = document.createElement(tag);
    no.textContent = valor == null ? "" : String(valor);
    if (classe) no.className = classe;
    return no;
  }

  function reais(centavos) {
    if (centavos === null || centavos === undefined) return "Valor sob consulta";
    return (centavos / 100).toLocaleString("pt-BR", {
      style: "currency", currency: "BRL"
    });
  }

  function dataBR(iso) {
    if (!iso) return "Data a combinar";
    var pedacos = iso.split("-");
    return pedacos[2] + "/" + pedacos[1] + "/" + pedacos[0];
  }

  function ativarAba(nome) {
    el("secaoServicos").hidden = nome !== "servicos";
    el("secaoCursos").hidden = nome !== "cursos";
    el("abaServicoBotao").classList.toggle("selecionado", nome === "servicos");
    el("abaCursoBotao").classList.toggle("selecionado", nome === "cursos");
    mensagem("");
  }

  function configurarAbas() {
    el("abaServicoBotao").addEventListener("click", function () { ativarAba("servicos"); });
    el("abaCursoBotao").addEventListener("click", function () { ativarAba("cursos"); });
  }

  function limparServico() {
    el("formCloudServico").reset();
    el("servicoCloudId").value = "";
    el("servicoCloudDuracao").value = "60";
    el("servicoCloudAtivo").checked = true;
  }

  function limparCurso() {
    el("formCloudCurso").reset();
    el("cursoCloudId").value = "";
    el("cursoCloudPublicado").checked = true;
    atualizarCampoDatas();
  }

  function atualizarCampoDatas() {
    var turma = el("cursoCloudFormato").value === "turma";
    document.querySelectorAll(".ls-cloud-datas").forEach(function (campo) {
      campo.hidden = !turma;
    });
    el("cursoCloudInicio").required = turma;
    if (!turma) {
      el("cursoCloudInicio").value = "";
      el("cursoCloudFim").value = "";
    }
  }

  async function buscarServicos() {
    var resposta = await db.from("services").select("*")
      .order("sort_order", {ascending:true})
      .order("created_at", {ascending:true});
    if (resposta.error) throw resposta.error;
    servicos = resposta.data || [];
    renderizarServicos();
  }

  async function buscarCursos() {
    var resposta = await db.from("courses").select("*")
      .order("created_at", {ascending:false});
    if (resposta.error) throw resposta.error;
    cursos = resposta.data || [];
    renderizarCursos();
  }

  function botao(rotulo, acao) {
    var elemento = texto("button", rotulo);
    elemento.type = "button";
    elemento.addEventListener("click", acao);
    return elemento;
  }

  async function executarModificacao(operacao, sucesso, apos) {
    try {
      var retorno = await operacao();
      if (retorno.error) throw retorno.error;
      await apos();
      mensagem(sucesso, false);
    } catch (erro) {
      mensagem("Não foi possível salvar: " + erro.message, true);
    }
  }

  function editarServico(s) {
    ativarAba("servicos");
    el("servicoCloudId").value = s.id;
    el("servicoCloudNome").value = s.name;
    el("servicoCloudPreco").value = (s.price_cents / 100).toFixed(2);
    el("servicoCloudDuracao").value = s.duration_minutes;
    el("servicoCloudEmoji").value = s.emoji || "💅";
    el("servicoCloudDescricao").value = s.description || "";
    el("servicoCloudAtivo").checked = !!s.active;
    el("formCloudServico").scrollIntoView({behavior:"smooth",block:"start"});
  }

  function renderizarServicos() {
    var lista = el("listaCloudServicos");
    lista.replaceChildren();
    if (!servicos.length) {
      lista.appendChild(texto("p", "Nenhum serviço no Supabase. Cadastre o primeiro acima."));
      return;
    }
    servicos.forEach(function (s) {
      var linha = document.createElement("div");
      linha.className = "ls-cloud-item";
      var info = document.createElement("div");
      info.appendChild(texto("strong", (s.emoji || "💅") + " " + s.name));
      info.appendChild(texto("small", reais(s.price_cents) + " · " +
        (s.duration_minutes ? s.duration_minutes + " min · " : "") +
        (s.active ? "Disponível" : "Oculto")));
      var botoes = document.createElement("div");
      botoes.className = "ls-cloud-item-actions";
      botoes.appendChild(botao("Editar", function () { editarServico(s); }));
      botoes.appendChild(botao(s.active ? "Ocultar" : "Publicar", function () {
        executarModificacao(function () {
          return db.from("services").update({active: !s.active}).eq("id",s.id);
        }, "Disponibilidade atualizada.", buscarServicos);
      }));
      botoes.appendChild(botao("Excluir", function () {
        if (!confirm('Excluir permanentemente o serviço "' + s.name + '"?')) return;
        executarModificacao(function () {
          return db.from("services").delete().eq("id",s.id);
        }, "Serviço excluído.", buscarServicos);
      }));
      linha.appendChild(info);
      linha.appendChild(botoes);
      lista.appendChild(linha);
    });
  }

  async function salvarServico(event) {
    event.preventDefault();
    var nome = el("servicoCloudNome").value.trim();
    var valor = Number(el("servicoCloudPreco").value);
    var duracao = Number(el("servicoCloudDuracao").value || 0);
    if (!nome || !Number.isFinite(valor) || valor < 0 || valor > 100000 ||
        !Number.isInteger(duracao) || duracao < 0 || duracao > 1440) {
      mensagem("Confira o nome, o valor e a duração.", true); return;
    }
    var registro = {
      name: nome,
      description: el("servicoCloudDescricao").value.trim(),
      price_cents: Math.round(valor * 100),
      duration_minutes: duracao,
      emoji: el("servicoCloudEmoji").value.trim() || "💅",
      active: el("servicoCloudAtivo").checked
    };
    var id = el("servicoCloudId").value;
    var btn = el("formCloudServico").querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      var pedido = id
        ? db.from("services").update(registro).eq("id", id)
        : db.from("services").insert(registro);
      var resultado = await pedido;
      if (resultado.error) throw resultado.error;
      await buscarServicos();
      limparServico();
      mensagem(id ? "Serviço atualizado na nuvem!" : "Serviço cadastrado na nuvem!");
    } catch (erro) {
      mensagem("Erro ao salvar serviço: " + erro.message, true);
    } finally {
      btn.disabled = false;
    }
  }

  function descricaoPeriodo(c) {
    if (c.format === "continuo") return "Inscrições contínuas, data a combinar";
    return dataBR(c.start_date) +
      (c.end_date && c.end_date !== c.start_date ? " a " + dataBR(c.end_date) : "");
  }

  function editarCurso(c) {
    ativarAba("cursos");
    el("cursoCloudId").value = c.id;
    el("cursoCloudNome").value = c.title;
    el("cursoCloudDescricao").value = c.description || "";
    el("cursoCloudFormato").value = c.format;
    atualizarCampoDatas();
    el("cursoCloudPreco").value = c.price_cents == null ? "" : (c.price_cents / 100).toFixed(2);
    el("cursoCloudInicio").value = c.start_date || "";
    el("cursoCloudFim").value = c.end_date || "";
    el("cursoCloudDias").value = c.days_description || "";
    el("cursoCloudHoraInicio").value = c.start_time ? c.start_time.slice(0,5) : "";
    el("cursoCloudHoraFim").value = c.end_time ? c.end_time.slice(0,5) : "";
    el("cursoCloudVagas").value = c.capacity == null ? "" : c.capacity;
    el("cursoCloudLocal").value = c.location || "";
    el("cursoCloudPublicado").checked = !!c.published;
    el("formCloudCurso").scrollIntoView({behavior:"smooth",block:"start"});
  }

  function renderizarCursos() {
    var lista = el("listaCloudCursos");
    lista.replaceChildren();
    if (!cursos.length) {
      lista.appendChild(texto("p", "Nenhum curso no Supabase. Cadastre o primeiro acima."));
      return;
    }
    cursos.forEach(function (c) {
      var linha = document.createElement("div");
      linha.className = "ls-cloud-item";
      var info = document.createElement("div");
      info.appendChild(texto("strong", c.title));
      info.appendChild(texto("small", descricaoPeriodo(c) + " · " +
        reais(c.price_cents) + " · " + (c.published ? "Publicado" : "Oculto")));
      var botoes = document.createElement("div");
      botoes.className = "ls-cloud-item-actions";
      botoes.appendChild(botao("Editar", function () { editarCurso(c); }));
      botoes.appendChild(botao(c.published ? "Ocultar" : "Publicar", function () {
        executarModificacao(function () {
          return db.from("courses").update({published: !c.published}).eq("id",c.id);
        }, "Visibilidade do curso atualizada.", buscarCursos);
      }));
      botoes.appendChild(botao("Excluir", function () {
        if (!confirm('Excluir permanentemente o curso "' + c.title + '"?')) return;
        executarModificacao(function () {
          return db.from("courses").delete().eq("id",c.id);
        }, "Curso excluído.", buscarCursos);
      }));
      linha.appendChild(info);
      linha.appendChild(botoes);
      lista.appendChild(linha);
    });
  }

  async function salvarCurso(event) {
    event.preventDefault();
    var turma = el("cursoCloudFormato").value === "turma";
    var inicio = el("cursoCloudInicio").value;
    var fim = el("cursoCloudFim").value;
    var horaInicio = el("cursoCloudHoraInicio").value;
    var horaFim = el("cursoCloudHoraFim").value;
    var precoTexto = el("cursoCloudPreco").value;
    var preco = precoTexto === "" ? null : Number(precoTexto);
    var vagasTexto = el("cursoCloudVagas").value;
    var vagas = vagasTexto === "" ? null : Number(vagasTexto);
    var nome = el("cursoCloudNome").value.trim();
    var descricao = el("cursoCloudDescricao").value.trim();
    if (!nome || !descricao || (turma && !inicio) || (turma && fim && fim < inicio) ||
        (horaInicio && horaFim && horaFim <= horaInicio) ||
        (preco !== null && (!Number.isFinite(preco) || preco < 0 || preco > 100000)) ||
        (vagas !== null && (!Number.isInteger(vagas) || vagas < 1 || vagas > 10000))) {
      mensagem("Confira nome, descrição, datas, horários, preço e vagas.", true);
      return;
    }
    var registro = {
      title: nome,
      description: descricao,
      format: turma ? "turma" : "continuo",
      price_cents: preco === null ? null : Math.round(preco * 100),
      start_date: turma ? inicio : null,
      end_date: turma ? fim || null : null,
      days_description: el("cursoCloudDias").value.trim(),
      start_time: horaInicio || null,
      end_time: horaFim || null,
      capacity: vagas,
      location: el("cursoCloudLocal").value.trim(),
      published: el("cursoCloudPublicado").checked
    };
    var id = el("cursoCloudId").value;
    var btn = el("formCloudCurso").querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      var pedido = id
        ? db.from("courses").update(registro).eq("id",id)
        : db.from("courses").insert(registro);
      var resposta = await pedido;
      if (resposta.error) throw resposta.error;
      await buscarCursos();
      limparCurso();
      mensagem(id ? "Curso atualizado na nuvem!" : "Curso cadastrado na nuvem!");
    } catch (erro) {
      mensagem("Erro ao salvar curso: " + erro.message, true);
    } finally {
      btn.disabled = false;
    }
  }

  function lerLocal(chave) {
    try {
      var dados = JSON.parse(localStorage.getItem(chave) || "[]");
      return Array.isArray(dados) ? dados : [];
    } catch (erro) { return []; }
  }

  async function importarDadosLocais() {
    var dadosServicos = lerLocal("bf_servicos_catalogo");
    var dadosCursos = lerLocal("bf_cursos");
    if (!dadosServicos.length && !dadosCursos.length) {
      mensagem("Não encontrei cursos ou serviços locais salvos neste navegador.", true);
      return;
    }
    if ((dadosServicos.length && servicos.length) || (dadosCursos.length && cursos.length)) {
      mensagem("A importação foi bloqueada para evitar duplicação: já existem dados na nuvem. " +
        "Cadastre manualmente os itens que faltam.", true);
      return;
    }
    if (!confirm("Importar " + dadosServicos.length + " serviço(s) e " +
      dadosCursos.length + " curso(s) deste navegador para a nuvem? " +
      "Os originais locais serão preservados.")) return;
    try {
      if (dadosServicos.length) {
        var novosServicos = dadosServicos.map(function (s,i) {
          return {
            name: String(s.name || "").slice(0,100),
            description: String(s.desc || "").slice(0,1000),
            price_cents: Math.round(Math.max(0,Number(s.priceNum)||0)*100),
            duration_minutes: Math.min(1440,Math.max(0,Number(s.duration)||0)),
            emoji: String(s.emoji || "💅").slice(0,8),
            active: !!s.ativo,
            sort_order: i
          };
        }).filter(function (s) { return s.name.trim().length > 0; });
        if (novosServicos.length) {
          var resServicos = await db.from("services").insert(novosServicos);
          if (resServicos.error) throw resServicos.error;
        }
      }
      if (dadosCursos.length) {
        var novosCursos = dadosCursos.map(function (c) {
          return {
            title: String(c.nome || "").slice(0,100),
            description: String(c.descricao || "").slice(0,2000),
            format: c.formato === "continuo" ? "continuo" : "turma",
            price_cents: c.preco == null ? null : Math.round(Math.max(0,Number(c.preco)||0)*100),
            start_date: c.formato === "continuo" ? null : (c.inicio || null),
            end_date: c.formato === "continuo" ? null : (c.fim || null),
            days_description: String(c.dias || "").slice(0,120),
            start_time: c.horaInicio || null,
            end_time: c.horaFim || null,
            capacity: c.vagas == null ? null : Math.max(1,Number(c.vagas)||1),
            location: String(c.local || "").slice(0,150),
            published: !!c.publicado
          };
        }).filter(function (c) { return c.title.trim().length > 0; });
        if (novosCursos.length) {
          var resCursos = await db.from("courses").insert(novosCursos);
          if (resCursos.error) throw resCursos.error;
        }
      }
      await Promise.all([buscarServicos(), buscarCursos()]);
      mensagem("Dados locais importados para a nuvem! Os dados originais não foram apagados.");
    } catch (erro) {
      mensagem("Importação interrompida: " + erro.message +
        ". Confira as listas antes de tentar outra importação.", true);
    }
  }

  function configurarBotoes() {
    configurarAbas();
    el("formCloudServico").addEventListener("submit", salvarServico);
    el("formCloudCurso").addEventListener("submit", salvarCurso);
    el("limparCloudServico").addEventListener("click", limparServico);
    el("limparCloudCurso").addEventListener("click", limparCurso);
    el("cursoCloudFormato").addEventListener("change", atualizarCampoDatas);
    atualizarCampoDatas();

    el("sairCloud").addEventListener("click", async function () {
      await db.auth.signOut();
      window.location.replace("login-nuvem.html");
    });

    var importar = botao("Importar dados locais", importarDadosLocais);
    importar.title = "Importa cursos e serviços salvos no navegador, sem apagar os originais.";
    el("sairCloud").parentNode.insertBefore(importar,el("sairCloud"));
  }

  async function iniciar() {
    var aguardando = el("aguardandoCloud");
    if (!db) {
      aguardando.textContent = window.studioCloudError ||
        "Erro ao configurar Supabase. Confira supabase-config.js.";
      return;
    }
    try {
      var usuario = await db.auth.getUser();
      if (usuario.error || !usuario.data || !usuario.data.user) {
        window.location.replace("login-nuvem.html");
        return;
      }
      var permitido = await db.rpc("can_manage_studio");
      if (permitido.error) throw permitido.error;
      if (permitido.data !== true) {
        await db.auth.signOut();
        window.location.replace("login-nuvem.html");
        return;
      }
      configurarBotoes();
      await Promise.all([buscarServicos(), buscarCursos()]);
      el("telaCloud").hidden = false;
      aguardando.hidden = true;
    } catch (erro) {
      aguardando.textContent = "Não foi possível abrir o painel: " + erro.message +
        ". Recarregue a página ou entre novamente pelo login seguro.";
    }
  }

  iniciar();
})();
