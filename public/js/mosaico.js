document.addEventListener('DOMContentLoaded', () => {
    const imageFileUploader = document.getElementById('image-file-input');
    const imageUploadArea = document.querySelector('.image-upload-area');
    const divisionMethodRadios = document.querySelectorAll('input[name="division-method"]');
    const divisionBySizeSection = document.getElementById('division-by-size');
    const divisionByGridSection = document.getElementById('division-by-grid');
    const finalWidthInput = document.getElementById('final-width');
    const finalHeightInput = document.getElementById('final-height');
    const gridColsInput = document.getElementById('grid-cols');
    const gridRowsInput = document.getElementById('grid-rows');
    const paperSizeSelect = document.getElementById('paper-size');
    const orientationSelect = document.getElementById('orientation');
    const calculateButton = document.getElementById('calculate-button');
    const previewGrid = document.getElementById('preview-grid');
    const saveButton = document.getElementById('save-button');

    const modal = document.getElementById('modal');
    const modalImage = document.getElementById('modal-image');
    const cropButton = document.getElementById('crop-button');
    const closeButton = document.querySelector('.close-button');

    let cropper;
    let originalImage = null;
    let croppedImage = null;

    const dpi = 300; // DPI padrão para impressão
    const paperSizesCm = {
        A4: { width: 21, height: 29.7 },
        A3: { width: 29.7, height: 42 }
    };

    // Abre o seletor de arquivo ao clicar na área de upload
    imageUploadArea.addEventListener('click', () => {
        if (croppedImage) {
            openModal(croppedImage.src);
        } else {
            imageFileUploader.click();
        }
    });

    // Lógica para carregar a imagem e abrir o modal de ajuste
    imageFileUploader.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                originalImage = new Image();
                originalImage.onload = () => {
                    openModal(originalImage.src);
                };
                originalImage.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Abre o modal de ajuste
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

    // Fecha o modal
    closeButton.addEventListener('click', () => {
        modal.style.display = 'none';
        if (cropper) cropper.destroy();
    });

    // Aplica o ajuste e salva a imagem cortada
    cropButton.addEventListener('click', () => {
        if (!cropper) return;
        const croppedCanvas = cropper.getCroppedCanvas();
        croppedImage = new Image();
        croppedImage.src = croppedCanvas.toDataURL();
        
        croppedImage.onload = () => {
            modal.style.display = 'none';
            if (cropper) cropper.destroy();
            
            // Reduz o tamanho da imagem de pré-visualização em 70%
            const ratio = croppedImage.width / croppedImage.height;
            const previewWidth = 500 * 0.3;
            const previewHeight = previewWidth / ratio;
            
            imageUploadArea.innerHTML = `<img src="${croppedImage.src}" alt="Imagem de pré-visualização" style="width: ${previewWidth}px; height: ${previewHeight}px; border-radius: 8px;">`;
            updatePreview();
        };
    });

    // Alternar entre os métodos de divisão
    divisionMethodRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            divisionBySizeSection.style.display = radio.value === 'by-size' ? 'block' : 'none';
            divisionByGridSection.style.display = radio.value === 'by-grid' ? 'block' : 'none';
            updatePreview();
        });
    });

    // Atualiza o display das dimensões estimadas em tempo real
    function updateEstimatedDimensions() {
        const paperSize = paperSizeSelect.value;
        const orientation = orientationSelect.value;
        const cols = parseInt(gridColsInput.value) || 1;
        const rows = parseInt(gridRowsInput.value) || 1;
        
        let paperWidth = paperSizesCm[paperSize].width;
        let paperHeight = paperSizesCm[paperSize].height;

        if (orientation === 'landscape') {
            [paperWidth, paperHeight] = [paperHeight, paperWidth];
        }
        
        const finalWidth = (cols * paperWidth).toFixed(1);
        const finalHeight = (rows * paperHeight).toFixed(1);
        
        document.getElementById('final-width-display').textContent = finalWidth;
        document.getElementById('final-height-display').textContent = finalHeight;
    }

    // Atualiza a pré-visualização ao mudar os inputs
    function setupRealtimeUpdates() {
        [finalWidthInput, finalHeightInput, gridColsInput, gridRowsInput, paperSizeSelect, orientationSelect].forEach(input => {
            input.addEventListener('input', () => {
                if (document.querySelector('input[name="division-method"]:checked').value === 'by-grid') {
                    updateEstimatedDimensions();
                }
                updatePreview();
            });
        });
        
        document.querySelectorAll('input[name="division-method"]').forEach(radio => {
            radio.addEventListener('change', updatePreview);
        });
    }

    // Função para atualizar a pré-visualização
    function updatePreview() {
        if (!croppedImage) {
            previewGrid.innerHTML = '<p>Carregue uma imagem e defina as opções para pré-visualizar o mosaico.</p>';
            saveButton.style.display = 'none';
            return;
        }
        
        const method = document.querySelector('input[name="division-method"]:checked').value;
        const paperSize = paperSizeSelect.value;
        const orientation = orientationSelect.value;
        let finalWidthCm, finalHeightCm, cols, rows;

        let paperWidth = paperSizesCm[paperSize].width;
        let paperHeight = paperSizesCm[paperSize].height;

        if (orientation === 'landscape') {
            [paperWidth, paperHeight] = [paperHeight, paperWidth];
        }

        if (method === 'by-size') {
            finalWidthCm = parseFloat(finalWidthInput.value);
            finalHeightCm = parseFloat(finalHeightInput.value);
            if (isNaN(finalWidthCm) || isNaN(finalHeightCm) || finalWidthCm <= 0 || finalHeightCm <= 0) {
                previewGrid.innerHTML = '<p>Defina as dimensões finais corretamente.</p>';
                saveButton.style.display = 'none';
                return;
            }
            cols = Math.ceil(finalWidthCm / paperWidth);
            rows = Math.ceil(finalHeightCm / paperHeight);
        } else {
            cols = parseInt(gridColsInput.value) || 1;
            rows = parseInt(gridRowsInput.value) || 1;
            finalWidthCm = cols * paperWidth;
            finalHeightCm = rows * paperHeight;
            updateEstimatedDimensions();
        }

        previewGrid.innerHTML = '';
        
        const previewCanvasWidth = 500;
        const aspectRatio = finalWidthCm / finalHeightCm;
        const previewCanvasHeight = previewCanvasWidth / aspectRatio;
        
        const canvas = document.createElement('canvas');
        canvas.width = previewCanvasWidth;
        canvas.height = previewCanvasHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(croppedImage, 0, 0, canvas.width, canvas.height);
        
        previewGrid.appendChild(canvas);
        
        for (let i = 1; i < cols; i++) {
            const line = document.createElement('div');
            line.classList.add('cut-line', 'vertical');
            line.style.left = `${(i * paperWidth / finalWidthCm) * 100}%`;
            previewGrid.appendChild(line);
        }
        for (let i = 1; i < rows; i++) {
            const line = document.createElement('div');
            line.classList.add('cut-line', 'horizontal');
            line.style.top = `${(i * paperHeight / finalHeightCm) * 100}%`;
            previewGrid.appendChild(line);
        }

        saveButton.style.display = 'block';
    }

    calculateButton.addEventListener('click', updatePreview);
    
    // Inicia a atualização em tempo real
    setupRealtimeUpdates();
    
    imageUploadArea.addEventListener('click', () => {
        if (croppedImage) {
            // Se já tem imagem, abre o modal para reajustar
            openModal(croppedImage.src);
        } else {
            // Se não tem, abre o seletor de arquivo
            imageFileUploader.click();
        }
    });

    saveButton.addEventListener('click', async () => {
        const method = document.querySelector('input[name="division-method"]:checked').value;
        const paperSize = paperSizeSelect.value;
        const orientation = orientationSelect.value;
        const zip = new JSZip();
        
        let paperWidthCm = paperSizesCm[paperSize].width;
        let paperHeightCm = paperSizesCm[paperSize].height;
        let finalWidthCm, finalHeightCm, cols, rows;
        
        if (orientation === 'landscape') {
            [paperWidthCm, paperHeightCm] = [paperHeightCm, paperWidthCm];
        }

        if (method === 'by-size') {
            finalWidthCm = parseFloat(finalWidthInput.value);
            finalHeightCm = parseFloat(finalHeightInput.value);
            cols = Math.ceil(finalWidthCm / paperWidthCm);
            rows = Math.ceil(finalHeightCm / paperHeightCm);
        } else {
            cols = parseInt(gridColsInput.value);
            rows = parseInt(gridRowsInput.value);
            finalWidthCm = cols * paperWidthCm;
            finalHeightCm = rows * paperHeightCm;
        }

        const totalWidthPx = finalWidthCm * dpi / 2.54;
        const totalHeightPx = finalHeightCm * dpi / 2.54;
        const paperWidthPx = paperWidthCm * dpi / 2.54;
        const paperHeightPx = paperHeightCm * dpi / 2.54;

        const originalCanvas = document.createElement('canvas');
        originalCanvas.width = totalWidthPx;
        originalCanvas.height = totalHeightPx;
        const originalCtx = originalCanvas.getContext('2d');
        originalCtx.drawImage(croppedImage, 0, 0, originalCanvas.width, originalCanvas.height);

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const sliceCanvas = document.createElement('canvas');
                sliceCanvas.width = paperWidthPx;
                sliceCanvas.height = paperHeightPx;
                const sliceCtx = sliceCanvas.getContext('2d');
                
                sliceCtx.drawImage(
                    originalCanvas,
                    c * paperWidthPx, r * paperHeightPx, paperWidthPx, paperHeightPx,
                    0, 0, paperWidthPx, paperHeightPx
                );
                
                const imgData = sliceCanvas.toDataURL('image/png');
                zip.file(`mosaico_linha-${r+1}_coluna-${c+1}.png`, imgData.substring(imgData.indexOf(',') + 1), {base64: true});
            }
        }

        zip.generateAsync({type: "blob"}).then(function(content) {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = "mosaico.zip";
            link.click();
        });
    });
});