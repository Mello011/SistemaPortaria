let currentUser = null;
let token = localStorage.getItem('token') || null;

document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  initApp();
  setupEventListeners();
});

async function initApp() {
  if (token) {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        currentUser = data.user;
        showApp();
        return;
      }
    } catch (e) {
      console.error(e);
    }
  }
  showLogin();
}

function showLogin() {
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('app-screen').classList.add('hidden');
}

function showApp() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app-screen').classList.remove('hidden');
  document.getElementById('user-display-name').textContent = `${currentUser.nome} (${currentUser.tipo})`;

  // Ocultar/Exibir elementos baseados no perfil RBAC
  document.querySelectorAll('.admin-only').forEach(el => {
    el.style.display = currentUser.tipo === 'Admin' ? 'inline-flex' : 'none';
  });
  document.querySelectorAll('.porteiro-only').forEach(el => {
    el.style.display = (currentUser.tipo === 'Admin' || currentUser.tipo === 'Porteiro') ? 'inline-flex' : 'none';
  });

  loadUnidadesSelect();
  loadGuaritaHistorico();
  loadEncomendas();
  loadVisitas();
  loadOcorrencias();
  loadComunicados();
}

function setupEventListeners() {
  // Formulario de Login
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });
      const data = await res.json();

      if (res.ok) {
        token = data.token;
        currentUser = data.user;
        localStorage.setItem('token', token);
        showApp();
      } else {
        alert(data.error || 'Erro ao realizar login');
      }
    } catch (err) {
      alert('Falha na comunicação com o servidor.');
    }
  });

  // Logout
  document.getElementById('btn-logout').addEventListener('click', (e) => {
    e.preventDefault();
    token = null;
    currentUser = null;
    localStorage.removeItem('token');
    showLogin();
  });

  // Navegação por abas
  const tabs = [
    { nav: 'nav-guarita', sec: 'sec-guarita' },
    { nav: 'nav-encomendas', sec: 'sec-encomendas' },
    { nav: 'nav-visitas', sec: 'sec-visitas' },
    { nav: 'nav-ocorrencias', sec: 'sec-ocorrencias' },
    { nav: 'nav-comunicados', sec: 'sec-comunicados' }
  ];

  tabs.forEach(t => {
    document.getElementById(t.nav).addEventListener('click', (e) => {
      e.preventDefault();
      tabs.forEach(item => {
        document.getElementById(item.nav).classList.remove('active');
        document.getElementById(item.sec).classList.add('hidden');
      });
      document.getElementById(t.nav).classList.add('active');
      document.getElementById(t.sec).classList.remove('hidden');
    });
  });

  // Check-in Guarita
  document.getElementById('form-checkin').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome_visitante = document.getElementById('checkin-nome').value;
    const metodo_autenticacao = document.getElementById('checkin-metodo').value;
    const observacao = document.getElementById('checkin-obs').value;

    const res = await apiFetch('/api/acessos/checkin', 'POST', {
      nome_visitante,
      metodo_autenticacao,
      observacao
    });

    if (res.id_registro) {
      alert('Entrada registrada com sucesso!');
      document.getElementById('form-checkin').reset();
      loadGuaritaHistorico();
    }
  });

  // Check-out Guarita
  document.getElementById('btn-checkout').addEventListener('click', async () => {
    const nome_visitante = document.getElementById('checkin-nome').value;
    const metodo_autenticacao = document.getElementById('checkin-metodo').value;
    const observacao = document.getElementById('checkin-obs').value;

    if (!nome_visitante) {
      alert('Preencha o nome para registrar a saída.');
      return;
    }

    const res = await apiFetch('/api/acessos/checkout', 'POST', {
      nome_visitante,
      metodo_autenticacao,
      observacao
    });

    if (res.id_registro) {
      alert('Saída registrada com sucesso!');
      document.getElementById('form-checkin').reset();
      loadGuaritaHistorico();
    }
  });

  // Modais trigger & close
  setupModal('btn-modal-encomenda', 'modal-encomenda');
  setupModal('btn-modal-visita', 'modal-visita');
  setupModal('btn-modal-ocorrencia', 'modal-ocorrencia');
  setupModal('btn-modal-comunicado', 'modal-comunicado');

  // Submit Nova Encomenda
  document.getElementById('form-nova-encomenda').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id_unidade = document.getElementById('enc-unidade').value;
    const codigo_rastreio = document.getElementById('enc-rastreio').value;
    const remetente = document.getElementById('enc-remetente').value;
    const descricao = document.getElementById('enc-desc').value;

    const res = await apiFetch('/api/encomendas', 'POST', { id_unidade, codigo_rastreio, remetente, descricao });
    if (res.id_encomenda) {
      closeModal('modal-encomenda');
      document.getElementById('form-nova-encomenda').reset();
      loadEncomendas();
    }
  });

  // Submit Nova Visita
  document.getElementById('form-nova-visita').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome_visitante = document.getElementById('vis-nome').value;
    const cpf_visitante = document.getElementById('vis-cpf').value;
    const tipo = document.getElementById('vis-tipo').value;
    const motivo = document.getElementById('vis-motivo').value;

    const res = await apiFetch('/api/acessos/pre-autorizacao', 'POST', { nome_visitante, cpf_visitante, tipo, motivo });
    if (res.id_visita) {
      closeModal('modal-visita');
      document.getElementById('form-nova-visita').reset();
      loadVisitas();
    }
  });

  // Submit Nova Ocorrência
  document.getElementById('form-nova-ocorrencia').addEventListener('submit', async (e) => {
    e.preventDefault();
    const categoria = document.getElementById('oco-cat').value;
    const descricao = document.getElementById('oco-desc').value;

    const res = await apiFetch('/api/ocorrencias', 'POST', { categoria, descricao });
    if (res.id_ocorrencia) {
      closeModal('modal-ocorrencia');
      document.getElementById('form-nova-ocorrencia').reset();
      loadOcorrencias();
    }
  });

  // Submit Novo Comunicado
  document.getElementById('form-novo-comunicado').addEventListener('submit', async (e) => {
    e.preventDefault();
    const titulo = document.getElementById('com-titulo').value;
    const conteudo = document.getElementById('com-conteudo').value;

    const res = await apiFetch('/api/comunicados', 'POST', { titulo, conteudo });
    if (res.id_comunicado) {
      closeModal('modal-comunicado');
      document.getElementById('form-novo-comunicado').reset();
      loadComunicados();
    }
  });
}

