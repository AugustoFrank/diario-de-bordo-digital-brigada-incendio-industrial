// ===== CONFIG =====
const API_BASE = (location.hostname === '127.0.0.1' || location.hostname === 'localhost')
  ? 'http://127.0.0.1:8001/api/'
  : 'https://vps67288.publiccloud.com.br/diario-bordo/api/';

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

function hojeLocalISO(){
  const d = new Date();
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

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

async function apiPostForm(path, formData){
  const res = await fetch(API_BASE + path, {
    method: 'POST',
    body: formData
  });
  if(!res.ok){
    const erro = await res.json().catch(()=>({}));
    throw new Error(erro.erro || ('Erro na API: ' + res.status));
  }
  return res.json();
}

// ===== ABRIR / CARREGAR DIÁRIO DO DIA =====
async function abrirOuCarregarDiario(trocarEquipe = false){
  const equipe = turnoEquipe.value;
  if(!equipe){
    document.getElementById('turnoData').textContent = '—';
    return;
  }
  try{
    const resp = await apiGet('diario-atual/?nome=' + encodeURIComponent(usuarioLabel) + '&equipe=' + encodeURIComponent(equipe) + (trocarEquipe ? '&trocar_equipe=1' : ''));
    diarioAtual = resp.diario;
    turnoEquipe.value = diarioAtual.equipe;
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
turnoEquipe.addEventListener('change', ()=> abrirOuCarregarDiario(true));

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
  evidenciaArquivoAtual = null;
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
  if(diarioAtual.data !== hojeLocalISO()){
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
  const modulo = moduloAtualKey;
  const arquivo = evidenciaArquivoAtual;
  try{
    if(arquivo){
      const fd = new FormData();
      fd.append('diario_id', diarioAtual.id);
      fd.append('modulo', modulo);
      fd.append('dados', JSON.stringify(dados));
      fd.append('evidencia', arquivo);
      await apiPostForm('ocorrencias/', fd);
    }else{
      await apiPost('ocorrencias/', {
        diario_id: diarioAtual.id,
        modulo: modulo,
        dados: dados
      });
    }
    fecharModal();
    showToast('Registro adicionado.');
    await carregarOcorrencias();
    if(modulo === 'ronda'){
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

let evidenciaArquivoAtual = null;

function wireEvidencia(container, inputId, labelId){
  const input = container.querySelector('#' + inputId);
  const label = container.querySelector('#' + labelId);
  let nome = null;
  evidenciaArquivoAtual = null;
  if(input){
    input.addEventListener('change', (e)=>{
      const file = e.target.files[0];
      nome = file ? file.name : null;
      evidenciaArquivoAtual = file || null;
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
  if(!diarioAtual || diarioAtual.finalizado_em) return;if(!diarioAtual){
    showToast('Nenhum diário aberto. Selecione a equipe do turno.', true);
    return;
  }
  if(diarioAtual.finalizado_em){
    showToast('Este diário já foi finalizado.', true);
    return;
  }
  if(!confirm('Finalizar este diário? Não será possível adicionar novos registros depois.')) return;
  try{
    const resp = await apiPost('diario/' + diarioAtual.id + '/finalizar/', {});
    diarioAtual = resp.diario;
    turnoEquipe.value = diarioAtual.equipe;
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
  if(view === 'painel') iniciarPainel();
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
        <td>${painelEsc(d.nome)}</td>
        <td>${painelEsc(d.equipe)}</td>
        <td><span class="badge ${rondaClasse}">${totalColetivo}/3</span></td>
        <td>${rtiMedioDoDiario(d)}%</td>
        <td>${bombasComAtencaoDoDiario(d)}</td>
        <td>${atividades.join(', ') || '—'}</td>
        <td><button type="button" class="expand-toggle" data-expand-id="${d.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg></button></td>
        <td><button type="button" class="row-delete" title="Excluir diário" onclick="excluirDiarioHistorico(${d.id})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0l-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16z"/></svg></button></td>
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

const CAMPO_LABELS = {
  tema: 'Tema',
  evidenciaNome: 'Evidência',
  local: 'Local',
  comentario: 'Comentário',
  inicio: 'Início',
  termino: 'Término',
  tag: 'Tag',
  placa: 'Placa',
  litros: 'Litros',
  checklist: 'Checklist',
  abastecimento: 'Abasteceu?',
  rti: 'Nível da R.T.I',
  horario: 'Horário',
  chegada: 'Horário de chegada',
  saida: 'Horário de saída',
  aph: 'APH',
  traumaMembro: 'Membro do trauma',
  resgateAnimal: 'Espécie (resgate)',
  resgateAnimalOutro: 'Espécie (outro)',
  resgateStatus: 'Situação do resgate',
  eventoAmbiental: 'Evento ambiental',
  eventoAmbientalOutro: 'Evento ambiental (outro)',
  incendio: 'Incêndio',
  incendioOutro: 'Incêndio (outro)',
  danosMateriais: 'Danos materiais',
  tipos: 'Tipos de avaliação',
  status: 'Status',
  desc: 'Descrição',
  acao: 'Ação',
  abt: 'ABT',
  abtDesc: 'Não conformidade (ABT)',
  aar: 'AAR',
  aarDesc: 'Não conformidade (AAR)',
  agua: 'Nível da água',
  combustivel: 'Combustível',
};

function formatarValorCampo(v){
  if(Array.isArray(v)) return v.join(', ');
  if(v === true) return 'Sim';
  if(v === false) return 'Não';
  return v;
}

function bombasAlteradasTexto(bombas){
  if(!bombas) return null;
  const alteradas = Object.entries(bombas).filter(([,st]) => st && st !== 'Automático');
  if(!alteradas.length) return null;
  return alteradas.map(([nome, st]) => nome + ' (' + st + ')').join(', ');
}

function urlEvidencia(caminho){
  if(!caminho) return null;
  if(/^https?:\/\//.test(caminho)) return caminho;
  const base = API_BASE.replace(/api\/?$/, '');
  return base + caminho.replace(/^\//, '');
}

function renderDetalheOcorrencias(diario){
  if(!diario.ocorrencias.length){
    return '<p class="detail-empty">Nenhum módulo registrado neste diário.</p>';
  }
  const cards = diario.ocorrencias.map(o=>{
    const linhas = [];
    Object.entries(o.dados).forEach(([k, v])=>{
      if(k === 'evidenciaNome' && o.evidencia_url) return;
      if(k === 'bombas'){
        const texto = bombasAlteradasTexto(v);
        linhas.push('<div class="dm-row"><b>Bombas alteradas:</b> ' + painelEsc(texto || 'Nenhuma') + '</div>');
        return;
      }
      if(v === null || v === undefined || v === '') return;
      const label = CAMPO_LABELS[k] || k;
      linhas.push('<div class="dm-row"><b>' + painelEsc(label) + ':</b> ' + painelEsc(formatarValorCampo(v)) + '</div>');
    });
    const urlEv = urlEvidencia(o.evidencia_url);
    if(urlEv){
      const urlSegura = painelEsc(urlEv);
      linhas.push('<div class="dm-row"><a href="' + urlSegura + '" target="_blank" rel="noopener"><img class="dm-thumb" src="' + urlSegura + '" alt="Evidência" loading="lazy"></a></div>');
    }
    return '<div class="detail-mod"><h4>' + painelEsc(o.modulo_label) + ' · ' + formatarHoraCurta(o.criado_em) + '</h4>' + (linhas.join('') || '<div class="dm-row">—</div>') + '</div>';
  }).join('');
  return '<div class="detail-grid">' + cards + '</div>';
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

// ===== PAINEL GERAL (estatísticas por período) =====
const PAINEL_EQUIPES = ['ADM','ALPHA', 'BRAVO', 'CHARLIE', 'DELTA', 'ESTRUTURA'];

const PAINEL_MODULOS = [
  {key:'dds', rotulo:'DDS', icone:'<path d="M12 3l7 3v5c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6z"/>'},
  {key:'ronda', rotulo:'Ronda', icone:'<circle cx="12" cy="5" r="2"/><path d="M12 8v6l-3 6M12 14l3 6M8 11l4-3 4 3"/>'},
  {key:'vtr', rotulo:'VTR', icone:'<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="1.5"/><circle cx="17" cy="18" r="1.5"/>'},
  {key:'emergencia', rotulo:'Emergência', icone:'<path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17h.01"/>'},
  {key:'avaliacao', rotulo:'Avaliação', icone:'<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4h6v3H9zM9 13l2 2 4-4"/>'},
  {key:'glp', rotulo:'Batedor GLP', icone:'<path d="M12 3c1 4 5 5 5 10a5 5 0 01-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-6 1-9z"/>'},
  {key:'fonte_radioativa', rotulo:'Fonte radioativa', icone:'<circle cx="12" cy="12" r="2"/><path d="M12 3a9 9 0 019 9M12 3a9 9 0 00-9 9M12 21a9 9 0 009-9M12 21a9 9 0 01-9-9"/>'},
  {key:'inspecao_mensal', rotulo:'Inspeção mensal', icone:'<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>'},
  {key:'trabalho_quente', rotulo:'Trab. a quente', icone:'<path d="M10 14V5a2 2 0 014 0v9a4 4 0 11-4 0z"/>'},
  {key:'treinamento', rotulo:'Treinamento', icone:'<path d="M2 9l10-5 10 5-10 5zM6 11v5c3 2 9 2 12 0v-5"/>'},
  {key:'caminhoes_combate', rotulo:'Caminhões', icone:'<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="1.5"/><circle cx="17" cy="18" r="1.5"/>'}
];

let painelDados = null;
let painelEquipeSel = null;

function painelEsc(t){
  return String(t).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function painelNomeEquipe(eq){
  return eq.charAt(0) + eq.slice(1).toLowerCase();
}

function painelNomeColab(nome){
  return (typeof nomeParaLabel === 'function') ? nomeParaLabel(nome) : nome;
}

function painelBarrasHtml(itens, opts){
  opts = opts || {};
  if(!itens.length) return '<div class="barra-vazio">Sem registros no período.</div>';
  const max = Math.max.apply(null, itens.map(i => i.valor)) || 0;
  return itens.map(i=>{
    const pct = max ? Math.round(i.valor / max * 100) : 0;
    let cls = 'barra-linha';
    if(opts.clicavel) cls += ' clicavel';
    if(opts.selecionada) cls += (i.chave === opts.selecionada) ? ' ativa' : ' apagada';
    return `
      <div class="${cls}" data-chave="${painelEsc(i.chave || '')}" title="${painelEsc(i.titulo || i.rotulo)}">
        <span class="barra-nome">${painelEsc(i.rotulo)}</span>
        <span class="barra-trilho"><span class="barra-fill" style="width:${pct}%"></span></span>
        <span class="barra-valor">${i.valor}</span>
      </div>`;
  }).join('');
}

function painelPorEquipe(lista){
  const mapa = {};
  lista.forEach(x => { mapa[x.equipe] = x.total; });
  return PAINEL_EQUIPES.map(eq => ({
    chave: eq,
    rotulo: painelNomeEquipe(eq),
    valor: mapa[eq] || 0
  }));
}

function painelColabItens(){
  const lista = painelDados.diarios_por_colaborador;
  let itens;
  if(painelEquipeSel){
    itens = lista
      .filter(c => c.equipe === painelEquipeSel)
      .map(c => ({rotulo: painelNomeColab(c.nome), titulo: c.nome, valor: c.total}));
  } else {
    const soma = {};
    lista.forEach(c => { soma[c.nome] = (soma[c.nome] || 0) + c.total; });
    itens = Object.keys(soma).map(n => ({rotulo: painelNomeColab(n), titulo: n, valor: soma[n]}));
  }
  return itens.sort((a, b) => b.valor - a.valor);
}

function desenharPainelModulos(){
  document.getElementById('painelModulos').innerHTML = PAINEL_MODULOS.map(m => `
    <div class="pm-item">
      <span class="pm-icone">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${m.icone}</svg>
      </span>
      <div class="pm-valor">${painelDados.modulos[m.key] || 0}</div>
      <div class="pm-nome">${m.rotulo}</div>
    </div>`).join('');
}

function desenharPainelEquipes(){
  document.getElementById('graficoEquipes').innerHTML = painelBarrasHtml(
    painelPorEquipe(painelDados.diarios_por_equipe),
    {clicavel: true, selecionada: painelEquipeSel}
  );
}

function desenharPainelColab(){
  document.getElementById('colabTitulo').textContent = painelEquipeSel
    ? 'Diários por colaborador — equipe ' + painelNomeEquipe(painelEquipeSel)
    : 'Diários por colaborador — todas as equipes';
  document.getElementById('painelLimparEquipe').hidden = !painelEquipeSel;
  document.getElementById('graficoColab').innerHTML = painelBarrasHtml(painelColabItens());
}

function desenharPainelRondas(){
  document.getElementById('graficoRondas').innerHTML = painelBarrasHtml(
    painelPorEquipe(painelDados.rondas_por_equipe)
  );
}

function desenharPainel(){
  desenharPainelModulos();
  desenharPainelEquipes();
  desenharPainelColab();
  desenharPainelRondas();
}

async function carregarPainel(){
  const ini = document.getElementById('painelInicio').value;
  const fim = document.getElementById('painelFim').value;
  if(!ini || !fim){
    showToast('Informe a data inicial e a final.', true);
    return;
  }
  if(ini > fim){
    showToast('A data inicial não pode ser maior que a final.', true);
    return;
  }
  try{
    painelDados = await apiGet('estatisticas/?inicio=' + encodeURIComponent(ini) + '&fim=' + encodeURIComponent(fim));
    painelEquipeSel = null;
    desenharPainel();
    localStorage.setItem('db_painel_data_inicio', ini);
    localStorage.setItem('db_painel_data_fim', fim);
  }catch(err){
    showToast('Erro ao carregar o painel: ' + err.message, true);
  }
}

function iniciarPainel(){
  const ini = document.getElementById('painelInicio');
  const fim = document.getElementById('painelFim');
  const salvoIni = localStorage.getItem('db_painel_data_inicio');
  const salvoFim = localStorage.getItem('db_painel_data_fim');
  const hoje = hojeLocalISO();
  if(!ini.value) ini.value = salvoIni || hoje;
  if(!fim.value) fim.value = salvoFim || hoje;
  carregarPainel();
  verificarDicaFiltroEquipe();
}

function verificarDicaFiltroEquipe(){
  const chave = 'db_dica_equipe_vista_' + usuarioLabel;
  const dica = document.getElementById('dicaFiltroEquipe');
  if(!dica) return;
  dica.style.display = localStorage.getItem(chave) ? 'none' : 'flex';
}

document.getElementById('btnFecharDicaEquipe').addEventListener('click', ()=>{
  localStorage.setItem('db_dica_equipe_vista_' + usuarioLabel, '1');
  document.getElementById('dicaFiltroEquipe').style.display = 'none';
});

document.getElementById('painelAplicar').addEventListener('click', carregarPainel);

document.getElementById('painelLimparEquipe').addEventListener('click', ()=>{
  painelEquipeSel = null;
  desenharPainelEquipes();
  desenharPainelColab();
});

document.getElementById('graficoEquipes').addEventListener('click', e=>{
  const linha = e.target.closest('.barra-linha');
  if(!linha || !painelDados) return;
  const eq = linha.dataset.chave;
  painelEquipeSel = (painelEquipeSel === eq) ? null : eq;
  desenharPainelEquipes();
  desenharPainelColab();
});

// ===== INICIALIZAÇÃO =====
goTo('novo');

preSelecionarEquipe();