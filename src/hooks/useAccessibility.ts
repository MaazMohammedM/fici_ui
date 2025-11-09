import { useEffect, useCallback, useRef } from 'react';

interface UseAccessibilityOptions {
  announcePageChanges?: boolean;
  manageFocus?: boolean;
  enableKeyboardNavigation?: boolean;
}

export const useAccessibility = (options: UseAccessibilityOptions = {}) => {
  const {
    announcePageChanges = true,
    manageFocus = true,
    enableKeyboardNavigation = true
  } = options;

  const announcementRef = useRef<HTMLDivElement>(null);

  // Announce content changes to screen readers
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announcementRef.current) {
      const announcer = document.createElement('div');
      announcer.setAttribute('aria-live', priority);
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'sr-only';
      announcer.id = 'accessibility-announcer';
      document.body.appendChild(announcer);
      announcementRef.current = announcer;
    }

    // Clear previous message and set new one
    announcementRef.current.textContent = '';
    setTimeout(() => {
      if (announcementRef.current) {
        announcementRef.current.textContent = message;
      }
    }, 100);
  }, []);

  // Focus management for SPA navigation
  const focusMainContent = useCallback(() => {
    if (manageFocus) {
      const mainContent = document.getElementById('main-content') || document.querySelector('main');
      if (mainContent) {
        mainContent.focus();
        mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [manageFocus]);

  // Keyboard navigation helpers
  const trapFocus = useCallback((container: HTMLElement) => {
    if (!enableKeyboardNavigation) return () => {};

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [enableKeyboardNavigation]);

  // Check color contrast
  const checkColorContrast = useCallback((foreground: string, background: string): number => {
    const getLuminance = (color: string): number => {
      const rgb = color.match(/\d+/g);
      if (!rgb) return 0;
      
      const [r, g, b] = rgb.map(c => {
        const sRGB = parseInt(c) / 255;
        return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
      });
      
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const l1 = getLuminance(foreground);
    const l2 = getLuminance(background);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }, []);

  // Validate ARIA attributes
  const validateAriaAttributes = useCallback((element: HTMLElement) => {
    const warnings: string[] = [];
    
    // Check for missing labels on interactive elements
    const interactiveElements = ['button', 'input', 'select', 'textarea'];
    if (interactiveElements.includes(element.tagName.toLowerCase())) {
      const hasLabel = element.getAttribute('aria-label') || 
                      element.getAttribute('aria-labelledby') ||
                      element.querySelector('label');
      
      if (!hasLabel) {
        warnings.push(`Interactive element ${element.tagName} is missing accessible label`);
      }
    }

    // Check for proper heading hierarchy
    if (element.tagName.match(/^H[1-6]$/)) {
      const level = parseInt(element.tagName.charAt(1));
      const prevHeading = element.previousElementSibling?.closest('h1, h2, h3, h4, h5, h6');
      
      if (prevHeading) {
        const prevLevel = parseInt(prevHeading.tagName.charAt(1));
        if (level > prevLevel + 1) {
          warnings.push(`Heading level ${level} skips levels (previous was ${prevLevel})`);
        }
      }
    }

    return warnings;
  }, []);

  // Keyboard event handlers
  const handleEscapeKey = useCallback((callback: () => void) => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        callback();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleArrowNavigation = useCallback((
    container: HTMLElement,
    options: { vertical?: boolean; horizontal?: boolean; wrap?: boolean } = {}
  ) => {
    const { vertical = true, horizontal = true, wrap = true } = options;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      const focusableElements = Array.from(
        container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      ) as HTMLElement[];
      
      const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
      if (currentIndex === -1) return;

      let nextIndex = currentIndex;

      if ((e.key === 'ArrowDown' && vertical) || (e.key === 'ArrowRight' && horizontal)) {
        nextIndex = currentIndex + 1;
        if (nextIndex >= focusableElements.length) {
          nextIndex = wrap ? 0 : currentIndex;
        }
      } else if ((e.key === 'ArrowUp' && vertical) || (e.key === 'ArrowLeft' && horizontal)) {
        nextIndex = currentIndex - 1;
        if (nextIndex < 0) {
          nextIndex = wrap ? focusableElements.length - 1 : currentIndex;
        }
      }

      if (nextIndex !== currentIndex) {
        e.preventDefault();
        focusableElements[nextIndex].focus();
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    // Set up page change announcements
    if (announcePageChanges) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            const title = document.title;
            if (title) {
              announce(`Navigated to ${title}`);
            }
          }
        });
      });

      observer.observe(document.head, {
        childList: true,
        subtree: true
      });

      return () => observer.disconnect();
    }
  }, [announcePageChanges, announce]);

  return {
    announce,
    focusMainContent,
    trapFocus,
    checkColorContrast,
    validateAriaAttributes,
    handleEscapeKey,
    handleArrowNavigation
  };
};

// Hook for managing modal accessibility
export const useModalAccessibility = (isOpen: boolean, onClose: () => void) => {
  const { trapFocus, handleEscapeKey, announce } = useAccessibility();
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Store previously focused element
      previousActiveElement.current = document.activeElement as HTMLElement;
      
      // Announce modal opening
      announce('Modal opened', 'assertive');
      
      // Trap focus and handle escape key
      const cleanupFocus = modalRef.current ? trapFocus(modalRef.current) : () => {};
      const cleanupEscape = handleEscapeKey(onClose);
      
      return () => {
        cleanupFocus();
        cleanupEscape();
        
        // Restore focus to previous element
        if (previousActiveElement.current) {
          previousActiveElement.current.focus();
        }
        
        announce('Modal closed');
      };
    }
  }, [isOpen, onClose, trapFocus, handleEscapeKey, announce]);

  return { modalRef };
};

// Hook for managing dropdown/menu accessibility
export const useDropdownAccessibility = (isOpen: boolean, onClose: () => void) => {
  const { handleEscapeKey, handleArrowNavigation } = useAccessibility();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const cleanupEscape = handleEscapeKey(onClose);
      const cleanupArrowNav = handleArrowNavigation(dropdownRef.current, {
        vertical: true,
        horizontal: false,
        wrap: true
      });

      return () => {
        cleanupEscape();
        cleanupArrowNav();
      };
    }
  }, [isOpen, onClose, handleEscapeKey, handleArrowNavigation]);

  return { dropdownRef };
};
