// ===== AUTENTICAÇÃO (mock) =====
const usuario = sessionStorage.getItem('db_usuario');
if(!usuario){
  window.location.href = 'index.html';
}
document.getElementById('userName').textContent = usuario || '—';
const initials = (usuario || '--').split(' ').map(p=>p[0]).slice(0,2).join('').toUpperCase();
document.getElementById('avatarInitials').textContent = initials;
document.getElementById('avatarInitialsMobile').textContent = initials;
document.getElementById('fNome').textContent = usuario || '—';

document.getElementById('logoutBtn').addEventListener('click', ()=>{
  sessionStorage.removeItem('db_usuario');
  window.location.href = 'index.html';
});

seedMockDataIfEmpty();

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

// ===== NAVEGAÇÃO ENTRE VIEWS =====
const views = { painel:'view-painel', novo:'view-novo', historico:'view-historico' };
const titles = {
  painel: ['Painel geral', 'Visão consolidada da prontidão da unidade'],
  novo: ['Novo diário', 'Registro de turno — ' + (usuario || '')],
  historico: ['Histórico', 'Diários registrados para consulta e auditoria']
};

function goTo(view){
  Object.values(views).forEach(id => document.getElementById(id).classList.remove('active'));
  document.getElementById(views[view]).classList.add('active');
  document.querySelectorAll('.nav-item[data-view]').forEach(b=>b.classList.remove('active'));
  document.querySelector('.nav-item[data-view="'+view+'"]').classList.add('active');
  document.getElementById('pageTitle').textContent = titles[view][0];
  document.getElementById('pageSubtitle').textContent = titles[view][1];
  if(view === 'painel') renderPainel();
  if(view === 'historico') renderHistorico();
}
document.querySelectorAll('.nav-item[data-view]').forEach(btn=>{
  btn.addEventListener('click', ()=> goTo(btn.dataset.view));
});

// ===== CHIP TOGGLES (grupos de status) =====
const chipState = {};
document.querySelectorAll('.status-toggle').forEach(group=>{
  const name = group.dataset.group;
  const tones = (group.dataset.tones || '').split(',');
  chipState[name] = null;
  const chips = group.querySelectorAll('.chip');
  chips.forEach((chip, i)=>{
    chip.addEventListener('click', ()=>{
      chips.forEach(c=>{ c.classList.remove('selected'); c.removeAttribute('data-tone'); });
      chip.classList.add('selected');
      if(tones[i]) chip.setAttribute('data-tone', tones[i]);
      chipState[name] = chip.dataset.value;
      onChipChange(name, chip.dataset.value);
    });
  });
});

function onChipChange(name, value){
  if(name === 'condicao') updateStatusStrip(value);
  const alterMap = {
    central: 'alterCentral',
    casa: 'alterCasa',
    area: 'alterArea',
    sub: 'alterSub'
  };
  if(alterMap[name]){
    const box = document.getElementById(alterMap[name]);
    if(value === 'Alterado'){ box.classList.add('show'); }
    else { box.classList.remove('show'); }
  }
}

function updateStatusStrip(condicao){
  const strip = document.getElementById('statusStrip');
  const text = document.getElementById('statusStripText');
  strip.classList.remove('warn','danger');
  if(condicao === 'Em alerta') strip.classList.add('warn');
  if(condicao === 'Emergência em andamento') strip.classList.add('danger');
  text.textContent = 'Condição geral da unidade: ' + condicao;
}

// ===== SLIDERS DA VIATURA =====
function bindRange(inputId, labelId){
  const input = document.getElementById(inputId);
  const label = document.getElementById(labelId);
  input.addEventListener('input', ()=> label.textContent = input.value + '%');
}
bindRange('fAgua','valAgua');
bindRange('fLpt','valLpt');
bindRange('fComb','valComb');

