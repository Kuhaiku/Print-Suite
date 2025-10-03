document.addEventListener('DOMContentLoaded', () => {
    const addImageButton = document.getElementById('add-image');
    const imageCardsContainer = document.getElementById('image-cards-container');
    const replicateButton = document.getElementById('replicate-button');
    const paperSizeSelect = document.getElementById('paper-size');
    const printPreviewContainer = document.getElementById('print-canvas-container');
    const paginationControls = document.getElementById('pagination-controls');
    const prevPageButton = document.getElementById('prev-page');
    const nextPageButton = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');
    const downloadButton = document.getElementById('download-button');
    const calculatorDisplay = document.getElementById('calculator-display');
    const calculatorResult = document.getElementById('result');

    const modal = document.getElementById('modal');
    const modalImage = document.getElementById('modal-image');
    const cropButton = document.getElementById('crop-button');
    const closeButton = document.querySelector('.close-button');

    let cropper;
    let currentCardToEdit = null;
    let finalCanvases = [];
    let currentPageIndex = 0;

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
        const cardId = Date.now();
        cardDiv.innerHTML = `
            <h3>Imagem ${imageCardsContainer.querySelectorAll('.image-card').length + 1}</h3>
            <div class="image-preview">
                <p>Clique para selecionar ou ajustar</p>
            </div>
            
            <input type="file" id="file-upload-${cardId}" class="image-upload" accept="image/*" style="display: none;">
            
            <div>
                <label for="width-${cardId}">Largura(mm)</label>
                <input type="number" id="width-${cardId}" class="image-width-mm" min="1" value="50" />
            </div>
            <div>
                <label for="height-${cardId}">Altura(mm)</label>
                <input type="number" id="height-${cardId}" class="image-height-mm" min="1" value="50" />
            </div>
            <div>
                <label for="count-${cardId}">Quantidade</label>
                <input type="number" id="count-${cardId}" class="image-count" min="1" value="1" />
            </div>
            <div>
                <label for="margin-${cardId}">Margem(mm)</label>
                <input type="number" id="margin-${cardId}" class="image-margin-mm" min="0" value="0" />
            </div>
            <div>
                <label for="round-${cardId}">Arredondar(%)</label>
                <input type="number" id="round-${cardId}" class="image-round-percent" min="0" max="50" value="0" />
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <input type="checkbox" class="add-border" id="border-${cardId}">
                <label for="border-${cardId}" style="margin: 0; flex-basis: auto; font-weight: normal;">Adicionar Borda</label>
            </div>
            
            <button class="action-button remove-image-button">Remover</button>
        `;
        imageCardsContainer.appendChild(cardDiv);

        const fileInput = cardDiv.querySelector('.image-upload');
        const previewDiv = cardDiv.querySelector('.image-preview');
        const removeButton = cardDiv.querySelector('.remove-image-button');
        const widthInput = cardDiv.querySelector('.image-width-mm');
        const heightInput = cardDiv.querySelector('.image-height-mm');
        const marginInput = cardDiv.querySelector('.image-margin-mm');

        const updateHandler = () => updateCalculator();
        widthInput.addEventListener('input', updateHandler);
        heightInput.addEventListener('input', updateHandler);
        marginInput.addEventListener('input', updateHandler);

        previewDiv.addEventListener('click', () => {
            if (previewDiv.querySelector('img')) {
                currentCardToEdit = cardDiv;
                modal.style.display = 'block';
                modalImage.src = previewDiv.querySelector('img').src;
                modalImage.onload = () => {
                    if (cropper) cropper.destroy();
                    cropper = new Cropper(modalImage, {
                        viewMode: 1,
                        zoomable: true,
                        dragMode: 'move',
                        autoCropArea: 1,
                    });
                };
            } else {
                fileInput.click();
            }
        });

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const imageData = event.target.result;
                    previewDiv.innerHTML = `<img src="${imageData}" alt="Pré-visualização da imagem">`;
                    currentCardToEdit = cardDiv;
                    openModal(imageData);
                };
                reader.readAsDataURL(file);
            }
        });

        removeButton.addEventListener('click', () => {
            cardDiv.remove();
            updateCalculator();
        });
    }

    function openModal(imageSrc) {
        modal.style.display = 'block';
        modalImage.src = imageSrc;
        modalImage.onload = () => {
            if (cropper) cropper.destroy();
            cropper = new Cropper(modalImage, {
                viewMode: 1,
                zoomable: true,
                dragMode: 'move',
                autoCropArea: 1,
            });
        };
    }

    cropButton.addEventListener('click', () => {
        if (!cropper || !currentCardToEdit) return;
        const croppedCanvas = cropper.getCroppedCanvas();
        const imageDataUrl = croppedCanvas.toDataURL();
        
        currentCardToEdit.dataset.imageData = imageDataUrl;
        currentCardToEdit.querySelector('.image-preview img').src = imageDataUrl;
        
        modal.style.display = 'none';
        currentCardToEdit = null;
    });

    closeButton.addEventListener('click', () => {
        modal.style.display = 'none';
        if (cropper) cropper.destroy();
        currentCardToEdit = null;
    });

    // Função de cálculo de espaço
    function updateCalculator() {
        const paper = paperSizesMm[paperSizeSelect.value];
        const imageCards = document.querySelectorAll('.image-card');

        if (imageCards.length === 0) {
            calculatorResult.innerHTML = '<p>Nenhuma imagem para calcular.</p>';
            return;
        }

        const firstCard = imageCards[0];
        const imgWidthMm = parseFloat(firstCard.querySelector('.image-width-mm').value);
        const imgHeightMm = parseFloat(firstCard.querySelector('.image-height-mm').value);
        const imgMarginMm = parseFloat(firstCard.querySelector('.image-margin-mm').value);

        if (isNaN(imgWidthMm) || isNaN(imgHeightMm) || imgWidthMm <= 0 || imgHeightMm <= 0 || isNaN(imgMarginMm) || imgMarginMm < 0) {
            calculatorResult.innerHTML = '<p>Insira valores válidos para calcular.</p>';
            return;
        }

        const itemWidthWithMargin = imgWidthMm + imgMarginMm;
        const itemHeightWithMargin = imgHeightMm + imgMarginMm;

        // Calcula a quantidade máxima que cabe, garantindo que o último item caiba
        const horizontalCount = Math.floor((paper.width + imgMarginMm) / itemWidthWithMargin);
        const verticalCount = Math.floor((paper.height + imgMarginMm) / itemHeightWithMargin);
        
        const totalPerSheet = horizontalCount * verticalCount;

        calculatorResult.innerHTML = `
            <p><strong>Largura útil:</strong> ${paper.width} mm</p>
            <p><strong>Altura útil:</strong> ${paper.height} mm</p>
            <p><strong>Total por folha (Item 1):</strong> ${totalPerSheet} item(s)</p>
        `;
    }

    // Listener para o seletor de papel
    paperSizeSelect.addEventListener('change', updateCalculator);

    addImageCard();
    addImageButton.addEventListener('click', addImageCard);

    replicateButton.addEventListener('click', async () => {
        const imageCards = document.querySelectorAll('.image-card');
        if (imageCards.length === 0) {
            alert('Por favor, adicione pelo menos uma imagem.');
            return;
        }

        const paper = paperSizesMm[paperSizeSelect.value];
        const paperPx = { width: mmToPx(paper.width), height: mmToPx(paper.height) };

        // --- INÍCIO DA MODIFICAÇÃO PARA CENTRALIZAÇÃO ---
        const firstCard = imageCards[0];
        const imgWidthMm_First = parseFloat(firstCard.querySelector('.image-width-mm').value);
        const imgHeightMm_First = parseFloat(firstCard.querySelector('.image-height-mm').value);
        const imgMarginMm_First = parseFloat(firstCard.querySelector('.image-margin-mm').value);

        if (isNaN(imgWidthMm_First) || isNaN(imgHeightMm_First) || imgWidthMm_First <= 0 || imgHeightMm_First <= 0 || isNaN(imgMarginMm_First) || imgMarginMm_First < 0) {
             alert('Por favor, preencha os campos de Largura, Altura e Margem do primeiro cartão corretamente para calcular o layout.');
            return;
        }

        const imgWidthPx_First = mmToPx(imgWidthMm_First);
        const imgHeightPx_First = mmToPx(imgHeightMm_First);
        const imgMarginPx_First = mmToPx(imgMarginMm_First);

        // Calcula o número máximo de itens que cabem horizontal e verticalmente (incluindo a margem)
        const itemWidthWithMargin_First = imgWidthMm_First + imgMarginMm_First;
        const itemHeightWithMargin_First = imgHeightMm_First + imgMarginMm_First;
        
        const horizontalCountMax = Math.floor((paper.width + imgMarginMm_First) / itemWidthWithMargin_First);
        const verticalCountMax = Math.floor((paper.height + imgMarginMm_First) / itemHeightWithMargin_First);
        
        // Largura total ocupada pelo bloco de imagens (largura total da grade)
        const totalUsedWidth = horizontalCountMax * imgWidthPx_First + (horizontalCountMax - 1) * imgMarginPx_First;
        const totalUsedHeight = verticalCountMax * imgHeightPx_First + (verticalCountMax - 1) * imgMarginPx_First;
        
        // Offset de centralização
        const offsetX = Math.max(0, (paperPx.width - totalUsedWidth) / 2);
        const offsetY = Math.max(0, (paperPx.height - totalUsedHeight) / 2);
        // --- FIM DA MODIFICAÇÃO PARA CENTRALIZAÇÃO ---


        finalCanvases = [];
        let currentCanvas = document.createElement('canvas');
        currentCanvas.width = paperPx.width;
        currentCanvas.height = paperPx.height;
        let ctx = currentCanvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, currentCanvas.width, currentCanvas.height);
        finalCanvases.push(currentCanvas);


        // Inicializa a posição com o offset de centralização
        let currentX = offsetX;
        let currentY = offsetY;
        let maxHeightInRow = 0;

        for (const card of imageCards) {
            const imageDataUrl = card.dataset.imageData;

            if (!imageDataUrl) {
                alert('Por favor, selecione uma imagem para todos os cards.');
                return;
            }

            const img = await new Promise((resolve, reject) => {
                const tempImg = new Image();
                tempImg.onload = () => resolve(tempImg);
                tempImg.onerror = () => reject(new Error('Falha ao carregar a imagem.'));
                tempImg.src = imageDataUrl;
            });

            const imgWidthMm = parseFloat(card.querySelector('.image-width-mm').value);
            const imgHeightMm = parseFloat(card.querySelector('.image-height-mm').value);
            const imgCount = parseInt(card.querySelector('.image-count').value);
            const imgMarginMm = parseFloat(card.querySelector('.image-margin-mm').value);
            const addBorder = card.querySelector('.add-border').checked;
            const roundPercent = parseInt(card.querySelector('.image-round-percent').value);

            if (isNaN(imgWidthMm) || isNaN(imgHeightMm) || isNaN(imgCount) || imgWidthMm <= 0 || imgHeightMm <= 0 || imgCount <= 0 || isNaN(imgMarginMm) || imgMarginMm < 0 || isNaN(roundPercent) || roundPercent < 0 || roundPercent > 50) {
                alert('Por favor, preencha todos os campos do card corretamente.');
                return;
            }

            const imgWidthPx = mmToPx(imgWidthMm);
            const imgHeightPx = mmToPx(imgHeightMm);
            const imgMarginPx = mmToPx(imgMarginMm);

            for (let i = 0; i < imgCount; i++) {
                
                // Quebra de linha: se o próximo item ultrapassar a borda direita
                if (currentX + imgWidthPx > paperPx.width) {
                    currentX = offsetX; // Reset para a posição X inicial centralizada
                    currentY += maxHeightInRow + imgMarginPx;
                    maxHeightInRow = 0;
                }
                
                // Quebra de página: se o item atual ultrapassar a borda inferior
                if (currentY + imgHeightPx > paperPx.height) {
                    currentCanvas = document.createElement('canvas');
                    currentCanvas.width = paperPx.width;
                    currentCanvas.height = paperPx.height;
                    ctx = currentCanvas.getContext('2d');
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, currentCanvas.width, currentCanvas.height);
                    finalCanvases.push(currentCanvas);
                    
                    currentX = offsetX; // Reset X para o offset
                    currentY = offsetY; // Reset Y para o offset
                    maxHeightInRow = 0;
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
        
        displayCurrentPage();
        paginationControls.style.display = finalCanvases.length > 1 ? 'flex' : 'none';
        downloadButton.style.display = 'block';
    });

    prevPageButton.addEventListener('click', () => {
        if (currentPageIndex > 0) {
            currentPageIndex--;
            displayCurrentPage();
        }
    });

    nextPageButton.addEventListener('click', () => {
        if (currentPageIndex < finalCanvases.length - 1) {
            currentPageIndex++;
            displayCurrentPage();
        }
    });

    function displayCurrentPage() {
        printPreviewContainer.innerHTML = '';
        const canvas = finalCanvases[currentPageIndex];
        const previewCanvas = document.createElement('canvas');
        const ratio = canvas.width / canvas.height;
        previewCanvas.width = 320;
        previewCanvas.height = 320 / ratio;
        const previewCtx = previewCanvas.getContext('2d');
        previewCtx.drawImage(canvas, 0, 0, previewCanvas.width, previewCanvas.height);
        previewCanvas.id = 'print-canvas';
        printPreviewContainer.appendChild(previewCanvas);
        pageInfo.textContent = `Página ${currentPageIndex + 1} de ${finalCanvases.length}`;
    }

    downloadButton.addEventListener('click', async () => {
        if (finalCanvases.length === 1) {
            const link = document.createElement('a');
            link.download = `imagens_replicadas.png`;
            link.href = finalCanvases[0].toDataURL('image/png');
            link.click();
        } else {
            const zip = new JSZip();
            for (let i = 0; i < finalCanvases.length; i++) {
                const canvas = finalCanvases[i];
                const imageData = canvas.toDataURL('image/png');
                zip.file(`pagina_${i+1}.png`, imageData.substring(imageData.indexOf(',') + 1), {base64: true});
            }
            zip.generateAsync({type: "blob"}).then(function(content) {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(content);
                link.download = "imagens_replicadas.zip";
                link.click();
            });
        }
    });

    // Inicia a calculadora ao carregar a página
    updateCalculator();
});
