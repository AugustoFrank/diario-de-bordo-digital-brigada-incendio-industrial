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
document.getElementById('fNome').textContent = usuarioLabel || '—';

document.getElementById('logoutBtn').addEventListener('click', ()=>{
  sessionStorage.clear();
  window.location.href = 'index.html';
});

seedMockDataIfEmpty();

// ===== ETAPA 1: SALVAMENTO PROGRESSIVO — diário do dia =====
function hojeISO(){
  return new Date().toISOString().slice(0,10);
}

let diarioAtualId = null; // id do diário de hoje deste bombeiro (após a 1ª gravação)

function buscarDiarioHoje(){
  const diarios = JSON.parse(localStorage.getItem('db_diarios') || '[]');
  return diarios.find(d => d.data === hojeISO() && d.nome === usuarioLabel) || null;
}

function diarioVazio(dataISO){
  return {
    id: 'd_' + Date.now() + '_' + Math.random().toString(36).slice(2,7),
    data: dataISO || hojeISO(),
    nome: usuarioLabel,
    equipe: '',
    status: 'rascunho',
    _timestamps: {},
    rondas: [estadoRondaVazio(), estadoRondaVazio(), estadoRondaVazio()],
    dds: null, vtr: null, emergencia: null, avaliacao: null, glp: null,
    fonteRadioativa: null, inspecaoMensal: null, trabalhoQuente: null,
    treinamento: null, caminhoesCombate: null
  };
}

function salvarDiarioNoStorage(diario){
  const diarios = JSON.parse(localStorage.getItem('db_diarios') || '[]');
  const idx = diarios.findIndex(d => d.id === diario.id);
  if(idx > -1) diarios[idx] = diario;
  else diarios.unshift(diario);
  localStorage.setItem('db_diarios', JSON.stringify(diarios));
}

// Garante que existe um diário de hoje no storage (cria se ainda não existir)
// e devolve o objeto atualizado.
function garantirDiarioHoje(){
  if(diarioAtualId){
    const diarios = JSON.parse(localStorage.getItem('db_diarios') || '[]');
    const existente = diarios.find(d => d.id === diarioAtualId);
    if(existente) return existente;
  }
  let diario = buscarDiarioHoje();
  if(!diario){
    diario = diarioVazio();
    salvarDiarioNoStorage(diario);
  }
  diarioAtualId = diario.id;
  return diario;
}

// ===== ETAPA 2: BLOQUEIO POR DATA (Rondas/DDS retroativos em até 24h) =====

function buscarDiarioPorData(dataISO){
  const diarios = JSON.parse(localStorage.getItem('db_diarios') || '[]');
  return diarios.find(d => d.data === dataISO && d.nome === usuarioLabel) || null;
}

function dataOntemISO(){
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0,10);
}

// Qual data o formulário de "Novo diário" está representando agora.
// 'hoje' na maior parte do tempo; vira a data de ontem quando o bombeiro
// entra no modo de completar Rondas/DDS pendentes do turno anterior.
let dataEmEdicao = hojeISO();

function garantirDiarioData(dataISO){
  if(diarioAtualId){
    const diarios = JSON.parse(localStorage.getItem('db_diarios') || '[]');
    const existente = diarios.find(d => d.id === diarioAtualId && d.data === dataISO);
    if(existente) return existente;
  }
  let diario = buscarDiarioPorData(dataISO);
  if(!diario){
    diario = diarioVazio(dataISO);
    salvarDiarioNoStorage(diario);
  }
  diarioAtualId = diario.id;
  return diario;
}

// Um diário está "pendente" quando as 3 rondas não estão completas
// ou o DDS ainda não foi salvo nenhuma vez.
function diarioPendente(diario){
  if(!diario) return false;
  const rondasCompletas = rondasConcluidasDoDiario(diario) === 3;
  const ddsSalvo = !!(diario._timestamps && diario._timestamps.dds);
  return !(rondasCompletas && ddsSalvo);
}

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

// ===== DATA: sempre hoje (Novo diário só existe para o dia atual) =====
const hoje = new Date();
const hojeStr = hoje.toISOString().slice(0,10);
const fData = document.getElementById('fData');
fData.min = hojeStr;
fData.max = hojeStr;
fData.value = hojeStr;
fData.addEventListener('change', ()=>{ fData.value = hojeStr; });

document.getElementById('topDate').textContent = hoje.toLocaleDateString('pt-BR', {
  weekday:'long', day:'2-digit', month:'long'
});

// ===== EQUIPE =====
const fEquipe = document.getElementById('fEquipe');
EQUIPES.forEach(eq=>{
  const opt = document.createElement('option');
  opt.value = eq;
  opt.textContent = eq;
  fEquipe.appendChild(opt);
});
function preSelecionarEquipe(){
  fEquipe.value = EQUIPES.includes(usuarioEmpresa) ? usuarioEmpresa : '';
}
preSelecionarEquipe();

// ===== helper genérico p/ selects de opções fixas =====
function popularSelectSimples(selectEl, opcoes){
  opcoes.forEach(o=>{
    const opt = document.createElement('option');
    opt.value = o;
    opt.textContent = o;
    selectEl.appendChild(opt);
  });
}
popularSelectSimples(document.getElementById('fEmerResgateAnimal'), OPCOES_RESGATE_ANIMAL);
popularSelectSimples(document.getElementById('fEmerEventoAmbiental'), OPCOES_EVENTO_AMBIENTAL);
popularSelectSimples(document.getElementById('fEmerIncendio'), OPCOES_INCENDIO);
popularSelectSimples(document.getElementById('fEmerDanosMateriais'), OPCOES_DANOS_MATERIAIS);
popularSelectSimples(document.getElementById('fInspecaoLocal'), OPCOES_INSPECAO_MENSAL);

// ===== RONDAS =====
function estadoRondaVazio(){
  return { rti: 50, bombas: {}, evidenciaNome: null, comentario: '' };
}
let rondasState = [estadoRondaVazio(), estadoRondaVazio(), estadoRondaVazio()];

function renderBombaGrid(rondaIndex){
  const wrap = document.getElementById('bombaGrid' + rondaIndex);
  wrap.innerHTML = '';
  BOMBAS.forEach(nomeBomba=>{
    const row = document.createElement('div');
    row.className = 'bomba-row';
    row.innerHTML = `
      <span class="br-label">Bomba ${nomeBomba}</span>
      <div class="status-toggle" data-ronda="${rondaIndex}" data-bomba="${nomeBomba}" data-tones="ok,warn,danger">
        <button type="button" class="chip" data-value="Automático">Auto</button>
        <button type="button" class="chip" data-value="Manual">Manual</button>
        <button type="button" class="chip" data-value="Inoperante">Inop.</button>
      </div>
    `;
    wrap.appendChild(row);
    const group = row.querySelector('.status-toggle');
    const tones = ['ok','warn','danger'];
    const valorAtual = rondasState[rondaIndex-1].bombas[nomeBomba];
    group.querySelectorAll('.chip').forEach((chip,i)=>{
      if(chip.dataset.value === valorAtual){
        chip.classList.add('selected');
        chip.setAttribute('data-tone', tones[i]);
      }
      chip.addEventListener('click', ()=>{
        group.querySelectorAll('.chip').forEach(c=>{ c.classList.remove('selected'); c.removeAttribute('data-tone'); });
        chip.classList.add('selected');
        chip.setAttribute('data-tone', tones[i]);
        rondasState[rondaIndex-1].bombas[nomeBomba] = chip.dataset.value;
        atualizarProgressoRondas();
      });
    });
  });
}
[1,2,3].forEach(renderBombaGrid);

