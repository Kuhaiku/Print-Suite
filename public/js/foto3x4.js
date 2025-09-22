document.addEventListener('DOMContentLoaded', () => {
    const imageCardsContainer = document.getElementById('image-cards-container');
    const imageFileInput = document.getElementById('image-file-input');
    const replicateButton = document.getElementById('replicate-button');
    const paperSizeSelect = document.getElementById('paper-size');
    const addBorderCheckbox = document.getElementById('add-border');
    const outputContainer = document.getElementById('output-canvas-container');
    const saveButton = document.getElementById('save-button');
    const modal = document.getElementById('modal');
    const modalImage = document.getElementById('modal-image');
    const cropButton = document.getElementById('crop-button');
    const closeButton = document.querySelector('.close-button');

    let cropper;
    let currentImageCard = null;
    let finalCanvases = [];
    let currentPageIndex = 0;

    const photoSize = { width: 3.25, height: 4.25 };
    const printDpi = 300;
    const printPaperSizes = {
        A5: { width: 14.8 * printDpi / 2.54, height: 21.0 * printDpi / 2.54 },
        A4: { width: 21.0 * printDpi / 2.54, height: 29.7 * printDpi / 2.54 }
    };
    const printPhotoDimensions = {
        width: photoSize.width * printDpi / 2.54,
        height: photoSize.height * printDpi / 2.54
    };

    imageCardsContainer.addEventListener('click', (e) => {
        if (e.target.closest('.add-card')) {
            imageFileInput.click();
        }
    });

    function addImageCard(imageSrc) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'image-card';
        cardDiv.dataset.imageData = imageSrc;
        cardDiv.innerHTML = `
            <div class="image-preview-container-card">
                <img src="${imageSrc}" class="image-preview" alt="Pré-visualização da foto">
            </div>
            <button class="remove-card-btn">&times;</button>
        `;
        imageCardsContainer.insertBefore(cardDiv, imageCardsContainer.querySelector('.add-card'));
        
        const previewImg = cardDiv.querySelector('.image-preview');
        previewImg.addEventListener('click', () => {
            currentImageCard = cardDiv;
            openModal(imageSrc);
        });
        
        const removeButton = cardDiv.querySelector('.remove-card-btn');
        removeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            cardDiv.remove();
        });
        return cardDiv;
    }

    imageFileInput.addEventListener('change', (e) => {
        const files = e.target.files;
        if (files.length > 0) {
            for (const file of files) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    currentImageCard = addImageCard(event.target.result);
                    openModal(event.target.result);
                };
                reader.readAsDataURL(file);
            }
        }
        imageFileInput.value = '';
    });

    function openModal(imageSrc) {
        modal.style.display = 'block';
        modalImage.src = imageSrc;
        modalImage.onload = () => {
            if (cropper) {
                cropper.destroy();
            }
            cropper = new Cropper(modalImage, {
                aspectRatio: photoSize.width / photoSize.height,
                viewMode: 1,
                zoomable: true,
                dragMode: 'move',
                autoCropArea: 1
            });
        };
    }

    cropButton.addEventListener('click', () => {
        if (!cropper || !currentImageCard) return;
        const croppedCanvas = cropper.getCroppedCanvas();
        const imageDataUrl = croppedCanvas.toDataURL();
        
        currentImageCard.dataset.imageData = imageDataUrl;
        currentImageCard.querySelector('.image-preview').src = imageDataUrl;
        
        modal.style.display = 'none';
        if (cropper) cropper.destroy();
    });

    closeButton.addEventListener('click', () => {
        modal.style.display = 'none';
        if (cropper) cropper.destroy();
    });

    replicateButton.addEventListener('click', async () => {
        const imageCards = document.querySelectorAll('.image-card:not(.add-card)');
        if (imageCards.length === 0) {
            alert('Por favor, adicione pelo menos uma imagem.');
            return;
        }

        const selectedPaper = paperSizeSelect.value;
        const printPaperDimensions = printPaperSizes[selectedPaper];

        const totalPhotosFit = Math.floor(printPaperDimensions.width / (printPhotoDimensions.width)) * Math.floor(printPaperDimensions.height / (printPhotoDimensions.height));
        
        const imagesToReplicate = [];
        for (let i = 0; i < imageCards.length; i++) {
            const imageDataUrl = imageCards[i].dataset.imageData;
            const image = await new Promise(resolve => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.src = imageDataUrl;
            });
            imagesToReplicate.push(image);
        }

        const totalImagesAdded = imagesToReplicate.length;
        const baseReplicates = Math.floor(totalPhotosFit / totalImagesAdded);
        let remainder = totalPhotosFit % totalImagesAdded;
        
        const photoList = [];
        for (let i = 0; i < totalImagesAdded; i++) {
            let count = baseReplicates;
            if (remainder > 0) {
                count++;
                remainder--;
            }
            for (let j = 0; j < count; j++) {
                photoList.push(imagesToReplicate[i]);
            }
        }

        const photoSpacing = 10;
        const photosPerRow = Math.floor(printPaperDimensions.width / (printPhotoDimensions.width + photoSpacing));
        
        finalCanvases = [];
        let currentCanvas = document.createElement('canvas');
        currentCanvas.width = printPaperDimensions.width;
        currentCanvas.height = printPaperDimensions.height;
        let ctx = currentCanvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, currentCanvas.width, currentCanvas.height);
        finalCanvases.push(currentCanvas);

        let x = 0;
        let y = 0;

        for (const photo of photoList) {
            if (x + printPhotoDimensions.width > printPaperDimensions.width) {
                x = 0;
                y += printPhotoDimensions.height + photoSpacing;
            }

            if (y + printPhotoDimensions.height > printPaperDimensions.height) {
                currentCanvas = document.createElement('canvas');
                currentCanvas.width = printPaperDimensions.width;
                currentCanvas.height = printPaperDimensions.height;
                ctx = currentCanvas.getContext('2d');
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, currentCanvas.width, currentCanvas.height);
                finalCanvases.push(currentCanvas);
                x = 0;
                y = 0;
            }

            ctx.drawImage(photo, x, y, printPhotoDimensions.width, printPhotoDimensions.height);
            
            if (addBorderCheckbox.checked) {
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, printPhotoDimensions.width, printPhotoDimensions.height);
            }
            
            x += printPhotoDimensions.width + photoSpacing;
        }

        outputContainer.innerHTML = '';
        finalCanvases.forEach((canvas, index) => {
            const screenDpi = 96;
            const screenPaperWidth = printPaperDimensions.width * screenDpi / printDpi;
            const screenPaperHeight = printPaperDimensions.height * screenDpi / printDpi;

            const previewCanvas = document.createElement('canvas');
            previewCanvas.width = screenPaperWidth;
            previewCanvas.height = screenPaperHeight;
            
            const previewCtx = previewCanvas.getContext('2d');
            previewCtx.drawImage(canvas, 0, 0, previewCanvas.width, previewCanvas.height);
            
            previewCanvas.classList.add('preview-canvas');
            outputContainer.appendChild(previewCanvas);
            
            const pageInfo = document.createElement('p');
            pageInfo.textContent = `Página ${index + 1}`;
            pageInfo.style.textAlign = 'center';
            outputContainer.appendChild(pageInfo);
        });

        saveButton.style.display = 'block';
    });

    saveButton.addEventListener('click', () => {
        if (finalCanvases.length === 1) {
            const link = document.createElement('a');
            link.download = `fotos-3x4-${paperSizeSelect.value}.png`;
            link.href = finalCanvases[0].toDataURL('image/png');
            link.click();
        } else {
            const zip = new JSZip();
            finalCanvases.forEach((canvas, index) => {
                const imageData = canvas.toDataURL('image/png');
                zip.file(`fotos-3x4-pagina_${index + 1}.png`, imageData.substring(imageData.indexOf(',') + 1), { base64: true });
            });
            zip.generateAsync({ type: "blob" }).then(function(content) {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(content);
                link.download = `fotos-3x4-${paperSizeSelect.value}.zip`;
                link.click();
            });
        }
    });
});