# SistemaPortaria

## 1. Visão Geral do Sistema
O **SistemaPortaria** é um sistema de controle de acesso e gestão de portaria voltado para condomínios residenciais e comerciais. O objetivo principal do sistema é modernizar, agilizar e registrar com segurança o fluxo de moradores, visitantes, prestadores de serviços, veículos, encomendas e ocorrências no condomínio.

---

## 2. Especificações do Sistema (Specs)

### 2.1 Requisitos Funcionais (RF)

#### RF01 - Gestão de Unidades e Moradores
- **RF01.1**: Cadastro, edição, inativação e consulta de unidades (blocos, torres, apartamentos ou casas).
- **RF01.2**: Cadastro, edição e consulta de moradores associados às suas respectivas unidades.
- **RF01.3**: Registro de contatos de emergência e responsáveis por unidade.
- **RF01.4**: Cadastro de veículos de moradores (placa, marca, modelo, cor).

#### RF02 - Controle de Acesso (Visitantes e Prestadores)
- **RF02.1**: Registro de entrada de visitantes e prestadores de serviços (nome, documento/CPF, foto, unidade de destino e autorizador).
- **RF02.2**: Sistema de pré-autorização de visitantes criada pelo morador.
- **RF02.3**: Registro de saída de visitantes e prestadores de serviço com horário e confirmação do operador.
- **RF02.4**: Consulta e relatórios de histórico de acessos por período, unidade ou visitante.

#### RF03 - Gestão de Encomendas e Correspondências
- **RF03.1**: Registro do recebimento de encomendas pela portaria (data/hora, morador/unidade de destino, código de rastreio, remetente/transportadora, quantidade de pacotes).
- **RF03.2**: Envio de notificação ao morador referente ao recebimento de nova encomenda.
- **RF03.3**: Registro de entrega/retirada da encomenda (data/hora, nome de quem retirou, confirmação de recebimento).
- **RF03.4**: Consulta de encomendas pendentes de retirada e histórico de entregas.

#### RF04 - Gestão de Veículos e Garagem
- **RF04.1**: Controle de acesso de veículos autorizados por identificação de placa.
- **RF04.2**: Registro e acompanhamento do uso de vagas de visitantes/estacionamento interno.

#### RF05 - Livro de Ocorrências e Comunicados
- **RF05.1**: Registro de ocorrências digitais pela portaria ou moradores (categoria, descrição, data/hora, fotos/anexos e status).
- **RF05.2**: Mural de avisos e comunicados emitidos pela administração/síndico para os moradores.

#### RF06 - Autenticação e Perfis de Acesso
- **RF06.1**: Autenticação de usuários via credenciais seguras.
- **RF06.2**: Perfis de acesso distintos:
  - **Administrador / Síndico**: Gestão completa de cadastros, relatórios e configurações.
  - **Porteiro / Operador**: Foco operacional em acessos, encomendas e ocorrências.
  - **Morador**: Visualização de encomendas, autorização de visitantes e comunicados.
- **RF06.3**: Trilha de auditoria (logs) de ações realizadas pelos operadores.

### 2.2 Requisitos Não-Funcionais (RNF)
- **RNF01 - Desempenho**: Tempo de resposta para consultas rápidas na portaria inferior a 2 segundos.
- **RNF02 - Segurança**: Autenticação e autorização robustas (controle de acesso baseado em funções - RBAC), proteção de dados pessoais em conformidade com a LGPD.
- **RNF03 - Disponibilidade**: Operação com alta disponibilidade (24/7) garantindo que a portaria não fique inoperante.
- **RNF04 - Usabilidade**: Interface intuitiva e otimizada para operação rápida em computadores ou tablets da portaria.
- **RNF05 - Rastreabilidade**: Armazenamento de logs imutáveis para registro de acessos e movimentação de encomendas.

---

## 3. Divisão em Tarefas (Task Breakdown)

### Épico 1: Arquitetura Base e Autenticação
- [ ] **TAREFA-101**: Configurar estrutura base do projeto e ambiente de desenvolvimento.
- [ ] **TAREFA-102**: Modelar e criar schema/entidades do banco de dados (Unidades, Moradores, Visitantes, Acessos, Encomendas, Ocorrências, Usuários).
- [ ] **TAREFA-103**: Implementar serviço de autenticação (login, logout, renovação de token e redefinição de senha).
- [ ] **TAREFA-104**: Implementar middleware de autorização baseado em papéis (RBAC: Admin, Porteiro, Morador).

### Épico 2: Módulo de Unidades e Moradores
- [ ] **TAREFA-201**: Implementar API/Endpoints para CRUD de Unidades.
- [ ] **TAREFA-202**: Implementar API/Endpoints para CRUD de Moradores e vínculo com Unidades.
- [ ] **TAREFA-203**: Implementar cadastro e listagem de veículos de moradores.
- [ ] **TAREFA-204**: Criar tela/interface para busca rápida de moradores e unidades pela portaria.

### Épico 3: Módulo de Controle de Acesso
- [ ] **TAREFA-301**: Implementar funcionalidade de pré-autorização de visitantes pelo morador.
- [ ] **TAREFA-302**: Implementar fluxo de registro de entrada (check-in) de visitantes e prestadores de serviço na portaria.
- [ ] **TAREFA-303**: Implementar fluxo de registro de saída (check-out) de visitantes e prestadores de serviço.
- [ ] **TAREFA-304**: Criar histórico e relatórios de acessos filtrados por data, unidade e visitante.

### Épico 4: Módulo de Gestão de Encomendas
- [ ] **TAREFA-401**: Implementar registro de recebimento de encomendas na portaria.
- [ ] **TAREFA-402**: Implementar serviço de notificação ao morador sobre novas encomendas pendentes.
- [ ] **TAREFA-403**: Implementar fluxo de baixa/retirada de encomenda com confirmação de recebimento.
- [ ] **TAREFA-404**: Criar painel de controle de encomendas pendentes e histórico de entregas.

### Épico 5: Módulo de Ocorrências e Mural de Avisos
- [ ] **TAREFA-501**: Implementar livro de ocorrências digital (criação, acompanhamento e alteração de status pelo síndico).
- [ ] **TAREFA-502**: Implementar mural de comunicados e avisos gerais para os moradores.

### Épico 6: Qualidade, Testes e Documentação
- [ ] **TAREFA-601**: Desenvolver testes unitários e de integração para os serviços de controle de acesso, encomendas e moradores.
- [ ] **TAREFA-602**: Finalizar documentação da API e guia de utilização do sistema para operadores de portaria.
