// Colaboradores reais fornecidos pelo cliente para entrada no piloto.
// empresa = equipe/unidade de lotação. FUNÇÃO fica disponível para exibição futura.

const STAFF = [
  { nome: "FABRICIO FRANCISCO CARNEIRO CONCEIÇÃO", empresa: "ADM", funcao: "Supervisor de Bombeiro" },
  { nome: "MADSON FERNANDES DE SOUZA", empresa: "ADM", funcao: "Bombeiro Civil ADM" },
  { nome: "NILSIANE CARLOS DE MATOS DOS SANTOS", empresa: "ADM", funcao: "Bombeiro Civil ADM" },
  { nome: "THAMARA RAQUEL DE SOUSA SANTOS", empresa: "ADM", funcao: "Bombeiro Civil ADM" },

  { nome: "ANTONIO JOSE BEZERRA", empresa: "ALPHA", funcao: "Bombeiro Civil I" },
  { nome: "CAIO FERNANDO SILVA E SILVA", empresa: "ALPHA", funcao: "Bombeiro Civil Condutor" },
  { nome: "CARLOS HENRIQUE MARINHO SANTOS", empresa: "ALPHA", funcao: "Bombeiro Civil I" },
  { nome: "EZEQUIEL FERREIRA RIBEIRO", empresa: "ALPHA", funcao: "Bombeiro Civil I" },
  { nome: "FERNANDA FANILCY RIBEIRO PASTOR", empresa: "ALPHA", funcao: "Bombeiro Civil Líder" },
  { nome: "GEDEON MENDES FARIA JUNIOR", empresa: "ALPHA", funcao: "Bombeiro Civil Condutor" },
  { nome: "JORGE GOMES DA SILVA", empresa: "ALPHA", funcao: "Bombeiro Civil Condutor" },
  { nome: "JOSE DE RIBAMAR TORRES", empresa: "ALPHA", funcao: "Bombeiro Civil I" },
  { nome: "MARCIO ROBERTO MELO BRITO", empresa: "ALPHA", funcao: "Bombeiro Civil Condutor" },
  { nome: "RAILEIDE GARRETO DE SOUZA", empresa: "ALPHA", funcao: "Operador de CCE" },
  { nome: "WINNY DOS SANTOS CARVALHO", empresa: "ALPHA", funcao: "Operador de CCE" },

  { nome: "ANTONIO CARLOS CARVALHO SILVA", empresa: "BRAVO", funcao: "Bombeiro Civil I" },
  { nome: "ARNOLD FEITOSA MIRANDA", empresa: "BRAVO", funcao: "Bombeiro Civil Líder" },
  { nome: "CAROLINA QUADROS CARVALHO", empresa: "BRAVO", funcao: "Operador de CCE" },
  { nome: "IDERLAYNE LOPES DE SOUZA", empresa: "BRAVO", funcao: "Bombeiro Civil I" },
  { nome: "LUIS FELIPE CUNHA LIMA", empresa: "BRAVO", funcao: "Bombeiro Civil I" },
  { nome: "MARCONE PESTANA LEITE", empresa: "BRAVO", funcao: "Bombeiro Civil I" },
  { nome: "REGINIEL BARROS REIS FILHO", empresa: "BRAVO", funcao: "Bombeiro Civil Condutor" },
  { nome: "RUAN VICTOR COIMBRA SANTOS", empresa: "BRAVO", funcao: "Bombeiro Civil Condutor" },
  { nome: "SANDRADE REGINA SOUSA ANDRADE", empresa: "BRAVO", funcao: "Operador de CCE" },
  { nome: "TOME VIEIRA RIBEIRO JUNIOR", empresa: "BRAVO", funcao: "Bombeiro Civil Condutor" },
  { nome: "WILBER PRESLEY FERREIRA SANTOS", empresa: "BRAVO", funcao: "Bombeiro Civil Condutor" },

  { nome: "ADRIANA DOS SANTOS SOUSA", empresa: "CHARLIE", funcao: "Operador de CCE" },
  { nome: "ARTHUR AMORIM DA SILVA", empresa: "CHARLIE", funcao: "Bombeiro Civil Condutor" },
  { nome: "AUGUSTO CESAR CORREA NASCIMENTO", empresa: "CHARLIE", funcao: "Bombeiro Civil Condutor" },
  { nome: "EDILENE MARIA MADEIRA MENDES", empresa: "CHARLIE", funcao: "Bombeiro Civil I" },
  { nome: "FABRICIO RIBEIRO PINTO BRITTO", empresa: "CHARLIE", funcao: "Bombeiro Civil I" },
  { nome: "GEORGE DE JESUS COSTA ENES", empresa: "CHARLIE", funcao: "Bombeiro Civil Líder" },
  { nome: "GILSON CARLOS DA ROCHA SOUSA", empresa: "CHARLIE", funcao: "Bombeiro Civil I" },
  { nome: "HELGA DE JESUS PEREIRA MORAES", empresa: "CHARLIE", funcao: "Operador de CCE" },
  { nome: "RAY CARLOS LIMA SERRA", empresa: "CHARLIE", funcao: "Bombeiro Civil I" },
  { nome: "RICHARDSON COSTA MARINHO", empresa: "CHARLIE", funcao: "Bombeiro Civil I" },
  { nome: "WILDSON FERNANDO RIBEIRO PASTOR", empresa: "CHARLIE", funcao: "Bombeiro Civil Condutor" },

  { nome: "CARLOS DE JESUS COSTA DA COSTA", empresa: "DELTA", funcao: "Bombeiro Civil Líder" },
  { nome: "CHARLES ALVES DA SILVA", empresa: "DELTA", funcao: "Bombeiro Civil Condutor" },
  { nome: "DANIEL CESAR RIBEIRO ANDRADE", empresa: "DELTA", funcao: "Bombeiro Civil Condutor" },
  { nome: "FRANCEILDO PEREIRA MARINHO", empresa: "DELTA", funcao: "Bombeiro Civil I" },
  { nome: "MAYRON BARBOSA MONTEIRO", empresa: "DELTA", funcao: "Bombeiro Civil I" },
  { nome: "NATALIANE VIANA DE ALMEIDA", empresa: "DELTA", funcao: "Bombeiro Civil I" },
  { nome: "RODRIGO DE JESUS DOS REIS SILVA", empresa: "DELTA", funcao: "Bombeiro Civil Condutor" },
  { nome: "SILMARA ANDRADE FACUNDES", empresa: "DELTA", funcao: "Operador de CCE" },
  { nome: "TATIANA CRISTINA BEZERRA CUNHA", empresa: "DELTA", funcao: "Operador de CCE" },
  { nome: "VINICIUS GRACINDO ALVES DE SOUSA", empresa: "DELTA", funcao: "Bombeiro Civil I" },
  { nome: "WANDERSON LIMA COSTA", empresa: "DELTA", funcao: "Bombeiro Civil I" },
  { nome: "WELLINGTON SILVA PINHEIRO", empresa: "DELTA", funcao: "Bombeiro Civil I" },

  { nome: "ANTONIO IRAN BARBOSA JUNIOR", empresa: "ESTRUTURA", funcao: "Bombeiro Civil I" },
  { nome: "BRUNO FERREIRA LIMA", empresa: "ESTRUTURA", funcao: "Bombeiro Civil I" },
  { nome: "JOSÉ RIBAMAR ROLAND JUNIOR", empresa: "ESTRUTURA", funcao: "Bombeiro Civil Condutor" },
  { nome: "MARCOS AURELIO PEREIRA DA SILVA", empresa: "ESTRUTURA", funcao: "Bombeiro Civil Condutor" },
  { nome: "RENAN JONATAS SENA BALDEZ", empresa: "ESTRUTURA", funcao: "Bombeiro Civil Condutor" },
  { nome: "WANDERLEY BRITO DA SILVA", empresa: "ESTRUTURA", funcao: "Bombeiro Civil Condutor" }
];

// Times operacionais selecionáveis no campo "Nome da equipe" do diário.
// ADM fica de fora — é suporte/gestão, não uma equipe de campo.
const EQUIPES = ["ALPHA", "BRAVO", "CHARLIE", "DELTA", "ESTRUTURA"];

function nomeParaLabel(nomeCompleto){
  return nomeCompleto
    .toLowerCase()
    .split(' ')
    .map(w => w.length ? w[0].toUpperCase() + w.slice(1) : w)
    .join(' ');
}

function popularSelectEquipes(selectEl){
  const empresas = [...new Set(STAFF.map(p => p.empresa))];
  empresas.forEach(emp => {
    const opt = document.createElement('option');
    opt.value = emp;
    opt.textContent = emp;
    selectEl.appendChild(opt);
  });
}

function popularSelectBombeirosPorEmpresa(selectEl, empresa){
  selectEl.innerHTML = '<option value="" disabled selected>Selecione o bombeiro</option>';
  STAFF.filter(p => p.empresa === empresa).forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.nome;
    opt.textContent = nomeParaLabel(p.nome);
    selectEl.appendChild(opt);
  });
}

function buscarStaff(nome){
  return STAFF.find(p => p.nome === nome);
}
