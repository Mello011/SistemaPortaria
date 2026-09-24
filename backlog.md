# Backlog de Desenvolvimento - SistemaPortaria / PortariaOS

## Épico 1: Arquitetura Base e Autenticação
- [x] **TAREFA-101**: Configurar estrutura base do projeto (Node.js, Express, SQLite e Frontend SPA).
- [x] **TAREFA-102**: Modelar e criar schema de banco de dados baseado em `SCRIPTDDL.sql` e requisitos do `README.md`.
- [x] **TAREFA-103**: Implementar serviço de autenticação (Login, Validação de Token JWT e Permissões).
- [x] **TAREFA-104**: Implementar middleware de autorização baseado em papéis (RBAC: Admin/Síndico, Porteiro, Morador).

## Épico 2: Módulo de Unidades e Moradores
- [x] **TAREFA-201**: Implementar Endpoints REST para CRUD de Unidades.
- [x] **TAREFA-202**: Implementar Endpoints REST para CRUD de Moradores e vínculo com Unidades.
- [x] **TAREFA-203**: Implementar cadastro e listagem de veículos de moradores.
- [x] **TAREFA-204**: Criar interface gráfica para consulta rápida de moradores e unidades na portaria.

## Épico 3: Módulo de Controle de Acesso
- [x] **TAREFA-301**: Implementar funcionalidade de pré-autorização de visitantes pelo morador.
- [x] **TAREFA-302**: Implementar registro de entrada (check-in) de visitantes e prestadores de serviço na portaria.
- [x] **TAREFA-303**: Implementar registro de saída (check-out) de visitantes e prestadores de serviço.
- [x] **TAREFA-304**: Criar histórico de acessos e relatórios de movimentação.

## Épico 4: Módulo de Gestão de Encomendas
- [x] **TAREFA-401**: Implementar recebimento e registro de encomendas na portaria.
- [x] **TAREFA-402**: Implementar serviço/notificação visual de encomendas pendentes para moradores.
- [x] **TAREFA-403**: Implementar registro de baixa/retirada de encomendas com confirmação.
- [x] **TAREFA-404**: Criar painel de acompanhamento de encomendas pendentes e entregues.

## Épico 5: Módulo de Ocorrências e Mural de Avisos
- [x] **TAREFA-501**: Implementar livro digital de ocorrências (criação e alteração de status pelo síndico).
- [x] **TAREFA-502**: Implementar mural de comunicados e avisos gerais para moradores.

## Épico 6: Qualidade, Testes e Documentação
- [x] **TAREFA-601**: Criar suíte de testes automatizados para as APIs principais do sistema.
- [x] **TAREFA-602**: Atualizar documentação e backlog de alterações do projeto.
