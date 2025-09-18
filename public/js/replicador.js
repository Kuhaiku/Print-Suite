document.addEventListener('DOMContentLoaded', () => {
    const addImageButton = document.getElementById('add-image');
    const imageCardsContainer = document.getElementById('image-cards-container');
    const replicateButton = document.getElementById('replicate-button');
    const paperSizeSelect = document.getElementById('paper-size');

    const dpi = 300;
    const mmToPx = (mm) => mm * dpi / 25.4;

    const paperSizesMm = {
        A5_portrait: { width: 148, height: 210 },
        A5_landscape: { width: 210, height: 148 },
        A4_portrait: { width: 210, height: 297 },
        A4_landscape: { width: 297, height: 210 },
        A3_portrait: { width: 297, height: 420 },
        A3_landscape: { width: 420, height: 297 }
    };

    function addImageCard() {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'image-card';
        cardDiv.innerHTML = `
            <h3>Imagem ${imageCardsContainer.querySelectorAll('.image-card').length + 1}</h3>
            <div class="options-group">
                <div>
                    <label>Largura (mm)</label>
                    <input type="number" class="image-width-mm" min="1" value="50" />
                </div>
                <div>
                    <label>Altura (mm)</label>
                    <input type="number" class="image-height-mm" min="1" value="50" />
                </div>
                <div>
                    <label>Quantidade</label>
                    <input type="number" class="image-count" min="1" value="1" />
                </div>
                <div>
                    <label>Margem (mm)</label>
                    <input type="number" class="image-margin-mm" min="0" value="0" />
                </div>
                <div>
                    <label>Arredondar (%)</label>
                    <input type="number" class="image-round-percent" min="0" max="50" value="0" />
                </div>
                <div>
                    <input type="checkbox" class="add-border" id="border-checkbox-${Date.now()}">
                    <label for="border-checkbox-${Date.now()}" style="flex-basis: auto; text-align: left;">Adicionar Borda</label>
                </div>
            </div>
            <input type="file" class="image-upload" accept="image/*" style="margin-top: 15px;">
            <button class="remove-image-button">Remover</button>
        `;
        imageCardsContainer.appendChild(cardDiv);

        cardDiv.querySelector('.remove-image-button').addEventListener('click', () => {
            cardDiv.remove();
        });
    }

    addImageCard(); // Adiciona o primeiro card por padrão
    addImageButton.addEventListener('click', addImageCard);

    replicateButton.addEventListener('click', async () => {
        const imageCards = document.querySelectorAll('.image-card');
        if (imageCards.length === 0) {
            alert('Por favor, adicione pelo menos uma imagem.');
            return;
        }

        const paper = paperSizesMm[paperSizeSelect.value];
        const paperPx = { width: mmToPx(paper.width), height: mmToPx(paper.height) };

        const newWindow = window.open('', '_blank', `width=${window.screen.width},height=${window.screen.height}`);
        newWindow.document.write('<html><head><title>Imagens para Impressão</title></head><body style="margin:0;padding:0;"></body></html>');
        newWindow.document.close();

        const canvas = newWindow.document.createElement('canvas');
        canvas.width = paperPx.width;
        canvas.height = paperPx.height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        let currentX = 0;
        let currentY = 0;
        let maxHeightInRow = 0;

        for (const card of imageCards) {
            const fileInput = card.querySelector('.image-upload');
            const file = fileInput.files[0];

            if (!file) {
                alert('Por favor, carregue uma imagem para todos os cards.');
                newWindow.close();
                return;
            }

            const img = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const tempImg = new Image();
                    tempImg.onload = () => resolve(tempImg);
                    tempImg.onerror = () => reject(new Error('Falha ao carregar a imagem.'));
                    tempImg.src = e.target.result;
                };
                reader.onerror = () => reject(new Error('Falha ao ler o arquivo.'));
                reader.readAsDataURL(file);
            });

            const imgWidthMm = parseFloat(card.querySelector('.image-width-mm').value);
            const imgHeightMm = parseFloat(card.querySelector('.image-height-mm').value);
            const imgCount = parseInt(card.querySelector('.image-count').value);
            const imgMarginMm = parseFloat(card.querySelector('.image-margin-mm').value);
            const addBorder = card.querySelector('.add-border').checked;
            const roundPercent = parseInt(card.querySelector('.image-round-percent').value);

            if (isNaN(imgWidthMm) || isNaN(imgHeightMm) || isNaN(imgCount) || imgWidthMm <= 0 || imgHeightMm <= 0 || imgCount <= 0 || isNaN(imgMarginMm) || imgMarginMm < 0 || isNaN(roundPercent) || roundPercent < 0 || roundPercent > 50) {
                alert('Por favor, preencha todos os campos do card corretamente.');
                newWindow.close();
                return;
            }

            const imgWidthPx = mmToPx(imgWidthMm);
            const imgHeightPx = mmToPx(imgHeightMm);
            const imgMarginPx = mmToPx(imgMarginMm);

            for (let i = 0; i < imgCount; i++) {
                if (currentX + imgWidthPx > paperPx.width) {
                    currentX = 0;
                    currentY += maxHeightInRow + imgMarginPx;
                    maxHeightInRow = 0;
                }
                
                if (currentY + imgHeightPx > paperPx.height) {
                    alert('As imagens não cabem na folha selecionada. Algumas imagens serão cortadas.');
                    break;
                }

                ctx.save();
                ctx.beginPath();
                const radius = Math.min(imgWidthPx, imgHeightPx) * (roundPercent / 100);
                ctx.moveTo(currentX + radius, currentY);
                ctx.arcTo(currentX + imgWidthPx, currentY, currentX + imgWidthPx, currentY + radius, radius);
                ctx.lineTo(currentX + imgWidthPx, currentY + imgHeightPx - radius);
                ctx.arcTo(currentX + imgWidthPx, currentY + imgHeightPx, currentX + imgWidthPx - radius, currentY + imgHeightPx, radius);
                ctx.lineTo(currentX + radius, currentY + imgHeightPx);
                ctx.arcTo(currentX, currentY + imgHeightPx, currentX, currentY + imgHeightPx - radius, radius);
                ctx.lineTo(currentX, currentY + radius);
                ctx.arcTo(currentX, currentY, currentX + radius, currentY, radius);
                ctx.closePath();
                ctx.clip();
                
                ctx.drawImage(img, currentX, currentY, imgWidthPx, imgHeightPx);
                ctx.restore();

                if (addBorder) {
                    ctx.strokeStyle = '#000000';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(currentX, currentY, imgWidthPx, imgHeightPx);
                }

                currentX += imgWidthPx + imgMarginPx;
                maxHeightInRow = Math.max(maxHeightInRow, imgHeightPx);
            }
        }
        
        newWindow.document.body.appendChild(canvas);
        
        const style = newWindow.document.createElement('style');
        style.innerHTML = 'body { margin: 0; padding: 0; } canvas { width: 100%; height: auto; }';
        newWindow.document.head.appendChild(style);

        alert('As imagens foram geradas em um pop-up. Você pode clicar com o botão direito na imagem para salvá-la ou imprimir.');
    });
});