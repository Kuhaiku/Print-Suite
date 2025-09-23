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
