import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award,
  Star,
  Trophy,
  Target,
  Zap,
  Flame,
  Calendar,
  TrendingUp,
  CheckCircle,
  Lock,
  Gift,
  Crown,
  Medal,
  Gem,
  Rocket,
  Heart,
  Sparkles
} from 'lucide-react';
import { cn } from '../../utils/cn.js';

// Achievement System
export const AchievementSystem = ({ userAchievements = [], userLevel = 1, userPoints = 0 }) => {
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const achievements = [
    {
      id: 1,
      name: 'First Steps',
      description: 'Complete your first assignment',
      icon: Award,
      color: 'blue',
      points: 10,
      unlocked: true,
      progress: 100,
      category: 'Beginner'
    },
    {
      id: 2,
      name: 'Perfect Attendance',
      description: 'Attend all classes for a month',
      icon: Calendar,
      color: 'green',
      points: 50,
      unlocked: true,
      progress: 100,
      category: 'Attendance'
    },
    {
      id: 3,
      name: 'Math Wizard',
      description: 'Score 95%+ in 3 math tests',
      icon: Target,
      color: 'purple',
      points: 100,
      unlocked: false,
      progress: 67,
      category: 'Academic'
    },
    {
      id: 4,
      name: 'Study Streak',
      description: 'Study for 7 days in a row',
      icon: Flame,
      color: 'orange',
      points: 75,
      unlocked: false,
      progress: 43,
      category: 'Consistency'
    },
    {
      id: 5,
      name: 'Helper Hero',
      description: 'Help 5 classmates with assignments',
      icon: Heart,
      color: 'pink',
      points: 60,
      unlocked: false,
      progress: 20,
      category: 'Social'
    },
    {
      id: 6,
      name: 'Quick Learner',
      description: 'Complete 5 courses in record time',
      icon: Rocket,
      color: 'indigo',
      points: 80,
      unlocked: false,
      progress: 80,
      category: 'Speed'
    }
  ];

  const getLevelColor = (level) => {
    if (level >= 10) return 'text-purple-600';
    if (level >= 7) return 'text-blue-600';
    if (level >= 5) return 'text-green-600';
    if (level >= 3) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getLevelBadge = (level) => {
    if (level >= 10) return { icon: Crown, color: 'purple' };
    if (level >= 7) return { icon: Trophy, color: 'blue' };
    if (level >= 5) return { icon: Medal, color: 'green' };
    if (level >= 3) return { icon: Star, color: 'yellow' };
    return { icon: Award, color: 'gray' };
  };

  const levelBadge = getLevelBadge(userLevel);
  const Icon = levelBadge.icon;

  return (
    <div className="space-y-6">
      {/* User Level and Points */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Icon className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Level {userLevel}</h3>
              <p className="text-blue-100">Student Scholar</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{userPoints}</div>
            <p className="text-blue-100">Total Points</p>
          </div>
        </div>
        
        {/* Progress to Next Level */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-2">
            <span>Progress to Level {userLevel + 1}</span>
            <span>{userPoints % 100}/100 XP</span>
          </div>
          <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(userPoints % 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-white rounded-full"
            />
          </div>
        </div>
      </motion.div>

      {/* Achievement Categories */}
      <div className="flex gap-2 flex-wrap">
        {['All', 'Beginner', 'Academic', 'Attendance', 'Consistency', 'Social', 'Speed'].map((category) => (
          <button
            key={category}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium transition-colors"
          >
            {category}
          </button>
        ))}
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements.map((achievement, index) => {
          const colorClasses = {
            blue: 'bg-blue-100 text-blue-600 border-blue-200',
            green: 'bg-green-100 text-green-600 border-green-200',
            purple: 'bg-purple-100 text-purple-600 border-purple-200',
            orange: 'bg-orange-100 text-orange-600 border-orange-200',
            pink: 'bg-pink-100 text-pink-600 border-pink-200',
            indigo: 'bg-indigo-100 text-indigo-600 border-indigo-200',
            gray: 'bg-gray-100 text-gray-600 border-gray-200'
          };

          const AchievementIcon = achievement.icon;

          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedAchievement(achievement)}
              className={cn(
                'p-4 rounded-xl border cursor-pointer transition-all duration-300',
                achievement.unlocked
                  ? colorClasses[achievement.color]
                  : 'bg-gray-50 text-gray-400 border-gray-200'
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  'w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0',
                  achievement.unlocked
                    ? colorClasses[achievement.color]
                    : 'bg-gray-200 text-gray-400'
                )}>
                  <AchievementIcon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold truncate">{achievement.name}</h4>
                    {achievement.unlocked && <CheckCircle className="w-4 h-4" />}
                    {!achievement.unlocked && <Lock className="w-4 h-4" />}
                  </div>
                  <p className="text-sm opacity-75 mb-2">{achievement.description}</p>
                  
                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Progress</span>
                      <span>{achievement.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${achievement.progress}%` }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className={cn(
                          'h-1.5 rounded-full',
                          achievement.unlocked
                            ? 'bg-current'
                            : 'bg-gray-300'
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs opacity-75">{achievement.category}</span>
                    <div className="flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      <span className="text-xs font-semibold">{achievement.points}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Achievement Detail Modal */}
      <AnimatePresence>
        {selectedAchievement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedAchievement(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className={cn(
                  'w-16 h-16 rounded-xl flex items-center justify-center',
                  selectedAchievement.unlocked
                    ? `bg-${selectedAchievement.color}-100 text-${selectedAchievement.color}-600`
                    : 'bg-gray-200 text-gray-400'
                )}>
                  <selectedAchievement.icon className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{selectedAchievement.name}</h3>
                  <p className="text-gray-600">{selectedAchievement.category}</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-4">{selectedAchievement.description}</p>
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <span className="font-semibold">{selectedAchievement.points} points</span>
                </div>
                <div className="text-sm text-gray-500">
                  {selectedAchievement.unlocked ? 'Unlocked' : 'Locked'}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{selectedAchievement.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${selectedAchievement.progress}%` }}
                    transition={{ duration: 0.5 }}
                    className={cn(
                      'h-2 rounded-full',
                      selectedAchievement.unlocked
                        ? 'bg-green-500'
                        : 'bg-gray-300'
                    )}
                  />
                </div>
              </div>
              
              <button
                onClick={() => setSelectedAchievement(null)}
                className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Leaderboard Component
export const Leaderboard = ({ rankings = [], userRank = null }) => {
  const [timeRange, setTimeRange] = useState('week');
  const [category, setCategory] = useState('all');

  const timeRanges = ['day', 'week', 'month', 'all'];
  const categories = ['all', 'points', 'attendance', 'grades'];

  const getRankIcon = (rank) => {
    if (rank === 1) return { icon: Crown, color: 'text-yellow-500' };
    if (rank === 2) return { icon: Medal, color: 'text-gray-400' };
    if (rank === 3) return { icon: Medal, color: 'text-orange-600' };
    return { icon: Award, color: 'text-gray-500' };
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2">
          {timeRanges.map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
        
        <div className="flex gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                category === cat
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Rankings */}
      <div className="space-y-3">
        {rankings.map((user, index) => {
          const rankIcon = getRankIcon(index + 1);
          const RankIconComponent = rankIcon.icon;
          const isCurrentUser = userRank && user.id === userRank.id;

          return (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                'flex items-center gap-4 p-4 rounded-xl border transition-all duration-300',
                isCurrentUser
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:shadow-md'
              )}
            >
              {/* Rank */}
              <div className="flex items-center justify-center w-8">
                {index < 3 ? (
                  <RankIconComponent className={cn('w-6 h-6', rankIcon.color)} />
                ) : (
                  <span className="text-lg font-bold text-gray-600">#{index + 1}</span>
                )}
              </div>

              {/* User Info */}
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {user.name}
                    {isCurrentUser && <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded-full">You</span>}
                  </h4>
                  <p className="text-sm text-gray-600">{user.grade} - {user.class}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{user.points}</div>
                  <div className="text-xs text-gray-500">Points</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{user.level}</div>
                  <div className="text-xs text-gray-500">Level</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{user.streak}</div>
                  <div className="text-xs text-gray-500">Streak</div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* User's Position (if not in top rankings) */}
      {userRank && !rankings.some(r => r.id === userRank.id) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-2 border-blue-500 bg-blue-50 rounded-xl p-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-8 text-center">
              <span className="text-lg font-bold text-blue-600">#{userRank.rank}</span>
            </div>
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                {userRank.name.charAt(0)}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">
                  {userRank.name}
                  <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded-full">You</span>
                </h4>
                <p className="text-sm text-gray-600">{userRank.grade} - {userRank.class}</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{userRank.points}</div>
                <div className="text-xs text-gray-500">Points</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{userRank.level}</div>
                <div className="text-xs text-gray-500">Level</div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Progress Tracker
export const ProgressTracker = ({ goals = [], milestones = [] }) => {
  const [activeGoal, setActiveGoal] = useState(null);

  return (
    <div className="space-y-6">
      {/* Goals */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Goals</h3>
        <div className="space-y-3">
          {goals.map((goal, index) => (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl border border-gray-200 p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">{goal.title}</h4>
                <span className={cn(
                  'px-2 py-1 rounded-full text-xs font-medium',
                  goal.completed
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                )}>
                  {goal.completed ? 'Completed' : 'In Progress'}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-3">{goal.description}</p>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{goal.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${goal.progress}%` }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={cn(
                      'h-2 rounded-full',
                      goal.completed
                        ? 'bg-green-500'
                        : 'bg-blue-500'
                    )}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-gray-500">Due: {goal.dueDate}</span>
                <div className="flex items-center gap-1">
                  <Target className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-semibold">{goal.points} pts</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Milestones */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Milestones</h3>
        <div className="relative">
          {/* Timeline */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
          
          <div className="space-y-6">
            {milestones.map((milestone, index) => (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-4"
              >
                <div className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 relative z-10',
                  milestone.completed
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                )}>
                  {milestone.completed ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <Lock className="w-6 h-6" />
                  )}
                </div>
                
                <div className="flex-1 bg-white rounded-xl border border-gray-200 p-4">
                  <h4 className="font-semibold text-gray-900 mb-1">{milestone.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{milestone.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{milestone.date}</span>
                    <div className="flex items-center gap-1">
                      <Trophy className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-semibold">{milestone.points} pts</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Streak Counter
export const StreakCounter = ({ currentStreak = 0, longestStreak = 0, lastActiveDate }) => {
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (currentStreak > 0) {
      setShowAnimation(true);
      const timer = setTimeout(() => setShowAnimation(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [currentStreak]);

  return (
    <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Study Streak</h3>
        <Flame className="w-6 h-6" />
      </div>
      
      <div className="flex items-center justify-center">
        <motion.div
          animate={showAnimation ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="text-5xl font-bold mb-2">{currentStreak}</div>
          <div className="text-orange-100">days in a row</div>
        </motion.div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-orange-400">
        <div className="flex justify-between text-sm">
          <span className="text-orange-100">Longest streak</span>
          <span className="font-semibold">{longestStreak} days</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-orange-100">Last active</span>
          <span className="font-semibold">{lastActiveDate}</span>
        </div>
      </div>
      
      {currentStreak === 0 && (
        <div className="mt-4 p-3 bg-white bg-opacity-20 rounded-lg">
          <p className="text-sm text-center">
            Start studying today to build your streak!
          </p>
        </div>
      )}
    </div>
  );
};
