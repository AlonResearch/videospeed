/**
 * Integrated UI for Video Speed Controller
 * Similar to SponsorBlock's approach - integrates into YouTube player controls
 * Modular architecture using global variables
 */

window.VSC = window.VSC || {};

class IntegratedUI {
  constructor(config, actionHandler) {
    this.config = config;
    this.actionHandler = actionHandler;
    this.buttons = new Map();
    this.controls = null;
    this.isInitialized = false;
    this.currentSpeedIndex = 0;
    this.favoriteSpeeds = config.settings.favoriteSpeeds || [1.0, 1.3, 1.5, 1.75, 2.0]; // Use config or default
    this.hoverTimeout = null;
    this.sliderVisible = false;
  }

  /**
   * Initialize the integrated UI
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Wait for YouTube controls to be available
      this.controls = await this.waitForControls();
      if (!this.controls) {
        window.VSC.logger.warn('YouTube controls not found, integrated UI not available');
        return;
      }

      this.createSpeedButton();
      this.createSpeedMenu();
      this.createVelocitySlider();
      this.setupEventListeners();

      this.isInitialized = true;
      window.VSC.logger.info('Integrated UI initialized successfully');
    } catch (error) {
      window.VSC.logger.error(`Failed to initialize integrated UI: ${error.message}`);
      // Fall back to floating UI if integrated UI fails
      this.fallbackToFloatingUI();
    }
  }

  /**
   * Fall back to floating UI if integrated UI fails
   */
  fallbackToFloatingUI() {
    window.VSC.logger.warn('Falling back to floating UI due to integrated UI failure');
    // This will be handled by the main content script when it detects no integrated UI
  }

