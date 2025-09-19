document.addEventListener('DOMContentLoaded', async () => {
    const authButtonsContainer = document.getElementById('auth-buttons');
    const mainNav = document.querySelector('.main-nav ul');

    try {
        const response = await fetch('/api/check-session');
        if (response.ok) {
            // Usuário logado
            authButtonsContainer.innerHTML = `<a href="/api/logout" class="action-button logout-button">Sair</a>`;
        } else {
            // Usuário não logado
            authButtonsContainer.innerHTML = `<a href="/auth/login.html" class="action-button">Entrar</a>`;
        }
    } catch (error) {
        console.error('Erro ao verificar a sessão:', error);
        authButtonsContainer.innerHTML = `<a href="/auth/login.html" class="action-button">Entrar</a>`;
    }
});