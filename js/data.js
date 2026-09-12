// Dados fictícios usados apenas para o protótipo ter contexto na demonstração.
// Em produção, isso viria do banco de dados via backend.

const BOMBAS = [
  "370S Jockey", "370S Elétrica", "370S Diesel",
  "371S Jockey", "371S Elétrica", "371S Diesel",
  "370R Jockey", "370R Elétrica", "370R Diesel",
  "370D Jockey", "370D Elétrica", "370D Diesel"
];

const OPCOES_RESGATE_ANIMAL = ["Jacaré","Gato","Cachorro","Cobra","Iguana","Macaco","Escorpião","Aranha","Pássaro","Preguiça","Outro"];
const OPCOES_EVENTO_AMBIENTAL = ["Óleo","Licor Cáustico","Combustível","Outro"];
const OPCOES_INCENDIO = ["Florestal","Veicular","Outro"];
const OPCOES_DANOS_MATERIAIS = ["Veículos","VEIM","Queda de Objeto"];
const OPCOES_INSPECAO_MENSAL = [
  "Áreas remotas","Caixas de mangueiras","F500","Fire alarm","Fire pro","Fm200",
  "Hidrantes","Fontes radioativa","Novec 1230","Risco ambiental","Risco de explosão",
  "Riscos e perdas","Sinalização de emergência","Sistemas de bombas","Sprinklers",
  "Válvulas divisionais","Válvulas do sistemas de bombas"
];

function isoDateOffset(daysAgo){
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0,10);
}

function gerarId(){
  return 'seed_' + Math.random().toString(36).slice(2,9);
}

function rondaCompleta(rti, statusPadrao){
  const bombas = {};
  BOMBAS.forEach(b => bombas[b] = statusPadrao);
  return { rti, bombas, evidenciaNome: "vistoria.jpg", comentario: "Ronda realizada sem intercorrências." };
}

const MOCK_DIARIOS = [
  {
    id: gerarId(),
    data: isoDateOffset(1),
    nome: "Fernanda Fanilcy Ribeiro Pastor",
    equipe: "ALPHA",
    rondas: [
      rondaCompleta(55, "Automático"),
      rondaCompleta(50, "Automático"),
      (function(){ const r = rondaCompleta(48, "Automático"); r.bombas["370R Jockey"] = "Manual"; r.comentario = "Bomba 370R Jockey operando em modo manual, aguardando manutenção."; return r; })()
    ],
    dds: { tema: "Uso correto de EPI em áreas classificadas", evidenciaNome: "dds-alpha.jpg" }
  },
  {
    id: gerarId(),
    data: isoDateOffset(2),
    nome: "Arnold Feitosa Miranda",
    equipe: "BRAVO",
    rondas: [
      rondaCompleta(60, "Automático"),
      rondaCompleta(58, "Automático"),
      rondaCompleta(57, "Automático")
    ],
    dds: { tema: "Procedimento de evacuação em emergência", evidenciaNome: "dds-bravo.jpg" }
  },
  {
    id: gerarId(),
    data: isoDateOffset(4),
    nome: "George de Jesus Costa Enes",
    equipe: "CHARLIE",
    rondas: [
      rondaCompleta(50, "Automático"),
      (function(){ const r = rondaCompleta(45, "Automático"); r.bombas["370D Diesel"] = "Inoperante"; r.comentario = "370D Diesel inoperante, manutenção acionada."; return r; })(),
      rondaCompleta(50, "Automático")
    ],
    dds: { tema: "Inspeção visual de mangueiras", evidenciaNome: null }
  }
];

function seedMockDataIfEmpty(){
  const existing = localStorage.getItem('db_diarios');
  if(!existing){
    localStorage.setItem('db_diarios', JSON.stringify(MOCK_DIARIOS));
  }
}
