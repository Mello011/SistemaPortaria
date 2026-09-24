# Specification: Sistema de Portaria e Controle de Acesso (PortariaOS)

## 1. Visão Geral do Projeto
Sistema para controle de acesso físico em portarias corporativas, focado em alta resiliência (operação offline), segurança reforçada e agilidade. O sistema atende funcionários, veículos e terceiros/prestadores, integrado a um painel web para o RH e um aplicativo PWA para colaboradores.

## 2. Stack Tecnológica & Dependências
- **Agente de Execução:** Google Jules
- **Repositório:** GitHub
- **Backend & Database:** Supabase (PostgreSQL, Auth e APIs REST nativas)
- **Frontend:** HTML5, CSS3 e JavaScript Vanilla (sem frameworks como React ou Vue).
- **Bibliotecas Frontend (via CDN, sem gerenciadores de pacotes/npm):**
  - **Ícones:** Lucide Icons (`https://unpkg.com/lucide@latest`)
  - **Estilização/Componentes:** Pico CSS (`https://unpkg.com/@picocss/pico@latest`) para redução de CSS boilerplate.
  - **Leitura de QR Code:** HTML5-QRCode (`https://unpkg.com/html5-qrcode`)
  - **Geração de QR Code:** QRCode.js (`https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js`)

## 3. Diretrizes de UI/UX
- **Plataformas Alvo:** Exclusivo para Desktop e Tablets (layout responsivo para telas ≥ 768px).
- **Tema:** Design limpo, profissional, fundo claro/branco.
- **Iconografia:** Proibido o uso de emojis na interface. Utilizar exclusivamente a biblioteca Lucide Icons.
- **APIs Nativas:** Uso restrito da API de Câmera (`navigator.mediaDevices.getUserMedia`) para captura de fotos na guarita e leitura de QR Code.

## 4. Módulos do Sistema e Regras de Negócio

### 4.1. Módulo Guarita (Porteiro)
- **Monitoramento em Tempo Real:** Exibição do último acesso em destaque com fotos (cadastro vs. captura), status (Liberado/Negado) e motivo de bloqueios.
- **Controle de Acesso Veicular:** Exige dupla autenticação (Placa cadastrada + Face ID/Senha do motorista).
- **Cadastro Rápido de Terceiros:**
  - Consulta prévia por CPF. Se existente, autopreenche dados.
  - Exige validação/liberação manual do porteiro após conferência de RG/CPF/CNH, setor de destino e declaração de materiais.
  - Impressão/Geração de QR Code temporário (válido apenas para a data de emissão).
- **Ações Rápidas:** Botões para ver detalhes do usuário, liberação manual com justificativa obrigatória e inserção de notas/observações de auditoria.

### 4.2. Módulo App do Funcionário (PWA)
- **Tela Inicial:** Cartão Digital com QR Code dinâmico (estilo TOTP, renovado periodicamente).
- **Segurança do QR Code:** Funcional para telas offline e com bloqueio de captura de tela (*anti-screenshot*).
- **Contingência:** Visualização e solicitação de redefinição de senha numérica (hash BCrypt).
- **Informativo:** Aba com regras de tolerância de escala e central de dúvidas (FAQ).

### 4.3. Módulo RH & Gestão
- **Auditoria:** Relatórios e logs de tentativas negadas (com filtros por período, motivo e foto) e alertas de uso de senha de contingência.
- **Dashboard:** Quantitativo em tempo real de pessoas no perímetro, ocupação de vagas do estacionamento e alertas de inconsistências de horário.
- **Horas Extras:** Cruzamento automático dos horários de acesso na portaria com as escalas cadastradas, aplicando margens de tolerância configuráveis.

## 5. Resiliência e Operação Offline
- **Cache Local:** Uso do `localStorage` / `IndexedDB` no navegador da Guarita para armazenar a lista de pessoas ativas e senhas.
- **Fila de Sincronização (Sync Queue):** Registros realizados offline são salvos localmente com status `Pendente` e sincronizados via API do Supabase assim que a conexão for restabelecida.

## 6. Instruções para Agentes de IA (Google Jules / Outros)
1. **Dúvidas e Incertezas:** NÃO codifique caso haja dúvidas ou ambiguidades nas especificações. Solicite esclarecimentos antes de prosseguir.
2. **Divisão de Tarefas:** Sempre divida programações extensas em tarefas e subtarefas incrementais e testáveis.
3. **Registro de Alterações (Backlog):** Crie e mantenha atualizado um arquivo `backlog.md` na raiz do repositório, registrando cronologicamente todas as funcionalidades implementadas, corrigidas ou modificadas.