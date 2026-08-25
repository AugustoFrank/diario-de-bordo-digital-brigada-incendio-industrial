// Dados fictícios usados apenas para o protótipo ter contexto na demonstração.
// Em produção, isso viria do banco de dados via backend.

function isoDateOffset(daysAgo){
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0,10);
}

const MOCK_DIARIOS = [
  {
    id: 1,
    data: isoDateOffset(1),
    nome: "Raimundo Silva",
    equipe: "🦁 Leão",
    condicao: "Normal",
    bomba: "Automático",
    alarmeDeteccao: "Normal",
    hidrantes: "Pressurizada",
    central: "Normal", centralDesc: "",
    casa: "Normal", casaDesc: "",
    area: "Normal", areaDesc: "",
    sub: "Normal", subDesc: "",
    agua: 95, lpt: 90, comb: 88
  },
  {
    id: 2,
    data: isoDateOffset(2),
    nome: "João Paulo Costa",
    equipe: "🐆 Onça",
    condicao: "Em alerta",
    bomba: "Manual",
    alarmeDeteccao: "Normal",
    hidrantes: "Pressurizada",
    central: "Alterado", centralDesc: "Sensor da área B apresentou falha intermitente durante o turno.",
    casa: "Normal", casaDesc: "",
    area: "Normal", areaDesc: "",
    sub: "Normal", subDesc: "",
    agua: 100, lpt: 100, comb: 95
  },
  {
    id: 3,
    data: isoDateOffset(4),
    nome: "Fernanda Aragão",
    equipe: "🦭 Foca",
    condicao: "Normal",
    bomba: "Automático",
    alarmeDeteccao: "Falha / Silenciado",
    hidrantes: "Pressurizada",
    central: "Normal", centralDesc: "",
    casa: "Alterado", casaDesc: "Vazamento leve identificado na válvula de recalque, manutenção acionada.",
    area: "Normal", areaDesc: "",
    sub: "Normal", subDesc: "",
    agua: 100, lpt: 97, comb: 100
  },
  {
    id: 4,
    data: isoDateOffset(6),
    nome: "Carlos Menezes",
    equipe: "🦁 Leão",
    condicao: "Normal",
    bomba: "Automático",
    alarmeDeteccao: "Normal",
    hidrantes: "Pressurizada",
    central: "Normal", centralDesc: "",
    casa: "Normal", casaDesc: "",
    area: "Normal", areaDesc: "",
    sub: "Normal", subDesc: "",
    agua: 100, lpt: 100, comb: 100
  }
];

function seedMockDataIfEmpty(){
  const existing = localStorage.getItem('db_diarios');
  if(!existing){
    localStorage.setItem('db_diarios', JSON.stringify(MOCK_DIARIOS));
  }
}
