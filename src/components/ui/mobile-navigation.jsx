import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  BookOpen,
  Users,
  Calendar,
  FileText,
  Award,
  Settings,
  Search,
  Menu,
  X,
  ChevronUp,
  Bell
} from 'lucide-react';
import { cn } from '../../utils/cn.js';

export function MobileNavigation({ navigation = [], user = null }) {
  const [activeTab, setActiveTab] = useState('home');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const bottomNavItems = navigation.slice(0, 4).map(item => ({
    id: item.name.toLowerCase().replace(' ', '-'),
    label: item.name,
    icon: item.icon,
    href: item.href,
    badge: item.badge
  }));

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50 md:hidden">
        <div className="flex justify-around items-center">
          {bottomNavItems.map((item) => {
            const isActive = window.location.pathname === item.href;
            return (
              <button
                key={item.id}
                onClick={() => window.location.href = item.href}
                className={cn(
                  'flex flex-col items-center p-2 rounded-lg transition-all duration-200',
                  'relative group',
                  isActive
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                )}
              >
                <div className="relative">
                  <item.icon className="w-5 h-5" />
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-xs mt-1 font-medium">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="mobileActiveTab"
                    className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-20 right-4 z-40 flex flex-col gap-2">
        {/* Search Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setSearchOpen(!searchOpen)}
          className="w-12 h-12 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-900"
        >
          <Search className="w-5 h-5" />
        </motion.button>

        {/* Notifications Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="w-12 h-12 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-900 relative"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
        </motion.button>
      </div>

      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={scrollToTop}
            className="fixed bottom-20 left-4 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center z-40"
          >
            <ChevronUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Mobile Search Overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start pt-20 px-4"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              className="w-full max-w-md mx-auto bg-white rounded-xl shadow-xl p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students, teachers, subjects..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button
                  onClick={() => setSearchOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Quick Search Results */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-500 mb-2">Quick Actions</div>
                {['Add Student', 'View Calendar', 'Generate Report', 'Send Message'].map((action) => (
                  <button
                    key={action}
                    className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Mobile Swipe Navigation
export function MobileSwipeNavigation({ children }) {
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(0);
    setTouchStart(e.targetTouches[0].clientX);
    setIsSwiping(true);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      // Swipe left - next page
      console.log('Swipe left detected');
    } else if (isRightSwipe) {
      // Swipe right - previous page
      console.log('Swipe right detected');
    }

    setIsSwiping(false);
  };

  return (
    <div
      className="relative touch-pan-y"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {children}
      
      {/* Swipe Indicator */}
      <AnimatePresence>
        {isSwiping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-24 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-3 py-1 rounded-full text-xs"
          >
            Swipe to navigate
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Mobile Gesture Handler
export function MobileGestureHandler({ children, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown }) {
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [touchEnd, setTouchEnd] = useState({ x: 0, y: 0 });

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd({ x: 0, y: 0 });
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const onTouchMove = (e) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const onTouchEnd = () => {
    if (!touchStart.x || !touchEnd.x) return;

    const xDistance = touchStart.x - touchEnd.x;
    const yDistance = touchStart.y - touchEnd.y;

    const isLeftSwipe = xDistance > minSwipeDistance;
    const isRightSwipe = xDistance < -minSwipeDistance;
    const isUpSwipe = yDistance > minSwipeDistance;
    const isDownSwipe = yDistance < -minSwipeDistance;

    if (isLeftSwipe && onSwipeLeft) onSwipeLeft();
    if (isRightSwipe && onSwipeRight) onSwipeRight();
    if (isUpSwipe && onSwipeUp) onSwipeUp();
    if (isDownSwipe && onSwipeDown) onSwipeDown();
  };

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="relative"
    >
      {children}
    </div>
  );
}

// Mobile Tab Bar
export function MobileTabBar({ tabs = [], activeTab, onTabChange }) {
  return (
    <div className="flex bg-white border-t border-gray-200 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'flex flex-col items-center px-4 py-2 min-w-fit transition-colors',
            activeTab === tab.id
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          <tab.icon className="w-5 h-5 mb-1" />
          <span className="text-xs font-medium">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

// Mobile Pull to Refresh
export function MobilePullToRefresh({ children, onRefresh, isRefreshing }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);

  const onTouchStart = (e) => {
    if (window.scrollY === 0) {
      setIsPulling(true);
      setPullDistance(0);
    }
  };

  const onTouchMove = (e) => {
    if (isPulling && window.scrollY === 0) {
      const touch = e.touches[0];
      const distance = Math.max(0, touch.clientY - 50);
      setPullDistance(Math.min(distance, 100));
    }
  };

  const onTouchEnd = () => {
    if (pullDistance > 60 && onRefresh) {
      onRefresh();
    }
    setIsPulling(false);
    setPullDistance(0);
  };

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="relative"
    >
      {/* Pull to Refresh Indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center bg-white border-b border-gray-200 z-10"
        style={{
          height: `${pullDistance}px`,
          opacity: pullDistance / 100,
          transform: `translateY(-${Math.min(pullDistance, 60)}px)`
        }}
      >
        {isRefreshing ? (
          <div className="animate-spin">
            <Settings className="w-6 h-6 text-blue-600" />
          </div>
        ) : (
          <ChevronUp 
            className="w-6 h-6 text-gray-400"
            style={{ transform: `rotate(${Math.min(pullDistance * 2, 180)}deg)` }}
          />
        )}
      </div>

      {/* Content */}
      <div className="relative">
        {children}
      </div>
    </div>
  );
}

// Mobile Responsive Container
export function MobileContainer({ children, className = '' }) {
  return (
    <div className={cn(
      'container mx-auto px-4 sm:px-6 lg:px-8',
      'max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-6xl',
      className
    )}>
      {children}
    </div>
  );
}

// Mobile Grid System
export function MobileGrid({ children, cols = { mobile: 1, tablet: 2, desktop: 3 }, gap = 4 }) {
  const gridClasses = cn(
    'grid gap-4',
    `grid-cols-${cols.mobile}`,
    `sm:grid-cols-${cols.tablet || cols.mobile}`,
    `lg:grid-cols-${cols.desktop || cols.tablet || cols.mobile}`
  );

  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
}

// Mobile Card Stack
export function MobileCardStack({ children, className = '' }) {
  return (
    <div className={cn(
      'space-y-4',
      'sm:space-y-6',
      'lg:space-y-8',
      className
    )}>
      {children}
    </div>
  );
}
