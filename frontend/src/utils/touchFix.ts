/**
 * Touch Fix Utility for Android WebView
 * 
 * This utility fixes the issue where buttons highlight but don't execute actions
 * in Android WebView by intercepting touch events and manually triggering click events.
 */

export const initializeTouchFix = () => {
  console.log('Initializing touch fix for Android WebView');

  // Detect if we're running in Android WebView
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isWebView = /(wv|WebView)/i.test(navigator.userAgent);
  
  console.log('Is Android:', isAndroid);
  console.log('Is WebView:', isWebView);

  if (!isAndroid) {
    console.log('Not Android, skipping touch fix');
    return;
  }

  // Global touch event handler
  let touchStartTime = 0;
  let touchStartX = 0;
  let touchStartY = 0;
  let lastTouchedElement: HTMLElement | null = null;

  document.addEventListener('touchstart', (e) => {
    touchStartTime = Date.now();
    if (e.touches.length > 0) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      lastTouchedElement = e.target as HTMLElement;
    }
  }, { passive: true, capture: true });

  document.addEventListener('touchend', (e) => {
    const touchDuration = Date.now() - touchStartTime;
    
    if (e.changedTouches.length > 0) {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      
      // Calculate distance moved
      const deltaX = Math.abs(touchEndX - touchStartX);
      const deltaY = Math.abs(touchEndY - touchStartY);
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      // If it's a tap (short duration, minimal movement)
      if (touchDuration < 500 && distance < 10) {
        const target = e.target as HTMLElement;
        
        // Check if target is a button or clickable element
        const isClickable = 
          target.tagName === 'BUTTON' ||
          target.tagName === 'A' ||
          target.getAttribute('role') === 'button' ||
          target.closest('button') ||
          target.closest('a') ||
          target.closest('ion-button') ||
          target.closest('[role="button"]');
        
        if (isClickable) {
          console.log('Touch detected on clickable element:', target);
          
          // Find the actual clickable element
          let clickableElement = target;
          if (target.tagName !== 'BUTTON' && target.tagName !== 'A') {
            const closest = target.closest('button, a, ion-button, [role="button"]');
            if (closest) {
              clickableElement = closest as HTMLElement;
            }
          }
          
          // Prevent default and stop propagation
          e.preventDefault();
          e.stopPropagation();
          
          // Manually trigger click event
          console.log('Manually triggering click on:', clickableElement);
          clickableElement.click();
          
          // Also dispatch a synthetic click event
          const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
          });
          clickableElement.dispatchEvent(clickEvent);
        }
      }
    }
  }, { passive: false, capture: true });

  // Add visual feedback for touches
  document.addEventListener('touchstart', (e) => {
    const target = e.target as HTMLElement;
    const isClickable = 
      target.tagName === 'BUTTON' ||
      target.closest('button') ||
      target.closest('ion-button');
    
    if (isClickable) {
      let element = target;
      if (target.tagName !== 'BUTTON') {
        const closest = target.closest('button, ion-button');
        if (closest) {
          element = closest as HTMLElement;
        }
      }
      element.style.opacity = '0.7';
    }
  }, { passive: true, capture: true });

  document.addEventListener('touchend', (e) => {
    if (lastTouchedElement) {
      lastTouchedElement.style.opacity = '1';
    }
  }, { passive: true, capture: true });

  console.log('Touch fix initialized successfully');
};

// Also export a function to fix specific elements
export const fixElementTouch = (element: HTMLElement) => {
  if (!element) return;

  console.log('Fixing touch for element:', element);

  element.addEventListener('touchend', (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Touch end on element, triggering click');
    element.click();
  }, { passive: false, capture: true });
};

