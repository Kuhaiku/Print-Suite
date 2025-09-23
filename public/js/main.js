document.addEventListener('DOMContentLoaded', async () => {
    const authButtonsContainer = document.getElementById('auth-buttons');
    if (!authButtonsContainer) {
        // Se o elemento não existe, saia da função para evitar o erro.
        return;
    }

    try {
        const response = await fetch('/api/check-session');
        const data = await response.json();

        if (data.loggedIn) {
            authButtonsContainer.innerHTML = `<a href="/api/logout" class="action-button logout-button">Sair</a>`;
        } else {
            authButtonsContainer.innerHTML = `<a href="/auth/login.html" class="action-button">Entrar</a>`;
        }
    } catch (error) {
        console.error('Erro ao verificar a sessão:', error);
        authButtonsContainer.innerHTML = `<a href="/auth/login.html" class="action-button">Entrar</a>`;
    }
});

// Código do monitor de uso
document.addEventListener('DOMContentLoaded', () => {
    let hasSentBeacon = false;
    
    // Usa navigator.sendBeacon para enviar dados de forma confiável
    window.addEventListener('beforeunload', () => {
        if (!hasSentBeacon) {
            // O caminho '/api/log-exit' deve ser o mesmo do server.js
            navigator.sendBeacon('/api/log-exit');
            hasSentBeacon = true;
        }
    });

    // Adiciona um listener para a navegação por links internos
    document.body.addEventListener('click', (e) => {
        const target = e.target.closest('a');
        if (target && !target.target && !target.href.startsWith('mailto') && !target.href.startsWith('tel') && !target.href.includes('logout')) {
            hasSentBeacon = true;
        }
    });
});
