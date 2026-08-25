# Diário de Bordo Digital — Brigada de Incêndio Industrial

Protótipo funcional de um sistema para digitalizar o diário de bordo da Brigada de Incêndio Industrial, substituindo as anotações manuais de turno por um registro estruturado e consultável.

> ⚠️ **Este é um protótipo de demonstração.** Os dados são fictícios e ficam salvos apenas no navegador (`localStorage`), sem backend ou banco de dados real.

## Visão geral

O sistema permite que o bombeiro em turno registre, ao final de cada plantão:

- Identificação do turno (data, bombeiro logado, equipe)
- Condição geral da unidade (Normal / Em alerta / Emergência em andamento)
- Situação dos sistemas de proteção contra incêndio (bomba de incêndio, alarme e detecção, rede de hidrantes)
- Verificações de áreas da unidade (central de alarme, casa de bombas, área de processo, subestações), com descrição obrigatória quando houver alteração
- Níveis da viatura (Pipa): água, LPT e combustível

Também conta com um **painel geral** (KPIs e pendências do último registro) e um **histórico** de todos os diários registrados, com opção de exclusão.

## Estrutura do projeto

```
diario-bordo/
├── index.html      # Tela de login (seleção do bombeiro)
├── app.html        # Aplicação principal (painel, novo diário, histórico)
├── css/
│   └── style.css   # Estilos, variáveis de tema e responsividade
├── js/
│   ├── data.js     # Dados fictícios (seed) usados na demonstração
│   ├── app.js      # Lógica da aplicação (navegação, formulário, painel, histórico)
│   └── theme.js    # Alternância entre modo claro e escuro
└── README.md
```

## Funcionalidades

- **Login simplificado**: seleção do bombeiro em uma lista (sem senha real — é um protótipo)
- **Novo diário**: formulário completo com validação dos campos obrigatórios
  - Data com preenchimento automático, sem permitir data futura nem anterior a 10 dias
  - Nome vinculado ao usuário autenticado na sessão
- **Painel geral**: indicadores do mês, situação dos sistemas de proteção e pendências abertas
- **Histórico**: tabela com todos os diários registrados e botão para excluir um registro (com confirmação)
- **Modo escuro**: alternância manual, com preferência salva no navegador
- **Responsivo**: layout adaptado para celular, tablet e desktop

## Como visualizar localmente

Por usar apenas HTML, CSS e JavaScript puro (sem build), basta abrir os arquivos em um servidor local:

```bash
# a partir da pasta do projeto
python3 -m http.server 8080
```

Depois acesse `http://localhost:8080/index.html` no navegador.

> Não recomendado abrir `index.html` diretamente com duplo clique (`file://`) — alguns navegadores restringem `sessionStorage`/`localStorage` nesse modo.

## Próximos passos (fora do escopo deste protótipo)

- Inspeção por QR Code / NFC
- Passagem de turno
- Gestão de desvios
- Viaturas e viabilidade
- Simulados & treinamentos
- Painel do Bombeiro Chefe
- Conformidade com NR-23, ITs do Corpo de Bombeiros e ISO 45001
- Backend real (autenticação, banco de dados, API) e app mobile

## Hospedagem

Site estático — compatível com qualquer hospedagem que sirva arquivos HTML/CSS/JS (ex.: Locaweb).
