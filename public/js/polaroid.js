document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.getElementById("fileInput");
    const saveBtn = document.getElementById("saveBtn");
    const pagesContainer = document.getElementById("pagesContainer");
    const modal = document.getElementById('modal');
    const modalImage = document.getElementById('modal-image');
    const cropButton = document.getElementById('crop-button');
    const closeButton = document.querySelector('.close-button');

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
    closeButton.addEventListener("click", () => modal.style.display = "none");
    cropButton.addEventListener("click", handleCrop);

    function handleFiles(event) {
        const files = event.target.files;
        for (let i = 0; i < files.length; i++) {
            photoQueue.push(URL.createObjectURL(files[i]));
            if (photoCount % photosPerPage === 0) createNewPage();
            addPolaroid({ src: URL.createObjectURL(files[i]) });
            photoCount++;
        }
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
        img.dataset.imageData = imageData.src; // Salva o caminho original
        
        img.addEventListener('click', () => {
            currentPolaroidToEdit = polaroid;
            openModal(img.src);
        });

        imageContainer.appendChild(img);
        polaroid.appendChild(imageContainer);

        const caption = document.createElement("input");
        caption.type = "text";
        caption.placeholder = "";
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
        if (!cropper) return;
        
        const croppedCanvas = cropper.getCroppedCanvas();
        const imageDataUrl = croppedCanvas.toDataURL();
        
        if (currentPolaroidToEdit) {
            const imgToUpdate = currentPolaroidToEdit.querySelector('img');
            imgToUpdate.src = imageDataUrl;
            imgToUpdate.dataset.imageData = imageDataUrl;
        }
        
        modal.style.display = 'none';
        currentPolaroidToEdit = null;
    }

    // A lógica de `saveAsImage` permanece a mesma da nossa última versão corrigida
    function saveAsImage() {
        // ... (o código de salvamento em alta resolução que já corrigimos vai aqui) ...
        const pages = document.querySelectorAll(".a4-page");
        pages.forEach((page, index) => {
            html2canvas(page).then(canvas => {
                const link = document.createElement("a");
                link.download = `pagina_${index + 1}.png`;
                link.href = canvas.toDataURL("image/png");
                link.click();
            });
        });
    }
});