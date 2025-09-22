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