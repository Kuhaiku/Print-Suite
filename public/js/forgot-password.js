document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('forgot-password-form');
    const emailInput = document.getElementById('email');
    const messageDiv = document.getElementById('message');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value;

        try {
            const response = await fetch('/api/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const text = await response.text();
            messageDiv.textContent = text;
            
            if (response.ok) {
                messageDiv.style.color = 'green';
                // Redireciona para a página de redefinição após 2 segundos
                setTimeout(() => {
                    window.location.href = '/auth/reset-password.html';
                }, 2000);
            } else {
                messageDiv.style.color = 'red';
            }
        } catch (error) {
            console.error('Erro:', error);
            messageDiv.textContent = 'Ocorreu um erro. Por favor, tente novamente mais tarde.';
            messageDiv.style.color = 'red';
        }
    });
});