import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Keyboard,
  MousePointer,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Sun,
  Moon,
  Type,
  Palette,
  Navigation,
  HelpCircle,
  Settings
} from 'lucide-react';
import { cn } from '../../utils/cn.js';

// Accessibility Context
const AccessibilityContext = React.createContext();

export const useAccessibility = () => {
  const context = React.useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

export const AccessibilityProvider = ({ children }) => {
  const [highContrast, setHighContrast] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [screenReaderMode, setScreenReaderMode] = useState(false);
  const [keyboardNavigation, setKeyboardNavigation] = useState(true);
  const [focusVisible, setFocusVisible] = useState(true);
  const [ariaLive, setAriaLive] = useState('polite');
  const [zoomLevel, setZoomLevel] = useState(100);

  // Apply accessibility settings to document
  useEffect(() => {
    const root = document.documentElement;
    
    // High contrast
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Large text
    if (largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }
    
    // Reduced motion
    if (reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
    
    // Screen reader mode
    if (screenReaderMode) {
      root.classList.add('screen-reader-mode');
    } else {
      root.classList.remove('screen-reader-mode');
    }
    
    // Zoom level
    root.style.fontSize = `${zoomLevel}%`;
    
    // Keyboard navigation
    if (keyboardNavigation) {
      root.setAttribute('tabindex', '0');
    } else {
      root.removeAttribute('tabindex');
    }
  }, [highContrast, largeText, reducedMotion, screenReaderMode, keyboardNavigation, zoomLevel]);

  const value = {
    highContrast,
    setHighContrast,
    largeText,
    setLargeText,
    reducedMotion,
    setReducedMotion,
    screenReaderMode,
    setScreenReaderMode,
    keyboardNavigation,
    setKeyboardNavigation,
    focusVisible,
    setFocusVisible,
    ariaLive,
    setAriaLive,
    zoomLevel,
    setZoomLevel
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

// Skip to Main Content Link
export const SkipToMain = ({ mainId = 'main-content' }) => (
  <a
    href={`#${mainId}`}
    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-lg z-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    Skip to main content
  </a>
);

// Focus Trap Component
export const FocusTrap = ({ children, isActive = true }) => {
  const containerRef = useRef(null);
  const firstFocusableRef = useRef(null);
  const lastFocusableRef = useRef(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length > 0) {
      firstFocusableRef.current = focusableElements[0];
      lastFocusableRef.current = focusableElements[focusableElements.length - 1];
    }

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusableRef.current) {
          e.preventDefault();
          lastFocusableRef.current?.focus();
        }
      } else {
        if (document.activeElement === lastFocusableRef.current) {
          e.preventDefault();
          firstFocusableRef.current?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    return () => container.removeEventListener('keydown', handleTabKey);
  }, [isActive]);

  return <div ref={containerRef}>{children}</div>;
};

// Accessible Button Component
export const AccessibleButton = ({
  children,
  onClick,
  disabled = false,
  ariaLabel,
  ariaDescribedBy,
  className = '',
  ...props
}) => {
  const { screenReaderMode } = useAccessibility();

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-disabled={disabled}
      className={cn(
        'px-4 py-2 rounded-lg font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        disabled && 'opacity-50 cursor-not-allowed',
        screenReaderMode && 'sr-only-focusable',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

// Screen Reader Announcer
export const ScreenReaderAnnouncer = ({ message, priority = 'polite' }) => {
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    if (message) {
      setAnnouncement(message);
      const timer = setTimeout(() => setAnnouncement(''), 1000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
};

// Keyboard Navigation Indicator
export const KeyboardNavIndicator = () => {
  const { keyboardNavigation } = useAccessibility();
  const [isUsingKeyboard, setIsUsingKeyboard] = useState(false);

  useEffect(() => {
    const handleMouseDown = () => setIsUsingKeyboard(false);
    const handleKeyDown = (e) => {
      if (e.key === 'Tab') setIsUsingKeyboard(true);
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (!keyboardNavigation || !isUsingKeyboard) return null;

  return (
    <div className="fixed top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm z-50">
      <Keyboard className="w-4 h-4 inline mr-1" />
      Keyboard Navigation Active
    </div>
  );
};

// Accessibility Toolbar
export const AccessibilityToolbar = ({ isOpen, onClose }) => {
  const {
    highContrast,
    setHighContrast,
    largeText,
    setLargeText,
    reducedMotion,
    setReducedMotion,
    screenReaderMode,
    setScreenReaderMode,
    zoomLevel,
    setZoomLevel,
    ariaLive,
    setAriaLive
  } = useAccessibility();

  const [showSettings, setShowSettings] = useState(false);

  const accessibilityOptions = [
    {
      id: 'high-contrast',
      label: 'High Contrast',
      icon: Palette,
      enabled: highContrast,
      toggle: () => setHighContrast(!highContrast),
      description: 'Increase contrast for better visibility'
    },
    {
      id: 'large-text',
      label: 'Large Text',
      icon: Type,
      enabled: largeText,
      toggle: () => setLargeText(!largeText),
      description: 'Increase text size for better readability'
    },
    {
      id: 'reduced-motion',
      label: 'Reduced Motion',
      icon: Navigation,
      enabled: reducedMotion,
      toggle: () => setReducedMotion(!reducedMotion),
      description: 'Reduce animations and transitions'
    },
    {
      id: 'screen-reader',
      label: 'Screen Reader Mode',
      icon: Volume2,
      enabled: screenReaderMode,
      toggle: () => setScreenReaderMode(!screenReaderMode),
      description: 'Optimize for screen readers'
    }
  ];

  const zoomOptions = [
    { label: 'Zoom Out', icon: ZoomOut, action: () => setZoomLevel(Math.max(50, zoomLevel - 10)) },
    { label: 'Reset Zoom', icon: Maximize, action: () => setZoomLevel(100) },
    { label: 'Zoom In', icon: ZoomIn, action: () => setZoomLevel(Math.min(200, zoomLevel + 10)) }
  ];

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 overflow-y-auto"
    >
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Accessibility</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Quick Actions */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h3>
          <div className="grid grid-cols-3 gap-2">
            {zoomOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.label}
                  onClick={option.action}
                  className="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  title={option.label}
                >
                  <Icon className="w-5 h-5 mx-auto" />
                </button>
              );
            })}
          </div>
          <div className="mt-2 text-center">
            <span className="text-sm text-gray-600">Zoom: {zoomLevel}%</span>
          </div>
        </div>

        {/* Accessibility Options */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Display Options</h3>
          <div className="space-y-3">
            {accessibilityOptions.map((option) => {
              const Icon = option.icon;
              return (
                <div key={option.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-gray-600" />
                    <div>
                      <div className="font-medium text-gray-900">{option.label}</div>
                      <div className="text-xs text-gray-500">{option.description}</div>
                    </div>
                  </div>
                  <button
                    onClick={option.toggle}
                    className={cn(
                      'w-12 h-6 rounded-full transition-colors',
                      option.enabled ? 'bg-blue-600' : 'bg-gray-300'
                    )}
                  >
                    <div className={cn(
                      'w-5 h-5 bg-white rounded-full transition-transform',
                      option.enabled ? 'translate-x-6' : 'translate-x-1'
                    )} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Screen Reader Settings */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Screen Reader</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Announcement Priority
              </label>
              <select
                value={ariaLive}
                onChange={(e) => setAriaLive(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="polite">Polite</option>
                <option value="assertive">Assertive</option>
                <option value="off">Off</option>
              </select>
            </div>
          </div>
        </div>

        {/* Help */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Keyboard Shortcuts</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Tab</span>
              <span className="text-gray-900 font-mono">Navigate</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Enter</span>
              <span className="text-gray-900 font-mono">Select</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Esc</span>
              <span className="text-gray-900 font-mono">Close</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Alt + A</span>
              <span className="text-gray-900 font-mono">Accessibility</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Alt Text Generator Helper
export const AltTextHelper = ({ imageUrl, onAltTextChange }) => {
  const [altText, setAltText] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const generateSuggestions = () => {
    // Mock AI-powered suggestions
    const mockSuggestions = [
      'A group of students studying in a classroom',
      'Teacher explaining a concept to the class',
      'Students working on a group project',
      'Classroom with modern learning equipment'
    ];
    setSuggestions(mockSuggestions);
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Alternative Text
        </label>
        <textarea
          value={altText}
          onChange={(e) => {
            setAltText(e.target.value);
            onAltTextChange(e.target.value);
          }}
          placeholder="Describe this image for screen readers..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
      </div>
      
      <button
        onClick={generateSuggestions}
        className="mb-3 px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
      >
        Generate Suggestions
      </button>
      
      {suggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Suggestions:</p>
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => setAltText(suggestion)}
              className="block w-full text-left p-2 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors text-sm"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Color Blindness Simulator
export const ColorBlindnessSimulator = () => {
  const [simulation, setSimulation] = useState('normal');
  const [originalColors, setOriginalColors] = useState([]);

  const simulations = [
    { id: 'normal', label: 'Normal Vision' },
    { id: 'protanopia', label: 'Protanopia (Red-Blind)' },
    { id: 'deuteranopia', label: 'Deuteranopia (Green-Blind)' },
    { id: 'tritanopia', label: 'Tritanopia (Blue-Blind)' },
    { id: 'achromatopsia', label: 'Achromatopsia (Color-Blind)' }
  ];

  const applySimulation = (type) => {
    const root = document.documentElement;
    
    // Remove existing simulation classes
    root.classList.remove('sim-protanopia', 'sim-deuteranopia', 'sim-tritanopia', 'sim-achromatopsia');
    
    // Apply new simulation
    if (type !== 'normal') {
      root.classList.add(`sim-${type}`);
    }
    
    setSimulation(type);
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Color Vision Simulator</h3>
      <div className="grid grid-cols-2 gap-2">
        {simulations.map((sim) => (
          <button
            key={sim.id}
            onClick={() => applySimulation(sim.id)}
            className={cn(
              'p-2 text-sm rounded-lg border transition-colors',
              simulation === sim.id
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:border-gray-400'
            )}
          >
            {sim.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Test how your interface appears to users with different color vision deficiencies.
      </p>
    </div>
  );
};

// Focus Indicator
export const FocusIndicator = ({ children }) => {
  const { focusVisible } = useAccessibility();

  return (
    <div className={focusVisible ? 'focus-visible' : ''}>
      {children}
    </div>
  );
};

// ARIA Live Region
export const AriaLiveRegion = ({ priority = 'polite', children }) => {
  return (
    <div
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {children}
    </div>
  );
};

// Accessible Form Field
export const AccessibleFormField = ({
  label,
  id,
  required = false,
  error,
  hint,
  children,
  ...props
}) => {
  const fieldId = id || `field-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;

  return (
    <div className="space-y-2">
      <label
        htmlFor={fieldId}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {hint && (
        <p id={hintId} className="text-sm text-gray-500">
          {hint}
        </p>
      )}
      
      <div>
        {React.cloneElement(children, {
          id: fieldId,
          'aria-describedby': [
            hint ? hintId : null,
            error ? errorId : null
          ].filter(Boolean).join(' '),
          'aria-invalid': error ? 'true' : 'false',
          'aria-required': required,
          ...props
        })}
      </div>
      
      {error && (
        <p id={errorId} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
