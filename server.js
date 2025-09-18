const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para servir arquivos estáticos
// Isso faz com que a pasta 'public' e todo o seu conteúdo
// fiquem acessíveis diretamente pelo navegador.
app.use(express.static(path.join(__dirname, 'public')));

// Rota principal (opcional, já que estamos servindo o index.html como estático)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Inicialização do servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});