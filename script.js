document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const settingsPanel = document.getElementById('settingsPanel');
    const downloadSection = document.getElementById('downloadSection');
    const imagePreview = document.getElementById('imagePreview');
    const convertedPreview = document.getElementById('convertedPreview');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const fileDimensions = document.getElementById('fileDimensions');
    const fileType = document.getElementById('fileType');
    const outputFormat = document.getElementById('outputFormat');
    const quality = document.getElementById('quality');
    const qualityValue = document.getElementById('qualityValue');
    const qualityGroup = document.getElementById('qualityGroup');
    const transparencyGroup = document.getElementById('transparencyGroup');
    const resizeOption = document.getElementById('resizeOption');
    const resizeFields = document.getElementById('resizeFields');
    const resizeWidth = document.getElementById('resizeWidth');
    const resizeHeight = document.getElementById('resizeHeight');
    const lockAspect = document.getElementById('lockAspect');
    const maintainQuality = document.getElementById('maintainQuality');
    const convertBtn = document.getElementById('convertBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const shareBtn = document.getElementById('shareBtn');
    const newFileBtn = document.getElementById('newFileBtn');
    const newFileSize = document.getElementById('newFileSize');
    const sizeReduction = document.getElementById('sizeReduction');
    const timeSaved = document.getElementById('timeSaved');
    
    let originalFile = null;
    let convertedFile = null;
    let originalImageData = null;
    let aspectRatio = 1;
    let isAspectLocked = true;
    
    // Initialize
    init();
    
    function init() {
        setupEventListeners();
        updateUI();
    }
    
    function setupEventListeners() {
        // File selection
        browseBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', handleFiles);
        
        // Drag and drop
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, preventDefaults, false);
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, unhighlight, false);
        });
        
        dropArea.addEventListener('drop', handleDrop, false);
        
        // Conversion settings
        outputFormat.addEventListener('change', updateUI);
        quality.addEventListener('input', function() {
            qualityValue.textContent = this.value;
            previewConversion();
        });
        
        // Resize controls
        resizeOption.addEventListener('change', function() {
            resizeFields.style.display = this.value === 'custom' ? 'block' : 'none';
            if (this.value === 'hd') {
                resizeWidth.value = 1280;
                resizeHeight.value = 720;
            } else if (this.value === 'fullhd') {
                resizeWidth.value = 1920;
                resizeHeight.value = 1080;
            } else if (this.value === '4k') {
                resizeWidth.value = 3840;
                resizeHeight.value = 2160;
            }
            previewConversion();
        });
        
        resizeWidth.addEventListener('input', handleDimensionChange);
        resizeHeight.addEventListener('input', handleDimensionChange);
        
        lockAspect.addEventListener('click', function() {
            isAspectLocked = !isAspectLocked;
            this.innerHTML = isAspectLocked ? '<i class="fas fa-lock"></i>' : '<i class="fas fa-lock-open"></i>';
        });
        
        // Buttons
        convertBtn.addEventListener('click', convertImage);
        downloadBtn.addEventListener('click', downloadImage);
        shareBtn.addEventListener('click', shareImage);
        newFileBtn.addEventListener('click', resetConverter);
    }
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    function highlight() {
        dropArea.classList.add('highlight');
    }
    
    function unhighlight() {
        dropArea.classList.remove('highlight');
    }
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles({ target: { files } });
    }
    
    function handleFiles(e) {
        const files = e.target.files;
        if (files.length) {
            originalFile = files[0];
            if (!originalFile.type.match('image.*')) {
                alert('Please select an image file');
                return;
            }
            
            const startTime = performance.now();
            
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = new Image();
                img.onload = function() {
                    originalImageData = {
                        img: img,
                        width: img.width,
                        height: img.height,
                        aspectRatio: img.width / img.height
                    };
                    
                    aspectRatio = originalImageData.aspectRatio;
                    resizeWidth.value = img.width;
                    resizeHeight.value = img.height;
                    
                    displayFileInfo(originalFile, img);
                    previewImage(img);
                    previewConversion();
                    
                    settingsPanel.style.display = 'block';
                    dropArea.style.display = 'none';
                    
                    const loadTime = ((performance.now() - startTime)/1000).toFixed(2);
                    console.log(`Image loaded in ${loadTime} seconds`);
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(originalFile);
        }
    }
    
    function displayFileInfo(file, img) {
        fileName.textContent = file.name;
        fileSize.textContent = formatFileSize(file.size);
        fileDimensions.textContent = `${img.width} × ${img.height} px`;
        fileType.textContent = file.type || getFileExtension(file.name);
    }
    
    function previewImage(img) {
        imagePreview.src = img.src;
    }
    
    function updateUI() {
        const format = outputFormat.value;
        
        // Show/hide quality slider
        qualityGroup.style.display = (format === 'jpg' || format === 'webp') ? 'block' : 'none';
        
        // Show/hide transparency option
        transparencyGroup.style.display = (format === 'png' || format === 'webp') ? 'block' : 'none';
        
        // Update preview
        previewConversion();
    }
    
    function handleDimensionChange(e) {
        if (!originalImageData) return;
        
        if (isAspectLocked) {
            if (e.target === resizeWidth) {
                resizeHeight.value = Math.round(resizeWidth.value / aspectRatio);
            } else {
                resizeWidth.value = Math.round(resizeHeight.value * aspectRatio);
            }
        }
        
        previewConversion();
    }
    
    function previewConversion() {
        if (!originalImageData) return;
        
        const format = outputFormat.value;
        const qualityValue = format === 'jpg' || format === 'webp' ? quality.value / 100 : 1;
        const keepTransparency = document.getElementById('keepTransparency').checked;
        
        let targetWidth = originalImageData.width;
        let targetHeight = originalImageData.height;
        
        // Calculate target dimensions based on resize option
        const resizeMode = resizeOption.value;
        if (resizeMode === 'custom') {
            targetWidth = parseInt(resizeWidth.value) || targetWidth;
            targetHeight = parseInt(resizeHeight.value) || targetHeight;
        } else if (resizeMode === 'hd') {
            targetWidth = 1280;
            targetHeight = 720;
        } else if (resizeMode === 'fullhd') {
            targetWidth = 1920;
            targetHeight = 1080;
        } else if (resizeMode === '4k') {
            targetWidth = 3840;
            targetHeight = 2160;
        }
        
        // Ensure dimensions are within reasonable limits
        targetWidth = Math.min(targetWidth, 10000);
        targetHeight = Math.min(targetHeight, 10000);
        
        // Apply high-quality downscaling if enabled
        const shouldMaintainQuality = maintainQuality.checked && 
                                    (targetWidth < originalImageData.width || 
                                     targetHeight < originalImageData.height);
        
        // Draw to preview canvas
        const ctx = convertedPreview.getContext('2d');
        convertedPreview.width = targetWidth;
        convertedPreview.height = targetHeight;
        
        // Use image smoothing for better quality when downscaling
        ctx.imageSmoothingQuality = shouldMaintainQuality ? 'high' : 'medium';
        
        // Handle transparency
        if ((format === 'png' || format === 'webp') && keepTransparency) {
            ctx.clearRect(0, 0, targetWidth, targetHeight);
        } else {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, targetWidth, targetHeight);
        }
        
        // Draw the image with proper scaling
        ctx.drawImage(originalImageData.img, 0, 0, targetWidth, targetHeight);
    }
    
    function convertImage() {
        if (!originalImageData) return;
        
        const startTime = performance.now();
        convertBtn.disabled = true;
        convertBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        
        // Get conversion settings
        const format = outputFormat.value;
        const qualityValue = format === 'jpg' || format === 'webp' ? quality.value / 100 : 1;
        const keepTransparency = document.getElementById('keepTransparency').checked;
        
        // Get target dimensions from preview canvas
        const targetWidth = convertedPreview.width;
        const targetHeight = convertedPreview.height;
        
        // Create a temporary canvas for final conversion
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        
        // Use highest quality settings
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Handle transparency
        if ((format === 'png' || format === 'webp') && keepTransparency) {
            ctx.clearRect(0, 0, targetWidth, targetHeight);
        } else {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, targetWidth, targetHeight);
        }
        
        // Draw the image with proper scaling
        ctx.drawImage(originalImageData.img, 0, 0, targetWidth, targetHeight);
        
        // Convert to blob with highest quality settings
        canvas.toBlob(function(blob) {
            const conversionTime = ((performance.now() - startTime)/1000).toFixed(2);
            
            convertedFile = new File([blob], 
                `${originalFile.name.replace(/\.[^/.]+$/, '')}.${format}`, 
                { type: `image/${format}` }
            );
            
            // Display results
            showConversionResults(convertedFile, conversionTime);
            
            convertBtn.disabled = false;
            convertBtn.innerHTML = '<i class="fas fa-exchange-alt"></i> Convert Image';
        }, `image/${format}`, qualityValue);
    }
    
    function showConversionResults(file, conversionTime) {
        newFileSize.textContent = formatFileSize(file.size);
        
        const reduction = ((originalFile.size - file.size) / originalFile.size * 100).toFixed(2);
        sizeReduction.textContent = `${reduction}%`;
        sizeReduction.style.color = reduction > 0 ? 'green' : 'red';
        
        timeSaved.textContent = `${conversionTime}s`;
        
        settingsPanel.style.display = 'none';
        downloadSection.style.display = 'block';
    }
    
    function downloadImage() {
        if (!convertedFile) return;
        
        const url = URL.createObjectURL(convertedFile);
        const a = document.createElement('a');
        a.href = url;
        a.download = convertedFile.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    function shareImage() {
        if (!convertedFile) return;
        
        if (navigator.share) {
            navigator.share({
                title: 'Converted Image',
                text: 'I just converted an image using PixelConvert',
                files: [convertedFile]
            }).catch(err => {
                console.log('Error sharing:', err);
                fallbackShare();
            });
        } else {
            fallbackShare();
        }
    }
    
    function fallbackShare() {
        alert('Sharing not supported in this browser. Download the image first.');
    }
    
    function resetConverter() {
        originalFile = null;
        convertedFile = null;
        originalImageData = null;
        fileInput.value = '';
        settingsPanel.style.display = 'none';
        downloadSection.style.display = 'none';
        dropArea.style.display = 'block';
    }
    
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