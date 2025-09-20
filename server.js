const express = require('express');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
require('dotenv').config({ path: '.env' });

const app = express();
const PORT = process.env.PORT || 3000;

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
            assinatura_ativa BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            reset_token VARCHAR(255),
            reset_token_expires_at DATETIME
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

const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN
});

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: 'auto' }
}));

const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/auth/login.html');
    }
};

const hasActiveSubscription = async (req, res, next) => {
    try {
        const [users] = await pool.query('SELECT assinatura_ativa FROM users WHERE email = ?', [req.session.user.email]);
        const user = users[0];
        if (user && user.assinatura_ativa) {
            next();
        } else {
            res.redirect('/assinatura.html');
        }
    } catch (error) {
        console.error('Erro ao verificar assinatura:', error);
        res.status(500).send('Erro interno do servidor.');
    }
};

app.get('/tools/foto3x4.html', isAuthenticated, hasActiveSubscription, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/tools/foto3x4.html'));
});

app.get('/tools/polaroid.html', isAuthenticated, hasActiveSubscription, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/tools/polaroid.html'));
});

app.get('/tools/replicador.html', isAuthenticated, hasActiveSubscription, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/tools/replicador.html'));
});

app.get('/tools/mosaico.html', isAuthenticated, hasActiveSubscription, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/tools/mosaico.html'));
});

app.use(express.static(path.join(__dirname, 'public')));

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
        res.status(200).json({ loggedIn: true });
    } else {
        res.status(401).json({ loggedIn: false });
    }
});

app.post('/api/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        const user = users[0];
        if (!user) {
            return res.status(404).send('Usuário não encontrado.');
        }

        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 300000);

        await pool.query(
            'UPDATE users SET reset_token = ?, reset_token_expires_at = ? WHERE email = ?',
            [resetCode, expiresAt, email]
        );

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Código de Redefinição de Senha',
            html: `
                <p>Você solicitou a redefinição de senha.</p>
                <p>Seu código é: <b>${resetCode}</b></p>
                <p>O código é válido por 5 minutos.</p>
            `,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Erro ao enviar e-mail:', error);
                return res.status(500).send('Erro ao enviar o e-mail de redefinição.');
            }
            console.log('E-mail enviado:', info.response);
            res.status(200).send('Um código de redefinição foi enviado para seu email.');
        });

    } catch (error) {
        console.error('Erro na solicitação de redefinição:', error);
        res.status(500).send('Erro interno do servidor.');
    }
});

app.post('/api/reset-password', async (req, res) => {
    const { email, code, newPassword } = req.body;
    try {
        const [users] = await pool.query(
            'SELECT * FROM users WHERE email = ? AND reset_token = ? AND reset_token_expires_at > NOW()',
            [email, code]
        );
        const user = users[0];

        if (!user) {
            return res.status(400).send('Código inválido ou expirado.');
        }

        const newHashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.query(
            'UPDATE users SET password = ?, reset_token = NULL, reset_token_expires_at = NULL WHERE id = ?',
            [newHashedPassword, user.id]
        );

        res.status(200).send('Senha redefinida com sucesso.');

    } catch (error) {
        console.error('Erro ao redefinir a senha:', error);
        res.status(500).send('Erro interno do servidor.');
    }
});


app.post('/api/create_preference', isAuthenticated, async (req, res) => {
    try {
        const { email } = req.session.user;
        const preference = new Preference(client);
        
        const result = await preference.create({
            body: {
                items: [
                    {
                        title: "Assinatura Mensal Print Suite",
                        unit_price: 29.90,
                        quantity: 1,
                    }
                ],
                payer: {
                    email: email
                },
                // AQUI ESTÁ A CORREÇÃO: back_urls e auto_return devem estar neste nível
            },
            back_urls: {
                success: `${req.protocol}://${req.get('host')}/assinatura-status.html?status=success`,
                failure: `${req.protocol}://${req.get('host')}/assinatura-status.html?status=failure`,
                pending: `${req.protocol}://${req.get('host')}/assinatura-status.html?status=pending`
            },
            auto_return: "approved",
            notification_url: `${req.protocol}://${req.get('host')}/api/payment_notification`,
        });

        res.status(200).json({ url: result.init_point });
    } catch (error) {
        console.error('Erro ao criar a preferência de pagamento:', error);
        res.status(500).json({ error: 'Erro ao processar a solicitação de pagamento.' });
    }
});

app.post('/api/payment_notification', async (req, res) => {
    const topic = req.query.topic || req.body.topic;
    if (topic === 'payment') {
        const paymentId = req.body.data.id;
        try {
            const paymentClient = new Payment(client);
            const payment = await paymentClient.findById(paymentId);
            
            if (payment.status === 'approved') {
                const userEmail = payment.payer.email;
                await pool.query('UPDATE users SET assinatura_ativa = TRUE WHERE email = ?', [userEmail]);
                console.log(`Assinatura ativada para o usuário: ${userEmail}`);
            }
        } catch (error) {
            console.error('Erro ao processar a notificação de pagamento:', error);
            res.status(500).send('Erro ao processar a notificação.');
            return;
        }
    }
    res.status(200).send('OK');
});

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