[1,2,3].forEach(i=>{
  const slider = document.getElementById('fRti' + i);
  const label = document.getElementById('valRti' + i);
  slider.addEventListener('input', ()=>{
    label.textContent = slider.value + '%';
    rondasState[i-1].rti = Number(slider.value);
  });
  document.getElementById('fComentario' + i).addEventListener('input', (e)=>{
    rondasState[i-1].comentario = e.target.value;
  });
  document.getElementById('fEvidencia' + i).addEventListener('change', (e)=>{
    const file = e.target.files[0];
    rondasState[i-1].evidenciaNome = file ? file.name : null;
    document.getElementById('fEvidencia' + i + 'Label').textContent = file ? file.name : 'Tirar foto ou anexar da galeria';
  });
});

function rondaEstaCompleta(rondaIndex){
  const estado = rondasState[rondaIndex-1];
  return BOMBAS.every(b => estado.bombas[b]);
}

function atualizarProgressoRondas(){
  let concluidas = 0;
  [1,2,3].forEach(i=>{
    const completa = rondaEstaCompleta(i);
    const card = document.getElementById('rondaCard' + i);
    const badge = document.getElementById('rondaBadge' + i);
    card.classList.toggle('ronda-done', completa);
    badge.textContent = completa ? 'Concluída' : 'Pendente';
    if(completa) concluidas++;
  });
  const percentuais = [0, 33, 66, 100];
  const pct = percentuais[concluidas];
  document.getElementById('rondasProgressoFill').style.width = pct + '%';
  document.getElementById('rondasProgressoTexto').textContent = concluidas + '/3 concluídas';
  document.getElementById('statusStripText').textContent = 'Rondas do turno: ' + concluidas + '/3 concluídas';
  const strip = document.getElementById('statusStrip');
  strip.classList.remove('warn','danger');
  if(concluidas === 0) strip.classList.add('danger');
  else if(concluidas < 3) strip.classList.add('warn');
  return concluidas;
}
atualizarProgressoRondas();

// ===== GENÉRICO: grupos de chip (exclusivos, com "alter-box" opcional) =====
// mapa de qual alter-box cada grupo controla, e sob qual valor ela aparece
const ALTER_BOX_TRIGGERS = {
  emerAph: { box: 'emerTraumaBox', showOn: 'Trauma' },
  emerResgateStatus: null,
  avaliacaoStatus: { box: 'avaliacaoAlteradoBox', showOn: 'Alterado' },
  abtStatus: { box: 'abtDescBox', showOn: 'Não Conformidade' },
  aarStatus: { box: 'aarDescBox', showOn: 'Não Conformidade' }
};

const chipGroupState = {};
document.querySelectorAll('.status-toggle[data-group]').forEach(group=>{
  const name = group.dataset.group;
  const tones = (group.dataset.tones || '').split(',');
  chipGroupState[name] = null;
  const chips = group.querySelectorAll('.chip');
  chips.forEach((chip,i)=>{
    chip.addEventListener('click', ()=>{
      chips.forEach(c=>{ c.classList.remove('selected'); c.removeAttribute('data-tone'); });
      chip.classList.add('selected');
      if(tones[i]) chip.setAttribute('data-tone', tones[i]);
      chipGroupState[name] = chip.dataset.value;
      onGroupChange(name, chip.dataset.value);
    });
  });
});

function toggleAlterBox(boxId, show){
  const box = document.getElementById(boxId);
  if(!box) return;
  box.classList.toggle('show', show);
}

function onGroupChange(name, value){
  const trigger = ALTER_BOX_TRIGGERS[name];
  if(trigger){
    toggleAlterBox(trigger.box, value === trigger.showOn);
  }
  if(name === 'vtrAbastecimento'){
    const mostrar = value === 'Sim';
    document.getElementById('vtrLitrosWrap').style.display = mostrar ? 'block' : 'none';
    document.getElementById('vtrLocalWrap').style.display = mostrar ? 'block' : 'none';
  }
}

// Avaliação: tipos (multi-seleção, não exclusiva)
const avaliacaoTiposState = [];
document.querySelectorAll('#avaliacaoTipos .chip').forEach(chip=>{
  chip.addEventListener('click', ()=>{
    chip.classList.toggle('selected');
    const v = chip.dataset.value;
    const idx = avaliacaoTiposState.indexOf(v);
    if(chip.classList.contains('selected') && idx === -1) avaliacaoTiposState.push(v);
    if(!chip.classList.contains('selected') && idx > -1) avaliacaoTiposState.splice(idx,1);
  });
});

// selects com "Outro" -> mostra campo de texto
document.getElementById('fEmerResgateAnimal').addEventListener('change', (e)=>{
  toggleAlterBox('emerResgateOutroBox', e.target.value === 'Outro');
});
document.getElementById('fEmerEventoAmbiental').addEventListener('change', (e)=>{
  toggleAlterBox('emerEventoOutroBox', e.target.value === 'Outro');
});
document.getElementById('fEmerIncendio').addEventListener('change', (e)=>{
  toggleAlterBox('emerIncendioOutroBox', e.target.value === 'Outro');
});

// ===== DDS =====
let ddsState = { tema: '', evidenciaNome: null };
document.getElementById('fDdsTema').addEventListener('input', (e)=>{ ddsState.tema = e.target.value; });
document.getElementById('fDdsEvidencia').addEventListener('change', (e)=>{
  const file = e.target.files[0];
  ddsState.evidenciaNome = file ? file.name : null;
  document.getElementById('fDdsEvidenciaLabel').textContent = file ? file.name : 'Tirar foto ou anexar da galeria';
});

// ===== VTR =====
let vtrState = { tag:'', placa:'', checklist:null, abastecimento:null, litros:null, local:'', evidenciaNome:null };
document.getElementById('fVtrTag').addEventListener('input', e => vtrState.tag = e.target.value);
document.getElementById('fVtrPlaca').addEventListener('input', e => vtrState.placa = e.target.value);
document.getElementById('fVtrLitros').addEventListener('input', e => vtrState.litros = e.target.value);
document.getElementById('fVtrLocal').addEventListener('input', e => vtrState.local = e.target.value);
document.getElementById('fVtrEvidencia').addEventListener('change', (e)=>{
  const file = e.target.files[0];
  vtrState.evidenciaNome = file ? file.name : null;
  document.getElementById('fVtrEvidenciaLabel').textContent = file ? file.name : 'Tirar foto ou anexar da galeria';
});

