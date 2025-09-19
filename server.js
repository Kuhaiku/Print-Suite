const express = require('express');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.development' });

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração da conexão com o banco de dados
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
};

let pool;

async function connectToDatabase() {
    try {
        pool = mysql.createPool(dbConfig);
        console.log('Conexão com o banco de dados MySQL estabelecida.');
        await createUsersTable();
    } catch (error) {
        console.error('Erro ao conectar ao banco de dados:', error);
        process.exit(1);
    }
}

async function createUsersTable() {
    const sql = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;
    try {
        await pool.query(sql);
        console.log('Tabela "users" verificada/criada com sucesso.');
    } catch (error) {
        console.error('Erro ao criar a tabela "users":', error);
    }
}

connectToDatabase();

// Middleware para processar dados de formulário
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configuração da sessão
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: 'auto' }
}));

// Middleware de autenticação
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/auth/login.html');
    }
};

// **IMPORTANTE:** Rotas Protegidas primeiro
app.get('/tools/foto3x4.html', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/tools/foto3x4.html'));
});

app.get('/tools/polaroid.html', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/tools/polaroid.html'));
});

app.get('/tools/replicador.html', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/tools/replicador.html'));
});

app.get('/tools/mosaico.html', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/tools/mosaico.html'));
});

// **Somente depois** de proteger as rotas específicas, sirva os arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rotas de API
app.post('/api/register', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).send('Email e senha são obrigatórios.');
    }
    
    try {
        const [existingUser] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(409).send('Email já cadastrado.');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashedPassword]);
        res.status(201).send('Usuário registrado com sucesso!');
    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).send('Erro interno do servidor.');
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password, rememberMe } = req.body;
    
    try {
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        const user = users[0];

        if (!user) {
            return res.status(400).send('Email ou senha incorretos.');
        }

        const match = await bcrypt.compare(password, user.password);

        if (match) {
            if (rememberMe) {
                req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
            } else {
                req.session.cookie.expires = false;
            }

            req.session.user = { email: user.email };
            res.status(200).send('Login bem-sucedido!');
        } else {
            res.status(400).send('Email ou senha incorretos.');
        }
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).send('Erro interno do servidor.');
    }
});

app.get('/api/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/auth/login.html');
});

app.get('/api/check-session', (req, res) => {
    if (req.session.user) {
        res.status(200).send('Usuário logado.');
    } else {
        res.status(401).send('Usuário não logado.');
    }
});

// Rota principal (agora com controle de autenticação)
app.get('/', (req, res) => {
    if (req.session.user) {
        res.sendFile(path.join(__dirname, 'public/index.html'));
    } else {
        res.redirect('/auth/login.html');
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});