  /**
   * Wait for YouTube player controls to be available
   * @returns {Promise<HTMLElement>} Controls element
   */
  async waitForControls() {
    const maxAttempts = 50;
    const interval = 100;

    for (let i = 0; i < maxAttempts; i++) {
      const controls = this.getControls();
      if (controls) {
        return controls;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }

    return null;
  }

  /**
   * Get YouTube player controls element
   * @returns {HTMLElement|null} Controls element
   */
  getControls() {
    const controlsSelectors = [
      // New YouTube (2025 April)
      ".ytp-right-controls-right",
      // YouTube
      ".ytp-right-controls",
      // Mobile YouTube
      ".player-controls-top",
      // Invidious/videojs video element's controls element
      ".vjs-control-bar",
      // Piped shaka player
      ".shaka-bottom-controls",
      // Vorapis v3
      ".html5-player-chrome",
      // tv.youtube.com
      ".ypcs-control-buttons-right"
    ];

    for (const controlsSelector of controlsSelectors) {
      const controls = Array.from(document.querySelectorAll(controlsSelector))
        .filter(el => !this.isInPreviewPlayer(el));

      if (controls.length > 0) {
        return controls[controls.length - 1];
      }
    }

    return null;
  }

  /**
   * Check if element is in preview player
   * @param {Element} element - Element to check
   * @returns {boolean} True if in preview player
   */
  isInPreviewPlayer(element) {
    return !!element.closest("#inline-preview-player");
  }

  /**
   * Create the main speed button with speedometer icon
   */
  createSpeedButton() {
    const existingButton = document.getElementById('vscSpeedButton');
    if (existingButton) return existingButton;

    const button = document.createElement('button');
    button.id = 'vscSpeedButton';
    button.className = 'playerButton ytp-button vsc-speed-button';
    button.setAttribute('title', 'Video Speed Controller');
    button.setAttribute('aria-label', 'Video Speed Controller');

    // Create speedometer icon container
    const iconContainer = document.createElement('div');
    iconContainer.className = 'vsc-speedometer-icon';
    
    // Create speedometer SVG icon
    const svgIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgIcon.setAttribute('width', '20');
    svgIcon.setAttribute('height', '20');
    svgIcon.setAttribute('viewBox', '0 0 24 24');
    svgIcon.setAttribute('fill', 'currentColor');
    
    // Add the speedometer path
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M10.0492532,15.4208574 L16.3060077,6.94493547 C16.5131405,6.66433611 16.8962754,6.58091825 17.2013158,6.75000494 C17.4758699,6.90219275 17.61052,7.21639422 17.5413028,7.51420559 L17.510592,7.61262428 L13.6405266,17.4116224 C13.2205308,18.475051 12.0179777,18.9966563 10.9545491,18.5766605 C10.8710782,18.543694 10.7898393,18.5053348 10.7113465,18.4618255 C9.71108052,17.9073691 9.34968053,16.6470175 9.904137,15.6467516 L9.97303013,15.5314501 L9.97303013,15.5314501 L10.0492532,15.4208574 L16.3060077,6.94493547 L10.0492532,15.4208574 Z M18.6095174,7.41397033 C19.364068,8.02528183 20.0469718,8.75083284 20.6317275,9.58595046 C21.1562296,10.3350171 21.6612578,11.2420254 21.9517027,11.9842912 C22.1026388,12.3700259 21.9122969,12.8050834 21.5265623,12.9560194 C21.1408277,13.1069554 20.7057702,12.9166136 20.5548341,12.530879 C20.4575421,12.2822379 20.3277108,12.0046594 20.1775548,11.7190679 L18.1280514,12.9023464 C17.769332,13.1094531 17.3106392,12.9865468 17.1035324,12.6278273 C16.9136845,12.2990011 17.0011393,11.8861696 17.2933389,11.6601229 L17.3780514,11.6033083 L19.3963044,10.4364308 L19.1658779,10.1227204 C18.8419948,9.70016342 18.4876665,9.31329453 18.1081562,8.96304177 L18.4883177,7.99876394 C18.5262055,7.90283222 18.5550318,7.80534515 18.5751558,7.70730436 L18.5988599,7.55995309 L18.6095174,7.41397033 Z M15.9809484,5.85271523 C15.8318986,5.9392755 15.694531,6.04936208 15.5743759,6.18134222 L15.4601633,6.32055973 L14.919203,7.05349635 C14.2174399,6.80955942 13.4886764,6.6517272 12.7502416,6.58305531 L12.75,9.25589923 C12.75,9.6701128 12.4142136,10.0058992 12,10.0058992 C11.6203042,10.0058992 11.306509,9.72374535 11.2568466,9.35766979 L11.25,9.25589923 L11.2496135,6.56662077 C9.65294084,6.68015443 8.06551588,7.21425939 6.65889532,8.19918572 C5.84294582,8.77051971 5.13152818,9.52142873 4.54015984,10.4038879 L6.62237477,11.6059717 C6.98109424,11.8130785 7.1040006,12.2717713 6.89689382,12.6304908 C6.70704594,12.959317 6.30579591,13.0899946 5.96393397,12.9499658 L5.87237477,12.9050099 L3.79818254,11.7080227 C3.6704134,11.9742424 3.55177265,12.248307 3.44255853,12.5292935 C3.29249811,12.9153696 2.8578736,13.1066981 2.47179751,12.9566377 C2.08572142,12.8065773 1.89439292,12.3719528 2.04445335,11.9858767 C2.85090303,9.91103954 4.12374054,8.14315832 5.79853067,6.97045765 C8.8904309,4.8054858 12.7328827,4.5119546 15.9809484,5.85271523 Z');
    
    svgIcon.appendChild(path);
    iconContainer.appendChild(svgIcon);

    // Create speed indicator
    const speedIndicator = document.createElement('span');
    speedIndicator.id = 'vscSpeedIndicator';
    speedIndicator.className = 'vsc-speed-indicator';
    speedIndicator.textContent = '1.00x';

    // Add elements to button (only icon, no speed indicator)
    button.appendChild(iconContainer);
    
    // Debug: Log the button structure
    window.VSC.logger.debug('Speed button created with structure:', {
      hasIcon: !!iconContainer.querySelector('svg'),
      hasSpeedIndicator: !!speedIndicator,
      buttonHTML: button.outerHTML
    });

    // Add click handler for cycling through favorite speeds
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      this.cycleFavoriteSpeed();
    });