// ===== EMERGÊNCIAS =====
let emergenciaState = {
  chegada:'', saida:'', local:'', aph:null, traumaMembro:'',
  resgateAnimal:'', resgateAnimalOutro:'', resgateStatus:null,
  eventoAmbiental:'', eventoAmbientalOutro:'',
  incendio:'', incendioOutro:'',
  danosMateriais:'', comentario:''
};
document.getElementById('fEmerChegada').addEventListener('input', e => emergenciaState.chegada = e.target.value);
document.getElementById('fEmerSaida').addEventListener('input', e => emergenciaState.saida = e.target.value);
document.getElementById('fEmerLocal').addEventListener('input', e => emergenciaState.local = e.target.value);
document.getElementById('fEmerTraumaMembro').addEventListener('input', e => emergenciaState.traumaMembro = e.target.value);
document.getElementById('fEmerResgateAnimal').addEventListener('change', e => emergenciaState.resgateAnimal = e.target.value);
document.getElementById('fEmerResgateOutro').addEventListener('input', e => emergenciaState.resgateAnimalOutro = e.target.value);
document.getElementById('fEmerEventoAmbiental').addEventListener('change', e => emergenciaState.eventoAmbiental = e.target.value);
document.getElementById('fEmerEventoOutro').addEventListener('input', e => emergenciaState.eventoAmbientalOutro = e.target.value);
document.getElementById('fEmerIncendio').addEventListener('change', e => emergenciaState.incendio = e.target.value);
document.getElementById('fEmerIncendioOutro').addEventListener('input', e => emergenciaState.incendioOutro = e.target.value);
document.getElementById('fEmerDanosMateriais').addEventListener('change', e => emergenciaState.danosMateriais = e.target.value);
document.getElementById('fEmerComentario').addEventListener('input', e => emergenciaState.comentario = e.target.value);

// ===== AVALIAÇÃO =====
let avaliacaoState = { local:'', status:null, desc:'' };
document.getElementById('fAvaliacaoLocal').addEventListener('input', e => avaliacaoState.local = e.target.value);
document.getElementById('fAvaliacaoDesc').addEventListener('input', e => avaliacaoState.desc = e.target.value);

// ===== BATEDOR DE GLP =====
let glpState = { acao:null, tag:'', inicio:'', termino:'' };
document.getElementById('fGlpTag').addEventListener('input', e => glpState.tag = e.target.value);
document.getElementById('fGlpInicio').addEventListener('input', e => glpState.inicio = e.target.value);
document.getElementById('fGlpTermino').addEventListener('input', e => glpState.termino = e.target.value);

// ===== FONTE RADIOATIVA =====
let fonteState = { acao:null, tag:'', horario:'', local:'' };
document.getElementById('fFonteTag').addEventListener('input', e => fonteState.tag = e.target.value);
document.getElementById('fFonteHorario').addEventListener('input', e => fonteState.horario = e.target.value);
document.getElementById('fFonteLocal').addEventListener('input', e => fonteState.local = e.target.value);

// ===== INSPEÇÃO MENSAL =====
let inspecaoState = { local:'', inicio:'', termino:'', comentario:'' };
document.getElementById('fInspecaoLocal').addEventListener('change', e => inspecaoState.local = e.target.value);
document.getElementById('fInspecaoInicio').addEventListener('input', e => inspecaoState.inicio = e.target.value);
document.getElementById('fInspecaoTermino').addEventListener('input', e => inspecaoState.termino = e.target.value);
document.getElementById('fInspecaoComentario').addEventListener('input', e => inspecaoState.comentario = e.target.value);

// ===== ACOMPANHAMENTO TRABALHO A QUENTE =====
let taqState = { tag:'', local:'', inicio:'', termino:'' };
document.getElementById('fTaqTag').addEventListener('input', e => taqState.tag = e.target.value);
document.getElementById('fTaqLocal').addEventListener('input', e => taqState.local = e.target.value);
document.getElementById('fTaqInicio').addEventListener('input', e => taqState.inicio = e.target.value);
document.getElementById('fTaqTermino').addEventListener('input', e => taqState.termino = e.target.value);

// ===== TREINAMENTO =====
let treinamentoState = { tema:'', evidenciaNome:null };
document.getElementById('fTreinamentoTema').addEventListener('input', e => treinamentoState.tema = e.target.value);
document.getElementById('fTreinamentoEvidencia').addEventListener('change', (e)=>{
  const file = e.target.files[0];
  treinamentoState.evidenciaNome = file ? file.name : null;
  document.getElementById('fTreinamentoEvidenciaLabel').textContent = file ? file.name : 'Tirar foto ou anexar da galeria';
});

