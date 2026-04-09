import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  const [primaryColor, setPrimaryColor] = useState('blue');
  const [fontSize, setFontSize] = useState('medium');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  // Load theme preferences from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const savedPrimaryColor = localStorage.getItem('primaryColor');
    const savedFontSize = localStorage.getItem('fontSize');
    const savedReducedMotion = localStorage.getItem('reducedMotion');
    const savedHighContrast = localStorage.getItem('highContrast');

    if (savedTheme) setTheme(savedTheme);
    if (savedPrimaryColor) setPrimaryColor(savedPrimaryColor);
    if (savedFontSize) setFontSize(savedFontSize);
    if (savedReducedMotion) setReducedMotion(savedReducedMotion === 'true');
    if (savedHighContrast) setHighContrast(savedHighContrast === 'true');
  }, []);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply theme class
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    
    // Apply primary color
    root.classList.remove('primary-blue', 'primary-green', 'primary-purple', 'primary-orange');
    root.classList.add(`primary-${primaryColor}`);
    
    // Apply font size
    root.classList.remove('text-sm', 'text-base', 'text-lg');
    root.classList.add(`text-${fontSize}`);
    
    // Apply accessibility preferences
    if (reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
    
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  }, [theme, primaryColor, fontSize, reducedMotion, highContrast]);

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('primaryColor', primaryColor);
  }, [primaryColor]);

  useEffect(() => {
    localStorage.setItem('fontSize', fontSize);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('reducedMotion', reducedMotion.toString());
  }, [reducedMotion]);

  useEffect(() => {
    localStorage.setItem('highContrast', highContrast.toString());
  }, [highContrast]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const value = {
    theme,
    setTheme,
    toggleTheme,
    primaryColor,
    setPrimaryColor,
    fontSize,
    setFontSize,
    reducedMotion,
    setReducedMotion,
    highContrast,
    setHighContrast
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Theme Toggle Component
export const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${className}`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0018 18a9.003 9.003 0 01-8.646 11.646z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )}
    </button>
  );
};

// Theme Settings Panel
export const ThemeSettings = ({ isOpen, onClose }) => {
  const { 
    theme, 
    setTheme, 
    primaryColor, 
    setPrimaryColor, 
    fontSize, 
    setFontSize, 
    reducedMotion, 
    setReducedMotion, 
    highContrast, 
    setHighContrast 
  } = useTheme();

  const colors = [
    { name: 'Blue', value: 'blue', class: 'bg-blue-500' },
    { name: 'Green', value: 'green', class: 'bg-green-500' },
    { name: 'Purple', value: 'purple', class: 'bg-purple-500' },
    { name: 'Orange', value: 'orange', class: 'bg-orange-500' }
  ];

  const fontSizes = [
    { name: 'Small', value: 'sm' },
    { name: 'Medium', value: 'base' },
    { name: 'Large', value: 'lg' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Theme Settings</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Theme Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Theme Mode</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setTheme('light')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  theme === 'light' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span className="font-medium">Light</span>
                </div>
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  theme === 'dark' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0018 18a9.003 9.003 0 01-8.646 11.646z" />
                  </svg>
                  <span className="font-medium">Dark</span>
                </div>
              </button>
            </div>
          </div>

          {/* Primary Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Primary Color</label>
            <div className="grid grid-cols-4 gap-3">
              {colors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setPrimaryColor(color.value)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    primaryColor === color.value 
                      ? 'border-gray-900' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-6 h-6 rounded-full ${color.class}`} />
                    <span className="text-xs font-medium">{color.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Font Size</label>
            <div className="grid grid-cols-3 gap-3">
              {fontSizes.map((size) => (
                <button
                  key={size.value}
                  onClick={() => setFontSize(size.value)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    fontSize === size.value 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="font-medium">{size.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Accessibility Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Accessibility</label>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reducedMotion}
                  onChange={(e) => setReducedMotion(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm">Reduce motion</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={highContrast}
                  onChange={(e) => setHighContrast(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm">High contrast</span>
              </label>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Apply Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
