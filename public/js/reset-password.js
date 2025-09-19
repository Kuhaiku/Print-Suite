document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('reset-password-form');
    const emailInput = document.getElementById('email');
    const codeInput = document.getElementById('code');
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const messageDiv = document.getElementById('message');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = emailInput.value;
        const code = codeInput.value;
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        if (newPassword !== confirmPassword) {
            messageDiv.textContent = 'As senhas não coincidem.';
            messageDiv.style.color = 'red';
            return;
        }

        try {
            const response = await fetch('/api/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, code, newPassword }),
            });

            const text = await response.text();
            messageDiv.textContent = text;

            if (response.ok) {
                messageDiv.style.color = 'green';
                setTimeout(() => {
                    window.location.href = '/auth/login.html';
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