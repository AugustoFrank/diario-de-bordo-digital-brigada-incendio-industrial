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

// ===== DATA: hoje / limite de 10 dias =====
const hoje = new Date();
const limite = new Date();
limite.setDate(hoje.getDate() - 10);
const fData = document.getElementById('fData');
fData.min = limite.toISOString().slice(0,10);
fData.max = hoje.toISOString().slice(0,10);
fData.value = hoje.toISOString().slice(0,10);

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
    group.querySelectorAll('.chip').forEach((chip,i)=>{
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

// ===== SUBMIT =====
document.getElementById('diarioForm').addEventListener('submit', function(e){
  e.preventDefault();

  const equipe = fEquipe.value;
  if(!equipe){
    showToast('Selecione a equipe antes de registrar.', true);
    return;
  }

  const concluidas = atualizarProgressoRondas();
  if(concluidas < 3){
    showToast('As 3 rondas do turno são obrigatórias antes de registrar o diário.', true);
    return;
  }

  // sincroniza os grupos de chip nos objetos de estado antes de salvar
  vtrState.checklist = chipGroupState.vtrChecklist;
  vtrState.abastecimento = chipGroupState.vtrAbastecimento;
  emergenciaState.aph = chipGroupState.emerAph;
  emergenciaState.resgateStatus = chipGroupState.emerResgateStatus;
  avaliacaoState.status = chipGroupState.avaliacaoStatus;
  glpState.acao = chipGroupState.glpAcao;
  fonteState.acao = chipGroupState.fonteAcao;
  caminhoesState.abt = chipGroupState.abtStatus;
  caminhoesState.aar = chipGroupState.aarStatus;

  const registro = {
    id: 'd_' + Date.now() + '_' + Math.random().toString(36).slice(2,7),
    data: fData.value,
    nome: usuarioLabel,
    equipe,
    rondas: JSON.parse(JSON.stringify(rondasState)),
    dds: JSON.parse(JSON.stringify(ddsState)),
    vtr: JSON.parse(JSON.stringify(vtrState)),
    emergencia: JSON.parse(JSON.stringify(emergenciaState)),
    avaliacao: { tipos: avaliacaoTiposState.slice(), ...JSON.parse(JSON.stringify(avaliacaoState)) },
    glp: JSON.parse(JSON.stringify(glpState)),
    fonteRadioativa: JSON.parse(JSON.stringify(fonteState)),
    inspecaoMensal: JSON.parse(JSON.stringify(inspecaoState)),
    trabalhoQuente: JSON.parse(JSON.stringify(taqState)),
    treinamento: JSON.parse(JSON.stringify(treinamentoState)),
    caminhoesCombate: JSON.parse(JSON.stringify(caminhoesState))
  };

  const diarios = JSON.parse(localStorage.getItem('db_diarios') || '[]');
  diarios.unshift(registro);
  localStorage.setItem('db_diarios', JSON.stringify(diarios));

  showToast('Diário registrado com sucesso.');
  resetForm();
  setTimeout(()=> goTo('historico'), 500);
});

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
  diario.rondas.forEach((ronda, i)=>{
    BOMBAS.forEach(b=>{
      if(ronda.bombas[b] && ronda.bombas[b] !== 'Automático'){
        achados.push({ bomba: b, status: ronda.bombas[b], ronda: i+1 });
      }
    });
  });
  return achados;
}
function ultimaRondaPreenchida(diario){
  for(let i = diario.rondas.length - 1; i >= 0; i--){
    if(BOMBAS.some(b => diario.rondas[i].bombas[b])) return diario.rondas[i];
  }
  return diario.rondas[diario.rondas.length - 1];
}
function rondasConcluidasDoDiario(diario){
  return diario.rondas.filter(r => BOMBAS.every(b => r.bombas[b])).length;
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

    const rtis = ultimo.rondas.map(r => r.rti).filter(v => typeof v === 'number');
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
    if(foraDoAuto.length){
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
    const rtis = d.rondas.map(r => r.rti).filter(v => typeof v === 'number');
    const mediaRti = rtis.length ? Math.round(rtis.reduce((a,b)=>a+b,0)/rtis.length) : 0;
    const foraDoAuto = bombasForaDoAutomatico(d);
    const atencaoBadge = foraDoAuto.length > 0
      ? `<span class="badge badge-warn">${foraDoAuto.length}</span>`
      : `<span class="badge badge-ok">0</span>`;

    body.insertAdjacentHTML('beforeend', `
      <tr data-id="${d.id}">
        <td>${formatDateBR(d.data)}</td>
        <td>${d.nome}</td>
        <td>${d.equipe}</td>
        <td><span class="badge ${rondasBadgeClass}">${concluidas}/3</span></td>
        <td>${mediaRti}%</td>
        <td>${atencaoBadge}</td>
        <td>
          <button class="row-delete" data-delete-id="${d.id}" type="button" aria-label="Excluir diário">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-8 0l1 12a1 1 0 001 1h6a1 1 0 001-1l1-12"/></svg>
          </button>
        </td>
      </tr>
    `);
  });

  body.querySelectorAll('[data-delete-id]').forEach(btn=>{
    btn.addEventListener('click', ()=> abrirConfirmacaoExclusao(btn.dataset.deleteId));
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
