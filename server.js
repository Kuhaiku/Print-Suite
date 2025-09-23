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

            req.session.user = { email: user.email, loginTime: Date.now() }; // Armazena o tempo de login
            console.log(`[MONITOR] Usuário ${user.email} logado em: ${new Date().toISOString()}`); // Loga o tempo de entrada
            res.status(200).send('Login bem-sucedido!');
        } else {
            res.status(400).send('Email ou senha incorretos.');
        }
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).send('Erro interno do servidor.');
    }
});
