const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const { initDb, runAsync, queryAsync, getAsync } = require('./db');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-sistema-portaria';

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Middleware de Autenticação
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acesso não fornecido.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido ou expirado.' });
    req.user = user;
    next();
  });
}

// Middleware de Autorização Baseado em Papéis (RBAC)
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.tipo)) {
      return res.status(403).json({ error: 'Acesso não autorizado para o seu perfil.' });
    }
    next();
  };
}

// --- ROTAS DE AUTENTICAÇÃO ---

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    }

    const pessoa = await getAsync('SELECT * FROM pessoas WHERE email = ?', [email]);
    if (!pessoa) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const match = await bcrypt.compare(senha, pessoa.hash_senha);
    if (!match) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const payload = {
      id_pessoa: pessoa.id_pessoa,
      nome: pessoa.nome,
      tipo: pessoa.tipo,
      email: pessoa.email,
      id_unidade: pessoa.id_unidade
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: payload
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// --- ROTAS DE UNIDADES E MORADORES ---

app.get('/api/unidades', authenticateToken, async (req, res) => {
  try {
    const unidades = await queryAsync('SELECT * FROM unidades ORDER BY bloco, numero');
    res.json(unidades);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/unidades', authenticateToken, authorizeRoles('Admin', 'Porteiro'), async (req, res) => {
  try {
    const { bloco, numero, responsavel, contato_emergencia } = req.body;
    if (!bloco || !numero) {
      return res.status(400).json({ error: 'Bloco e Número são obrigatórios.' });
    }

    const result = await runAsync(
      `INSERT INTO unidades (bloco, numero, responsavel, contato_emergencia) VALUES (?, ?, ?, ?)`,
      [bloco, numero, responsavel || null, contato_emergencia || null]
    );

    res.status(201).json({ id_unidade: result.lastID, message: 'Unidade cadastrada com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/moradores', authenticateToken, async (req, res) => {
  try {
    const moradores = await queryAsync(`
      SELECT p.id_pessoa, p.nome, p.cpf, p.email, p.tipo, p.id_unidade, u.bloco, u.numero
      FROM pessoas p
      LEFT JOIN unidades u ON p.id_unidade = u.id_unidade
      WHERE p.tipo = 'Morador'
      ORDER BY p.nome
    `);
    res.json(moradores);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/moradores', authenticateToken, authorizeRoles('Admin', 'Porteiro'), async (req, res) => {
  try {
    const { nome, cpf, email, senha, id_unidade } = req.body;
    if (!nome || !cpf || !email || !senha || !id_unidade) {
      return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos.' });
    }

    const hashSenha = await bcrypt.hash(senha, 10);
    const result = await runAsync(
      `INSERT INTO pessoas (nome, cpf, email, hash_senha, tipo, id_unidade) VALUES (?, ?, ?, ?, 'Morador', ?)`,
      [nome, cpf, email, hashSenha, id_unidade]
    );

    res.status(201).json({ id_pessoa: result.lastID, message: 'Morador cadastrado com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ROTAS DE VEÍCULOS ---

app.get('/api/veiculos', authenticateToken, async (req, res) => {
  try {
    const veiculos = await queryAsync(`
      SELECT v.*, p.nome as proprietario
      FROM veiculos v
      LEFT JOIN pessoas p ON v.id_pessoa = p.id_pessoa
    `);
    res.json(veiculos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/veiculos', authenticateToken, authorizeRoles('Admin', 'Porteiro', 'Morador'), async (req, res) => {
  try {
    const { id_pessoa, placa, modelo, cor, tipo_veiculo } = req.body;
    const targetPessoaId = req.user.tipo === 'Morador' ? req.user.id_pessoa : (id_pessoa || req.user.id_pessoa);

    if (!placa) {
      return res.status(400).json({ error: 'A placa do veículo é obrigatória.' });
    }

    const result = await runAsync(
      `INSERT INTO veiculos (id_pessoa, placa, modelo, cor, tipo_veiculo) VALUES (?, ?, ?, ?, ?)`,
      [targetPessoaId, placa, modelo || '', cor || '', tipo_veiculo || 'Carro']
    );

    res.status(201).json({ id_veiculo: result.lastID, message: 'Veículo cadastrado com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ROTAS DE CONTROLE DE ACESSO & VISITAS ---

app.get('/api/acessos/visitas', authenticateToken, async (req, res) => {
  try {
    let sql = `
      SELECT v.*, u.bloco, u.numero, p.nome as autorizador_nome
      FROM visitas_prestadores v
      LEFT JOIN unidades u ON v.id_unidade = u.id_unidade
      LEFT JOIN pessoas p ON v.autorizador_id = p.id_pessoa
    `;
    const params = [];

    if (req.user.tipo === 'Morador') {
      sql += ` WHERE v.id_unidade = ?`;
      params.push(req.user.id_unidade);
    }

    sql += ` ORDER BY v.id_visita DESC`;
    const visitas = await queryAsync(sql, params);
    res.json(visitas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/acessos/pre-autorizacao', authenticateToken, authorizeRoles('Admin', 'Porteiro', 'Morador'), async (req, res) => {
  try {
    const { nome_visitante, cpf_visitante, id_unidade, tipo, setor_destino, motivo, data_validade } = req.body;
    const targetUnidadeId = req.user.tipo === 'Morador' ? req.user.id_unidade : (id_unidade || req.user.id_unidade);

    if (!nome_visitante || !targetUnidadeId) {
      return res.status(400).json({ error: 'Nome do visitante e unidade são obrigatórios.' });
    }

    const token = 'QR-' + Math.random().toString(36).substring(2, 9).toUpperCase();

    const result = await runAsync(
      `INSERT INTO visitas_prestadores (nome_visitante, cpf_visitante, id_unidade, autorizador_id, tipo, setor_destino, motivo, qr_code_token, data_validade, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pendente')`,
      [nome_visitante, cpf_visitante || null, targetUnidadeId, req.user.id_pessoa, tipo || 'Visitante', setor_destino || '', motivo || '', token, data_validade || null]
    );

    res.status(201).json({ id_visita: result.lastID, qr_code_token: token, message: 'Pré-autorização criada com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/acessos/checkin', authenticateToken, authorizeRoles('Admin', 'Porteiro'), async (req, res) => {
  try {
    const { id_pessoa, nome_visitante, id_veiculo, metodo_autenticacao, observacao } = req.body;

    const result = await runAsync(
      `INSERT INTO registros_ponto (id_pessoa, nome_visitante, id_veiculo, tipo_acesso, metodo_autenticacao, observacao)
       VALUES (?, ?, ?, 'Entrada', ?, ?)`,
      [id_pessoa || null, nome_visitante || null, id_veiculo || null, metodo_autenticacao || 'Manual', observacao || '']
    );

    res.status(201).json({ id_registro: result.lastID, message: 'Check-in registrado com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/acessos/checkout', authenticateToken, authorizeRoles('Admin', 'Porteiro'), async (req, res) => {
  try {
    const { id_pessoa, nome_visitante, id_veiculo, metodo_autenticacao, observacao } = req.body;

    const result = await runAsync(
      `INSERT INTO registros_ponto (id_pessoa, nome_visitante, id_veiculo, tipo_acesso, metodo_autenticacao, observacao)
       VALUES (?, ?, ?, 'Saida', ?, ?)`,
      [id_pessoa || null, nome_visitante || null, id_veiculo || null, metodo_autenticacao || 'Manual', observacao || '']
    );

    res.status(201).json({ id_registro: result.lastID, message: 'Check-out registrado com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/acessos/historico', authenticateToken, async (req, res) => {
  try {
    const registros = await queryAsync(`
      SELECT r.*, p.nome as pessoa_nome, v.placa
      FROM registros_ponto r
      LEFT JOIN pessoas p ON r.id_pessoa = p.id_pessoa
      LEFT JOIN veiculos v ON r.id_veiculo = v.id_veiculo
      ORDER BY r.data_hora DESC
      LIMIT 100
    `);
    res.json(registros);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ROTAS DE ENCOMENDAS ---

app.get('/api/encomendas', authenticateToken, async (req, res) => {
  try {
    let sql = `
      SELECT e.*, u.bloco, u.numero, p.nome as morador_nome
      FROM encomendas e
      JOIN unidades u ON e.id_unidade = u.id_unidade
      LEFT JOIN pessoas p ON e.id_morador = p.id_pessoa
    `;
    const params = [];

    if (req.user.tipo === 'Morador') {
      sql += ` WHERE e.id_unidade = ?`;
      params.push(req.user.id_unidade);
    }

    sql += ` ORDER BY e.id_encomenda DESC`;
    const encomendas = await queryAsync(sql, params);
    res.json(encomendas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/encomendas', authenticateToken, authorizeRoles('Admin', 'Porteiro'), async (req, res) => {
  try {
    const { id_unidade, id_morador, codigo_rastreio, remetente, quantidade, descricao } = req.body;
    if (!id_unidade) {
      return res.status(400).json({ error: 'A unidade é obrigatória.' });
    }

    const result = await runAsync(
      `INSERT INTO encomendas (id_unidade, id_morador, codigo_rastreio, remetente, quantidade, descricao, recebido_por)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id_unidade, id_morador || null, codigo_rastreio || '', remetente || '', quantidade || 1, descricao || '', req.user.id_pessoa]
    );

    res.status(201).json({ id_encomenda: result.lastID, message: 'Encomenda registrada com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/encomendas/:id/retirar', authenticateToken, authorizeRoles('Admin', 'Porteiro'), async (req, res) => {
  try {
    const { retirado_por } = req.body;
    const { id } = req.params;

    if (!retirado_por) {
      return res.status(400).json({ error: 'Nome de quem retirou é obrigatório.' });
    }

    await runAsync(
      `UPDATE encomendas SET status = 'Entregue', data_retirada = CURRENT_TIMESTAMP, retirado_por = ? WHERE id_encomenda = ?`,
      [retirado_por, id]
    );

    res.json({ message: 'Baixa de encomenda realizada com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ROTAS DE OCORRÊNCIAS ---

app.get('/api/ocorrencias', authenticateToken, async (req, res) => {
  try {
    let sql = `
      SELECT o.*, p.nome as autor_nome
      FROM ocorrencias o
      LEFT JOIN pessoas p ON o.id_autor = p.id_pessoa
    `;
    const params = [];

    if (req.user.tipo === 'Morador') {
      sql += ` WHERE o.id_autor = ?`;
      params.push(req.user.id_pessoa);
    }

    sql += ` ORDER BY o.id_ocorrencia DESC`;
    const ocorrencias = await queryAsync(sql, params);
    res.json(ocorrencias);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ocorrencias', authenticateToken, async (req, res) => {
  try {
    const { categoria, descricao } = req.body;
    if (!categoria || !descricao) {
      return res.status(400).json({ error: 'Categoria e descrição são obrigatórias.' });
    }

    const result = await runAsync(
      `INSERT INTO ocorrencias (id_autor, categoria, descricao) VALUES (?, ?, ?)`,
      [req.user.id_pessoa, categoria, descricao]
    );

    res.status(201).json({ id_ocorrencia: result.lastID, message: 'Ocorrência registrada com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/ocorrencias/:id/status', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    const { status, resposta } = req.body;
    const { id } = req.params;

    await runAsync(
      `UPDATE ocorrencias SET status = ?, resposta = ? WHERE id_ocorrencia = ?`,
      [status || 'Resolvido', resposta || '', id]
    );

    res.json({ message: 'Status da ocorrência atualizado com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ROTAS DE COMUNICADOS ---

app.get('/api/comunicados', authenticateToken, async (req, res) => {
  try {
    const comunicados = await queryAsync(`
      SELECT c.*, p.nome as autor_nome
      FROM comunicados c
      LEFT JOIN pessoas p ON c.autor_id = p.id_pessoa
      ORDER BY c.data_publicacao DESC
    `);
    res.json(comunicados);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/comunicados', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    const { titulo, conteudo } = req.body;
    if (!titulo || !conteudo) {
      return res.status(400).json({ error: 'Título e conteúdo são obrigatórios.' });
    }

    const result = await runAsync(
      `INSERT INTO comunicados (titulo, conteudo, autor_id) VALUES (?, ?, ?)`,
      [titulo, conteudo, req.user.id_pessoa]
    );

    res.status(201).json({ id_comunicado: result.lastID, message: 'Comunicado publicado com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  initDb().then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  }).catch(err => {
    console.error('Erro ao inicializar o banco de dados:', err);
  });
}

module.exports = { app, initDb };
