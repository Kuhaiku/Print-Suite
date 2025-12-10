document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.getElementById("fileInput");
    const saveBtn = document.getElementById("saveBtn");
    const pagesContainer = document.getElementById("pagesContainer");
    const modal = document.getElementById('modal');
    const modalImage = document.getElementById('modal-image');
    const cropButton = document.getElementById('crop-button');
    const closeButton = document.querySelector('.close-button');
    const removeButton = document.getElementById('remove-button');
    const rotateLeftButton = document.getElementById('rotate-left-button');
    const rotateRightButton = document.getElementById('rotate-right-button');

    let photoQueue = [];
    const photosPerPage = 8;
    let cropper;
    let currentPolaroidToEdit = null;

    // Dimensões em CM para o Cropper
    // Ajustado para refletir a proporção visual de 1/1.2 (7.9 * 1.2 = 9.48)
    const imageSizeCm = { width: 7.9, height: 9.48 };

    fileInput.addEventListener("change", handleFiles);
    saveBtn.addEventListener("click", saveAsImage);
    closeButton.addEventListener("click", () => {
        modal.style.display = "none";
        if (cropper) cropper.destroy();
        currentPolaroidToEdit = null;
    });
    cropButton.addEventListener("click", handleCrop);
    removeButton.addEventListener("click", handleRemove);

    // Event Listeners para rotação
    rotateLeftButton.addEventListener("click", () => {
        if (cropper) {
            cropper.rotate(-90);
        }
    });

    rotateRightButton.addEventListener("click", () => {
        if (cropper) {
            cropper.rotate(90);
        }
    });

    function saveCaptions() {
        const polaroids = document.querySelectorAll('.polaroid');
        polaroids.forEach((polaroid, index) => {
            const caption = polaroid.querySelector('textarea');
            // Use o índice de dados para garantir que a legenda seja salva no lugar correto, mesmo após remoções.
            const originalIndex = parseInt(polaroid.querySelector('img').dataset.originalIndex);
            if (caption && photoQueue[originalIndex]) {
                photoQueue[originalIndex].caption = caption.value;
            }
        });
    }

    function handleFiles(event) {
        saveCaptions();
        const files = event.target.files;
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const reader = new FileReader();
            reader.onload = (e) => {
                photoQueue.push({ src: e.target.result, caption: '' });
                renderPolaroids();
            };
            reader.readAsDataURL(file);
        }
        fileInput.value = '';
    }

    function renderPolaroids() {
        pagesContainer.innerHTML = '';
        let currentPage = null;
        let photoCount = 0;

        for (let i = 0; i < photoQueue.length; i++) {
            if (photoCount % photosPerPage === 0) {
                currentPage = document.createElement("div");
                currentPage.classList.add("a4-page");
                pagesContainer.appendChild(currentPage);
            }
            
            const polaroid = document.createElement("div");
            polaroid.classList.add("polaroid");

            const imageContainer = document.createElement("div");
            imageContainer.classList.add("image-container");
            
            const img = document.createElement("img");
            img.src = photoQueue[i].src;
            img.dataset.originalIndex = i;
            
            img.addEventListener('click', () => {
                currentPolaroidToEdit = polaroid;
                openModal(img.src);
            });

            imageContainer.appendChild(img);
            polaroid.appendChild(imageContainer);

            const caption = document.createElement("textarea");
            caption.placeholder = "Sua legenda aqui...";
            caption.classList.add("polaroid-caption");
            caption.value = photoQueue[i].caption;
            polaroid.appendChild(caption);

            currentPage.appendChild(polaroid);
            photoCount++;
        }
    }
    
    function openModal(imageSrc) {
        modal.style.display = 'block';
        modalImage.src = imageSrc;
        modalImage.onload = () => {
            if (cropper) cropper.destroy();
            cropper = new Cropper(modalImage, {
                aspectRatio: imageSizeCm.width / imageSizeCm.height,
                viewMode: 1,
                zoomable: true,
                dragMode: 'move',
                autoCropArea: 1,
            });
        };
    }

    function handleCrop() {
        if (!cropper || !currentPolaroidToEdit) return;
        
        const croppedCanvas = cropper.getCroppedCanvas();
        const imageDataUrl = croppedCanvas.toDataURL();
        
        const imgToUpdate = currentPolaroidToEdit.querySelector('img');
        imgToUpdate.src = imageDataUrl;

        const originalIndex = parseInt(imgToUpdate.dataset.originalIndex);
        if (originalIndex >= 0 && originalIndex < photoQueue.length) {
            photoQueue[originalIndex].src = imageDataUrl;
        }
        
        modal.style.display = 'none';
        if (cropper) cropper.destroy();
        currentPolaroidToEdit = null;
    }

    function handleRemove() {
        if (currentPolaroidToEdit) {
            saveCaptions();
            const imgToRemove = currentPolaroidToEdit.querySelector('img');
            const originalIndex = parseInt(imgToRemove.dataset.originalIndex);
            
            if (originalIndex >= 0 && originalIndex < photoQueue.length) {
                photoQueue.splice(originalIndex, 1);
            }
            
            modal.style.display = 'none';
            if (cropper) cropper.destroy();
            currentPolaroidToEdit = null;
            renderPolaroids();
        }
    }

    async function saveAsImage() {
        saveCaptions();
        const pages = document.querySelectorAll(".a4-page");
        
        const polaroids = document.querySelectorAll('.polaroid');
        for (const polaroid of polaroids) {
            const img = polaroid.querySelector('img');
            const originalIndex = parseInt(img.dataset.originalIndex);
            const originalSrc = photoQueue[originalIndex].src;
            const currentSrc = img.src;
            
            // Recorta a imagem original se ela não tiver sido editada manualmente pelo cropper
            // para garantir que a proporção correta seja salva na impressão
            if (originalSrc === currentSrc) {
                const tempImage = new Image();
                tempImage.src = originalSrc;
                await new Promise(resolve => tempImage.onload = resolve);
                
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                const aspectRatio = imageSizeCm.width / imageSizeCm.height;
                let sourceX = 0;
                let sourceY = 0;
                let sourceWidth = tempImage.width;
                let sourceHeight = tempImage.height;

                if (tempImage.width / tempImage.height > aspectRatio) {
                    sourceWidth = tempImage.height * aspectRatio;
                    sourceX = (tempImage.width - sourceWidth) / 2;
                } else {
                    sourceHeight = tempImage.width / aspectRatio;
                    sourceY = (tempImage.height - sourceHeight) / 2;
                }
                
                canvas.width = sourceWidth;
                canvas.height = sourceHeight;
                ctx.drawImage(tempImage, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
                
                img.src = canvas.toDataURL();
            }
        }
        
        pages.forEach((page, index) => {
            html2canvas(page, { scale: 2 }).then(canvas => {
                const link = document.createElement("a");
                link.download = `pagina_polaroid_${index + 1}.png`;
                link.href = canvas.toDataURL("image/png");
                link.click();
            });
        });
    }
});
