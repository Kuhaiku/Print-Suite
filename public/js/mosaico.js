document.addEventListener('DOMContentLoaded', () => {
    const imageUpload = document.getElementById('image-upload');
    const finalWidthInput = document.getElementById('final-width');
    const finalHeightInput = document.getElementById('final-height');
    const paperSizeSelect = document.getElementById('paper-size');
    const orientationSelect = document.getElementById('orientation');
    const calculateButton = document.getElementById('calculate-button');
    const previewSection = document.getElementById('preview-section');
    const previewGrid = document.getElementById('preview-grid');
    const saveButton = document.getElementById('save-button');

    let originalImage = null;
    const dpi = 300; // DPI padrão para impressão

    const paperSizesCm = {
        A4: { width: 21, height: 29.7 },
        A3: { width: 29.7, height: 42 }
    };

    imageUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                originalImage = new Image();
                originalImage.onload = () => {
                    calculateButton.disabled = false;
                    previewSection.style.display = 'none';
                };
                originalImage.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    calculateButton.addEventListener('click', () => {
        if (!originalImage || !finalWidthInput.value || !finalHeightInput.value) {
            alert('Por favor, carregue uma imagem e defina as dimensões finais.');
            return;
        }

        const finalWidthCm = parseFloat(finalWidthInput.value);
        const finalHeightCm = parseFloat(finalHeightInput.value);
        const paperSize = paperSizeSelect.value;
        const orientation = orientationSelect.value;

        let paperWidth = paperSizesCm[paperSize].width;
        let paperHeight = paperSizesCm[paperSize].height;

        if (orientation === 'landscape') {
            [paperWidth, paperHeight] = [paperHeight, paperWidth];
        }

        const cols = Math.ceil(finalWidthCm / paperWidth);
        const rows = Math.ceil(finalHeightCm / paperHeight);

        previewGrid.innerHTML = '';
        previewGrid.style.width = `${cols * 150}px`; // Tamanho da pré-visualização
        previewGrid.style.height = `${rows * 150}px`;
        previewGrid.style.position = 'relative';

        const canvas = document.createElement('canvas');
        canvas.width = cols * paperWidth;
        canvas.height = rows * paperHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
        
        previewGrid.appendChild(canvas);
        
        // Desenha as linhas de corte na pré-visualização
        for (let i = 1; i < cols; i++) {
            const line = document.createElement('div');
            line.classList.add('cut-line', 'vertical');
            line.style.left = `${i * paperWidth / canvas.width * 100}%`;
            previewGrid.appendChild(line);
        }
        for (let i = 1; i < rows; i++) {
            const line = document.createElement('div');
            line.classList.add('cut-line', 'horizontal');
            line.style.top = `${i * paperHeight / canvas.height * 100}%`;
            previewGrid.appendChild(line);
        }

        previewSection.style.display = 'block';
    });

    saveButton.addEventListener('click', async () => {
        const finalWidthCm = parseFloat(finalWidthInput.value);
        const finalHeightCm = parseFloat(finalHeightInput.value);
        const paperSize = paperSizeSelect.value;
        const orientation = orientationSelect.value;
        const zip = new JSZip();

        let paperWidth = paperSizesCm[paperSize].width;
        let paperHeight = paperSizesCm[paperSize].height;

        if (orientation === 'landscape') {
            [paperWidth, paperHeight] = [paperHeight, paperWidth];
        }
        
        const totalWidthPx = finalWidthCm * dpi / 2.54;
        const totalHeightPx = finalHeightCm * dpi / 2.54;
        const paperWidthPx = paperWidth * dpi / 2.54;
        const paperHeightPx = paperHeight * dpi / 2.54;

        const cols = Math.ceil(totalWidthPx / paperWidthPx);
        const rows = Math.ceil(totalHeightPx / paperHeightPx);
        
        const originalCanvas = document.createElement('canvas');
        originalCanvas.width = totalWidthPx;
        originalCanvas.height = totalHeightPx;
        const originalCtx = originalCanvas.getContext('2d');
        originalCtx.drawImage(originalImage, 0, 0, originalCanvas.width, originalCanvas.height);

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
                zip.file(`mosaico_linha${r+1}_coluna${c+1}.png`, imgData.substring(imgData.indexOf(',') + 1), {base64: true});
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