    // Add right-click handler for speed menu
    button.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggleSpeedMenu();
    });

    // Add hover handlers for velocity slider
    button.addEventListener('mouseenter', () => {
      this.showVelocitySlider();
    });

    button.addEventListener('mouseleave', () => {
      this.hideVelocitySlider();
    });

    // Insert after volume button (before autoplay/CC buttons)
    const volumeButton = this.controls.querySelector('.ytp-volume-button, .ytp-mute-button');
    const ccButton = this.controls.querySelector('.ytp-subtitles-button, .ytp-cc-button');
    const autoplayButton = this.controls.querySelector('.ytp-autonav-toggle-button');
    const settingsButton = this.controls.querySelector('.ytp-settings-button');
    
    if (volumeButton) {
      // Insert after volume button
      volumeButton.parentNode.insertBefore(button, volumeButton.nextSibling);
    } else if (ccButton) {
      // Insert before CC button if no volume button found
      ccButton.parentNode.insertBefore(button, ccButton);
    } else if (autoplayButton) {
      // Insert before autoplay button if no CC button found
      autoplayButton.parentNode.insertBefore(button, autoplayButton);
    } else if (settingsButton) {
      // Insert before settings button if no other buttons found
      settingsButton.parentNode.insertBefore(button, settingsButton);
    } else {
      // Fallback: insert at the beginning of controls
      this.controls.insertBefore(button, this.controls.firstChild);
    }

    this.buttons.set('speed', button);
    window.VSC.logger.debug('Speed button with speedometer icon created');
  }

  /**
   * Cycle through favorite speeds
   */
  cycleFavoriteSpeed() {
    this.currentSpeedIndex = (this.currentSpeedIndex + 1) % this.favoriteSpeeds.length;
    const newSpeed = this.favoriteSpeeds[this.currentSpeedIndex];
    this.setSpeed(newSpeed);
  }

  /**
   * Create the velocity slider for fine control
   */
  createVelocitySlider() {
    const existingSlider = document.getElementById('vscVelocitySlider');
    if (existingSlider) return existingSlider;

    const slider = document.createElement('div');
    slider.id = 'vscVelocitySlider';
    slider.className = 'vsc-velocity-slider';
    slider.style.display = 'none';

    // Create slider container
    const sliderContainer = document.createElement('div');
    sliderContainer.className = 'vsc-slider-container';

    // Create minus button
    const minusBtn = document.createElement('button');
    minusBtn.className = 'vsc-slider-btn vsc-minus-btn';
    minusBtn.textContent = '−';
    minusBtn.setAttribute('title', 'Decrease speed');
    minusBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.adjustSpeedByStep(-0.1);
    });

    // Create slider input with new range
    const sliderInput = document.createElement('input');
    sliderInput.type = 'range';
    sliderInput.className = 'vsc-slider-input';
    sliderInput.min = '0.25';
    sliderInput.max = '4';
    sliderInput.step = this.config.settings.sliderIncrement || 0.05;
    sliderInput.value = '1.0';
    sliderInput.addEventListener('input', (e) => {
      const speed = parseFloat(e.target.value);
      this.setSpeed(speed);
    });

    // Create plus button
    const plusBtn = document.createElement('button');
    plusBtn.className = 'vsc-slider-btn vsc-plus-btn';
    plusBtn.textContent = '+';
    plusBtn.setAttribute('title', 'Increase speed');
    plusBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.adjustSpeedByStep(0.1);
    });

    // Create speed display
    const speedDisplay = document.createElement('div');
    speedDisplay.className = 'vsc-slider-speed-display';
    speedDisplay.textContent = '1.00x';

    // Assemble slider
    sliderContainer.appendChild(minusBtn);
    sliderContainer.appendChild(sliderInput);
    sliderContainer.appendChild(plusBtn);
    slider.appendChild(sliderContainer);
    slider.appendChild(speedDisplay);

    // Add hover handlers to prevent slider from hiding when interacting with it
    slider.addEventListener('mouseenter', () => {
      if (this.hoverTimeout) {
        clearTimeout(this.hoverTimeout);
        this.hoverTimeout = null;
      }
    });

    slider.addEventListener('mouseleave', () => {
      this.hideVelocitySlider();
    });

    // Add to page
    document.body.appendChild(slider);
    this.buttons.set('slider', slider);
  }

  /**
   * Show velocity slider
   */
  showVelocitySlider() {
    const slider = document.getElementById('vscVelocitySlider');
    const button = document.getElementById('vscSpeedButton');
    
    if (slider && button) {
      // Clear any existing timeout
      if (this.hoverTimeout) {
        clearTimeout(this.hoverTimeout);
      }

      // Set timeout to show slider after a short delay
      this.hoverTimeout = setTimeout(() => {
        const rect = button.getBoundingClientRect();
        slider.style.position = 'absolute';
        // Position vertically above the button (like YouTube's volume slider)
        slider.style.bottom = `${window.innerHeight - rect.top + 10}px`;
        slider.style.left = `${rect.left - 75}px`; // Center the slider horizontally
        slider.style.display = 'block';
        slider.style.zIndex = '9999999';
        this.sliderVisible = true;

        // Update slider value to current speed
        const sliderInput = slider.querySelector('.vsc-slider-input');
        const videos = this.config.getMediaElements();
        if (videos.length > 0) {
          const currentSpeed = videos[0].playbackRate;
          sliderInput.value = currentSpeed;
          this.updateSliderSpeedDisplay(currentSpeed);
        }
      }, 100); // Reduced delay for better responsiveness
    }
  }

  /**
   * Hide velocity slider
   */
  hideVelocitySlider() {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }

    const slider = document.getElementById('vscVelocitySlider');
    if (slider && this.sliderVisible) {
      // Add a small delay before hiding to prevent flickering
      setTimeout(() => {
        if (slider && this.sliderVisible) {
          slider.style.display = 'none';
          this.sliderVisible = false;
        }
      }, 100);
    }
  }

  /**
   * Adjust speed by step
   * @param {number} step - Speed adjustment step
   */
  adjustSpeedByStep(step) {
    const videos = this.config.getMediaElements();
    if (videos.length > 0) {
      const currentSpeed = videos[0].playbackRate;
      const newSpeed = Math.max(0.25, Math.min(4, currentSpeed + step));
      this.setSpeed(newSpeed);
      
      // Update slider
      const slider = document.getElementById('vscVelocitySlider');
      if (slider) {
        const sliderInput = slider.querySelector('.vsc-slider-input');
        sliderInput.value = newSpeed;
        this.updateSliderSpeedDisplay(newSpeed);
      }
    }
  }

  /**
   * Update slider speed display
   * @param {number} speed - Current speed
   */
  updateSliderSpeedDisplay(speed) {
    const slider = document.getElementById('vscVelocitySlider');
    if (slider) {
      const display = slider.querySelector('.vsc-slider-speed-display');
      if (display) {
        display.textContent = `${speed.toFixed(2)}x`;
      }
    }
  }

  /**
   * Create the speed menu
   */
  createSpeedMenu() {
    const existingMenu = document.getElementById('vscSpeedMenu');
    if (existingMenu) return existingMenu;

    const menu = document.createElement('div');
    menu.id = 'vscSpeedMenu';
    menu.className = 'vsc-speed-menu';
    menu.style.display = 'none';

    // Speed presets
    const speeds = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0];
    
    speeds.forEach(speed => {
      const item = document.createElement('div');
      item.className = 'vsc-speed-item';
      item.textContent = `${speed}x`;
      item.addEventListener('click', () => {
        this.setSpeed(speed);
        this.hideSpeedMenu();
      });
      menu.appendChild(item);
    });

    // Add custom speed input
    const customContainer = document.createElement('div');
    customContainer.className = 'vsc-custom-speed';
    
    const customInput = document.createElement('input');
    customInput.type = 'number';
    customInput.step = '0.1';
    customInput.min = '0.07';
    customInput.max = '16';
    customInput.placeholder = 'Custom speed';
    customInput.className = 'vsc-speed-input';
    
    const customButton = document.createElement('button');
    customButton.textContent = 'Set';
    customButton.className = 'vsc-speed-set-btn';
    customButton.addEventListener('click', () => {
      const value = parseFloat(customInput.value);
      if (value >= 0.07 && value <= 16) {
        this.setSpeed(value);
        this.hideSpeedMenu();
      }
    });

    customContainer.appendChild(customInput);
    customContainer.appendChild(customButton);
    menu.appendChild(customContainer);

    // Add to page
    document.body.appendChild(menu);
    this.buttons.set('menu', menu);
  }

  /**
   * Set video speed
   * @param {number} speed - Target speed
   */
  setSpeed(speed) {
    const videos = this.config.getMediaElements();
    videos.forEach(video => {
      if (video.vsc) {
        this.actionHandler.adjustSpeed(video, speed);
      } else {
        video.playbackRate = speed;
      }
    });
    // Update UI (speed indicator is now only in slider)
    this.updateSliderSpeedDisplay(speed);
  }

  /**
   * Update speed indicator display (now only updates slider display)
   * @param {number} speed - Current speed
   */
  updateSpeedIndicator(speed) {
    // Speed indicator is now only shown in the slider, not on the button
    this.updateSliderSpeedDisplay(speed);
  }

  /**
   * Update speed indicator from external speed changes
   * @param {number} speed - Current speed
   */
  updateFromExternalChange(speed) {
    this.updateSpeedIndicator(speed);
    this.updateSliderSpeedDisplay(speed);
  }

  /**
   * Update favorite speeds from settings
   */
  updateFavoriteSpeeds() {
    this.favoriteSpeeds = this.config.settings.favoriteSpeeds || [1.0, 1.3, 1.5, 1.75, 2.0];
    // Reset current index if it's out of bounds
    if (this.currentSpeedIndex >= this.favoriteSpeeds.length) {
      this.currentSpeedIndex = 0;
    }
  }

  /**
   * Toggle speed menu visibility
   */
  toggleSpeedMenu() {
    const menu = document.getElementById('vscSpeedMenu');
    if (menu) {
      if (menu.style.display === 'none') {
        this.showSpeedMenu();
      } else {
        this.hideSpeedMenu();
      }
    }
  }

  /**
   * Show speed menu
   */
  showSpeedMenu() {
    const menu = document.getElementById('vscSpeedMenu');
    const button = document.getElementById('vscSpeedButton');
    
    if (menu && button) {
      const rect = button.getBoundingClientRect();
      menu.style.position = 'absolute';
      menu.style.top = `${rect.bottom + 5}px`;
      menu.style.left = `${rect.left}px`;
      menu.style.display = 'block';
      menu.style.zIndex = '9999999';
    }
  }

  /**
   * Hide speed menu
   */
  hideSpeedMenu() {
    const menu = document.getElementById('vscSpeedMenu');
    if (menu) {
      menu.style.display = 'none';
    }
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Hide menu when clicking outside
    document.addEventListener('click', (e) => {
      const menu = document.getElementById('vscSpeedMenu');
      const button = document.getElementById('vscSpeedButton');
      
      if (menu && button && !menu.contains(e.target) && !button.contains(e.target)) {
        this.hideSpeedMenu();
      }
    });

    // Handle escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideSpeedMenu();
        this.hideVelocitySlider();
      }
    });

    // Watch for YouTube navigation (SPA behavior)
    this.setupNavigationObserver();
  }

  /**
   * Set up observer for YouTube navigation
   */
  setupNavigationObserver() {
    // Watch for URL changes (YouTube is a SPA)
    let lastUrl = location.href;
    const observer = new MutationObserver(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        // Re-initialize after a short delay to let YouTube load
        setTimeout(() => {
          this.reinitialize();
        }, 1000);
      }
    });

    observer.observe(document, { subtree: true, childList: true });
  }

  /**
   * Re-initialize the integrated UI
   */
  async reinitialize() {
    this.cleanup();
    this.updateFavoriteSpeeds(); // Update favorite speeds from settings
    await this.initialize();
  }

  /**
   * Clean up integrated UI
   */
  cleanup() {
    this.buttons.forEach((element) => {
      if (element && element.parentNode) {
        element.remove();
      }
    });
    this.buttons.clear();
    this.isInitialized = false;
    this.sliderVisible = false;
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }
    window.VSC.logger.debug('Integrated UI cleaned up');
  }
}

// Create singleton instance
window.VSC.IntegratedUI = IntegratedUI; 