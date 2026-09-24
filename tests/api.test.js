const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
process.env.NODE_ENV = 'test';

const { app, initDb } = require('../src/server');

let adminToken = '';
let porteiroToken = '';
let moradorToken = '';
let unitId = null;

test.before(async () => {
  await initDb();
});

test('POST /api/auth/login - Realiza login como Admin', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@condo.com', senha: '123456' });

  assert.strictEqual(res.status, 200);
  assert.ok(res.body.token);
  assert.strictEqual(res.body.user.tipo, 'Admin');
  adminToken = res.body.token;
});

test('POST /api/auth/login - Realiza login como Porteiro', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'porteiro@condo.com', senha: '123456' });

  assert.strictEqual(res.status, 200);
  assert.ok(res.body.token);
  assert.strictEqual(res.body.user.tipo, 'Porteiro');
  porteiroToken = res.body.token;
});

test('POST /api/auth/login - Realiza login como Morador', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'morador@condo.com', senha: '123456' });

  assert.strictEqual(res.status, 200);
  assert.ok(res.body.token);
  assert.strictEqual(res.body.user.tipo, 'Morador');
  moradorToken = res.body.token;
});

test('GET /api/unidades - Listagem de Unidades', async () => {
  const res = await request(app)
    .get('/api/unidades')
    .set('Authorization', `Bearer ${adminToken}`);

  assert.strictEqual(res.status, 200);
  assert.ok(Array.isArray(res.body));
  assert.ok(res.body.length > 0);
  unitId = res.body[0].id_unidade;
});

test('POST /api/acessos/pre-autorizacao - Morador cria pré-autorização', async () => {
  const res = await request(app)
    .post('/api/acessos/pre-autorizacao')
    .set('Authorization', `Bearer ${moradorToken}`)
    .send({
      nome_visitante: 'Visitante Teste',
      cpf_visitante: '999.999.999-99',
      tipo: 'Visitante',
      motivo: 'Festa de aniversário'
    });

  assert.strictEqual(res.status, 201);
  assert.ok(res.body.id_visita);
  assert.ok(res.body.qr_code_token);
});

test('POST /api/acessos/checkin - Porteiro registra entrada na guarita', async () => {
  const res = await request(app)
    .post('/api/acessos/checkin')
    .set('Authorization', `Bearer ${porteiroToken}`)
    .send({
      nome_visitante: 'Visitante Teste',
      metodo_autenticacao: 'QR_Code',
      observacao: 'Acesso liberado via QR Code'
    });

  assert.strictEqual(res.status, 201);
  assert.ok(res.body.id_registro);
});

test('POST /api/encomendas - Porteiro cadastra recebimento de encomenda', async () => {
  const res = await request(app)
    .post('/api/encomendas')
    .set('Authorization', `Bearer ${porteiroToken}`)
    .send({
      id_unidade: unitId,
      codigo_rastreio: 'BR999888777',
      remetente: 'Mercado Livre',
      quantidade: 1,
      descricao: 'Pacote de utilidades'
    });

  assert.strictEqual(res.status, 201);
  assert.ok(res.body.id_encomenda);
});

test('POST /api/ocorrencias - Morador registra ocorrência', async () => {
  const res = await request(app)
    .post('/api/ocorrencias')
    .set('Authorization', `Bearer ${moradorToken}`)
    .send({
      categoria: 'Barulho / Incomodo',
      descricao: 'Barulho excessivo após às 22h.'
    });

  assert.strictEqual(res.status, 201);
  assert.ok(res.body.id_ocorrencia);
});

test('POST /api/comunicados - Admin publica comunicado', async () => {
  const res = await request(app)
    .post('/api/comunicados')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      titulo: 'Manutenção do Elevador',
      conteudo: 'O elevador social estará em manutenção nesta terça-feira.'
    });

  assert.strictEqual(res.status, 201);
  assert.ok(res.body.id_comunicado);
});
