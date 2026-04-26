/**
 * Badge system utilities for user achievements
 */

export type BadgeLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' | 'Master';

export interface Badge {
  level: BadgeLevel;
  minScore: number;
  maxScore: number | null;
  image: string;
  color: string;
  description: string;
}

export const BADGES: Record<BadgeLevel, Badge> = {
  Beginner: {
    level: 'Beginner',
    minScore: 0,
    maxScore: 49,
    image: '/Beginner.png',
    color: 'bg-gray-100 text-gray-800',
    description: 'Starting your environmental journey',
  },
  Intermediate: {
    level: 'Intermediate',
    minScore: 50,
    maxScore: 99,
    image: '/Intermediate.png',
    color: 'bg-blue-100 text-blue-800',
    description: 'Making a real difference',
  },
  Advanced: {
    level: 'Advanced',
    minScore: 100,
    maxScore: 149,
    image: '/Advanced.png',
    color: 'bg-purple-100 text-purple-800',
    description: 'Dedicated environmental champion',
  },
  Expert: {
    level: 'Expert',
    minScore: 150,
    maxScore: 199,
    image: '/Expert.png',
    color: 'bg-orange-100 text-orange-800',
    description: 'Leading the cleanup movement',
  },
  Master: {
    level: 'Master',
    minScore: 200,
    maxScore: null,
    image: '/Master.png',
    color: 'bg-yellow-100 text-yellow-800',
    description: 'Elite environmental guardian',
  },
};

/**
 * Get badge level based on impact score
 */
export function getBadgeForScore(score: number): Badge {
  if (score >= 200) return BADGES.Master;
  if (score >= 150) return BADGES.Expert;
  if (score >= 100) return BADGES.Advanced;
  if (score >= 50) return BADGES.Intermediate;
  return BADGES.Beginner;
}

/**
 * Get next badge level and progress
 */
export function getNextBadgeProgress(score: number): {
  currentBadge: Badge;
  nextBadge: Badge | null;
  progress: number;
  pointsToNext: number;
} {
  const currentBadge = getBadgeForScore(score);
  
  // If at Master level, no next badge
  if (currentBadge.level === 'Master') {
    return {
      currentBadge,
      nextBadge: null,
      progress: 100,
      pointsToNext: 0,
    };
  }

  // Find next badge
  const badgeLevels: BadgeLevel[] = ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Master'];
  const currentIndex = badgeLevels.indexOf(currentBadge.level);
  const nextBadgeLevel = badgeLevels[currentIndex + 1];
  if (!nextBadgeLevel) {
    return {
      currentBadge,
      nextBadge: null,
      progress: 100,
      pointsToNext: 0,
    };
  }
  const nextBadge = BADGES[nextBadgeLevel];

  // Calculate progress
  const pointsInCurrentLevel = score - currentBadge.minScore;
  const pointsNeededForNext = nextBadge.minScore - currentBadge.minScore;
  const progress = Math.min(100, (pointsInCurrentLevel / pointsNeededForNext) * 100);
  const pointsToNext = nextBadge.minScore - score;

  return {
    currentBadge,
    nextBadge,
    progress,
    pointsToNext,
  };
}
