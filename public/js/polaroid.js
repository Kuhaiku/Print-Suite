document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.getElementById("fileInput");
    const saveBtn = document.getElementById("saveBtn");
    const pagesContainer = document.getElementById("pagesContainer");
    const modal = document.getElementById('modal');
    const modalImage = document.getElementById('modal-image');
    const cropButton = document.getElementById('crop-button');
    const closeButton = document.querySelector('.close-button');
    const removeButton = document.getElementById('remove-button');

    let currentPage;
    let photoCount = 0;
    const photosPerPage = 8;
    let cropper;
    let photoQueue = [];
    let currentPolaroidToEdit = null;

    // Dimensões em CM para o Cropper
    const imageSizeCm = { width: 7.9, height: 7.9 };

    fileInput.addEventListener("change", handleFiles);
    saveBtn.addEventListener("click", saveAsImage);
    closeButton.addEventListener("click", () => {
        modal.style.display = "none";
        if (cropper) cropper.destroy();
        currentPolaroidToEdit = null;
    });
    cropButton.addEventListener("click", handleCrop);
    removeButton.addEventListener("click", handleRemove);

    function handleFiles(event) {
        const files = event.target.files;
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageData = { src: e.target.result };
                photoQueue.push(imageData);
                if (photoCount % photosPerPage === 0) createNewPage();
                addPolaroid(imageData);
                photoCount++;
            };
            reader.readAsDataURL(file);
        }
        fileInput.value = '';
    }

    function createNewPage() {
        currentPage = document.createElement("div");
        currentPage.classList.add("a4-page");
        pagesContainer.appendChild(currentPage);
    }

    function addPolaroid(imageData) {
        const polaroid = document.createElement("div");
        polaroid.classList.add("polaroid");

        const imageContainer = document.createElement("div");
        imageContainer.classList.add("image-container");
        
        const img = document.createElement("img");
        img.src = imageData.src;
        img.dataset.imageData = imageData.src;
        
        img.addEventListener('click', () => {
            currentPolaroidToEdit = polaroid;
            openModal(img.src);
        });

        imageContainer.appendChild(img);
        polaroid.appendChild(imageContainer);

        const caption = document.createElement("textarea");
        caption.placeholder = "Sua legenda aqui...";
        caption.classList.add("polaroid-caption");
        polaroid.appendChild(caption);

        currentPage.appendChild(polaroid);
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
        imgToUpdate.dataset.imageData = imageDataUrl;
        
        modal.style.display = 'none';
        if (cropper) cropper.destroy();
        currentPolaroidToEdit = null;
    }

    function handleRemove() {
        if (currentPolaroidToEdit) {
            currentPolaroidToEdit.remove();
            modal.style.display = 'none';
            if (cropper) cropper.destroy();
            currentPolaroidToEdit = null;
        }
    }

    function saveAsImage() {
        const pages = document.querySelectorAll(".a4-page");
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