// ===== LIMPAR FORMULÁRIO =====
document.getElementById('btnLimpar').addEventListener('click', resetForm);
function resetForm(){
  document.querySelectorAll('.status-toggle .chip').forEach(c=>{ c.classList.remove('selected'); c.removeAttribute('data-tone'); });
  Object.keys(chipState).forEach(k => chipState[k] = null);
  document.querySelectorAll('.alter-box').forEach(b => b.classList.remove('show'));
  document.querySelectorAll('#diarioForm textarea').forEach(t => t.value = '');
  document.getElementById('fEquipe').value = '';
  ['fAgua','fLpt','fComb'].forEach(id=>{
    document.getElementById(id).value = 100;
  });
  document.getElementById('valAgua').textContent = '100%';
  document.getElementById('valLpt').textContent = '100%';
  document.getElementById('valComb').textContent = '100%';
  fData.value = hoje.toISOString().slice(0,10);
  updateStatusStrip('Normal');
}

// ===== SUBMIT =====
document.getElementById('diarioForm').addEventListener('submit', function(e){
  e.preventDefault();

  const equipe = document.getElementById('fEquipe').value;
  if(!equipe || !chipState.condicao || !chipState.bomba || !chipState.alarmeDeteccao || !chipState.hidrantes || !chipState.central || !chipState.casa || !chipState.area || !chipState.sub){
    showToast('Preencha todos os campos obrigatórios antes de registrar.', true);
    return;
  }

  const registro = {
    id: Date.now(),
    data: fData.value,
    nome: usuario,
    equipe,
    condicao: chipState.condicao,
    bomba: chipState.bomba,
    alarmeDeteccao: chipState.alarmeDeteccao,
    hidrantes: chipState.hidrantes,
    central: chipState.central, centralDesc: document.getElementById('fCentralDesc').value,
    casa: chipState.casa, casaDesc: document.getElementById('fCasaDesc').value,
    area: chipState.area, areaDesc: document.getElementById('fAreaDesc').value,
    sub: chipState.sub, subDesc: document.getElementById('fSubDesc').value,
    agua: Number(document.getElementById('fAgua').value),
    lpt: Number(document.getElementById('fLpt').value),
    comb: Number(document.getElementById('fComb').value)
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

// ===== PAINEL =====
function renderPainel(){
  const diarios = JSON.parse(localStorage.getItem('db_diarios') || '[]');
  const mesAtual = new Date().getMonth();
  const doMes = diarios.filter(d => new Date(d.data).getMonth() === mesAtual);

  document.getElementById('kpiTotal').textContent = doMes.length;

  let alteracoes = 0;
  doMes.forEach(d=>{
    ['central','casa','area','sub'].forEach(campo=>{
      if(d[campo] === 'Alterado') alteracoes++;
    });
  });
  document.getElementById('kpiAlteracoes').textContent = alteracoes;

  if(doMes.length){
    const media = doMes.reduce((acc,d)=> acc + (d.agua + d.lpt + d.comb)/3, 0) / doMes.length;
    document.getElementById('kpiPipa').textContent = Math.round(media) + '%';
  } else {
    document.getElementById('kpiPipa').textContent = '—';
  }

  const ultimo = diarios[0];
  if(ultimo){
    document.getElementById('kpiUltima').textContent = ultimo.condicao;
    document.getElementById('kpiUltimaHint').textContent = ultimo.equipe + ' · ' + formatDateBR(ultimo.data);
    updateStatusStrip(ultimo.condicao);
  }

  // sistemas de proteção — grade de status (com base no último diário)
  const barsWrap = document.getElementById('barsWrap');
  barsWrap.innerHTML = '';
  if(ultimo){
    const tone = (ok) => ok ? 'tone-ok' : 'tone-warn';
    const itens = [
      ['Bomba de incêndio', ultimo.bomba, ultimo.bomba === 'Inoperante' ? 'tone-danger' : (ultimo.bomba === 'Manual' ? 'tone-warn' : 'tone-ok')],
      ['Alarme e detecção', ultimo.alarmeDeteccao, ultimo.alarmeDeteccao === 'Normal' ? 'tone-ok' : 'tone-danger'],
      ['Rede de hidrantes', ultimo.hidrantes, ultimo.hidrantes === 'Pressurizada' ? 'tone-ok' : 'tone-danger'],
      ['Central de alarme', ultimo.central, tone(ultimo.central === 'Normal')],
      ['Casa de bombas', ultimo.casa, tone(ultimo.casa === 'Normal')],
      ['Área de processo', ultimo.area, tone(ultimo.area === 'Normal')],
      ['Subestações', ultimo.sub, tone(ultimo.sub === 'Normal')],
    ];
    let rows = '<div class="status-grid">';
    itens.forEach(([label, val, toneClass])=>{
      rows += `
        <div class="status-row">
          <span class="sr-label">${label}</span>
          <span class="status-pill ${toneClass}">${val}</span>
        </div>`;
    });
    rows += '</div>';
    barsWrap.innerHTML = rows;
  } else {
    barsWrap.innerHTML = '<p style="color:var(--text-muted);font-size:13.5px;">Nenhum diário registrado ainda.</p>';
  }

  // pendências
  const pendingWrap = document.getElementById('pendingWrap');
  pendingWrap.innerHTML = '';
  const pendencias = [];
  if(ultimo){
    if(ultimo.central === 'Alterado') pendencias.push(['Central de alarme', ultimo.centralDesc]);
    if(ultimo.casa === 'Alterado') pendencias.push(['Casa de bombas', ultimo.casaDesc]);
    if(ultimo.area === 'Alterado') pendencias.push(['Área de processo', ultimo.areaDesc]);
    if(ultimo.sub === 'Alterado') pendencias.push(['Subestações', ultimo.subDesc]);
  }
  if(pendencias.length){
    pendencias.forEach(([titulo, desc])=>{
      pendingWrap.insertAdjacentHTML('beforeend', `
        <div class="pending-item">
          <div class="pending-dot"></div>
          <div>
            <div class="pi-title">${titulo}</div>
            <div class="pi-sub">${desc || 'Sem descrição informada'}</div>
          </div>
        </div>
      `);
    });
  } else {
    pendingWrap.innerHTML = '<p style="color:#8C8175;font-size:13.5px;">Nenhuma pendência no último registro.</p>';
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
    const pendencias = ['central','casa','area','sub'].filter(c => d[c] === 'Alterado').length;
    const badge = pendencias > 0
      ? `<span class="badge badge-warn">${pendencias} alteração(ões)</span>`
      : `<span class="badge badge-ok">Sem pendências</span>`;
    const condBadgeClass = d.condicao === 'Normal' ? 'badge-ok' : (d.condicao === 'Em alerta' ? 'badge-warn' : 'badge-danger');

    body.insertAdjacentHTML('beforeend', `
      <tr>
        <td>${formatDateBR(d.data)}</td>
        <td>${d.nome}</td>
        <td>${d.equipe}</td>
        <td><span class="badge ${condBadgeClass}">${d.condicao}</span></td>
        <td>${badge}</td>
        <td>${d.agua}%</td>
        <td>${d.lpt}%</td>
        <td>${d.comb}%</td>
        <td>
          <button type="button" class="btn-delete" title="Excluir registro" aria-label="Excluir registro" onclick="deleteDiario(${d.id})">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0l-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16z"/></svg>
          </button>
        </td>
      </tr>
    `);
  });
}

// ===== EXCLUIR DIÁRIO =====
function deleteDiario(id){
  const confirmado = window.confirm('Tem certeza que deseja excluir este diário? Essa ação não pode ser desfeita.');
  if(!confirmado) return;

  const diarios = JSON.parse(localStorage.getItem('db_diarios') || '[]');
  const restantes = diarios.filter(d => d.id !== id);
  localStorage.setItem('db_diarios', JSON.stringify(restantes));

  renderHistorico();
  showToast('Diário excluído.');
}

function formatDateBR(iso){
  const [y,m,d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

// ===== INICIALIZAÇÃO =====
updateStatusStrip('Normal');
goTo('painel');
