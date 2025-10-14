document.addEventListener('DOMContentLoaded', () => {
    // 1. Definição de constantes e variáveis
    const DOM = {};
    let cropper;
    let croppedImage = null;

    const paperSizesCm = {
        A4: { width: 21, height: 29.7 },
        A3: { width: 29.7, height: 42 }
    };
    
    // 2. Funções de inicialização
    function initializeDOM() {
        DOM.imageFileUploader = document.getElementById('image-file-input');
        DOM.imageUploadArea = document.querySelector('.image-upload-area');
        DOM.divisionMethodRadios = document.querySelectorAll('input[name="division-method"]');
        DOM.divisionBySizeSection = document.getElementById('division-by-size');
        DOM.divisionByGridSection = document.getElementById('division-by-grid');
        DOM.divisionByPieceSection = document.getElementById('division-by-piece'); // Novo
        DOM.finalWidthInput = document.getElementById('final-width');
        DOM.finalHeightInput = document.getElementById('final-height');
        DOM.gridColsInput = document.getElementById('grid-cols');
        DOM.gridRowsInput = document.getElementById('grid-rows');
        DOM.pieceWidthInput = document.getElementById('piece-width'); // Novo
        DOM.pieceHeightInput = document.getElementById('piece-height'); // Novo
        DOM.paperSizeSelect = document.getElementById('paper-size');
        DOM.orientationSelect = document.getElementById('orientation');
        DOM.autoDpiCheckbox = document.getElementById('auto-dpi');
        DOM.dpiInput = document.getElementById('dpi-input');
        DOM.calculateButton = document.getElementById('calculate-button');
        DOM.previewGrid = document.getElementById('preview-grid');
        DOM.saveButton = document.getElementById('save-button');
        DOM.modal = document.getElementById('modal');
        DOM.modalImage = document.getElementById('modal-image');
        DOM.cropButton = document.getElementById('crop-button');
        DOM.closeButton = document.querySelector('.close-button');
        DOM.finalWidthDisplay = document.getElementById('final-width-display');
        DOM.finalHeightDisplay = document.getElementById('final-height-display');
    }

    // 3. Funções de Manipulação
    function openModal(imageSrc) {
        DOM.modal.style.display = 'block';
        DOM.modalImage.src = imageSrc;
        DOM.modalImage.onload = () => {
            if (cropper) cropper.destroy();
            cropper = new Cropper(DOM.modalImage, {
                viewMode: 1,
                zoomable: true,
                dragMode: 'move',
                autoCropArea: 1,
            });
        };
    }

    function handleFileChange(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const originalImage = new Image();
                originalImage.onload = () => openModal(originalImage.src);
                originalImage.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    function handleCrop() {
        if (!cropper) return;
        const croppedCanvas = cropper.getCroppedCanvas();
        croppedImage = new Image();
        croppedImage.src = croppedCanvas.toDataURL();
        
        croppedImage.onload = () => {
            DOM.modal.style.display = 'none';
            if (cropper) cropper.destroy();
            
            const ratio = croppedImage.width / croppedImage.height;
            const previewWidth = 200;
            const previewHeight = previewWidth / ratio;
            
            DOM.imageUploadArea.innerHTML = `<img src="${croppedImage.src}" alt="Pré-visualização da imagem" style="width: ${previewWidth}px; height: ${previewHeight}px; border-radius: 8px;">`;
            
            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'X';
            removeBtn.className = 'remove-btn';
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                croppedImage = null;
                DOM.imageUploadArea.innerHTML = '<p>Clique aqui para selecionar ou ajustar a imagem.</p>';
                DOM.saveButton.style.display = 'none';
            });
            DOM.imageUploadArea.appendChild(removeBtn);
            
            calculateAndRenderPreview();
        };
    }

    function calculateOptimalDpi(widthCm, heightCm) {
        const maxDimensionPx = 20000;
        const minDpi = 72;
        const defaultDpi = 300;

        const mmToPx = (mm, dpi) => mm * dpi / 25.4;
        const widthPx = mmToPx(widthCm * 10, defaultDpi);
        const heightPx = mmToPx(heightCm * 10, defaultDpi);

        let finalDpi = defaultDpi;
        if (widthPx > maxDimensionPx || heightPx > maxDimensionPx) {
            const ratio = Math.max(widthPx / maxDimensionPx, heightPx / maxDimensionPx);
            finalDpi = Math.floor(defaultDpi / ratio);
            if (finalDpi < minDpi) {
                finalDpi = minDpi;
            }
        }
        return finalDpi;
    }

    function calculateAndRenderPreview() {
        if (!croppedImage) {
            DOM.previewGrid.innerHTML = '<p>Carregue uma imagem e defina as opções para pré-visualizar o mosaico.</p>';
            DOM.saveButton.style.display = 'none';
            return;
        }

        const method = document.querySelector('input[name="division-method"]:checked').value;
        const paperSize = DOM.paperSizeSelect.value;
        const orientation = DOM.orientationSelect.value;
        
        let paperWidthCm = paperSizesCm[paperSize].width;
        let paperHeightCm = paperSizesCm[paperSize].height;
        if (orientation === 'landscape') {
            [paperWidthCm, paperHeightCm] = [paperHeightCm, paperWidthCm];
        }

        let finalWidthCm, finalHeightCm, cols, rows;

        if (method === 'by-size') {
            finalWidthCm = parseFloat(DOM.finalWidthInput.value);
            finalHeightCm = parseFloat(DOM.finalHeightInput.value);
            if (isNaN(finalWidthCm) || isNaN(finalHeightCm) || finalWidthCm <= 0 || finalHeightCm <= 0) {
                DOM.previewGrid.innerHTML = '<p>Defina as dimensões finais corretamente.</p>';
                DOM.saveButton.style.display = 'none';
                return;
            }
            cols = Math.ceil(finalWidthCm / paperWidthCm);
            rows = Math.ceil(finalHeightCm / paperHeightCm);
        } else if (method === 'by-grid') {
            cols = parseInt(DOM.gridColsInput.value) || 1;
            rows = parseInt(DOM.gridRowsInput.value) || 1;
            finalWidthCm = cols * paperWidthCm;
            finalHeightCm = rows * paperHeightCm;
            DOM.finalWidthDisplay.textContent = finalWidthCm.toFixed(1);
            DOM.finalHeightDisplay.textContent = finalHeightCm.toFixed(1);
        } else { // by-piece
            const pieceWidthCm = parseFloat(DOM.pieceWidthInput.value);
            const pieceHeightCm = parseFloat(DOM.pieceHeightInput.value);
            if (isNaN(pieceWidthCm) || isNaN(pieceHeightCm) || pieceWidthCm <= 0 || pieceHeightCm <= 0) {
                DOM.previewGrid.innerHTML = '<p>Defina o tamanho de cada pedaço corretamente.</p>';
                DOM.saveButton.style.display = 'none';
                return;
            }
            // A lógica aqui é diferente, o tamanho final é o da imagem cortada.
            // A proporção da imagem cortada define as dimensões
            const imageAspectRatio = croppedImage.width / croppedImage.height;
            finalHeightCm = parseFloat(DOM.finalHeightInput.value) || 100; // Ou um valor padrão
            finalWidthCm = finalHeightCm * imageAspectRatio;

            cols = Math.ceil(finalWidthCm / pieceWidthCm);
            rows = Math.ceil(finalHeightCm / pieceHeightCm);
        }
        
        if (DOM.autoDpiCheckbox.checked) {
            const optimalDpi = calculateOptimalDpi(finalWidthCm, finalHeightCm);
            DOM.dpiInput.value = optimalDpi;
            DOM.dpiInput.disabled = true;
        } else {
            DOM.dpiInput.disabled = false;
        }

        const aspectRatio = finalWidthCm / finalHeightCm;
        const previewCanvasWidth = DOM.previewGrid.clientWidth;
        const previewCanvasHeight = previewCanvasWidth / aspectRatio;
        
        DOM.previewGrid.innerHTML = '';
        const canvas = document.createElement('canvas');
        canvas.width = previewCanvasWidth;
        canvas.height = previewCanvasHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(croppedImage, 0, 0, canvas.width, canvas.height);
        
        DOM.previewGrid.appendChild(canvas);
        
        for (let i = 1; i < cols; i++) {
            const line = document.createElement('div');
            line.classList.add('cut-line', 'vertical');
            line.style.left = `${(i / cols) * 100}%`;
            DOM.previewGrid.appendChild(line);
        }
        for (let i = 1; i < rows; i++) {
            const line = document.createElement('div');
            line.classList.add('cut-line', 'horizontal');
            line.style.top = `${(i / rows) * 100}%`;
            DOM.previewGrid.appendChild(line);
        }
        
        DOM.saveButton.style.display = 'block';
    }

    async function saveMosaico() {
        if (!croppedImage) return;

        const method = document.querySelector('input[name="division-method"]:checked').value;
        const paperSize = DOM.paperSizeSelect.value;
        const orientation = DOM.orientationSelect.value;
        const dpi = parseInt(DOM.dpiInput.value) || 300;
        
        let paperWidthCm = paperSizesCm[paperSize].width;
        let paperHeightCm = paperSizesCm[paperSize].height;
        let finalWidthCm, finalHeightCm, cols, rows, pieceWidthCm, pieceHeightCm;

        if (orientation === 'landscape') {
            [paperWidthCm, paperHeightCm] = [paperHeightCm, paperWidthCm];
        }

        if (method === 'by-size') {
            finalWidthCm = parseFloat(DOM.finalWidthInput.value);
            finalHeightCm = parseFloat(DOM.finalHeightInput.value);
            if (isNaN(finalWidthCm) || isNaN(finalHeightCm) || finalWidthCm <= 0 || finalHeightCm <= 0) {
                alert('Por favor, insira valores válidos para a largura e altura finais.');
                return;
            }
            cols = Math.ceil(finalWidthCm / paperWidthCm);
            rows = Math.ceil(finalHeightCm / paperHeightCm);
            pieceWidthCm = paperWidthCm;
            pieceHeightCm = paperHeightCm;
        } else if (method === 'by-grid') {
            cols = parseInt(DOM.gridColsInput.value) || 1;
            rows = parseInt(DOM.gridRowsInput.value) || 1;
            if (isNaN(cols) || isNaN(rows) || cols <= 0 || rows <= 0) {
                alert('Por favor, insira valores válidos para colunas e linhas.');
                return;
            }
            finalWidthCm = cols * paperWidthCm;
            finalHeightCm = rows * paperHeightCm;
            pieceWidthCm = paperWidthCm;
            pieceHeightCm = paperHeightCm;
        } else { // by-piece
            pieceWidthCm = parseFloat(DOM.pieceWidthInput.value);
            pieceHeightCm = parseFloat(DOM.pieceHeightInput.value);
            if (isNaN(pieceWidthCm) || isNaN(pieceHeightCm) || pieceWidthCm <= 0 || pieceHeightCm <= 0) {
                alert('Por favor, insira valores válidos para o tamanho do pedaço.');
                return;
            }

            const imageAspectRatio = croppedImage.width / croppedImage.height;
            finalHeightCm = parseFloat(DOM.finalHeightInput.value) || 100;
            finalWidthCm = finalHeightCm * imageAspectRatio;

            cols = Math.floor(finalWidthCm / pieceWidthCm);
            rows = Math.floor(finalHeightCm / pieceHeightCm);
        }

        const mmToPx = (mm) => mm * dpi / 25.4;

        const zip = new JSZip();

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const sliceCanvas = document.createElement('canvas');
                const sliceWidthPx = mmToPx(pieceWidthCm * 10);
                const sliceHeightPx = mmToPx(pieceHeightCm * 10);

                sliceCanvas.width = sliceWidthPx;
                sliceCanvas.height = sliceHeightPx;
                const sliceCtx = sliceCanvas.getContext('2d');
                
                const sourceX = (c * pieceWidthCm) / finalWidthCm * croppedImage.width;
                const sourceY = (r * pieceHeightCm) / finalHeightCm * croppedImage.height;
                const sourceWidth = (pieceWidthCm / finalWidthCm) * croppedImage.width;
                const sourceHeight = (pieceHeightCm / finalHeightCm) * croppedImage.height;

                sliceCtx.drawImage(
                    croppedImage,
                    sourceX, sourceY, sourceWidth, sourceHeight,
                    0, 0, sliceWidthPx, sliceHeightPx
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
    }

    // 4. Configuração de Eventos
    function setupEventListeners() {
        DOM.imageUploadArea.addEventListener('click', () => {
            if (croppedImage) {
                openModal(croppedImage.src);
            } else {
                DOM.imageFileUploader.click();
            }
        });
        
        DOM.imageFileUploader.addEventListener('change', handleFileChange);
        DOM.closeButton.addEventListener('click', () => DOM.modal.style.display = 'none');
        DOM.cropButton.addEventListener('click', handleCrop);
        DOM.saveButton.addEventListener('click', saveMosaico);
        
        DOM.autoDpiCheckbox.addEventListener('change', () => {
            DOM.dpiInput.disabled = DOM.autoDpiCheckbox.checked;
            calculateAndRenderPreview();
        });

        DOM.divisionMethodRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                DOM.divisionBySizeSection.style.display = radio.value === 'by-size' ? 'block' : 'none';
                DOM.divisionByGridSection.style.display = radio.value === 'by-grid' ? 'block' : 'none';
                DOM.divisionByPieceSection.style.display = radio.value === 'by-piece' ? 'block' : 'none'; // Novo
                calculateAndRenderPreview();
            });
        });

        const inputElements = [DOM.finalWidthInput, DOM.finalHeightInput, DOM.gridColsInput, DOM.gridRowsInput, DOM.pieceWidthInput, DOM.pieceHeightInput, DOM.paperSizeSelect, DOM.orientationSelect, DOM.dpiInput];
        inputElements.forEach(input => input.addEventListener('input', calculateAndRenderPreview));
    }

    // 5. Inicialização da aplicação
    initializeDOM();
    setupEventListeners();
    calculateAndRenderPreview();
});
