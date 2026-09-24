-- Habilita extensão para UUIDs se necessário
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA DE PESSOAS
CREATE TABLE pessoas (
    id_pessoa INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    rg_cnh VARCHAR(20),
    tipo VARCHAR(20) CHECK (tipo IN ('Funcionário', 'Fornecedor', 'Visitante')) NOT NULL,
    cargo_setor VARCHAR(100),
    hash_senha VARCHAR(255) NOT NULL,
    foto_url VARCHAR(255),
    status VARCHAR(20) DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo', 'Bloqueado')),
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA DE ESCALAS DE TRABALHO
CREATE TABLE escalas_trabalho (
    id_escala INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_pessoa INT NOT NULL REFERENCES pessoas(id_pessoa) ON DELETE CASCADE,
    dia_semana VARCHAR(3) CHECK (dia_semana IN ('Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom')) NOT NULL,
    horario_entrada TIME NOT NULL,
    horario_saida TIME NOT NULL,
    tolerancia_minutos INT DEFAULT 10
);

-- 3. TABELA DE VEÍCULOS
CREATE TABLE veiculos (
    id_veiculo INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_pessoa INT NOT NULL REFERENCES pessoas(id_pessoa) ON DELETE CASCADE,
    placa VARCHAR(10) UNIQUE NOT NULL,
    modelo VARCHAR(50),
    cor VARCHAR(30),
    tipo_veiculo VARCHAR(10) DEFAULT 'Carro' CHECK (tipo_veiculo IN ('Carro', 'Moto', 'Outro')),
    status_autorizacao VARCHAR(20) DEFAULT 'Autorizado' CHECK (status_autorizacao IN ('Autorizado', 'Bloqueado'))
);

-- 4. TABELA DE VISITAS E PRESTADORES
CREATE TABLE visitas_prestadores (
    id_visita INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_pessoa INT NOT NULL REFERENCES pessoas(id_pessoa) ON DELETE CASCADE,
    setor_destino VARCHAR(100) NOT NULL,
    responsavel_liberacao VARCHAR(100) NOT NULL,
    motivo_materiais TEXT,
    qr_code_token VARCHAR(255) UNIQUE NOT NULL,
    data_validade DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Finalizado', 'Expirado'))
);

-- 5. TABELA DE REGISTROS DE PONTO E ACESSO
CREATE TABLE registros_ponto (
    id_registro INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_pessoa INT NOT NULL REFERENCES pessoas(id_pessoa),
    id_veiculo INT REFERENCES veiculos(id_veiculo),
    tipo_acesso VARCHAR(10) CHECK (tipo_acesso IN ('Entrada', 'Saida')) NOT NULL,
    metodo_autenticacao VARCHAR(20) CHECK (metodo_autenticacao IN ('Face_ID', 'Senha', 'QR_Code', 'Placa_FaceID', 'Manual')) NOT NULL,
    ponto_acesso VARCHAR(50) NOT NULL,
    data_hora_local TIMESTAMPTZ NOT NULL,
    status_sincronizacao VARCHAR(20) DEFAULT 'Pendente' CHECK (status_sincronizacao IN ('Pendente', 'Sincronizado'))
);

-- 6. TABELA DE AUDITORIA E TENTATIVAS NEGADAS
CREATE TABLE registros_tentativas_acesso (
    id_tentativa INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_pessoa INT REFERENCES pessoas(id_pessoa),
    placa_detectada VARCHAR(10),
    motivo_negado VARCHAR(100) NOT NULL,
    foto_capturada_url VARCHAR(255),
    ponto_acesso VARCHAR(50) NOT NULL,
    data_hora TIMESTAMPTZ DEFAULT NOW(),
    observacao_porteiro TEXT
);

-- 7. TABELA DE CÁLCULO DE HORAS EXTRAS (RH)
CREATE TABLE calculo_horas_extras (
    id_calculo INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_pessoa INT NOT NULL REFERENCES pessoas(id_pessoa) ON DELETE CASCADE,
    data_registro DATE NOT NULL,
    horas_previstas TIME NOT NULL,
    horas_trabalhadas TIME NOT NULL,
    saldo_minutos INT NOT NULL,
    status_aprovacao VARCHAR(20) DEFAULT 'Pendente' CHECK (status_aprovacao IN ('Pendente', 'Aprovado', 'Rejeitado'))
);