function setupModal(btnId, modalId) {
  const btn = document.getElementById(btnId);
  const modal = document.getElementById(modalId);
  if (btn && modal) {
    btn.addEventListener('click', () => modal.setAttribute('open', 'true'));
  }
  document.querySelectorAll(`[data-target="${modalId}"]`).forEach(closeBtn => {
    closeBtn.addEventListener('click', () => closeModal(modalId));
  });
}

function closeModal(modalId) {
  document.getElementById(modalId).removeAttribute('open');
}

async function apiFetch(url, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
  if (body) options.body = JSON.stringify(body);

  try {
    const res = await fetch(url, options);
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || 'Erro na requisição');
      return {};
    }
    return data;
  } catch (err) {
    alert('Erro ao conectar ao servidor.');
    return {};
  }
}

async function loadUnidadesSelect() {
  const unidades = await apiFetch('/api/unidades');
  const select = document.getElementById('enc-unidade');
  if (select && Array.isArray(unidades)) {
    select.innerHTML = unidades.map(u => `<option value="${u.id_unidade}">${u.bloco} - ${u.numero}</option>`).join('');
  }
}

async function loadGuaritaHistorico() {
  const historico = await apiFetch('/api/acessos/historico');
  const tbody = document.getElementById('tbl-historico-acessos');
  if (tbody && Array.isArray(historico)) {
    tbody.innerHTML = historico.map(h => `
      <tr>
        <td>${new Date(h.data_hora).toLocaleString()}</td>
        <td>${h.nome_visitante || h.pessoa_nome || 'N/A'}</td>
        <td><span class="badge ${h.tipo_acesso === 'Entrada' ? 'badge-sucesso' : 'badge-info'}">${h.tipo_acesso}</span></td>
        <td>${h.metodo_autenticacao}</td>
      </tr>
    `).join('');
  }
}

