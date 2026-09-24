const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = process.env.NODE_ENV === 'test' ? ':memory:' : path.join(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath);

function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function queryAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

async function initDb() {
  await runAsync(`PRAGMA foreign_keys = ON;`);

  // Unidades
  await runAsync(`
    CREATE TABLE IF NOT EXISTS unidades (
      id_unidade INTEGER PRIMARY KEY AUTOINCREMENT,
      bloco VARCHAR(20) NOT NULL,
      numero VARCHAR(20) NOT NULL,
      tipo VARCHAR(20) DEFAULT 'Apartamento',
      responsavel VARCHAR(100),
      contato_emergencia VARCHAR(50),
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Pessoas / Usuários
  await runAsync(`
    CREATE TABLE IF NOT EXISTS pessoas (
      id_pessoa INTEGER PRIMARY KEY AUTOINCREMENT,
      nome VARCHAR(100) NOT NULL,
      cpf VARCHAR(14) UNIQUE NOT NULL,
      rg_cnh VARCHAR(20),
      tipo VARCHAR(20) NOT NULL, -- 'Admin', 'Porteiro', 'Morador', 'Visitante', 'Prestador'
      cargo_setor VARCHAR(100),
      email VARCHAR(100) UNIQUE,
      hash_senha VARCHAR(255) NOT NULL,
      foto_url VARCHAR(255),
      id_unidade INTEGER REFERENCES unidades(id_unidade) ON DELETE SET NULL,
      status VARCHAR(20) DEFAULT 'Ativo',
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Veículos
  await runAsync(`
    CREATE TABLE IF NOT EXISTS veiculos (
      id_veiculo INTEGER PRIMARY KEY AUTOINCREMENT,
      id_pessoa INTEGER REFERENCES pessoas(id_pessoa) ON DELETE CASCADE,
      placa VARCHAR(10) UNIQUE NOT NULL,
      modelo VARCHAR(50),
      cor VARCHAR(30),
      tipo_veiculo VARCHAR(10) DEFAULT 'Carro',
      status_autorizacao VARCHAR(20) DEFAULT 'Autorizado'
    );
  `);

  // Visitas e Pré-Autorizações
  await runAsync(`
    CREATE TABLE IF NOT EXISTS visitas_prestadores (
      id_visita INTEGER PRIMARY KEY AUTOINCREMENT,
      nome_visitante VARCHAR(100) NOT NULL,
      cpf_visitante VARCHAR(14),
      id_unidade INTEGER REFERENCES unidades(id_unidade) ON DELETE CASCADE,
      autorizador_id INTEGER REFERENCES pessoas(id_pessoa),
      tipo VARCHAR(20) DEFAULT 'Visitante', -- 'Visitante', 'Prestador'
      setor_destino VARCHAR(100),
      motivo VARCHAR(255),
      qr_code_token VARCHAR(255) UNIQUE,
      data_validade DATE,
      status VARCHAR(20) DEFAULT 'Pendente' -- 'Pendente', 'Em Visita', 'Finalizado', 'Expirado'
    );
  `);

  // Registros de Acesso / Ponto
  await runAsync(`
    CREATE TABLE IF NOT EXISTS registros_ponto (
      id_registro INTEGER PRIMARY KEY AUTOINCREMENT,
      id_pessoa INTEGER REFERENCES pessoas(id_pessoa),
      nome_visitante VARCHAR(100),
      id_veiculo INTEGER REFERENCES veiculos(id_veiculo),
      tipo_acesso VARCHAR(10) NOT NULL, -- 'Entrada', 'Saida'
      metodo_autenticacao VARCHAR(20) DEFAULT 'Manual',
      ponto_acesso VARCHAR(50) DEFAULT 'Guarita Principal',
      data_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
      observacao TEXT
    );
  `);

  // Encomendas
  await runAsync(`
    CREATE TABLE IF NOT EXISTS encomendas (
      id_encomenda INTEGER PRIMARY KEY AUTOINCREMENT,
      id_unidade INTEGER NOT NULL REFERENCES unidades(id_unidade) ON DELETE CASCADE,
      id_morador INTEGER REFERENCES pessoas(id_pessoa),
      codigo_rastreio VARCHAR(50),
      remetente VARCHAR(100),
      quantidade INTEGER DEFAULT 1,
      descricao VARCHAR(255),
      data_recebimento DATETIME DEFAULT CURRENT_TIMESTAMP,
      recebido_por INTEGER REFERENCES pessoas(id_pessoa),
      status VARCHAR(20) DEFAULT 'Pendente', -- 'Pendente', 'Entregue'
      data_retirada DATETIME,
      retirado_por VARCHAR(100)
    );
  `);

  // Ocorrências
  await runAsync(`
    CREATE TABLE IF NOT EXISTS ocorrencias (
      id_ocorrencia INTEGER PRIMARY KEY AUTOINCREMENT,
      id_autor INTEGER REFERENCES pessoas(id_pessoa),
      categoria VARCHAR(50) NOT NULL,
      descricao TEXT NOT NULL,
      status VARCHAR(20) DEFAULT 'Aberto', -- 'Aberto', 'Em Análise', 'Resolvido'
      resposta TEXT,
      data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Comunicados / Mural
  await runAsync(`
    CREATE TABLE IF NOT EXISTS comunicados (
      id_comunicado INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo VARCHAR(150) NOT NULL,
      conteudo TEXT NOT NULL,
      autor_id INTEGER REFERENCES pessoas(id_pessoa),
      data_publicacao DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await seedDefaultData();
}

async function seedDefaultData() {
  const existingUser = await getAsync(`SELECT COUNT(*) as count FROM pessoas`);
  if (existingUser.count === 0) {
    const passwordHash = await bcrypt.hash('123456', 10);

    // Seed Unidade
    const unitResult = await runAsync(
      `INSERT INTO unidades (bloco, numero, responsavel, contato_emergencia) VALUES (?, ?, ?, ?)`,
      ['Bloco A', '101', 'Carlos Morador', '(11) 99999-8888']
    );
    const unitId = unitResult.lastID;

    // Seed Admin / Síndico
    await runAsync(
      `INSERT INTO pessoas (nome, cpf, tipo, email, hash_senha) VALUES (?, ?, ?, ?, ?)`,
      ['Síndico Admin', '000.000.000-00', 'Admin', 'admin@condo.com', passwordHash]
    );

    // Seed Porteiro
    await runAsync(
      `INSERT INTO pessoas (nome, cpf, tipo, email, hash_senha) VALUES (?, ?, ?, ?, ?)`,
      ['Porteiro João', '111.111.111-11', 'Porteiro', 'porteiro@condo.com', passwordHash]
    );

    // Seed Morador
    const moradorResult = await runAsync(
      `INSERT INTO pessoas (nome, cpf, tipo, email, hash_senha, id_unidade) VALUES (?, ?, ?, ?, ?, ?)`,
      ['Carlos Morador', '222.222.222-22', 'Morador', 'morador@condo.com', passwordHash, unitId]
    );
    const moradorId = moradorResult.lastID;

    // Seed Veículo
    await runAsync(
      `INSERT INTO veiculos (id_pessoa, placa, modelo, cor, tipo_veiculo) VALUES (?, ?, ?, ?, ?)`,
      [moradorId, 'ABC-1234', 'Honda Civic', 'Preto', 'Carro']
    );

    // Seed Encomenda de Exemplo
    await runAsync(
      `INSERT INTO encomendas (id_unidade, id_morador, codigo_rastreio, remetente, quantidade, descricao) VALUES (?, ?, ?, ?, ?, ?)`,
      [unitId, moradorId, 'BR123456789', 'Amazon', 1, 'Pacote de livros']
    );

    // Seed Comunicado Inicial
    await runAsync(
      `INSERT INTO comunicados (titulo, conteudo) VALUES (?, ?)`,
      ['Bem-vindo ao SistemaPortaria', 'Mural de comunicados ativo para todos os moradores e funcionários.']
    );
  }
}

module.exports = {
  db,
  initDb,
  runAsync,
  queryAsync,
  getAsync
};
