import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  BookOpen,
  TrendingUp,
  GraduationCap,
  School,
  FileText,
  Key,
  Calendar,
  Award,
  Target,
  Activity,
  Bell,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  Star,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './card.jsx';
import { EnhancedButton, FloatingActionButton } from './enhanced-button.jsx';
import { cn } from '../../utils/cn.js';

// Animated Counter Component
function AnimatedCounter({ value, duration = 2000, suffix = '' }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime;
    let animationFrame;
    
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      setCount(Math.floor(progress * value));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return <span>{count}{suffix}</span>;
}

// Progress Ring Component
function ProgressRing({ value, size = 60, strokeWidth = 8, color = 'blue' }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  const colorClasses = {
    blue: '#3b82f6',
    green: '#22c55e',
    yellow: '#f59e0b',
    red: '#ef4444',
    purple: '#8b5cf6'
  };

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#e5e7eb"
        strokeWidth={strokeWidth}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={colorClasses[color]}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-500 ease-out"
      />
    </svg>
  );
}

// Quick Stats Card
function QuickStatsCard({ title, value, change, icon: Icon, color = 'blue', trend = 'up' }) {
  const trendIcon = trend === 'up' ? TrendingUp : TrendingDown;
  const trendColor = trend === 'up' ? 'text-green-600' : 'text-red-600';
  const bgColor = {
    blue: 'bg-blue-50',
    green: 'bg-green-50',
    yellow: 'bg-yellow-50',
    red: 'bg-red-50',
    purple: 'bg-purple-50'
  }[color];

  const textColor = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
    purple: 'text-purple-600'
  }[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={cn(
        'p-6 rounded-xl border border-gray-200 bg-white',
        'hover:shadow-lg transition-all duration-300'
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-gray-900">
              <AnimatedCounter value={value} />
            </p>
            {change && (
              <div className={cn('flex items-center text-sm font-medium', trendColor)}>
                <trendIcon className="w-4 h-4 mr-1" />
                {change}%
              </div>
            )}
          </div>
        </div>
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', bgColor, textColor)}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
}

// Activity Feed Item
function ActivityFeedItem({ icon: Icon, title, description, time, type = 'info' }) {
  const typeColors = {
    success: 'bg-green-100 text-green-600',
    warning: 'bg-yellow-100 text-yellow-600',
    error: 'bg-red-100 text-red-600',
    info: 'bg-blue-100 text-blue-600'
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', typeColors[type])}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-500">{description}</p>
        <p className="text-xs text-gray-400 mt-1">{time}</p>
      </div>
    </motion.div>
  );
}

// Enhanced Admin Dashboard
export function EnhancedAdminDashboard() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('week');
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'success', title: 'New Student Enrolled', description: 'John Doe joined Grade 10', time: '2 hours ago' },
    { id: 2, type: 'warning', title: 'Low Attendance', description: 'Grade 9B has 75% attendance', time: '5 hours ago' },
    { id: 3, type: 'info', title: 'System Update', description: 'New features available', time: '1 day ago' }
  ]);

  const stats = [
    { title: 'Total Students', value: 1247, change: 12, icon: Users, color: 'blue', trend: 'up' },
    { title: 'Total Teachers', value: 68, change: 5, icon: GraduationCap, color: 'green', trend: 'up' },
    { title: 'Total Subjects', value: 24, change: 0, icon: BookOpen, color: 'purple', trend: 'up' },
    { title: 'Avg Performance', value: 87, change: -3, icon: TrendingUp, color: 'yellow', trend: 'down' }
  ];

  const quickActions = [
    { icon: Users, label: 'Add Student', href: '/students/new', color: 'green' },
    { icon: Calendar, label: 'View Calendar', href: '/calendar', color: 'blue' },
    { icon: FileText, label: 'Generate Report', href: '/reports', color: 'purple' },
    { icon: Bell, label: 'Send Notification', href: '/notifications', color: 'orange' }
  ];

  const performanceData = [
    { name: 'Math', value: 85, color: 'blue' },
    { name: 'Science', value: 78, color: 'green' },
    { name: 'English', value: 92, color: 'purple' },
    { name: 'History', value: 71, color: 'yellow' },
    { name: 'Arts', value: 88, color: 'pink' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening in your school.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="day">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
          
          <EnhancedButton icon={FileText} variant="outline">
            Export Report
          </EnhancedButton>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <QuickStatsCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action, index) => (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-4 rounded-xl border border-gray-200 bg-white hover:shadow-lg transition-all duration-300"
          >
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3', 
              action.color === 'green' && 'bg-green-100 text-green-600',
              action.color === 'blue' && 'bg-blue-100 text-blue-600',
              action.color === 'purple' && 'bg-purple-100 text-purple-600',
              action.color === 'orange' && 'bg-orange-100 text-orange-600'
            )}>
              <action.icon className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-gray-900">{action.label}</p>
          </motion.button>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2"
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Subject Performance</span>
                <EnhancedButton variant="ghost" size="sm">
                  View Details
                </EnhancedButton>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceData.map((subject, index) => (
                  <motion.div
                    key={subject.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">{subject.name}</span>
                        <span className="text-sm font-semibold text-gray-700">{subject.value}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${subject.value}%` }}
                          transition={{ duration: 1, delay: index * 0.1 }}
                          className={cn('h-2 rounded-full', 
                            subject.color === 'blue' && 'bg-blue-500',
                            subject.color === 'green' && 'bg-green-500',
                            subject.color === 'purple' && 'bg-purple-500',
                            subject.color === 'yellow' && 'bg-yellow-500',
                            subject.color === 'pink' && 'bg-pink-500'
                          )}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-center">
                      <ProgressRing value={subject.value} size={40} color={subject.color} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Activity Feed */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recent Activity</span>
                <Bell className="w-5 h-5 text-gray-400" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <AnimatePresence>
                  {notifications.map((notification, index) => (
                    <ActivityFeedItem
                      key={notification.id}
                      icon={notification.type === 'success' ? CheckCircle : 
                            notification.type === 'warning' ? AlertCircle : 
                            notification.type === 'error' ? AlertCircle : Bell}
                      title={notification.title}
                      description={notification.description}
                      time={notification.time}
                      type={notification.type}
                    />
                  ))}
                </AnimatePresence>
              </div>
              
              <EnhancedButton variant="ghost" className="w-full mt-4">
                View All Activities
              </EnhancedButton>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton
        icon={Zap}
        position="bottom-right"
        color="primary"
        onClick={() => console.log('Quick action clicked')}
      />
    </div>
  );
}

// Enhanced Student Dashboard
export function EnhancedStudentDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [achievements, setAchievements] = useState([
    { id: 1, name: 'Perfect Attendance', icon: Calendar, unlocked: true, progress: 100 },
    { id: 2, name: 'Math Wizard', icon: Target, unlocked: true, progress: 100 },
    { id: 3, name: 'Science Explorer', icon: Award, unlocked: false, progress: 75 },
    { id: 4, name: 'Reading Champion', icon: BookOpen, unlocked: false, progress: 60 }
  ]);

  const studentStats = [
    { title: 'Overall Grade', value: 'A+', color: 'green' },
    { title: 'Attendance', value: '95%', color: 'blue' },
    { title: 'Assignments', value: '12/15', color: 'purple' },
    { title: 'Rank', value: '#3', color: 'yellow' }
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'grades', label: 'Grades', icon: FileText },
    { id: 'achievements', label: 'Achievements', icon: Award },
    { id: 'calendar', label: 'Calendar', icon: Calendar }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-gray-900">My Academic Journey</h1>
        <p className="text-gray-600 mt-1">Track your progress and celebrate your achievements</p>
      </motion.div>

      {/* Student Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {studentStats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="text-center p-6 rounded-xl border border-gray-200 bg-white hover:shadow-lg transition-all duration-300"
          >
            <div className={cn('w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3',
              stat.color === 'green' && 'bg-green-100 text-green-600',
              stat.color === 'blue' && 'bg-blue-100 text-blue-600',
              stat.color === 'purple' && 'bg-purple-100 text-purple-600',
              stat.color === 'yellow' && 'bg-yellow-100 text-yellow-600'
            )}>
              <Star className="w-6 h-6" />
            </div>
            <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 py-4 border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'achievements' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    'p-6 rounded-xl border transition-all duration-300',
                    achievement.unlocked
                      ? 'border-yellow-300 bg-gradient-to-br from-yellow-50 to-orange-50'
                      : 'border-gray-200 bg-white'
                  )}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={cn('w-12 h-12 rounded-full flex items-center justify-center',
                      achievement.unlocked
                        ? 'bg-yellow-500 text-white'
                        : 'bg-gray-200 text-gray-400'
                    )}>
                      <achievement.icon className="w-6 h-6" />
                    </div>
                    {achievement.unlocked && (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{achievement.name}</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium">{achievement.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${achievement.progress}%` }}
                        transition={{ duration: 1, delay: index * 0.1 }}
                        className={cn('h-2 rounded-full',
                          achievement.unlocked ? 'bg-yellow-500' : 'bg-gray-400'
                        )}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['Math', 'Science', 'English', 'History'].map((subject, index) => (
                      <div key={subject} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium">{subject}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">92%</span>
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div className="w-full bg-green-500 h-2 rounded-full" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {['Math Test - Tomorrow', 'Science Fair - Friday', 'Parent Meeting - Next Week'].map((event, index) => (
                      <div key={event} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                        <Calendar className="w-5 h-5 text-blue-500" />
                        <span className="text-sm">{event}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
