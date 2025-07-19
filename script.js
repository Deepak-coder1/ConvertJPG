document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const settingsPanel = document.getElementById('settingsPanel');
    const downloadSection = document.getElementById('downloadSection');
    const imagePreview = document.getElementById('imagePreview');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const fileType = document.getElementById('fileType');
    const outputFormat = document.getElementById('outputFormat');
    const quality = document.getElementById('quality');
    const qualityValue = document.getElementById('qualityValue');
    const qualityGroup = document.getElementById('qualityGroup');
    const transparencyGroup = document.getElementById('transparencyGroup');
    const convertBtn = document.getElementById('convertBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const newFileBtn = document.getElementById('newFileBtn');
    const newFileSize = document.getElementById('newFileSize');
    const sizeReduction = document.getElementById('sizeReduction');
    
    let originalFile = null;
    let convertedFile = null;
    
    // Event Listeners
    browseBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFiles);
    
    // Drag and drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropArea.classList.add('highlight');
    }
    
    function unhighlight() {
        dropArea.classList.remove('highlight');
    }
    
    dropArea.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles({ target: { files } });
    }
    
    // Handle selected files
    function handleFiles(e) {
        const files = e.target.files;
        if (files.length) {
            originalFile = files[0];
            displayFileInfo(originalFile);
            previewImage(originalFile);
            settingsPanel.style.display = 'block';
            dropArea.style.display = 'none';
        }
    }
    
    // Display file information
    function displayFileInfo(file) {
        fileName.textContent = file.name;
        fileSize.textContent = formatFileSize(file.size);
        fileType.textContent = file.type || getFileExtension(file.name);
    }
    
    // Preview the image
    function previewImage(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imagePreview.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    // Format selection change
    outputFormat.addEventListener('change', function() {
        const format = this.value;
        
        // Show/hide quality slider based on format
        if (format === 'jpg' || format === 'webp') {
            qualityGroup.style.display = 'block';
        } else {
            qualityGroup.style.display = 'none';
        }
        
        // Show/hide transparency option for PNG and WEBP
        if (format === 'png' || format === 'webp') {
            transparencyGroup.style.display = 'block';
        } else {
            transparencyGroup.style.display = 'none';
        }
    });
    
    // Quality slider
    quality.addEventListener('input', function() {
        qualityValue.textContent = this.value;
    });
    
    // Convert button click
    convertBtn.addEventListener('click', convertImage);
    
    // Convert the image
    function convertImage() {
        if (!originalFile) return;
        
        const format = outputFormat.value;
        const qualityValue = format === 'jpg' || format === 'webp' ? quality.value / 100 : 1;
        const keepTransparency = document.getElementById('keepTransparency').checked;
        
        convertBtn.disabled = true;
        convertBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Converting...';
        
        // Use canvas to convert the image
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                
                // Handle transparency
                if ((format === 'png' || format === 'webp') && keepTransparency) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                } else {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }
                
                ctx.drawImage(img, 0, 0);
                
                canvas.toBlob(function(blob) {
                    convertedFile = new File([blob], `${originalFile.name.split('.')[0]}.${format}`, {
                        type: `image/${format}`
                    });
                    
                    // Display result info
                    newFileSize.textContent = formatFileSize(convertedFile.size);
                    
                    const reduction = ((originalFile.size - convertedFile.size) / originalFile.size * 100).toFixed(2);
                    sizeReduction.textContent = `${reduction}%`;
                    sizeReduction.style.color = reduction > 0 ? 'green' : 'red';
                    
                    // Show download section
                    settingsPanel.style.display = 'none';
                    downloadSection.style.display = 'block';
                    
                    convertBtn.disabled = false;
                    convertBtn.innerHTML = '<i class="fas fa-exchange-alt"></i> Convert Image';
                }, `image/${format}`, qualityValue);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(originalFile);
    }
    
    // Download button
    downloadBtn.addEventListener('click', function() {
        if (!convertedFile) return;
        
        const url = URL.createObjectURL(convertedFile);
        const a = document.createElement('a');
        a.href = url;
        a.download = convertedFile.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
    
    // New file button
    newFileBtn.addEventListener('click', function() {
        originalFile = null;
        convertedFile = null;
        fileInput.value = '';
        settingsPanel.style.display = 'none';
        downloadSection.style.display = 'none';
        dropArea.style.display = 'block';
    });
    
    // Helper functions
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    function getFileExtension(filename) {
        return filename.split('.').pop().toLowerCase();
    }
});