// ===== CONFIG =====
const API_BASE = 'https://vps67288.publiccloud.com.br/diario-bordo/api/';

// ===== AUTENTICAÇÃO (mock) =====
const usuario = sessionStorage.getItem('db_usuario');
if(!usuario){
  window.location.href = 'index.html';
}
const usuarioLabel = sessionStorage.getItem('db_usuario_label') || usuario;
const usuarioEmpresa = sessionStorage.getItem('db_usuario_empresa') || '';
const usuarioFuncao = sessionStorage.getItem('db_usuario_funcao') || 'Bombeiro em turno';

document.getElementById('userName').textContent = usuarioLabel || '—';
document.querySelector('.user-chip .who span').textContent = usuarioFuncao;
const initials = (usuarioLabel || '--').split(' ').map(p=>p[0]).slice(0,2).join('').toUpperCase();
document.getElementById('avatarInitials').textContent = initials;
document.getElementById('avatarInitialsMobile').textContent = initials;

document.getElementById('logoutBtn').addEventListener('click', ()=>{
  sessionStorage.clear();
  window.location.href = 'index.html';
});

// ===== TEMA CLARO/ESCURO =====
function applyTheme(theme){
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('db_theme', theme);
}
function toggleTheme(){
  const atual = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  applyTheme(atual === 'dark' ? 'light' : 'dark');
}
document.getElementById('themeToggle').addEventListener('click', toggleTheme);
document.getElementById('themeToggleMobile').addEventListener('click', toggleTheme);

// ===== TOAST =====
function showToast(msg, isError){
  const toast = document.getElementById('toast');
  document.getElementById('toastMsg').textContent = msg;
  toast.querySelector('.tdot').style.background = isError ? '#C0402D' : '#5C7A56';
  toast.classList.add('show');
  setTimeout(()=> toast.classList.remove('show'), 2600);
}

