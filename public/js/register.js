document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const messageDiv = document.getElementById('message');

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = emailInput.value;
        const password = passwordInput.value;

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const text = await response.text();
            messageDiv.textContent = text;

            if (response.ok) {
                messageDiv.style.color = 'green';
                // Opcionalmente, redireciona o usuário para a página de login
                setTimeout(() => {
                    window.location.href = '/auth/login.html';
                }, 1500);
            } else {
                messageDiv.style.color = 'red';
            }
        } catch (error) {
            console.error('Erro:', error);
            messageDiv.textContent = 'Ocorreu um erro ao tentar se registrar.';
            messageDiv.style.color = 'red';
        }
    });
});