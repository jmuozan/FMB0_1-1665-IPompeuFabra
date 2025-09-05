class ASCIIAnimation {
  constructor(canvasId, imagePath) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.imagePath = imagePath;
    this.image = new Image();
    this.asciiChars = '@%#*+=-:i?¿ ';
    this.animationPhase = 0;
    this.frameCount = 0;
    this.pixelSize = 11;
    this.asciiArray = [];
    this.asciiWriteProgress = 0;
    this.disappearProgress = 0;
    this.pixelProgress = 0;
    this.backToHQProgress = 0;
    this.isImageLoaded = false;
    this.isProcessed = false;
    
    this.phaseDurations = {
      original: 120,       // 2 seconds original image
      asciiWrite: 300,     // 5 seconds ASCII writing
      ascii: 120,          // 2 seconds full ASCII
      disappear: 100,      // 3 seconds disappearing
      pixels: 300,         // 4 seconds pixel appearance
      backToHQ: 180        // 3 seconds back to high quality
    };
    
    this.setupCanvas();
    this.loadImage();
  }

  setupCanvas() {
    this.canvas.width = 1000;
    this.canvas.height = 700;
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.display = 'block';
    this.canvas.style.margin = '0';
    this.canvas.style.padding = '0';
  }

  loadImage() {
    this.image.crossOrigin = 'anonymous'; 
    this.image.onload = () => {
      console.log(`Image loaded: ${this.image.width}x${this.image.height}`);
      this.isImageLoaded = true;
      this.processImage();
      this.startAnimation();
    };
    this.image.onerror = (error) => {
      console.error('Failed to load image:', error);
      // fallback colored rectangle
      this.createFallbackImage();
    };
    this.image.src = this.imagePath;
  }

  createFallbackImage() {
    this.ctx.fillStyle = '#f7f7f7';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
    gradient.addColorStop(0, '#8500cc');
    gradient.addColorStop(1, '#fb4b4e');

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(100, 100, this.canvas.width - 200, this.canvas.height - 200);
    this.image.src = this.canvas.toDataURL();
  }

  processImage() {
    if (!this.isImageLoaded) {
      console.log('Image not loaded yet, skipping processing');
      return;
    }

    try {
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      
      const cols = Math.floor(this.canvas.width / this.pixelSize);
      const rows = Math.floor(this.canvas.height / this.pixelSize);
      
      console.log(`Processing grid: ${cols}x${rows} = ${cols * rows} pixels`);
      
      tempCanvas.width = cols;
      tempCanvas.height = rows;
      tempCtx.drawImage(this.image, 0, 0, cols, rows);
      const imageData = tempCtx.getImageData(0, 0, cols, rows);
      const data = imageData.data;
      
      console.log(`Image data length: ${data.length}, expected: ${cols * rows * 4}`);
      
      // Clear and rebuild array
      this.asciiArray = [];
      
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const index = (y * cols + x) * 4;
          
          if (index + 3 < data.length) {
            const r = data[index] || 0;
            const g = data[index + 1] || 0;
            const b = data[index + 2] || 0;
            const a = data[index + 3] || 255;
            
            const brightness = (r + g + b) / 3;
            const charIndex = Math.floor((brightness / 255) * (this.asciiChars.length - 1));
            const asciiChar = this.asciiChars[this.asciiChars.length - 1 - charIndex] || ' ';
            
            this.asciiArray.push({
              char: asciiChar,
              x: x * this.pixelSize,
              y: y * this.pixelSize,
              brightness: brightness,
              originalR: r,
              originalG: g,
              originalB: b,
              alpha: a / 255,
              gridX: x,
              gridY: y
            });
          }
        }
      }
      
      console.log(`Successfully processed ${this.asciiArray.length} pixels`);
      this.isProcessed = true;
      
    } catch (error) {
      console.error('Error processing image:', error);
      this.isProcessed = false;
    }
  }

  drawOriginalImage() {
    if (!this.isImageLoaded) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(this.image, 0, 0, this.canvas.width, this.canvas.height);
  }

  drawASCIIWriting() {
    if (!this.isProcessed || this.asciiArray.length === 0) {
      console.log('ASCII array not ready for writing');
      return;
    }
    
    this.ctx.fillStyle = '#f7f7f7';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.font = `${this.pixelSize + 2}px monospace`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    const charsToShow = Math.floor(this.asciiArray.length * this.asciiWriteProgress);
    
    for (let i = 0; i < charsToShow && i < this.asciiArray.length; i++) {
      const pixel = this.asciiArray[i];
      
      this.ctx.fillStyle = `rgb(${pixel.originalR}, ${pixel.originalG}, ${pixel.originalB})`;
      this.ctx.fillText(
        pixel.char,
        pixel.x + this.pixelSize / 2,
        pixel.y + this.pixelSize / 2
      );
    }
    
    this.asciiWriteProgress += 0.003;
  }

  drawFullASCII() {
    if (!this.isProcessed || this.asciiArray.length === 0) return;
    
    this.ctx.fillStyle = '#f7f7f7';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.font = `${this.pixelSize + 2}px monospace`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    this.asciiArray.forEach(pixel => {
      this.ctx.fillStyle = `rgb(${pixel.originalR}, ${pixel.originalG}, ${pixel.originalB})`;
      this.ctx.fillText(
        pixel.char,
        pixel.x + this.pixelSize / 2,
        pixel.y + this.pixelSize / 2
      );
    });
  }

  drawDisappearing() {
    if (!this.isProcessed || this.asciiArray.length === 0) return;
    
    this.ctx.fillStyle = '#f7f7f7';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.font = `${this.pixelSize + 2}px monospace`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    this.asciiArray.forEach((pixel, index) => {
      const waveOffset = Math.sin((index * 0.1) + (this.disappearProgress * 0.15)) * 30;
      const shouldShow = Math.random() > this.disappearProgress;
      
      if (shouldShow) {
        const alpha = Math.max(0, 1 - this.disappearProgress + (Math.random() * 0.2 - 0.1));
        this.ctx.fillStyle = `rgba(${pixel.originalR}, ${pixel.originalG}, ${pixel.originalB}, ${alpha})`;
        this.ctx.fillText(
          pixel.char,
          pixel.x + this.pixelSize / 2 + waveOffset,
          pixel.y + this.pixelSize / 2
        );
      }
    });
    
    this.disappearProgress += 0.008;
  }

  drawPixelAppearance() {
    if (!this.isProcessed || this.asciiArray.length === 0) {
      console.log('ASCII array not ready for pixel drawing');
      return;
    }
    
    this.ctx.fillStyle = '#f7f7f7';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const totalPixels = this.asciiArray.length;
    const pixelsToShow = Math.floor(totalPixels * this.pixelProgress);
    
    console.log(`Drawing ${pixelsToShow} of ${totalPixels} pixels`);
    
    // pixels simple pattern
    for (let i = 0; i < pixelsToShow && i < totalPixels; i++) {
      const pixel = this.asciiArray[i];
      
      if (pixel) {
        this.ctx.fillStyle = `rgb(${pixel.originalR}, ${pixel.originalG}, ${pixel.originalB})`;
        this.ctx.fillRect(pixel.x, pixel.y, this.pixelSize, this.pixelSize);
      }
    }
    
    this.pixelProgress += 0.005;
  }

  drawBackToHQ() {
    if (!this.isProcessed || this.asciiArray.length === 0 || !this.isImageLoaded) return;
    
    this.ctx.fillStyle = '#f7f7f7';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // pixelated version
    const pixelAlpha = 1 - this.backToHQProgress;
    this.ctx.globalAlpha = pixelAlpha;
    
    this.asciiArray.forEach(pixel => {
      this.ctx.fillStyle = `rgb(${pixel.originalR}, ${pixel.originalG}, ${pixel.originalB})`;
      this.ctx.fillRect(pixel.x, pixel.y, this.pixelSize, this.pixelSize);
    });
    
    // Back to high quality image
    this.ctx.globalAlpha = this.backToHQProgress;
    this.ctx.drawImage(this.image, 0, 0, this.canvas.width, this.canvas.height);
    this.ctx.globalAlpha = 1;
    
    this.backToHQProgress += 0.012;
  }

  getCurrentPhase() {
    let totalFrames = 0;
    const phases = ['original', 'asciiWrite', 'ascii', 'disappear', 'pixels', 'backToHQ'];
    
    for (let i = 0; i < phases.length; i++) {
      const phaseEnd = totalFrames + this.phaseDurations[phases[i]];
      if (this.frameCount < phaseEnd) {
        return { phase: i, localFrame: this.frameCount - totalFrames };
      }
      totalFrames = phaseEnd;
    }
    
    return { phase: 0, localFrame: 0 };
  }

  animate() {
    if (!this.isImageLoaded) {
      requestAnimationFrame(() => this.animate());
      return;
    }

    const { phase, localFrame } = this.getCurrentPhase();
    
    switch (phase) {
      case 0: // Original 
        this.drawOriginalImage();
        break;
        
      case 1: // ASCII writing 
        if (this.asciiWriteProgress >= 1) {
          this.asciiWriteProgress = 1;
        }
        this.drawASCIIWriting();
        break;
        
      case 2: // Full ASCII
        this.drawFullASCII();
        break;
        
      case 3: // Disappearing
        if (this.disappearProgress >= 1) {
          this.disappearProgress = 1;
        }
        this.drawDisappearing();
        break;
        
      case 4: // Pixel 
        if (this.pixelProgress >= 1) {
          this.pixelProgress = 1;
        }
        this.drawPixelAppearance();
        break;
        
      case 5: // Back to high quality
        if (this.backToHQProgress >= 1) {
          this.backToHQProgress = 1;
        }
        this.drawBackToHQ();
        break;
    }
    
    this.frameCount++;
    
    // Reset animation 
    const totalDuration = Object.values(this.phaseDurations).reduce((a, b) => a + b, 0);
    if (this.frameCount >= totalDuration) {
      console.log("Resetting animation loop");
      this.frameCount = 0;
      this.asciiWriteProgress = 0;
      this.disappearProgress = 0;
      this.pixelProgress = 0;
      this.backToHQProgress = 0;
      this.shuffledAsciiIndices = null;
      this.shuffledPixelIndices = null;
    }
    
    requestAnimationFrame(() => this.animate());
  }

  startAnimation() {
    this.animate();
  }
}

// Animation 
document.addEventListener('DOMContentLoaded', () => {
  new ASCIIAnimation('ascii-canvas', 'imgs/kuka.jpg');
});