// ===== DATA/HORA =====
const hoje = new Date();
document.getElementById('topDate').textContent = hoje.toLocaleDateString('pt-BR', {
  weekday:'long', day:'2-digit', month:'long'
});
function formatDateBR(iso){
  const [y,m,d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
function formatarHoraCurta(iso){
  if(!iso) return '';
  return new Date(iso).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
}

// ===== MÓDULOS: metadados =====
const MODULOS = [
  { key:'dds', label:'DDS', hint:'Diálogo Diário de Segurança' },
  { key:'ronda', label:'Ronda', hint:'Verificação das bombas' },
  { key:'vtr', label:'VTR', hint:'Viatura em uso' },
  { key:'emergencia', label:'Emergência', hint:'Ocorrências e APH' },
  { key:'avaliacao', label:'Avaliação', hint:'Espaço confinado / trab. a quente' },
  { key:'glp', label:'Batedor de GLP', hint:'Entrada / saída' },
  { key:'fonte_radioativa', label:'Fonte Radioativa', hint:'Bloqueio / desbloqueio' },
  { key:'inspecao_mensal', label:'Inspeção Mensal', hint:'Cronograma mensal' },
  { key:'trabalho_quente', label:'Trab. a Quente', hint:'Acompanhamento' },
  { key:'treinamento', label:'Treinamento', hint:'Registro de treinamento' },
  { key:'caminhoes_combate', label:'Caminhões', hint:'ABT / AAR' }
];

const TEMPLATE_ID = {
  fonte_radioativa: 'tpl-fonteRadioativa',
  inspecao_mensal: 'tpl-inspecaoMensal',
  trabalho_quente: 'tpl-trabalhoQuente',
  caminhoes_combate: 'tpl-caminhoesCombate'
};
function templateIdPara(key){
  return TEMPLATE_ID[key] || ('tpl-' + key);
}

// ===== ESTADO DO DIÁRIO ATUAL =====
let diarioAtual = null;   // { id, data, nome, equipe, finalizado_em }
let ocorrenciasAtuais = []; // lista vinda do backend

// ===== EQUIPE (select do turno) =====
const turnoEquipe = document.getElementById('turnoEquipe');
MODULOS; // no-op, mantém ordem de leitura
if(typeof EQUIPES !== 'undefined'){
  EQUIPES.forEach(eq=>{
    const opt = document.createElement('option');
    opt.value = eq;
    opt.textContent = eq;
    turnoEquipe.appendChild(opt);
  });
}
function preSelecionarEquipe(){
  if(typeof EQUIPES !== 'undefined' && EQUIPES.includes(usuarioEmpresa)){
    turnoEquipe.value = usuarioEmpresa;
    abrirOuCarregarDiario();
  }
}

// ===== FETCH HELPERS =====
async function apiGet(path){
  const res = await fetch(API_BASE + path);
  if(!res.ok) throw new Error('Erro na API: ' + res.status);
  return res.json();
}
async function apiPost(path, body){
  const res = await fetch(API_BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if(!res.ok){
    const erro = await res.json().catch(()=>({}));
    throw new Error(erro.erro || ('Erro na API: ' + res.status));
  }
  return res.json();
}

// ===== ABRIR / CARREGAR DIÁRIO DO DIA =====
async function abrirOuCarregarDiario(){
  const equipe = turnoEquipe.value;
  if(!equipe){
    document.getElementById('turnoData').textContent = '—';
    return;
  }
  try{
    const resp = await apiGet('diario-atual/?nome=' + encodeURIComponent(usuarioLabel) + '&equipe=' + encodeURIComponent(equipe));
    diarioAtual = resp.diario;
    const pendente = resp.pendente;
    document.getElementById('turnoData').textContent = formatDateBR(diarioAtual.data);
    document.getElementById('turnoNome').textContent = diarioAtual.nome;
    atualizarBadgeStatusDiario(diarioAtual);
    atualizarAvisoPendente(pendente, diarioAtual.data);
    await carregarOcorrencias();
    await atualizarContadorRondasTurno();
  }catch(err){
    showToast('Erro ao abrir diário: ' + err.message, true);
  }
}
turnoEquipe.addEventListener('change', abrirOuCarregarDiario);

function atualizarBadgeStatusDiario(diario){
  const concluido = !!diario.finalizado_em;
  document.getElementById('btnFinalizarDiario').disabled = concluido;
  document.getElementById('btnFinalizarDiario').style.opacity = concluido ? '.5' : '1';
}

function atualizarAvisoPendente(pendente, data){
  const card = document.getElementById('avisoPendenteCard');
  card.style.display = pendente ? 'flex' : 'none';
  if(pendente){
    document.getElementById('avisoPendenteData').textContent = formatDateBR(data);
  }
  document.querySelectorAll('.modulo-btn').forEach(btn=>{
    btn.disabled = !!pendente;
    btn.style.opacity = pendente ? '.5' : '1';
    btn.style.cursor = pendente ? 'not-allowed' : 'pointer';
  });
}

// ===== CONTADOR COLETIVO DE RONDAS =====
async function atualizarContadorRondasTurno(){
  if(!diarioAtual) return;
  try{
    const resp = await apiGet('rondas-contador/?data=' + diarioAtual.data);
    const texto = 'Rondas do turno: ' + resp.rondas_realizadas + '/' + resp.meta + ' concluídas';
    document.getElementById('statusStripText').textContent = texto;
    const strip = document.getElementById('statusStrip');
    strip.classList.remove('warn','danger');
    if(resp.rondas_realizadas === 0) strip.classList.add('danger');
    else if(resp.rondas_realizadas < resp.meta) strip.classList.add('warn');
  }catch(err){
    // silencioso — não crítico pra experiência
  }
}

// ===== CARRINHO (lista de ocorrências do diário atual) =====
async function carregarOcorrencias(){
  if(!diarioAtual) return;
  try{
    const resp = await apiGet('ocorrencias/?diario_id=' + diarioAtual.id);
    ocorrenciasAtuais = resp.ocorrencias;
    renderCarrinho();
    renderContagemModulos();
  }catch(err){
    showToast('Erro ao carregar registros: ' + err.message, true);
  }
}

function renderContagemModulos(){
  const wrap = document.getElementById('contagemModulosWrap');
  wrap.innerHTML = MODULOS.map(m=>{
    const count = ocorrenciasAtuais.filter(oc => oc.modulo === m.key).length;
    return `
      <div class="activity-row">
        <span>${m.label}</span>
        <span class="ar-count">${count}</span>
      </div>`;
  }).join('');
}

function renderCarrinho(){
  // Card "Registros deste diário" removido — contagem por módulo continua em renderContagemModulos()
}

// ===== BOTÕES DE MÓDULO =====
function renderBotoesModulo(){
  const wrap = document.getElementById('modulosBotoesWrap');
  wrap.innerHTML = MODULOS.map(m=>`
    <button type="button" class="modulo-btn" data-modulo="${m.key}">
      <span class="mb-label">${m.label}</span>
      <span class="mb-hint">${m.hint}</span>
    </button>
  `).join('');
  wrap.querySelectorAll('.modulo-btn').forEach(btn=>{
    btn.addEventListener('click', ()=> abrirModalModulo(btn.dataset.modulo));
  });
}
renderBotoesModulo();

// ===== MODAL GENÉRICO =====
const modal = document.getElementById('moduloModal');
const modalTitulo = document.getElementById('moduloModalTitulo');
const modalSub = document.getElementById('moduloModalSub');
const modalCorpo = document.getElementById('moduloModalCorpo');
const modalConfirmar = document.getElementById('moduloModalConfirmar');
const modalCancelar = document.getElementById('moduloModalCancelar');

let moduloAtualKey = null;
let coletarDadosAtual = null; // função que devolve o objeto "dados" pra enviar

// fechar modal clicando fora
modal.addEventListener('click', (e)=>{
  if(e.target === modal){
    fecharModal();
  }
});

function fecharModal(){
  modal.classList.remove('show');
  modalCorpo.innerHTML = '';
  moduloAtualKey = null;
  coletarDadosAtual = null;
  document.body.style.overflow = '';
}
modalCancelar.addEventListener('click', fecharModal);

function abrirModalModulo(key){
  if(!diarioAtual){
    showToast('Selecione a equipe antes de adicionar registros.', true);
    return;
  }
  if(diarioAtual.finalizado_em){
    showToast('Este diário já foi finalizado.', true);
    return;
  }
  if(diarioAtual.data !== hoje.toISOString().slice(0,10)){
    showToast('Finalize o diário pendente antes de adicionar novos registros.', true);
    return;
  }
  const meta = MODULOS.find(m => m.key === key);
  moduloAtualKey = key;
  modalTitulo.textContent = meta.label;
  modalSub.textContent = meta.hint;

  document.body.style.overflow = 'hidden';

  const tpl = document.getElementById(templateIdPara(key));
  modalCorpo.innerHTML = '';
  modalCorpo.appendChild(tpl.content.cloneNode(true));

  coletarDadosAtual = montarModulo(key, modalCorpo);

  modal.classList.add('show');
}

modalConfirmar.addEventListener('click', async ()=>{
  if(!coletarDadosAtual) return;
  const dados = coletarDadosAtual();
  try{
    await apiPost('ocorrencias/', {
      diario_id: diarioAtual.id,
      modulo: moduloAtualKey,
      dados: dados
    });
    fecharModal();
    showToast('Registro adicionado.');
    await carregarOcorrencias();
    if(moduloAtualKey === 'ronda'){
      await atualizarContadorRondasTurno();
    }
  }catch(err){
    showToast('Erro ao salvar: ' + err.message, true);
  }
});

// ===== HELPERS DE MONTAGEM DE CADA MÓDULO =====
// Cada função recebe o container (modalCorpo, já com o template inserido)
// e devolve uma função "coletar()" que lê os campos e monta o objeto "dados".

function wireChipGroup(container, groupName, onChange){
  const group = container.querySelector('.status-toggle[data-group="'+groupName+'"]');
  if(!group) return { get:()=>null };
  const tones = (group.dataset.tones || '').split(',');
  let valor = null;
  group.querySelectorAll('.chip').forEach((chip,i)=>{
    chip.addEventListener('click', ()=>{
      group.querySelectorAll('.chip').forEach(c=>{ c.classList.remove('selected'); c.removeAttribute('data-tone'); });
      chip.classList.add('selected');
      if(tones[i]) chip.setAttribute('data-tone', tones[i]);
      valor = chip.dataset.value;
      if(onChange) onChange(valor);
    });
  });
  return { get:()=>valor };
}

function wireAlterBox(container, boxId, mostrarSe){
  const box = container.querySelector('#' + boxId);
  return {
    toggle:(valorAtual)=>{
      if(box) box.classList.toggle('show', mostrarSe(valorAtual));
    }
  };
}

function popularSelect(selectEl, opcoes){
  if(!selectEl || typeof opcoes === 'undefined') return;
  opcoes.forEach(o=>{
    const opt = document.createElement('option');
    opt.value = o;
    opt.textContent = o;
    selectEl.appendChild(opt);
  });
}

function wireEvidencia(container, inputId, labelId){
  const input = container.querySelector('#' + inputId);
  const label = container.querySelector('#' + labelId);
  let nome = null;
  if(input){
    input.addEventListener('change', (e)=>{
      const file = e.target.files[0];
      nome = file ? file.name : null;
      if(label) label.textContent = nome || 'Tirar foto ou anexar da galeria';
    });
  }
  return { get:()=>nome };
}

function montarModulo(key, c){
  if(key === 'dds'){
    const ev = wireEvidencia(c, 'm-fDdsEvidencia', 'm-fDdsEvidenciaLabel');
    return ()=>({
      tema: c.querySelector('#m-fDdsTema').value,
      evidenciaNome: ev.get()
    });
  }

  if(key === 'ronda'){
    const bombaGrid = c.querySelector('#m-bombaGrid');
    const bombasState = {};
    BOMBAS.forEach(nomeBomba=>{
      const row = document.createElement('div');
      row.className = 'bomba-row';
      row.innerHTML = `
        <span class="br-label">Bomba ${nomeBomba}</span>
        <div class="status-toggle" data-tones="ok,warn,danger">
          <button type="button" class="chip" data-value="Automático">Auto</button>
          <button type="button" class="chip" data-value="Manual">Manual</button>
          <button type="button" class="chip" data-value="Inoperante">Inop.</button>
        </div>
      `;
      bombaGrid.appendChild(row);
      const group = row.querySelector('.status-toggle');
      const tones = ['ok','warn','danger'];
      group.querySelectorAll('.chip').forEach((chip,i)=>{
        chip.addEventListener('click', ()=>{
          group.querySelectorAll('.chip').forEach(cc=>{ cc.classList.remove('selected'); cc.removeAttribute('data-tone'); });
          chip.classList.add('selected');
          chip.setAttribute('data-tone', tones[i]);
          bombasState[nomeBomba] = chip.dataset.value;
        });
      });
    });
    const slider = c.querySelector('#m-fRti');
    const label = c.querySelector('#m-valRti');
    slider.addEventListener('input', ()=>{ label.textContent = slider.value + '%'; });
    const ev = wireEvidencia(c, 'm-fEvidenciaRonda', 'm-fEvidenciaRondaLabel');

    return ()=>({
      rti: Number(slider.value),
      bombas: bombasState,
      evidenciaNome: ev.get(),
      comentario: c.querySelector('#m-fComentarioRonda').value
    });
  }

  if(key === 'vtr'){
    const checklist = wireChipGroup(c, 'vtrChecklist');
    const abastecimento = wireChipGroup(c, 'vtrAbastecimento', (valor)=>{
      const mostrar = valor === 'Sim';
      c.querySelector('#m-vtrLitrosWrap').style.display = mostrar ? 'block' : 'none';
      c.querySelector('#m-vtrLocalWrap').style.display = mostrar ? 'block' : 'none';
    });
    const ev = wireEvidencia(c, 'm-fVtrEvidencia', 'm-fVtrEvidenciaLabel');
    return ()=>({
      tag: c.querySelector('#m-fVtrTag').value,
      placa: c.querySelector('#m-fVtrPlaca').value,
      checklist: checklist.get(),
      abastecimento: abastecimento.get(),
      litros: c.querySelector('#m-fVtrLitros').value,
      local: c.querySelector('#m-fVtrLocal').value,
      evidenciaNome: ev.get()
    });
  }

  if(key === 'emergencia'){
    popularSelect(c.querySelector('#m-fEmerResgateAnimal'), OPCOES_RESGATE_ANIMAL);
    popularSelect(c.querySelector('#m-fEmerEventoAmbiental'), OPCOES_EVENTO_AMBIENTAL);
    popularSelect(c.querySelector('#m-fEmerIncendio'), OPCOES_INCENDIO);
    popularSelect(c.querySelector('#m-fEmerDanosMateriais'), OPCOES_DANOS_MATERIAIS);

    const trauma = wireAlterBox(c, 'm-emerTraumaBox', v => v === 'Trauma');
    const aph = wireChipGroup(c, 'emerAph', v => trauma.toggle(v));
    const resgateStatus = wireChipGroup(c, 'emerResgateStatus');

    const resgateOutro = wireAlterBox(c, 'm-emerResgateOutroBox', v => v === 'Outro');
    c.querySelector('#m-fEmerResgateAnimal').addEventListener('change', e => resgateOutro.toggle(e.target.value));
    const eventoOutro = wireAlterBox(c, 'm-emerEventoOutroBox', v => v === 'Outro');
    c.querySelector('#m-fEmerEventoAmbiental').addEventListener('change', e => eventoOutro.toggle(e.target.value));
    const incendioOutro = wireAlterBox(c, 'm-emerIncendioOutroBox', v => v === 'Outro');
    c.querySelector('#m-fEmerIncendio').addEventListener('change', e => incendioOutro.toggle(e.target.value));

    return ()=>({
      chegada: c.querySelector('#m-fEmerChegada').value,
      saida: c.querySelector('#m-fEmerSaida').value,
      local: c.querySelector('#m-fEmerLocal').value,
      aph: aph.get(),
      traumaMembro: c.querySelector('#m-fEmerTraumaMembro').value,
      resgateAnimal: c.querySelector('#m-fEmerResgateAnimal').value,
      resgateAnimalOutro: c.querySelector('#m-fEmerResgateOutro').value,
      resgateStatus: resgateStatus.get(),
      eventoAmbiental: c.querySelector('#m-fEmerEventoAmbiental').value,
      eventoAmbientalOutro: c.querySelector('#m-fEmerEventoOutro').value,
      incendio: c.querySelector('#m-fEmerIncendio').value,
      incendioOutro: c.querySelector('#m-fEmerIncendioOutro').value,
      danosMateriais: c.querySelector('#m-fEmerDanosMateriais').value,
      comentario: c.querySelector('#m-fEmerComentario').value
    });
  }

  if(key === 'avaliacao'){
    const tiposState = [];
    c.querySelectorAll('#m-avaliacaoTipos .chip').forEach(chip=>{
      chip.addEventListener('click', ()=>{
        chip.classList.toggle('selected');
        const v = chip.dataset.value;
        const idx = tiposState.indexOf(v);
        if(chip.classList.contains('selected') && idx === -1) tiposState.push(v);
        if(!chip.classList.contains('selected') && idx > -1) tiposState.splice(idx,1);
      });
    });
    const alterado = wireAlterBox(c, 'm-avaliacaoAlteradoBox', v => v === 'Alterado');
    const status = wireChipGroup(c, 'avaliacaoStatus', v => alterado.toggle(v));

    return ()=>({
      tipos: tiposState.slice(),
      local: c.querySelector('#m-fAvaliacaoLocal').value,
      status: status.get(),
      desc: c.querySelector('#m-fAvaliacaoDesc').value
    });
  }

  if(key === 'glp'){
    const acao = wireChipGroup(c, 'glpAcao');
    return ()=>({
      acao: acao.get(),
      tag: c.querySelector('#m-fGlpTag').value,
      inicio: c.querySelector('#m-fGlpInicio').value,
      termino: c.querySelector('#m-fGlpTermino').value
    });
  }

  if(key === 'fonte_radioativa'){
    const acao = wireChipGroup(c, 'fonteAcao');
    return ()=>({
      acao: acao.get(),
      tag: c.querySelector('#m-fFonteTag').value,
      horario: c.querySelector('#m-fFonteHorario').value,
      local: c.querySelector('#m-fFonteLocal').value
    });
  }

  if(key === 'inspecao_mensal'){
    popularSelect(c.querySelector('#m-fInspecaoLocal'), OPCOES_INSPECAO_MENSAL);
    return ()=>({
      local: c.querySelector('#m-fInspecaoLocal').value,
      inicio: c.querySelector('#m-fInspecaoInicio').value,
      termino: c.querySelector('#m-fInspecaoTermino').value,
      comentario: c.querySelector('#m-fInspecaoComentario').value
    });
  }

  if(key === 'trabalho_quente'){
    return ()=>({
      tag: c.querySelector('#m-fTaqTag').value,
      local: c.querySelector('#m-fTaqLocal').value,
      inicio: c.querySelector('#m-fTaqInicio').value,
      termino: c.querySelector('#m-fTaqTermino').value
    });
  }

  if(key === 'treinamento'){
    const ev = wireEvidencia(c, 'm-fTreinamentoEvidencia', 'm-fTreinamentoEvidenciaLabel');
    return ()=>({
      tema: c.querySelector('#m-fTreinamentoTema').value,
      evidenciaNome: ev.get()
    });
  }

  if(key === 'caminhoes_combate'){
    const abtDesc = wireAlterBox(c, 'm-abtDescBox', v => v === 'Não Conformidade');
    const abt = wireChipGroup(c, 'abtStatus', v => abtDesc.toggle(v));
    const aarDesc = wireAlterBox(c, 'm-aarDescBox', v => v === 'Não Conformidade');
    const aar = wireChipGroup(c, 'aarStatus', v => aarDesc.toggle(v));

    const aguaSlider = c.querySelector('#m-fCcAgua');
    const aguaLabel = c.querySelector('#m-valCcAgua');
    aguaSlider.addEventListener('input', ()=>{ aguaLabel.textContent = aguaSlider.value + '%'; });
    const combSlider = c.querySelector('#m-fCcComb');
    const combLabel = c.querySelector('#m-valCcComb');
    combSlider.addEventListener('input', ()=>{ combLabel.textContent = combSlider.value + '%'; });

    return ()=>({
      abt: abt.get(),
      abtDesc: c.querySelector('#m-fAbtDesc').value,
      agua: Number(aguaSlider.value),
      combustivel: Number(combSlider.value),
      aar: aar.get(),
      aarDesc: c.querySelector('#m-fAarDesc').value
    });
  }

  return ()=>({});
}

// ===== FINALIZAR DIÁRIO =====
document.getElementById('btnFinalizarDiario').addEventListener('click', async ()=>{
  if(!diarioAtual || diarioAtual.finalizado_em) return;
  if(!confirm('Finalizar este diário? Não será possível adicionar novos registros depois.')) return;
  try{
    const resp = await apiPost('diario/' + diarioAtual.id + '/finalizar/', {});
    diarioAtual = resp.diario;
    atualizarBadgeStatusDiario(diarioAtual);
    showToast('Diário finalizado com sucesso.');
  }catch(err){
    showToast('Erro ao finalizar: ' + err.message, true);
  }
});

// ===== NAVEGAÇÃO ENTRE VIEWS =====
const views = { painel:'view-painel', novo:'view-novo', historico:'view-historico' };
const titles = {
  painel: ['Painel geral', 'Visão consolidada da prontidão da unidade'],
  novo: ['Novo diário', 'Registro de turno — ' + (usuarioLabel || '')],
  historico: ['Histórico', 'Diários registrados para consulta e auditoria']
};

function goTo(view){
  Object.values(views).forEach(id => document.getElementById(id).classList.remove('active'));
  document.getElementById(views[view]).classList.add('active');
  document.querySelectorAll('.nav-item[data-view]').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.nav-item[data-view="'+view+'"]').forEach(b=>b.classList.add('active'));
  document.getElementById('pageTitle').textContent = titles[view][0];
  document.getElementById('pageSubtitle').textContent = titles[view][1];
  if(view === 'novo') abrirOuCarregarDiario();
  if(view === 'historico') carregarHistorico();
}
document.querySelectorAll('.nav-item[data-view]').forEach(btn=>{
  btn.addEventListener('click', ()=> goTo(btn.dataset.view));
});

// ===== HISTÓRICO (via API) =====
let diariosHistorico = [];

async function carregarHistorico(){
  try{
    const resp = await apiGet('diarios/');
    diariosHistorico = resp.diarios;
    renderHistorico();
  }catch(err){
    showToast('Erro ao carregar histórico: ' + err.message, true);
  }
}

function rondasDoDiario(diario){
  return diario.ocorrencias.filter(o => o.modulo === 'ronda');
}

function rondasColetivasDoDia(dataISO){
  return diariosHistorico
    .filter(d => d.data === dataISO)
    .reduce((total, d) => total + rondasDoDiario(d).length, 0);
}

function rtiMedioDoDiario(diario){
  const rtis = rondasDoDiario(diario).map(o => o.dados.rti).filter(v => typeof v === 'number');
  if(!rtis.length) return 0;
  return Math.round(rtis.reduce((a,b)=>a+b,0) / rtis.length);
}

function bombasComAtencaoDoDiario(diario){
  let count = 0;
  rondasDoDiario(diario).forEach(o=>{
    Object.values(o.dados.bombas || {}).forEach(status=>{
      if(status && status !== 'Automático') count++;
    });
  });
  return count;
}

function atividadesDoDiario(diario){
  const contagem = {};
  diario.ocorrencias.forEach(o=>{
    contagem[o.modulo] = (contagem[o.modulo] || 0) + 1;
  });
  return MODULOS
    .filter(m => contagem[m.key])
    .map(m => m.label + (contagem[m.key] > 1 ? ' ×' + contagem[m.key] : ''));
}

function renderHistorico(){
  const body = document.getElementById('historicoBody');
  const empty = document.getElementById('historicoEmpty');
  body.innerHTML = '';

  if(!diariosHistorico.length){
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  diariosHistorico.forEach(d=>{
    const totalColetivo = rondasColetivasDoDia(d.data);
    const rondaClasse = totalColetivo >= 3 ? 'badge-ok' : 'badge-warn';
    const atividades = atividadesDoDiario(d);

    body.insertAdjacentHTML('beforeend', `
      <tr>
        <td>${formatDateBR(d.data)}</td>
        <td>${d.nome}</td>
        <td>${d.equipe}</td>
        <td><span class="badge ${rondaClasse}">${totalColetivo}/3</span></td>
        <td>${rtiMedioDoDiario(d)}%</td>
        <td>${bombasComAtencaoDoDiario(d)}</td>
        <td>${atividades.join(', ') || '—'}</td>
        <td><button type="button" class="expand-toggle" data-expand-id="${d.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg></button></td>
        <td><button type="button" class="btn-delete" title="Excluir diário" onclick="excluirDiarioHistorico(${d.id})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0l-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16z"/></svg></button></td>
      </tr>
      <tr class="detail-row" id="detailRow_${d.id}">
        <td colspan="9"><div class="detail-wrap">${renderDetalheOcorrencias(d)}</div></td>
      </tr>
    `);
  });

  body.querySelectorAll('[data-expand-id]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const row = document.getElementById('detailRow_' + btn.dataset.expandId);
      row.classList.toggle('show');
      btn.classList.toggle('open');
    });
  });
}

function renderDetalheOcorrencias(diario){
  if(!diario.ocorrencias.length) return '<p class="card-sub">Nenhum módulo registrado neste diário.</p>';
  return diario.ocorrencias.map(o=>{
    const linhas = Object.entries(o.dados)
      .filter(([k,v]) => v !== null && v !== '' && k !== 'bombas')
      .map(([k,v]) => '<b>' + k + ':</b> ' + (Array.isArray(v) ? v.join(', ') : v))
      .join('<br>');
    return `<div class="detail-card"><h4>${o.modulo_label} <span class="card-sub">${formatarHoraCurta(o.criado_em)}</span></h4><p>${linhas || '—'}</p></div>`;
  }).join('');
}

async function excluirDiarioHistorico(id){
  if(!confirm('Excluir este diário e todos os registros dele? Essa ação não pode ser desfeita.')) return;
  try{
    await apiPost('diario/' + id + '/excluir/', {});
    showToast('Diário excluído.');
    carregarHistorico();
  }catch(err){
    showToast('Erro ao excluir: ' + err.message, true);
  }
}

// ===== INICIALIZAÇÃO =====
goTo('novo');