async function loadEncomendas() {
  const encomendas = await apiFetch('/api/encomendas');
  const tbody = document.getElementById('tbl-encomendas');
  if (tbody && Array.isArray(encomendas)) {
    tbody.innerHTML = encomendas.map(e => `
      <tr>
        <td><strong>${e.codigo_rastreio || 'Sem Código'}</strong></td>
        <td>${e.bloco} - ${e.numero}</td>
        <td>${e.remetente || 'N/I'}</td>
        <td>${new Date(e.data_recebimento).toLocaleDateString()}</td>
        <td><span class="badge ${e.status === 'Pendente' ? 'badge-pendente' : 'badge-sucesso'}">${e.status}</span></td>
        <td>
          ${e.status === 'Pendente' && (currentUser.tipo === 'Admin' || currentUser.tipo === 'Porteiro')
            ? `<button onclick="darBaixaEncomenda(${e.id_encomenda})" class="btn-sm contrast">Dar Baixa</button>`
            : '-'}
        </td>
      </tr>
    `).join('');
  }
}

async function darBaixaEncomenda(id) {
  const nome = prompt('Nome de quem está retirando a encomenda:');
  if (!nome) return;

  const res = await apiFetch(`/api/encomendas/${id}/retirar`, 'PUT', { retirado_por: nome });
  if (res.message) {
    alert(res.message);
    loadEncomendas();
  }
}

async function loadVisitas() {
  const visitas = await apiFetch('/api/acessos/visitas');
  const tbody = document.getElementById('tbl-visitas');
  if (tbody && Array.isArray(visitas)) {
    tbody.innerHTML = visitas.map(v => `
      <tr>
        <td><strong>${v.nome_visitante}</strong></td>
        <td>${v.cpf_visitante || 'N/A'}</td>
        <td>${v.bloco ? `${v.bloco} - ${v.numero}` : 'N/A'}</td>
        <td>${v.tipo}</td>
        <td><code>${v.qr_code_token}</code></td>
        <td><span class="badge badge-info">${v.status}</span></td>
      </tr>
    `).join('');
  }
}

async function loadOcorrencias() {
  const ocorrencias = await apiFetch('/api/ocorrencias');
  const container = document.getElementById('cards-ocorrencias');
  if (container && Array.isArray(ocorrencias)) {
    container.innerHTML = ocorrencias.map(o => `
      <article class="card-item">
        <header>
          <strong>${o.categoria}</strong>
          <span class="badge ${o.status === 'Aberto' ? 'badge-pendente' : 'badge-sucesso'}">${o.status}</span>
        </header>
        <p>${o.descricao}</p>
        <small>Autor: ${o.autor_nome || 'Morador'} - Data: ${new Date(o.data_criacao).toLocaleDateString()}</small>
        ${o.resposta ? `<div style="margin-top:10px; background:#f3f4f6; padding:8px; border-radius:4px;"><small><strong>Resposta do Síndico:</strong> ${o.resposta}</small></div>` : ''}
      </article>
    `).join('');
  }
}

async function loadComunicados() {
  const comunicados = await apiFetch('/api/comunicados');
  const container = document.getElementById('cards-comunicados');
  if (container && Array.isArray(comunicados)) {
    container.innerHTML = comunicados.map(c => `
      <article class="card-item" style="margin-bottom:16px;">
        <header>
          <strong><i data-lucide="bell"></i> ${c.titulo}</strong>
          <small>${new Date(c.data_publicacao).toLocaleDateString()}</small>
        </header>
        <p>${c.conteudo}</p>
        <small class="hint-text">Publicado por: ${c.autor_nome || 'Administração'}</small>
      </article>
    `).join('');
    lucide.createIcons();
  }
}
