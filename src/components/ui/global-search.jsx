import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Users,
  BookOpen,
  Calendar,
  FileText,
  School,
  GraduationCap,
  Clock,
  TrendingUp,
  ArrowRight,
  X,
  Loader2
} from 'lucide-react';
import { cn } from '../../utils/cn.js';

// Search result types
const searchTypes = {
  student: { icon: Users, color: 'blue', label: 'Student' },
  teacher: { icon: GraduationCap, color: 'green', label: 'Teacher' },
  subject: { icon: BookOpen, color: 'purple', label: 'Subject' },
  class: { icon: School, color: 'yellow', label: 'Class' },
  report: { icon: FileText, color: 'red', label: 'Report' },
  event: { icon: Calendar, color: 'indigo', label: 'Event' }
};

export function GlobalSearch({ placeholder = "Search students, teachers, subjects..." }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const searchTimeout = useRef(null);

  // Mock search function
  const performSearch = async (searchQuery) => {
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (searchQuery.trim() === '') {
      setResults([]);
      setLoading(false);
      return;
    }

    // Mock search results
    const mockResults = [
      {
        id: 1,
        type: 'student',
        title: 'John Doe',
        subtitle: 'Grade 10 - Class A',
        description: 'Student ID: STU001',
        href: '/students/1'
      },
      {
        id: 2,
        type: 'teacher',
        title: 'Jane Smith',
        subtitle: 'Mathematics Teacher',
        description: 'Teacher ID: TCH001',
        href: '/teachers/1'
      },
      {
        id: 3,
        type: 'subject',
        title: 'Advanced Mathematics',
        subtitle: 'Grade 10-12',
        description: 'Subject Code: MATH101',
        href: '/subjects/1'
      },
      {
        id: 4,
        type: 'class',
        title: 'Grade 10A',
        subtitle: 'Mathematics Class',
        description: '25 students',
        href: '/classes/1'
      }
    ].filter(result => 
      result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setResults(mockResults);
    setLoading(false);
  };

  // Handle search input
  const handleInputChange = (value) => {
    setQuery(value);
    setSelectedIndex(0);
    
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        window.location.href = results[selectedIndex].href;
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setQuery('');
    }
  };

  // Handle search result click
  const handleResultClick = (result) => {
    // Add to recent searches
    const newRecentSearches = [result, ...recentSearches.slice(0, 4)];
    setRecentSearches(newRecentSearches);
    
    // Navigate
    window.location.href = result.href;
    setIsOpen(false);
    setQuery('');
  };

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={inputRef}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
        )}
        {query && !loading && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              inputRef.current.focus();
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden"
          >
            {/* Loading State */}
            {loading && (
              <div className="p-4 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
                <p className="text-sm text-gray-500 mt-2">Searching...</p>
              </div>
            )}

            {/* Search Results */}
            {!loading && results.length > 0 && (
              <div className="py-2">
                <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Search Results
                </div>
                {results.map((result, index) => {
                  const typeConfig = searchTypes[result.type];
                  const Icon = typeConfig.icon;
                  
                  return (
                    <motion.button
                      key={result.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleResultClick(result)}
                      className={cn(
                        'w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors',
                        selectedIndex === index && 'bg-blue-50'
                      )}
                    >
                      <div className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center',
                        typeConfig.color === 'blue' && 'bg-blue-100 text-blue-600',
                        typeConfig.color === 'green' && 'bg-green-100 text-green-600',
                        typeConfig.color === 'purple' && 'bg-purple-100 text-purple-600',
                        typeConfig.color === 'yellow' && 'bg-yellow-100 text-yellow-600',
                        typeConfig.color === 'red' && 'bg-red-100 text-red-600',
                        typeConfig.color === 'indigo' && 'bg-indigo-100 text-indigo-600'
                      )}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{result.title}</p>
                          <span className={cn(
                            'text-xs px-2 py-1 rounded-full',
                            typeConfig.color === 'blue' && 'bg-blue-100 text-blue-600',
                            typeConfig.color === 'green' && 'bg-green-100 text-green-600',
                            typeConfig.color === 'purple' && 'bg-purple-100 text-purple-600',
                            typeConfig.color === 'yellow' && 'bg-yellow-100 text-yellow-600',
                            typeConfig.color === 'red' && 'bg-red-100 text-red-600',
                            typeConfig.color === 'indigo' && 'bg-indigo-100 text-indigo-600'
                          )}>
                            {typeConfig.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{result.subtitle}</p>
                        <p className="text-xs text-gray-500">{result.description}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </motion.button>
                  );
                })}
              </div>
            )}

            {/* No Results */}
            {!loading && query && results.length === 0 && (
              <div className="p-4 text-center">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No results found for "{query}"</p>
                <p className="text-xs text-gray-400 mt-1">Try searching with different keywords</p>
              </div>
            )}

            {/* Recent Searches */}
            {!loading && !query && recentSearches.length > 0 && (
              <div className="py-2 border-t border-gray-200">
                <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recent Searches
                </div>
                {recentSearches.map((search, index) => {
                  const typeConfig = searchTypes[search.type];
                  const Icon = typeConfig.icon;
                  
                  return (
                    <button
                      key={search.id}
                      onClick={() => handleResultClick(search)}
                      className="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                    >
                      <Clock className="w-4 h-4 text-gray-400" />
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-gray-900">{search.title}</p>
                        <p className="text-xs text-gray-500">{search.subtitle}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Quick Actions */}
            {!loading && !query && (
              <div className="py-2 border-t border-gray-200">
                <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quick Actions
                </div>
                <div className="grid grid-cols-2 gap-2 p-4">
                  {[
                    { label: 'Add Student', href: '/students/new', icon: Users },
                    { label: 'View Calendar', href: '/calendar', icon: Calendar },
                    { label: 'Generate Report', href: '/reports', icon: FileText },
                    { label: 'View Analytics', href: '/analytics', icon: TrendingUp }
                  ].map((action, index) => (
                    <button
                      key={action.label}
                      onClick={() => window.location.href = action.href}
                      className="flex items-center gap-2 p-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <action.icon className="w-4 h-4" />
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Advanced Search Component
export function AdvancedSearch() {
  const [filters, setFilters] = useState({
    type: 'all',
    grade: 'all',
    subject: 'all',
    dateRange: 'all'
  });

  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Advanced Search</h3>
        <button
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Type
          </label>
          <select
            value={filters.type}
            onChange={(e) => setFilters({...filters, type: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="student">Students</option>
            <option value="teacher">Teachers</option>
            <option value="subject">Subjects</option>
            <option value="class">Classes</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Grade Level
          </label>
          <select
            value={filters.grade}
            onChange={(e) => setFilters({...filters, grade: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Grades</option>
            <option value="9">Grade 9</option>
            <option value="10">Grade 10</option>
            <option value="11">Grade 11</option>
            <option value="12">Grade 12</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subject
          </label>
          <select
            value={filters.subject}
            onChange={(e) => setFilters({...filters, subject: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Subjects</option>
            <option value="math">Mathematics</option>
            <option value="science">Science</option>
            <option value="english">English</option>
            <option value="history">History</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date Range
          </label>
          <select
            value={filters.dateRange}
            onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between mt-6">
        <button
          onClick={() => setFilters({
            type: 'all',
            grade: 'all',
            subject: 'all',
            dateRange: 'all'
          })}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Clear Filters
        </button>
        
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Search
          </button>
        </div>
      </div>
    </div>
  );
}
