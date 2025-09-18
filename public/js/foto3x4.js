document.addEventListener('DOMContentLoaded', () => {
    const imageUpload = document.getElementById('image-upload');
    const imageToCrop = document.getElementById('image-to-crop');
    const replicateButton = document.getElementById('replicate-button');
    const paperSizeSelect = document.getElementById('paper-size');
    const addBorderCheckbox = document.getElementById('add-border');
    const outputContainer = document.getElementById('output-canvas-container');
    const saveButton = document.getElementById('save-button');

    let cropper;
    const photoSize = { width: 3.25, height: 4.25 }; // Tamanho da foto em cm

    // Carregar imagem e inicializar o Cropper
    imageUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                imageToCrop.src = event.target.result;
                imageToCrop.style.display = 'block';

                if (cropper) {
                    cropper.destroy();
                }
                
                cropper = new Cropper(imageToCrop, {
                    aspectRatio: photoSize.width / photoSize.height,
                    viewMode: 1,
                    zoomable: true,
                    dragMode: 'move',
                    autoCropArea: 1
                });

                replicateButton.disabled = false;
                outputContainer.innerHTML = '';
                saveButton.style.display = 'none';
            };
            reader.readAsDataURL(file);
        }
    });

    // Função para replicar a foto
    replicateButton.addEventListener('click', () => {
        if (!cropper) return;

        // Dimensões do papel em pixels para IMPRESSÃO (300 DPI)
        const printDpi = 300;
        const printPaperSizes = {
            A5: { width: 14.8 * printDpi / 2.54, height: 21.0 * printDpi / 2.54 },
            A4: { width: 21.0 * printDpi / 2.54, height: 29.7 * printDpi / 2.54 }
        };
        const selectedPaper = paperSizeSelect.value;
        const printPaperDimensions = printPaperSizes[selectedPaper];

        // Dimensões da foto para IMPRESSÃO
        const printPhotoDimensions = {
            width: photoSize.width * printDpi / 2.54,
            height: photoSize.height * printDpi / 2.54
        };

        // Cria o canvas para o resultado final em tamanho de impressão
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = printPaperDimensions.width;
        finalCanvas.height = printPaperDimensions.height;
        const ctx = finalCanvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
        
        const imageData = cropper.getCroppedCanvas().toDataURL();
        const image = new Image();
        image.src = imageData;

        image.onload = () => {
            let x = 0;
            let y = 0;

            // Preenche a folha com as fotos
            while (y + printPhotoDimensions.height <= printPaperDimensions.height) {
                while (x + printPhotoDimensions.width <= printPaperDimensions.width) {
                    ctx.drawImage(image, x, y, printPhotoDimensions.width, printPhotoDimensions.height);
                    
                    if (addBorderCheckbox.checked) {
                        ctx.strokeStyle = '#000000';
                        ctx.lineWidth = 1;
                        ctx.strokeRect(x, y, printPhotoDimensions.width, printPhotoDimensions.height);
                    }
                    
                    x += printPhotoDimensions.width;
                }
                x = 0;
                y += printPhotoDimensions.height;
            }

            // Agora, cria um canvas em miniatura para pré-visualização na tela
            // Usando um DPI visual mais comum (ex: 96 DPI) para a pré-visualização
            const screenDpi = 96;
            const screenPaperWidth = printPaperDimensions.width * screenDpi / printDpi;
            const screenPaperHeight = printPaperDimensions.height * screenDpi / printDpi;

            const previewCanvas = document.createElement('canvas');
            previewCanvas.width = screenPaperWidth;
            previewCanvas.height = screenPaperHeight;
            
            const previewCtx = previewCanvas.getContext('2d');
            previewCtx.drawImage(finalCanvas, 0, 0, previewCanvas.width, previewCanvas.height);
            
            // Adiciona a classe para estilização da miniatura
            previewCanvas.classList.add('preview-canvas');

            outputContainer.innerHTML = '';
            outputContainer.appendChild(previewCanvas);
            saveButton.style.display = 'block';

            // Armazena o canvas final para o botão de salvar
            saveButton.finalCanvas = finalCanvas;
        };
    });

    // Salvar o canvas como imagem
    saveButton.addEventListener('click', () => {
        const finalCanvas = saveButton.finalCanvas;
        if (finalCanvas) {
            const link = document.createElement('a');
            link.download = `fotos-3x4-${paperSizeSelect.value}.png`;
            link.href = finalCanvas.toDataURL('image/png');
            link.click();
        }
    });
});