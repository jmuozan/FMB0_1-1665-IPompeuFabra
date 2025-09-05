class ASCIIAnimation {
  constructor(canvasId, imagePath) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.imagePath = imagePath;
    this.image = new Image();
    this.asciiChars = '@%#*+=-:. ';
    this.animationPhase = 0; // 0: original, 1: ascii, 2: disappear, 3: pixels
    this.animationSpeed = 60; // frames per second
    this.frameCount = 0;
    this.pixelSize = 8;
    this.asciiArray = [];
    this.pixelData = [];
    this.disappearProgress = 0;
    this.pixelProgress = 0;
    
    this.setupCanvas();
    this.loadImage();
  }

  setupCanvas() {
    this.canvas.width = 600;
    this.canvas.height = 400;
    this.canvas.style.maxWidth = '100%';
    this.canvas.style.height = 'auto';
  }

  loadImage() {
    this.image.onload = () => {
      this.processImage();
      this.startAnimation();
    };
    this.image.src = this.imagePath;
  }

  processImage() {
    // Create a temporary canvas to process the image
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    // Set dimensions based on pixel size for ASCII
    const cols = Math.floor(this.canvas.width / this.pixelSize);
    const rows = Math.floor(this.canvas.height / this.pixelSize);
    
    tempCanvas.width = cols;
    tempCanvas.height = rows;
    
    // Draw and scale down the image
    tempCtx.drawImage(this.image, 0, 0, cols, rows);
    
    // Get pixel data
    const imageData = tempCtx.getImageData(0, 0, cols, rows);
    const data = imageData.data;
    
    // Process pixels for ASCII and pixel animation
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      
      // Calculate brightness for ASCII
      const brightness = (r + g + b) / 3;
      const charIndex = Math.floor((brightness / 255) * (this.asciiChars.length - 1));
      const asciiChar = this.asciiChars[this.asciiChars.length - 1 - charIndex];
      
      // Store ASCII character and pixel info
      const pixelIndex = i / 4;
      const x = pixelIndex % cols;
      const y = Math.floor(pixelIndex / cols);
      
      this.asciiArray.push({
        char: asciiChar,
        x: x * this.pixelSize,
        y: y * this.pixelSize,
        brightness: brightness,
        originalR: r,
        originalG: g,
        originalB: b,
        alpha: a / 255
      });
    }
  }

  drawOriginalImage() {
    this.ctx.drawImage(this.image, 0, 0, this.canvas.width, this.canvas.height);
  }

  drawASCII() {
    this.ctx.fillStyle = '#f7f7f7';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.font = `${this.pixelSize}px monospace`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    this.asciiArray.forEach(pixel => {
      // Color based on original pixel color
      this.ctx.fillStyle = `rgb(${pixel.originalR}, ${pixel.originalG}, ${pixel.originalB})`;
      this.ctx.fillText(
        pixel.char,
        pixel.x + this.pixelSize / 2,
        pixel.y + this.pixelSize / 2
      );
    });
  }

  drawDisappearing() {
    this.ctx.fillStyle = '#f7f7f7';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.font = `${this.pixelSize}px monospace`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    this.asciiArray.forEach((pixel, index) => {
      // Create a wave effect for disappearing
      const waveOffset = Math.sin((index * 0.1) + (this.disappearProgress * 0.1)) * 50;
      const shouldShow = Math.random() > this.disappearProgress;
      
      if (shouldShow) {
        const alpha = Math.max(0, 1 - this.disappearProgress + (Math.random() * 0.3 - 0.15));
        this.ctx.fillStyle = `rgba(${pixel.originalR}, ${pixel.originalG}, ${pixel.originalB}, ${alpha})`;
        this.ctx.fillText(
          pixel.char,
          pixel.x + this.pixelSize / 2 + waveOffset,
          pixel.y + this.pixelSize / 2
        );
      }
    });
    
    this.disappearProgress += 0.02;
  }

  drawPixelAppearance() {
    this.ctx.fillStyle = '#f7f7f7';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const numPixelsToShow = Math.floor(this.asciiArray.length * this.pixelProgress);
    
    // Shuffle pixels for random appearance
    const shuffledIndices = Array.from({length: this.asciiArray.length}, (_, i) => i)
      .sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < numPixelsToShow; i++) {
      const pixelIndex = shuffledIndices[i];
      const pixel = this.asciiArray[pixelIndex];
      
      this.ctx.fillStyle = `rgb(${pixel.originalR}, ${pixel.originalG}, ${pixel.originalB})`;
      this.ctx.fillRect(pixel.x, pixel.y, this.pixelSize, this.pixelSize);
    }
    
    this.pixelProgress += 0.005;
  }

  animate() {
    this.frameCount++;
    
    // Phase transitions
    if (this.frameCount < 120) { // 2 seconds at 60fps
      this.animationPhase = 0;
      this.drawOriginalImage();
    } else if (this.frameCount < 300) { // 3 seconds ASCII
      this.animationPhase = 1;
      this.drawASCII();
    } else if (this.frameCount < 480) { // 3 seconds disappearing
      this.animationPhase = 2;
      this.drawDisappearing();
    } else if (this.frameCount < 720) { // 4 seconds pixel appearance
      this.animationPhase = 3;
      this.drawPixelAppearance();
    } else {
      // Reset animation
      this.frameCount = 0;
      this.disappearProgress = 0;
      this.pixelProgress = 0;
    }
    
    requestAnimationFrame(() => this.animate());
  }

  startAnimation() {
    this.animate();
  }
}

// Initialize animation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ASCIIAnimation('ascii-canvas', 'imgs/kuka.jpg');
});