// ===== CAMINHÕES DE COMBATE =====
let caminhoesState = { abt:null, abtDesc:'', agua:50, combustivel:50, aar:null, aarDesc:'' };
document.getElementById('fAbtDesc').addEventListener('input', e => caminhoesState.abtDesc = e.target.value);
document.getElementById('fAarDesc').addEventListener('input', e => caminhoesState.aarDesc = e.target.value);
document.getElementById('fCcAgua').addEventListener('input', (e)=>{
  caminhoesState.agua = Number(e.target.value);
  document.getElementById('valCcAgua').textContent = e.target.value + '%';
});
document.getElementById('fCcComb').addEventListener('input', (e)=>{
  caminhoesState.combustivel = Number(e.target.value);
  document.getElementById('valCcComb').textContent = e.target.value + '%';
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
  if(view === 'painel') renderPainel();
  if(view === 'historico') renderHistorico();
  if(view === 'novo') carregarDiarioAtual();
}
document.querySelectorAll('.nav-item[data-view]').forEach(btn=>{
  btn.addEventListener('click', ()=> goTo(btn.dataset.view));
});

// ===== LIMPAR FORMULÁRIO =====
document.getElementById('btnLimpar').addEventListener('click', resetForm);
function resetForm(){
  preSelecionarEquipe();
  fData.value = hoje.toISOString().slice(0,10);

  // rondas
  rondasState = [estadoRondaVazio(), estadoRondaVazio(), estadoRondaVazio()];
  [1,2,3].forEach(i=>{
    document.getElementById('fRti' + i).value = 50;
    document.getElementById('valRti' + i).textContent = '50%';
    document.getElementById('fComentario' + i).value = '';
    document.getElementById('fEvidencia' + i).value = '';
    document.getElementById('fEvidencia' + i + 'Label').textContent = 'Tirar foto ou anexar da galeria';
    renderBombaGrid(i);
  });
  atualizarProgressoRondas();

  // chips exclusivos de todos os módulos
  document.querySelectorAll('.status-toggle[data-group] .chip').forEach(c=>{
    c.classList.remove('selected');
    c.removeAttribute('data-tone');
  });
  Object.keys(chipGroupState).forEach(k => chipGroupState[k] = null);
  document.querySelectorAll('.alter-box').forEach(b => b.classList.remove('show'));
  document.getElementById('vtrLitrosWrap').style.display = 'none';
  document.getElementById('vtrLocalWrap').style.display = 'none';

  // avaliação (multi)
  document.querySelectorAll('#avaliacaoTipos .chip').forEach(c => c.classList.remove('selected'));
  avaliacaoTiposState.length = 0;

  // demais campos de texto/select/textarea dos módulos novos
  const idsTexto = [
    'fDdsTema','fVtrTag','fVtrPlaca','fVtrLitros','fVtrLocal',
    'fEmerChegada','fEmerSaida','fEmerLocal','fEmerTraumaMembro','fEmerResgateOutro',
    'fEmerEventoOutro','fEmerIncendioOutro','fEmerComentario',
    'fAvaliacaoLocal','fAvaliacaoDesc',
    'fGlpTag','fGlpInicio','fGlpTermino',
    'fFonteTag','fFonteHorario','fFonteLocal',
    'fInspecaoInicio','fInspecaoTermino','fInspecaoComentario',
    'fTaqTag','fTaqLocal','fTaqInicio','fTaqTermino',
    'fTreinamentoTema','fAbtDesc','fAarDesc'
  ];
  idsTexto.forEach(id => document.getElementById(id).value = '');
  ['fEmerResgateAnimal','fEmerEventoAmbiental','fEmerIncendio','fEmerDanosMateriais','fInspecaoLocal'].forEach(id=>{
    document.getElementById(id).value = '';
  });
  document.getElementById('fVtrEvidencia').value = '';
  document.getElementById('fVtrEvidenciaLabel').textContent = 'Tirar foto ou anexar da galeria';
  document.getElementById('fDdsEvidencia').value = '';
  document.getElementById('fDdsEvidenciaLabel').textContent = 'Tirar foto ou anexar da galeria';
  document.getElementById('fTreinamentoEvidencia').value = '';
  document.getElementById('fTreinamentoEvidenciaLabel').textContent = 'Tirar foto ou anexar da galeria';
  document.getElementById('fCcAgua').value = 50;
  document.getElementById('fCcComb').value = 50;
  document.getElementById('valCcAgua').textContent = '50%';
  document.getElementById('valCcComb').textContent = '50%';

  // reset dos objetos de estado
  ddsState = { tema:'', evidenciaNome:null };
  vtrState = { tag:'', placa:'', checklist:null, abastecimento:null, litros:null, local:'', evidenciaNome:null };
  emergenciaState = { chegada:'', saida:'', local:'', aph:null, traumaMembro:'', resgateAnimal:'', resgateAnimalOutro:'', resgateStatus:null, eventoAmbiental:'', eventoAmbientalOutro:'', incendio:'', incendioOutro:'', danosMateriais:'', comentario:'' };
  avaliacaoState = { local:'', status:null, desc:'' };
  glpState = { acao:null, tag:'', inicio:'', termino:'' };
  fonteState = { acao:null, tag:'', horario:'', local:'' };
  inspecaoState = { local:'', inicio:'', termino:'', comentario:'' };
  taqState = { tag:'', local:'', inicio:'', termino:'' };
  treinamentoState = { tema:'', evidenciaNome:null };
  caminhoesState = { abt:null, abtDesc:'', agua:50, combustivel:50, aar:null, aarDesc:'' };
}

// ===== ETAPA 1: HELPERS DE UI PARA CARREGAR/SALVAR MÓDULOS =====

function timestampAgora(){
  return new Date().toISOString();
}

function formatarHoraCurta(iso){
  if(!iso) return null;
  return new Date(iso).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
}

function atualizarBadgeStatusDiario(diario){
  const badge = document.getElementById('diarioStatusBadge');
  if(!badge) return;
  const concluido = diario.status === 'concluido';
  badge.textContent = concluido ? 'Concluído' : 'Rascunho';
  badge.classList.toggle('badge-ok', concluido);
  badge.classList.toggle('badge-warn', !concluido);
}

function atualizarTextoSalvo(modulo, iso){
  const span = document.getElementById('saveStatus_' + modulo);
  if(!span) return;
  span.textContent = iso ? ('Salvo hoje às ' + formatarHoraCurta(iso)) : 'Ainda não salvo hoje';
}

function definirChipGroup(nomeGrupo, valor){
  const group = document.querySelector('.status-toggle[data-group="'+nomeGrupo+'"]');
  if(!group) return;
  const tones = (group.dataset.tones || '').split(',');
  group.querySelectorAll('.chip').forEach((chip,i)=>{
    chip.classList.remove('selected');
    chip.removeAttribute('data-tone');
    if(valor && chip.dataset.value === valor){
      chip.classList.add('selected');
      if(tones[i]) chip.setAttribute('data-tone', tones[i]);
    }
  });
  chipGroupState[nomeGrupo] = valor || null;
  onGroupChange(nomeGrupo, valor || null);
}

function definirAvaliacaoTipos(lista){
  avaliacaoTiposState.length = 0;
  document.querySelectorAll('#avaliacaoTipos .chip').forEach(chip=>{
    const v = chip.dataset.value;
    const marcado = (lista || []).includes(v);
    chip.classList.toggle('selected', marcado);
    if(marcado) avaliacaoTiposState.push(v);
  });
}

function preencherTextoOuVazio(id, valor){
  const el = document.getElementById(id);
  if(el) el.value = (valor === null || valor === undefined) ? '' : valor;
}

function preencherRondasNaTela(){
  [1,2,3].forEach(i=>{
    const estado = rondasState[i-1];
    document.getElementById('fRti' + i).value = estado.rti;
    document.getElementById('valRti' + i).textContent = estado.rti + '%';
    document.getElementById('fComentario' + i).value = estado.comentario || '';
    document.getElementById('fEvidencia' + i + 'Label').textContent = estado.evidenciaNome || 'Tirar foto ou anexar da galeria';
    renderBombaGrid(i);
  });
  atualizarProgressoRondas();
}

// Sincroniza os grupos de chip (exclusivos) nos objetos de estado de cada módulo
function sincronizarChipsNoEstado(){
  vtrState.checklist = chipGroupState.vtrChecklist;
  vtrState.abastecimento = chipGroupState.vtrAbastecimento;
  emergenciaState.aph = chipGroupState.emerAph;
  emergenciaState.resgateStatus = chipGroupState.emerResgateStatus;
  avaliacaoState.status = chipGroupState.avaliacaoStatus;
  glpState.acao = chipGroupState.glpAcao;
  fonteState.acao = chipGroupState.fonteAcao;
  caminhoesState.abt = chipGroupState.abtStatus;
  caminhoesState.aar = chipGroupState.aarStatus;
}

// ===== SALVAR UM MÓDULO ISOLADO NO DIÁRIO DE HOJE =====
function salvarModulo(modulo){
  const equipe = fEquipe.value;
  if(!equipe){
    showToast('Selecione a equipe antes de salvar.', true);
    return;
  }

  sincronizarChipsNoEstado();

  const diario = garantirDiarioHoje();
  diario.equipe = equipe;

  if(modulo === 'rondas'){
    diario.rondas = JSON.parse(JSON.stringify(rondasState));
  } else {
    const mapaEstado = {
      dds: ddsState,
      vtr: vtrState,
      emergencia: emergenciaState,
      avaliacao: { tipos: avaliacaoTiposState.slice(), local: avaliacaoState.local, status: avaliacaoState.status, desc: avaliacaoState.desc },
      glp: glpState,
      fonteRadioativa: fonteState,
      inspecaoMensal: inspecaoState,
      trabalhoQuente: taqState,
      treinamento: treinamentoState,
      caminhoesCombate: caminhoesState
    };
    diario[modulo] = JSON.parse(JSON.stringify(mapaEstado[modulo]));
  }

  if(!diario._timestamps) diario._timestamps = {};
  diario._timestamps[modulo] = timestampAgora();

  const concluidas = rondasConcluidasDoDiario(diario);
  diario.status = concluidas === 3 ? 'concluido' : 'rascunho';

  salvarDiarioNoStorage(diario);

  atualizarTextoSalvo(modulo, diario._timestamps[modulo]);
  atualizarBadgeStatusDiario(diario);
  showToast('Módulo salvo.');
}

document.querySelectorAll('.btn-salvar-modulo').forEach(btn=>{
  btn.addEventListener('click', ()=> salvarModulo(btn.dataset.modulo));
});

// ===== CARREGAR O RASCUNHO DE HOJE (OU DEIXAR EM BRANCO) AO ABRIR "NOVO DIÁRIO" =====
const MODULOS_CHAVE = ['rondas','dds','vtr','emergencia','avaliacao','glp','fonteRadioativa','inspecaoMensal','trabalhoQuente','treinamento','caminhoesCombate'];

function preencherRondasEDdsNaTela(diario){
  rondasState = (diario.rondas && diario.rondas.length === 3)
    ? JSON.parse(JSON.stringify(diario.rondas))
    : [estadoRondaVazio(), estadoRondaVazio(), estadoRondaVazio()];
  preencherRondasNaTela();

  ddsState = diario.dds ? JSON.parse(JSON.stringify(diario.dds)) : { tema:'', evidenciaNome:null };
  preencherTextoOuVazio('fDdsTema', ddsState.tema);
  document.getElementById('fDdsEvidenciaLabel').textContent = ddsState.evidenciaNome || 'Tirar foto ou anexar da galeria';

  const ts = diario._timestamps || {};
  atualizarTextoSalvo('rondas', ts.rondas || null);
  atualizarTextoSalvo('dds', ts.dds || null);
}

function carregarDiarioAtual(){
  dataEmEdicao = hojeISO();
  document.getElementById('cabecalhoDiario').style.display = '';
  document.getElementById('modulosApenasHoje').style.display = '';
  document.getElementById('headerModoOntem').style.display = 'none';

  const diario = buscarDiarioHoje();

  if(!diario){
    diarioAtualId = null;
    resetForm();
    MODULOS_CHAVE.forEach(m => atualizarTextoSalvo(m, null));
    atualizarBadgeStatusDiario({ status: 'rascunho' });
    verificarDiarioOntemPendente();
    return;
  }

  diarioAtualId = diario.id;

  fEquipe.value = diario.equipe || (EQUIPES.includes(usuarioEmpresa) ? usuarioEmpresa : '');

  preencherRondasEDdsNaTela(diario);

  vtrState = diario.vtr ? JSON.parse(JSON.stringify(diario.vtr)) : { tag:'', placa:'', checklist:null, abastecimento:null, litros:null, local:'', evidenciaNome:null };

  preencherTextoOuVazio('fVtrTag', vtrState.tag);
  preencherTextoOuVazio('fVtrPlaca', vtrState.placa);
  preencherTextoOuVazio('fVtrLitros', vtrState.litros);
  preencherTextoOuVazio('fVtrLocal', vtrState.local);
  document.getElementById('fVtrEvidenciaLabel').textContent = vtrState.evidenciaNome || 'Tirar foto ou anexar da galeria';
  definirChipGroup('vtrChecklist', vtrState.checklist);
  definirChipGroup('vtrAbastecimento', vtrState.abastecimento);

  emergenciaState = diario.emergencia ? JSON.parse(JSON.stringify(diario.emergencia)) : {
    chegada:'', saida:'', local:'', aph:null, traumaMembro:'',
    resgateAnimal:'', resgateAnimalOutro:'', resgateStatus:null,
    eventoAmbiental:'', eventoAmbientalOutro:'',
    incendio:'', incendioOutro:'',
    danosMateriais:'', comentario:''
  };
  preencherTextoOuVazio('fEmerChegada', emergenciaState.chegada);
  preencherTextoOuVazio('fEmerSaida', emergenciaState.saida);
  preencherTextoOuVazio('fEmerLocal', emergenciaState.local);
  preencherTextoOuVazio('fEmerTraumaMembro', emergenciaState.traumaMembro);
  document.getElementById('fEmerResgateAnimal').value = emergenciaState.resgateAnimal || '';
  preencherTextoOuVazio('fEmerResgateOutro', emergenciaState.resgateAnimalOutro);
  document.getElementById('fEmerEventoAmbiental').value = emergenciaState.eventoAmbiental || '';
  preencherTextoOuVazio('fEmerEventoOutro', emergenciaState.eventoAmbientalOutro);
  document.getElementById('fEmerIncendio').value = emergenciaState.incendio || '';
  preencherTextoOuVazio('fEmerIncendioOutro', emergenciaState.incendioOutro);
  document.getElementById('fEmerDanosMateriais').value = emergenciaState.danosMateriais || '';
  preencherTextoOuVazio('fEmerComentario', emergenciaState.comentario);
  definirChipGroup('emerAph', emergenciaState.aph);
  definirChipGroup('emerResgateStatus', emergenciaState.resgateStatus);
  toggleAlterBox('emerResgateOutroBox', emergenciaState.resgateAnimal === 'Outro');
  toggleAlterBox('emerEventoOutroBox', emergenciaState.eventoAmbiental === 'Outro');
  toggleAlterBox('emerIncendioOutroBox', emergenciaState.incendio === 'Outro');

  const avaliacaoSalva = diario.avaliacao || { tipos:[], local:'', status:null, desc:'' };
  avaliacaoState = { local: avaliacaoSalva.local || '', status: avaliacaoSalva.status || null, desc: avaliacaoSalva.desc || '' };
  definirAvaliacaoTipos(avaliacaoSalva.tipos);
  preencherTextoOuVazio('fAvaliacaoLocal', avaliacaoState.local);
  preencherTextoOuVazio('fAvaliacaoDesc', avaliacaoState.desc);
  definirChipGroup('avaliacaoStatus', avaliacaoState.status);

  glpState = diario.glp ? JSON.parse(JSON.stringify(diario.glp)) : { acao:null, tag:'', inicio:'', termino:'' };
  preencherTextoOuVazio('fGlpTag', glpState.tag);
  preencherTextoOuVazio('fGlpInicio', glpState.inicio);
  preencherTextoOuVazio('fGlpTermino', glpState.termino);
  definirChipGroup('glpAcao', glpState.acao);

  fonteState = diario.fonteRadioativa ? JSON.parse(JSON.stringify(diario.fonteRadioativa)) : { acao:null, tag:'', horario:'', local:'' };
  preencherTextoOuVazio('fFonteTag', fonteState.tag);
  preencherTextoOuVazio('fFonteHorario', fonteState.horario);
  preencherTextoOuVazio('fFonteLocal', fonteState.local);
  definirChipGroup('fonteAcao', fonteState.acao);

  inspecaoState = diario.inspecaoMensal ? JSON.parse(JSON.stringify(diario.inspecaoMensal)) : { local:'', inicio:'', termino:'', comentario:'' };
  document.getElementById('fInspecaoLocal').value = inspecaoState.local || '';
  preencherTextoOuVazio('fInspecaoInicio', inspecaoState.inicio);
  preencherTextoOuVazio('fInspecaoTermino', inspecaoState.termino);
  preencherTextoOuVazio('fInspecaoComentario', inspecaoState.comentario);

  taqState = diario.trabalhoQuente ? JSON.parse(JSON.stringify(diario.trabalhoQuente)) : { tag:'', local:'', inicio:'', termino:'' };
  preencherTextoOuVazio('fTaqTag', taqState.tag);
  preencherTextoOuVazio('fTaqLocal', taqState.local);
  preencherTextoOuVazio('fTaqInicio', taqState.inicio);
  preencherTextoOuVazio('fTaqTermino', taqState.termino);

  treinamentoState = diario.treinamento ? JSON.parse(JSON.stringify(diario.treinamento)) : { tema:'', evidenciaNome:null };
  preencherTextoOuVazio('fTreinamentoTema', treinamentoState.tema);
  document.getElementById('fTreinamentoEvidenciaLabel').textContent = treinamentoState.evidenciaNome || 'Tirar foto ou anexar da galeria';

  caminhoesState = diario.caminhoesCombate ? JSON.parse(JSON.stringify(diario.caminhoesCombate)) : { abt:null, abtDesc:'', agua:50, combustivel:50, aar:null, aarDesc:'' };
  preencherTextoOuVazio('fAbtDesc', caminhoesState.abtDesc);
  preencherTextoOuVazio('fAarDesc', caminhoesState.aarDesc);
  document.getElementById('fCcAgua').value = caminhoesState.agua != null ? caminhoesState.agua : 50;
  document.getElementById('valCcAgua').textContent = (caminhoesState.agua != null ? caminhoesState.agua : 50) + '%';
  document.getElementById('fCcComb').value = caminhoesState.combustivel != null ? caminhoesState.combustivel : 50;
  document.getElementById('valCcComb').textContent = (caminhoesState.combustivel != null ? caminhoesState.combustivel : 50) + '%';
  definirChipGroup('abtStatus', caminhoesState.abt);
  definirChipGroup('aarStatus', caminhoesState.aar);

  const ts = diario._timestamps || {};
  MODULOS_CHAVE.forEach(m => atualizarTextoSalvo(m, ts[m] || null));
  atualizarBadgeStatusDiario(diario);
  verificarDiarioOntemPendente();
}

// ===== SUBMIT =====
// ===== SALVAMENTO POR MÓDULO (ver função salvarModulo mais abaixo) =====


function showToast(msg, isError){
  const toast = document.getElementById('toast');
  document.getElementById('toastMsg').textContent = msg;
  toast.querySelector('.tdot').style.background = isError ? '#C0402D' : '#5C7A56';
  toast.classList.add('show');
  setTimeout(()=> toast.classList.remove('show'), 2600);
}

// ===== HELPERS DE DADOS (rondas — usados no Painel/Histórico) =====
function bombasForaDoAutomatico(diario){
  const achados = [];
  (diario.rondas || []).forEach((ronda, i)=>{
    BOMBAS.forEach(b=>{
      if(ronda.bombas[b] && ronda.bombas[b] !== 'Automático'){
        achados.push({ bomba: b, status: ronda.bombas[b], ronda: i+1 });
      }
    });
  });
  return achados;
}
function ultimaRondaPreenchida(diario){
  const rondas = diario.rondas || [];
  for(let i = rondas.length - 1; i >= 0; i--){
    if(BOMBAS.some(b => rondas[i].bombas && rondas[i].bombas[b])) return rondas[i];
  }
  return rondas[rondas.length - 1] || { bombas:{} };
}
function rondasConcluidasDoDiario(diario){
  return (diario.rondas || []).filter(r => r.bombas && BOMBAS.every(b => r.bombas[b])).length;
}

// ===== PAINEL =====
function renderPainel(){
  const diarios = JSON.parse(localStorage.getItem('db_diarios') || '[]');
  const mesAtual = new Date().getMonth();
  const doMes = diarios.filter(d => new Date(d.data).getMonth() === mesAtual);

  document.getElementById('kpiTotal').textContent = doMes.length;

  const ultimo = diarios[0];

  if(ultimo){
    const foraDoAuto = bombasForaDoAutomatico(ultimo);
    document.getElementById('kpiAlteracoes').textContent = foraDoAuto.length;

    const rtis = (ultimo.rondas || []).map(r => r.rti).filter(v => typeof v === 'number');
    const mediaRti = rtis.length ? Math.round(rtis.reduce((a,b)=>a+b,0)/rtis.length) : 0;
    document.getElementById('kpiPipa').textContent = mediaRti + '%';

    const concluidas = rondasConcluidasDoDiario(ultimo);
    document.getElementById('kpiUltima').textContent = concluidas + '/3';
    document.getElementById('kpiUltimaHint').textContent = ultimo.equipe + ' · ' + formatDateBR(ultimo.data);

    const barsWrap = document.getElementById('barsWrap');
    const ronda = ultimaRondaPreenchida(ultimo);
    let rows = '<div class="status-grid">';
    BOMBAS.forEach(b=>{
      const val = ronda.bombas[b] || '—';
      const toneClass = val === 'Automático' ? 'tone-ok' : (val === 'Manual' ? 'tone-warn' : (val === 'Inoperante' ? 'tone-danger' : 'tone-warn'));
      rows += `
        <div class="status-row">
          <span class="sr-label">Bomba ${b}</span>
          <span class="status-pill ${toneClass}">${val}</span>
        </div>`;
    });
    rows += '</div>';
    barsWrap.innerHTML = rows;

    const pendingWrap = document.getElementById('pendingWrap');
    pendingWrap.innerHTML = '';
    const extras = [];
    if(ultimo.caminhoesCombate){
      if(ultimo.caminhoesCombate.abt === 'Não Conformidade') extras.push(['Caminhão ABT — Não Conformidade', ultimo.caminhoesCombate.abtDesc || 'Sem descrição informada']);
      if(ultimo.caminhoesCombate.aar === 'Não Conformidade') extras.push(['Caminhão AAR — Não Conformidade', ultimo.caminhoesCombate.aarDesc || 'Sem descrição informada']);
    }
    if(ultimo.avaliacao && ultimo.avaliacao.status === 'Alterado'){
      extras.push(['Avaliação alterada — ' + (ultimo.avaliacao.local || 'local não informado'), ultimo.avaliacao.desc || 'Sem descrição informada']);
    }
    if(foraDoAuto.length || extras.length){
      foraDoAuto.forEach(item=>{
        pendingWrap.insertAdjacentHTML('beforeend', `
          <div class="pending-item">
            <div class="pending-dot"></div>
            <div>
              <div class="pi-title">Bomba ${item.bomba} — ${item.status}</div>
              <div class="pi-sub">Identificado na ${item.ronda}ª ronda</div>
            </div>
          </div>
        `);
      });
      extras.forEach(([titulo, sub])=>{
        pendingWrap.insertAdjacentHTML('beforeend', `
          <div class="pending-item">
            <div class="pending-dot"></div>
            <div>
              <div class="pi-title">${titulo}</div>
              <div class="pi-sub">${sub}</div>
            </div>
          </div>
        `);
      });
    } else {
      pendingWrap.innerHTML = '<p style="color:var(--text-muted);font-size:13.5px;">Nenhuma pendência no último registro.</p>';
    }
  } else {
    document.getElementById('kpiAlteracoes').textContent = '0';
    document.getElementById('kpiPipa').textContent = '—';
    document.getElementById('kpiUltima').textContent = '—';
    document.getElementById('kpiUltimaHint').textContent = '—';
    document.getElementById('barsWrap').innerHTML = '<p style="color:var(--text-muted);font-size:13.5px;">Nenhum diário registrado ainda.</p>';
    document.getElementById('pendingWrap').innerHTML = '<p style="color:var(--text-muted);font-size:13.5px;">Nenhuma pendência no último registro.</p>';
  }

  const activityWrap = document.getElementById('activityWrap');
  activityWrap.innerHTML = MODULOS_INFO.map(m=>{
    const count = doMes.filter(d => m.tem(d)).length;
    return `
      <div class="activity-row">
        <span>${m.label}</span>
        <span class="ar-count">${count}</span>
      </div>`;
  }).join('');
}

// ===== MÓDULOS: metadados p/ Histórico e Painel =====
const MODULOS_INFO = [
  { key:'dds', label:'DDS',
    tem: d => !!(d.dds && d.dds.tema),
    alerta: () => false,
    detalhe: d => d.dds ? [['Tema', d.dds.tema || '—'], ['Evidência', d.dds.evidenciaNome || '—']] : null
  },
  { key:'vtr', label:'VTR',
    tem: d => !!(d.vtr && (d.vtr.tag || d.vtr.placa || d.vtr.checklist)),
    alerta: d => d.vtr && d.vtr.checklist === 'Não Realizado',
    detalhe: d => {
      if(!d.vtr) return null;
      const rows = [['Tag', d.vtr.tag || '—'], ['Placa', d.vtr.placa || '—'], ['Checklist', d.vtr.checklist || '—'], ['Abastecimento', d.vtr.abastecimento || '—']];
      if(d.vtr.abastecimento === 'Sim'){ rows.push(['Litros', d.vtr.litros || '—']); rows.push(['Local abastec.', d.vtr.local || '—']); }
      return rows;
    }
  },
  { key:'emergencia', label:'Emergência',
    tem: d => !!(d.emergencia && (d.emergencia.local || d.emergencia.aph || d.emergencia.resgateAnimal || d.emergencia.eventoAmbiental || d.emergencia.incendio || d.emergencia.danosMateriais)),
    alerta: () => true,
    detalhe: d => {
      if(!d.emergencia) return null;
      const e = d.emergencia;
      const rows = [['Chegada', e.chegada || '—'], ['Saída', e.saida || '—'], ['Local', e.local || '—'], ['APH', e.aph || '—']];
      if(e.aph === 'Trauma') rows.push(['Membro', e.traumaMembro || '—']);
      if(e.resgateAnimal) rows.push(['Resgate animal', (e.resgateAnimal === 'Outro' ? e.resgateAnimalOutro : e.resgateAnimal) + (e.resgateStatus ? ' — ' + e.resgateStatus : '')]);
      if(e.eventoAmbiental) rows.push(['Evento ambiental', e.eventoAmbiental === 'Outro' ? e.eventoAmbientalOutro : e.eventoAmbiental]);
      if(e.incendio) rows.push(['Incêndio', e.incendio === 'Outro' ? e.incendioOutro : e.incendio]);
      if(e.danosMateriais) rows.push(['Danos materiais', e.danosMateriais]);
      if(e.comentario) rows.push(['Comentário', e.comentario]);
      return rows;
    }
  },
  { key:'avaliacao', label:'Avaliação',
    tem: d => !!(d.avaliacao && ((d.avaliacao.tipos && d.avaliacao.tipos.length) || d.avaliacao.local)),
    alerta: d => d.avaliacao && d.avaliacao.status === 'Alterado',
    detalhe: d => {
      if(!d.avaliacao) return null;
      const rows = [
        ['Tipo', (d.avaliacao.tipos && d.avaliacao.tipos.length) ? d.avaliacao.tipos.join(', ') : '—'],
        ['Local', d.avaliacao.local || '—'],
        ['Status', d.avaliacao.status || '—']
      ];
      if(d.avaliacao.status === 'Alterado') rows.push(['Alteração', d.avaliacao.desc || '—']);
      return rows;
    }
  },
  { key:'glp', label:'Batedor GLP',
    tem: d => !!(d.glp && d.glp.acao),
    alerta: () => false,
    detalhe: d => d.glp ? [['Ação', d.glp.acao || '—'], ['Tag VRT', d.glp.tag || '—'], ['Início', d.glp.inicio || '—'], ['Término', d.glp.termino || '—']] : null
  },
  { key:'fonteRadioativa', label:'Fonte Radioativa',
    tem: d => !!(d.fonteRadioativa && d.fonteRadioativa.acao),
    alerta: d => d.fonteRadioativa && d.fonteRadioativa.acao === 'Bloqueio',
    detalhe: d => d.fonteRadioativa ? [['Ação', d.fonteRadioativa.acao || '—'], ['Tag', d.fonteRadioativa.tag || '—'], ['Horário', d.fonteRadioativa.horario || '—'], ['Local', d.fonteRadioativa.local || '—']] : null
  },
  { key:'inspecaoMensal', label:'Inspeção Mensal',
    tem: d => !!(d.inspecaoMensal && d.inspecaoMensal.local),
    alerta: () => false,
    detalhe: d => d.inspecaoMensal ? [['Local', d.inspecaoMensal.local || '—'], ['Início', d.inspecaoMensal.inicio || '—'], ['Término', d.inspecaoMensal.termino || '—'], ['Comentário', d.inspecaoMensal.comentario || '—']] : null
  },
  { key:'trabalhoQuente', label:'Trab. a Quente',
    tem: d => !!(d.trabalhoQuente && (d.trabalhoQuente.tag || d.trabalhoQuente.local)),
    alerta: () => false,
    detalhe: d => d.trabalhoQuente ? [['Tag equipamento', d.trabalhoQuente.tag || '—'], ['Local', d.trabalhoQuente.local || '—'], ['Início', d.trabalhoQuente.inicio || '—'], ['Término', d.trabalhoQuente.termino || '—']] : null
  },
  { key:'treinamento', label:'Treinamento',
    tem: d => !!(d.treinamento && d.treinamento.tema),
    alerta: () => false,
    detalhe: d => d.treinamento ? [['Tema', d.treinamento.tema || '—'], ['Evidência', d.treinamento.evidenciaNome || '—']] : null
  },
  { key:'caminhoesCombate', label:'Caminhões',
    tem: d => !!(d.caminhoesCombate && (d.caminhoesCombate.abt || d.caminhoesCombate.aar)),
    alerta: d => d.caminhoesCombate && (d.caminhoesCombate.abt === 'Não Conformidade' || d.caminhoesCombate.aar === 'Não Conformidade'),
    detalhe: d => {
      if(!d.caminhoesCombate) return null;
      const c = d.caminhoesCombate;
      const rows = [['ABT', c.abt || '—']];
      if(c.abt === 'Não Conformidade') rows.push(['N. conformidade (ABT)', c.abtDesc || '—']);
      rows.push(['Água', c.agua != null ? c.agua + '%' : '—']);
      rows.push(['Combustível', c.combustivel != null ? c.combustivel + '%' : '—']);
      rows.push(['AAR', c.aar || '—']);
      if(c.aar === 'Não Conformidade') rows.push(['N. conformidade (AAR)', c.aarDesc || '—']);
      return rows;
    }
  }
];

function rondasDetalhe(d){
  return (d.rondas || []).map((r,i)=>{
    const bombasAlteradas = BOMBAS.filter(b => r.bombas && r.bombas[b] && r.bombas[b] !== 'Automático');
    const linhas = [['R.T.I', r.rti != null ? r.rti + '%' : '—']];
    linhas.push(['Bombas alteradas', bombasAlteradas.length ? bombasAlteradas.map(b => b + ' (' + r.bombas[b] + ')').join(', ') : 'Nenhuma']);
    if(r.comentario) linhas.push(['Comentário', r.comentario]);
    return { titulo: (i+1) + 'ª Ronda', linhas };
  });
}

function renderDetailGrid(d){
  let html = '';
  rondasDetalhe(d).forEach(r=>{
    html += `<div class="detail-mod"><h4>${r.titulo}</h4>` +
      r.linhas.map(([k,v]) => `<div class="dm-row"><b>${k}:</b> ${v}</div>`).join('') +
      `</div>`;
  });
  MODULOS_INFO.forEach(m=>{
    if(m.tem(d)){
      const linhas = m.detalhe(d) || [];
      html += `<div class="detail-mod"><h4>${m.label}</h4>` +
        linhas.map(([k,v]) => `<div class="dm-row"><b>${k}:</b> ${v}</div>`).join('') +
        `</div>`;
    }
  });
  return html;
}

// ===== HISTÓRICO =====
function renderHistorico(){
  const diarios = JSON.parse(localStorage.getItem('db_diarios') || '[]');
  const body = document.getElementById('historicoBody');
  const empty = document.getElementById('historicoEmpty');
  body.innerHTML = '';

  if(!diarios.length){
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  diarios.forEach(d=>{
    const concluidas = rondasConcluidasDoDiario(d);
    const rondasBadgeClass = concluidas === 3 ? 'badge-ok' : (concluidas > 0 ? 'badge-warn' : 'badge-danger');
    const rtis = (d.rondas || []).map(r => r.rti).filter(v => typeof v === 'number');
    const mediaRti = rtis.length ? Math.round(rtis.reduce((a,b)=>a+b,0)/rtis.length) : 0;
    const foraDoAuto = bombasForaDoAutomatico(d);
    const atencaoBadge = foraDoAuto.length > 0
      ? `<span class="badge badge-warn">${foraDoAuto.length}</span>`
      : `<span class="badge badge-ok">0</span>`;

    const modsPresentes = MODULOS_INFO.filter(m => m.tem(d));
    const modChips = modsPresentes.length
      ? modsPresentes.map(m => `<span class="mod-chip ${m.alerta(d) ? 'mod-alert' : ''}">${m.label}</span>`).join('')
      : '<span style="color:var(--text-muted);font-size:12px;">—</span>';

    body.insertAdjacentHTML('beforeend', `
      <tr data-id="${d.id}">
        <td>${formatDateBR(d.data)}</td>
        <td>${d.nome}</td>
        <td>${d.equipe}</td>
        <td><span class="badge ${rondasBadgeClass}">${concluidas}/3</span></td>
        <td>${mediaRti}%</td>
        <td>${atencaoBadge}</td>
        <td>${modChips}</td>
        <td>
          <button class="expand-toggle" data-expand-id="${d.id}" type="button" aria-label="Ver detalhes">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
          </button>
        </td>
        <td>
          <button class="row-delete" data-delete-id="${d.id}" type="button" aria-label="Excluir diário">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-8 0l1 12a1 1 0 001 1h6a1 1 0 001-1l1-12"/></svg>
          </button>
        </td>
      </tr>
      <tr class="detail-row" id="detailRow_${d.id}">
        <td colspan="9">
          <div class="detail-wrap">
            <div class="detail-grid">${renderDetailGrid(d)}</div>
          </div>
        </td>
      </tr>
    `);
  });

  body.querySelectorAll('[data-delete-id]').forEach(btn=>{
    btn.addEventListener('click', ()=> abrirConfirmacaoExclusao(btn.dataset.deleteId));
  });
  body.querySelectorAll('[data-expand-id]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const row = document.getElementById('detailRow_' + btn.dataset.expandId);
      const aberto = row.classList.toggle('show');
      btn.classList.toggle('open', aberto);
    });
  });
}

let idParaExcluir = null;
function abrirConfirmacaoExclusao(id){
  idParaExcluir = id;
  document.getElementById('confirmOverlay').classList.add('show');
}
document.getElementById('confirmCancel').addEventListener('click', ()=>{
  idParaExcluir = null;
  document.getElementById('confirmOverlay').classList.remove('show');
});
document.getElementById('confirmDelete').addEventListener('click', ()=>{
  if(idParaExcluir){
    let diarios = JSON.parse(localStorage.getItem('db_diarios') || '[]');
    diarios = diarios.filter(d => d.id !== idParaExcluir);
    localStorage.setItem('db_diarios', JSON.stringify(diarios));
    showToast('Diário excluído.');
  }
  idParaExcluir = null;
  document.getElementById('confirmOverlay').classList.remove('show');
  renderHistorico();
});

function formatDateBR(iso){
  const [y,m,d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

// ===== INICIALIZAÇÃO =====
goTo('painel');
