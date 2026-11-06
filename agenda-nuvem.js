/* Complemento ao painel Supabase: Dashboard, Agenda e Clientes Sumidas.
   Dados pessoais protegidos pela tabela appointments + RLS (admin somente).
   O site público ainda NÃO cria agendamentos na nuvem nesta etapa. */
(function () {
  "use strict";

  var db = window.studioDb;
  var agendamentos = [];
  var servicos = [];

  function el(id) { return document.getElementById(id); }
  function no(tag, conteudo, classe) {
    var n = document.createElement(tag);
    n.textContent = conteudo == null ? "" : String(conteudo);
    if (classe) n.className = classe;
    return n;
  }
  function dataHoje() {
    return new Date().toLocaleDateString("sv-SE", {timeZone: "America/Sao_Paulo"});
  }
  function dataBR(iso) {
    if (!iso) return "";
    var partes = iso.split("-");
    return partes[2] + "/" + partes[1] + "/" + partes[0];
  }
  function dinheiro(centavos) {
    return (Number(centavos || 0) / 100)
      .toLocaleString("pt-BR", {style: "currency", currency: "BRL"});
  }
  function telefoneLimpo(valor) {
    return String(valor || "").replace(/\D/g, "");
  }
  function aviso(mensagem, erro) {
    var box = el("agendaCloudAviso");
    box.hidden = !mensagem;
    box.textContent = mensagem || "";
    box.className = "ls-cloud-mensagem" + (erro ? " erro" : "");
    if (mensagem) box.scrollIntoView({block: "nearest"});
  }
  function botao(rotulo, funcao) {
    var b = no("button", rotulo);
    b.type = "button";
    b.addEventListener("click", funcao);
    return b;
  }
  function soExtras(visivel) {
    ["secaoDashboardCloud", "secaoAgendaCloud", "secaoSumidasCloud"].forEach(function (id) {
      el(id).hidden = true;
    });
    ["botaoDashboardCloud", "botaoAgendaCloud", "botaoSumidasCloud"].forEach(function (id) {
      el(id).classList.remove("selecionado");
    });
    if (!visivel) aviso("");
  }
  function mudarAba(nome) {
    soExtras(true);
    el("secaoServicos").hidden = true;
    el("secaoCursos").hidden = true;
    el("abaServicoBotao").classList.remove("selecionado");
    el("abaCursoBotao").classList.remove("selecionado");
    el("secao" + nome + "Cloud").hidden = false;
    el("botao" + nome + "Cloud").classList.add("selecionado");
    aviso("");
    if (nome === "Dashboard") renderDashboard();
    if (nome === "Agenda") renderAgenda();
    if (nome === "Sumidas") renderSumidas();
  }
  function criarInterface() {
    var nav = document.querySelector(".ls-cloud-tabs");
    var mensagem = el("cloudMensagem");
    if (!nav || !mensagem) return false;

    var btnDashboard = botao("📊 Dashboard", function(){ mudarAba("Dashboard"); });
    btnDashboard.id = "botaoDashboardCloud";
    nav.insertBefore(btnDashboard, nav.firstChild);
    var btnAgenda = botao("📅 Agenda", function(){ mudarAba("Agenda"); });
    btnAgenda.id = "botaoAgendaCloud";
    nav.insertBefore(btnAgenda, el("abaServicoBotao"));
    var btnSumidas = botao("💌 Clientes Sumidas", function(){ mudarAba("Sumidas"); });
    btnSumidas.id = "botaoSumidasCloud";
    nav.appendChild(btnSumidas);

    ["abaServicoBotao","abaCursoBotao"].forEach(function (id) {
      el(id).addEventListener("click", function(){ soExtras(false); });
    });

    var a = document.createElement("div");
    a.id = "agendaCloudAviso";
    a.className = "ls-cloud-mensagem";
    a.hidden = true;
    mensagem.insertAdjacentElement("afterend",a);

    var dashboard = document.createElement("section");
    dashboard.className = "ls-cloud-secao";
    dashboard.id = "secaoDashboardCloud";
    dashboard.hidden = true;
    dashboard.innerHTML = `
      <div class="ls-cloud-card">
        <h2>Visão geral do Studio</h2>
        <div class="ls-agenda-stats" id="estatisticasAgendaCloud"></div>
        <p class="ls-agenda-nota">Os números são calculados dos agendamentos cadastrados
          na nuvem. A agenda antiga, salva somente no navegador, não entra aqui
          até ser importada.</p>
      </div>
      <div class="ls-cloud-card">
        <h2>Atendimentos de hoje</h2>
        <div id="agendaHojeCloud"></div>
      </div>`;
    mensagem.parentNode.insertBefore(dashboard, mensagem.nextSibling.nextSibling);

    var agenda = document.createElement("section");
    agenda.className = "ls-cloud-secao";
    agenda.id = "secaoAgendaCloud";
    agenda.hidden = true;
    agenda.innerHTML = `
      <div class="ls-cloud-card">
        <h2>Novo agendamento</h2>
        <p class="ls-agenda-nota">Cadastre um horário manualmente aqui.
          O formulário público do site ainda será conectado à nuvem em outra etapa.</p>
        <form id="formAgendaCloud">
          <input id="agCloudId" type="hidden">
          <div class="ls-cloud-grid">
            <label>Nome da cliente *
              <input id="agCloudNome" maxlength="120" required>
            </label>
            <label>WhatsApp (DDD + número) *
              <input id="agCloudTelefone" type="tel" maxlength="20"
                placeholder="21999999999" required>
            </label>
            <label>Serviço *
              <select id="agCloudServico" required>
                <option value="">Escolha um serviço…</option>
              </select>
            </label>
            <label>Valor (R$)
              <input id="agCloudPreco" type="number" min="0" max="100000" step="0.01">
            </label>
            <label>Data *
              <input id="agCloudData" type="date" required>
            </label>
            <label>Horário *
              <input id="agCloudHora" type="time" required>
            </label>
            <label>Status
              <select id="agCloudStatus">
                <option>Agendado</option><option>Concluido</option><option>Cancelado</option>
              </select>
            </label>
          </div>
          <div class="ls-cloud-actions">
            <button class="ls-cloud-primary" type="submit">Salvar agendamento</button>
            <button class="ls-cloud-secondary" id="limparAgendaCloud" type="button">Novo / Limpar</button>
          </div>
        </form>
      </div>
      <div class="ls-cloud-card">
        <h2>Agenda completa</h2>
        <div class="ls-agenda-filtros">
          <label>Filtrar por data <input id="filtroAgendaData" type="date"></label>
          <label>Status
            <select id="filtroAgendaStatus">
              <option value="">Todos</option>
              <option>Agendado</option><option>Concluido</option><option>Cancelado</option>
            </select>
          </label>
          <label>Buscar cliente <input id="filtroAgendaBusca" placeholder="Nome ou telefone"></label>
          <button type="button" id="limparFiltrosAgendaCloud" class="ls-cloud-secondary">Limpar filtros</button>
        </div>
        <div id="listaAgendaCloud"></div>
      </div>`;
    dashboard.insertAdjacentElement("afterend", agenda);

    var sumidas = document.createElement("section");
    sumidas.className = "ls-cloud-secao";
    sumidas.id = "secaoSumidasCloud";
    sumidas.hidden = true;
    sumidas.innerHTML = `
      <div class="ls-cloud-card">
        <h2>Clientes sem atendimento recente</h2>
        <p class="ls-agenda-nota">Contamos a partir do último atendimento
          <strong>concluído</strong> registrado na nuvem, não do dia em que foi criado.</p>
        <label>Sem atendimento há pelo menos
          <input id="diasSumidasCloud" type="number" min="1" max="3650" value="21"
            style="width:95px"> dias
        </label>
        <div id="listaSumidasCloud"></div>
      </div>`;
    agenda.insertAdjacentElement("afterend",sumidas);

    var css = document.createElement("style");
    css.textContent =
      ".ls-agenda-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px}" +
      ".ls-agenda-stat{background:#fff6fa;border:1px solid #efd7e2;border-radius:12px;padding:17px}" +
      ".ls-agenda-stat strong{display:block;font-size:25px;color:#8e305b;margin-bottom:4px}" +
      ".ls-agenda-stat span{font-size:12px;color:#7b6170}" +
      ".ls-agenda-nota{font-size:13px;color:#765e6b;margin-bottom:16px;line-height:1.6}" +
      ".ls-agenda-filtros{display:flex;flex-wrap:wrap;align-items:end;gap:12px;margin:16px 0 22px}" +
      ".ls-agenda-filtros label{display:flex;flex-direction:column;gap:5px;font-size:13px}" +
      ".ls-agenda-filtros input,.ls-agenda-filtros select{padding:10px;border:1px solid #e4d3d9;border-radius:8px}" +
      ".ls-agenda-item{border-top:1px solid #f1dfe6;padding:15px 0;display:flex;gap:15px;align-items:center;justify-content:space-between}" +
      ".ls-agenda-item small{display:block;color:#785d6e;font-size:13px;margin-top:4px}" +
      ".ls-agenda-item-actions{display:flex;gap:8px;flex-wrap:wrap}" +
      ".ls-agenda-item-actions button,.ls-agenda-item-actions a{padding:7px 10px;border-radius:8px;border:1px solid #e5cada;background:white;color:#873d60;font-size:13px;cursor:pointer;text-decoration:none}" +
      "@media(max-width:600px){.ls-agenda-item{flex-direction:column;align-items:flex-start}.ls-agenda-item-actions{width:100%}}";
    document.head.appendChild(css);
    return true;
  }

  async function buscarDados() {
    var consultas = await Promise.all([
      db.from("appointments").select("*").order("appointment_date",{ascending:false}).limit(1000),
      db.from("services").select("name,price_cents,active").order("name")
    ]);
    if (consultas[0].error) throw consultas[0].error;
    if (consultas[1].error) throw consultas[1].error;
    agendamentos = consultas[0].data || [];
    servicos = consultas[1].data || [];
    preencherServicos();
    renderDashboard();
    renderAgenda();
    renderSumidas();
    if (agendamentos.length >= 1000) {
      aviso("A agenda contém mais de 1000 registros. " +
        "Os indicadores exibidos são parciais; precisamos adicionar paginação.", true);
    }
  }

  function preencherServicos() {
    var select = el("agCloudServico");
    var escolhido = select.value;
    select.replaceChildren();
    var opcaoVazia = no("option","Escolha um serviço…");
    opcaoVazia.value = "";
    select.appendChild(opcaoVazia);
    servicos.forEach(function(s){
      var o = no("option",s.name+(s.active?"":" (inativo)"));
      o.value = s.name;
      select.appendChild(o);
    });
    select.value = escolhido;
    if (!select.value && escolhido) {
      var outro = no("option",escolhido);
      outro.value = escolhido;
      select.appendChild(outro);
      select.value = escolhido;
    }
  }

  function criarCard(a) {
    var card = document.createElement("div");
    card.className = "ls-agenda-item";
    var info = document.createElement("div");
    info.appendChild(no("strong",dataBR(a.appointment_date)+" às "+
      String(a.appointment_time).slice(0,5)+" — "+a.customer_name));
    info.appendChild(no("small",a.service_name+" · "+dinheiro(a.price_cents)+
      " · "+a.status));
    info.appendChild(no("small","WhatsApp: "+a.phone));
    var actions = document.createElement("div");
    actions.className = "ls-agenda-item-actions";

    var link = no("a","WhatsApp");
    var telefone = telefoneLimpo(a.phone);
    link.href = "https://wa.me/55"+telefone+"?text="+
      encodeURIComponent("Olá, "+a.customer_name+"! Tudo bem? 💅");
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    actions.appendChild(link);

    actions.appendChild(botao("Editar",function(){editar(a);}));
    if(a.status==="Agendado"){
      actions.appendChild(botao("Concluir",function(){mudarStatus(a,"Concluido");}));
      actions.appendChild(botao("Cancelar",function(){
        if(confirm("Cancelar atendimento de "+a.customer_name+"?"))
          mudarStatus(a,"Cancelado");
      }));
    }
    actions.appendChild(botao("Excluir",async function(){
      if(!confirm("Excluir PERMANENTEMENTE o agendamento de "+a.customer_name+"?"))return;
      try{
        var r=await db.from("appointments").delete().eq("id",a.id);
        if(r.error)throw r.error;
        await buscarDados();aviso("Agendamento excluído.",false);
      }catch(e){aviso("Erro ao excluir: "+e.message,true);}
    }));
    card.appendChild(info);
    card.appendChild(actions);
    return card;
  }

  function renderAgenda() {
    var lista=el("listaAgendaCloud");
    lista.replaceChildren();
    var filtroData=el("filtroAgendaData").value;
    var filtroStatus=el("filtroAgendaStatus").value;
    var busca=el("filtroAgendaBusca").value.trim().toLowerCase();
    var filtrados=agendamentos.filter(function(a){
      return (!filtroData||a.appointment_date===filtroData)&&
        (!filtroStatus||a.status===filtroStatus)&&
        (!busca||(a.customer_name||"").toLowerCase().includes(busca)||a.phone.includes(busca));
    }).sort(function(a,b) {
      return (a.appointment_date+a.appointment_time)
        .localeCompare(b.appointment_date+b.appointment_time);
    });
    if(!filtrados.length)lista.appendChild(no("p","Nenhum agendamento encontrado."));
    filtrados.forEach(function(a){lista.appendChild(criarCard(a));});
  }

  function renderDashboard() {
    var hoje = dataHoje(), fat = 0, feitos = 0, deHoje = 0;
    agendamentos.forEach(function(a){
      if(a.appointment_date===hoje&&a.status!=="Cancelado")deHoje++;
      if(a.status==="Concluido"){feitos++;fat+=a.price_cents||0;}
    });
    var stats=el("estatisticasAgendaCloud");
    stats.replaceChildren();
    [
      ["Total",agendamentos.length],
      ["Hoje",deHoje],
      ["Concluídos",feitos],
      ["Faturamento (concluídos)",dinheiro(fat)]
    ].forEach(function(par){
      var card=document.createElement("div");
      card.className="ls-agenda-stat";
      card.appendChild(no("strong",par[1]));
      card.appendChild(no("span",par[0]));
      stats.appendChild(card);
    });
    var hojeLista=el("agendaHojeCloud");
    hojeLista.replaceChildren();
    var itens=agendamentos.filter(function(a){
      return a.appointment_date===hoje&&a.status!=="Cancelado";
    }).sort(function(a,b){return a.appointment_time.localeCompare(b.appointment_time);});
    if(!itens.length)hojeLista.appendChild(no("p","Nenhum atendimento para hoje."));
    itens.forEach(function(a){hojeLista.appendChild(criarCard(a));});
  }

  function clientesInativas() {
    var agora = new Date(dataHoje()+"T12:00:00");
    var dias = Number(el("diasSumidasCloud").value || 21);
    var ultim={};
    agendamentos.forEach(function(a){
      if(a.status!=="Concluido")return;
      var tel=telefoneLimpo(a.phone),antigo=ultim[tel];
      if(!antigo||antigo.appointment_date<a.appointment_date)ultim[tel]=a;
    });
    return Object.keys(ultim).map(function(k){return ultim[k];}).filter(function(a){
      return (agora-new Date(a.appointment_date+"T12:00:00"))/86400000>=dias;
    }).sort(function(a,b){return a.appointment_date.localeCompare(b.appointment_date);});
  }

  function renderSumidas() {
    var lista=el("listaSumidasCloud");
    lista.replaceChildren();
    var inativas=clientesInativas();
    if(!inativas.length)lista.appendChild(no("p","Nenhuma cliente neste critério."));
    inativas.forEach(function(a){
      var card=document.createElement("div");card.className="ls-agenda-item";
      var dados=document.createElement("div");
      dados.appendChild(no("strong",a.customer_name));
      dados.appendChild(no("small","Último atendimento: "+dataBR(a.appointment_date)));
      var link=no("a","Enviar WhatsApp");
      link.href="https://wa.me/55"+telefoneLimpo(a.phone)+"?text="+
        encodeURIComponent("Olá, "+a.customer_name+"! Sentimos sua falta 💅");
      link.target="_blank";link.rel="noopener noreferrer";
      card.appendChild(dados);card.appendChild(link);lista.appendChild(card);
    });
  }

  function editar(a) {
    mudarAba("Agenda");
    el("agCloudId").value=a.id;
    el("agCloudNome").value=a.customer_name;
    el("agCloudTelefone").value=a.phone;
    el("agCloudServico").value=a.service_name;
    if(!el("agCloudServico").value){
      var op=no("option",a.service_name);op.value=a.service_name;
      el("agCloudServico").appendChild(op);el("agCloudServico").value=a.service_name;
    }
    el("agCloudPreco").value=(a.price_cents/100).toFixed(2);
    el("agCloudData").value=a.appointment_date;
    el("agCloudHora").value=a.appointment_time.slice(0,5);
    el("agCloudStatus").value=a.status;
    el("formAgendaCloud").scrollIntoView({behavior:"smooth",block:"start"});
  }

  function limpar() {
    el("formAgendaCloud").reset();
    el("agCloudId").value="";
    el("agCloudData").value=dataHoje();
  }

  async function salvar(evento) {
    evento.preventDefault();
    var nome=el("agCloudNome").value.trim();
    var telefone=telefoneLimpo(el("agCloudTelefone").value);
    var servico=el("agCloudServico").value.trim();
    var preco=Number(el("agCloudPreco").value||0);
    var data=el("agCloudData").value;
    var hora=el("agCloudHora").value;
    if(nome.length<2||nome.length>120||telefone.length<10||telefone.length>15||
      !servico||!data||!hora||!Number.isFinite(preco)||preco<0||preco>100000){
      aviso("Confira nome, telefone, serviço, data, horário e valor.",true);return;
    }
    var registro={
      customer_name:nome,phone:telefone,service_name:servico,
      appointment_date:data,appointment_time:hora,
      price_cents:Math.round(preco*100),
      status:el("agCloudStatus").value,
      updated_at:new Date().toISOString()
    };
    var id=el("agCloudId").value;
    var btn=el("formAgendaCloud").querySelector('button[type="submit"]');
    btn.disabled=true;
    try{
      var result=id
        ? await db.from("appointments").update(registro).eq("id",id)
        : await db.from("appointments").insert(registro);
      if(result.error)throw result.error;
      limpar();await buscarDados();
      aviso(id?"Atendimento atualizado na nuvem.":"Atendimento cadastrado na nuvem.",false);
    }catch(e){
      aviso(e.code==="23505"?"Já existe atendimento agendado nesta data e horário.":
        "Erro ao salvar: "+e.message,true);
    }finally{btn.disabled=false;}
  }

  async function mudarStatus(a,novo){
    try{
      var res=await db.from("appointments")
        .update({status:novo,updated_at:new Date().toISOString()}).eq("id",a.id);
      if(res.error)throw res.error;
      await buscarDados();aviso("Atendimento atualizado para "+novo+".",false);
    }catch(e){aviso("Erro: "+e.message,true);}
  }

  function locaisAntigos() {
    try{
      var arr=JSON.parse(localStorage.getItem("bf_agendamentos")||"[]");
      return Array.isArray(arr)?arr:[];
    }catch(e){return[];}
  }

  async function importarAgendaAntiga(){
    var dados=locaisAntigos();
    if(!dados.length){aviso("Não encontrei agendamentos antigos neste navegador.",true);return;}
    if(agendamentos.length){
      aviso("A agenda na nuvem já tem registros. Por segurança, a importação " +
        "automática fica bloqueada para evitar duplicações.",true);return;
    }
    if(!confirm("Importar "+dados.length+" agendamento(s) locais para a nuvem? "+
      "Os originais serão preservados."))return;

    var registros=dados.map(function(a){
      var tel=telefoneLimpo(a.telefone);
      var stat=["Agendado","Concluido","Cancelado"].includes(a.status)?a.status:"Agendado";
      return{
        customer_name:String(a.nome||"").trim().slice(0,120),
        phone:tel,
        service_name:String(a.servico||"").trim().slice(0,120),
        appointment_date:String(a.data||""),
        appointment_time:String(a.horario||""),
        status:stat,
        price_cents:Math.round(Math.max(0,Number(a.preco)||0)*100),
        legacy_id:String(a.id)
      };
    }).filter(function(a){
      return a.customer_name.length>=2&&a.phone.length>=10&&a.phone.length<=15&&
        a.service_name.length>=1&&/^\d{4}-\d{2}-\d{2}$/.test(a.appointment_date)&&
        /^\d{2}:\d{2}$/.test(a.appointment_time);
    });
    if(!registros.length){aviso("Não há registros antigos válidos para importar.",true);return;}
    try{
      var r=await db.from("appointments").insert(registros);
      if(r.error)throw r.error;
      await buscarDados();
      aviso("Importados "+registros.length+" atendimentos, sem apagar os originais.",false);
    }catch(e){
      aviso(e.code==="23505"?
        "Encontramos horários duplicados. Nenhum dado foi apagado; revise a agenda antiga.":
        "Falha na importação: "+e.message,true);
    }
  }

  function configurar(){
    criarInterface();
    el("formAgendaCloud").addEventListener("submit",salvar);
    el("limparAgendaCloud").addEventListener("click",limpar);
    el("filtroAgendaData").addEventListener("change",renderAgenda);
    el("filtroAgendaStatus").addEventListener("change",renderAgenda);
    el("filtroAgendaBusca").addEventListener("input",renderAgenda);
    el("diasSumidasCloud").addEventListener("input",renderSumidas);
    document.addEventListener("studio-appointment-changed",function(){
      buscarDados().catch(function(e){aviso("Erro ao atualizar agenda: "+e.message,true);});
    });
    el("limparFiltrosAgendaCloud").addEventListener("click",function(){
      el("filtroAgendaData").value="";
      el("filtroAgendaStatus").value="";
      el("filtroAgendaBusca").value="";
      renderAgenda();
    });
    el("agCloudServico").addEventListener("change",function(){
      var s=servicos.find(function(x){return x.name===el("agCloudServico").value;});
      if(s)el("agCloudPreco").value=(s.price_cents/100).toFixed(2);
    });
    var btnImportar=botao("Importar agenda antiga",importarAgendaAntiga);
    btnImportar.className="ls-cloud-secondary";
    el("limparAgendaCloud").parentNode.appendChild(btnImportar);
    limpar();
  }

  async function iniciar(){
    if(!db||!el("telaCloud"))return;
    try{
      var user=await db.auth.getUser();
      if(user.error||!user.data||!user.data.user)return;
      var valid=await db.rpc("can_manage_studio");
      if(valid.error||valid.data!==true)return;
      if(!criarInterface)return;
      configurar();
      await buscarDados();
    }catch(e){
      // If SQL has not been run, leave the original two tabs usable.
      if(el("agendaCloudAviso"))aviso("Agenda não disponível: "+e.message+
        ". Confira se executou supabase/agenda.sql no SQL Editor.",true);
      console.error("Agenda Supabase:",e);
    }
  }
  iniciar();
})();
