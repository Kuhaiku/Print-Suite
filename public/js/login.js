document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const rememberMeCheckbox = document.getElementById('remember-me');
    const messageDiv = document.getElementById('message');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = emailInput.value;
        const password = passwordInput.value;
        const rememberMe = rememberMeCheckbox.checked;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password, rememberMe }),
            });

            const text = await response.text();
            messageDiv.textContent = text;

            if (response.ok) {
                messageDiv.style.color = 'green';
                // Redireciona para a página principal após 1.5 segundos
                setTimeout(() => {
                    window.location.href = '/';
                }, 1500);
            } else {
                messageDiv.style.color = 'red';
            }
        } catch (error) {
            console.error('Erro:', error);
            messageDiv.textContent = 'Ocorreu um erro ao tentar fazer o login.';
            messageDiv.style.color = 'red';
        }
    });
});