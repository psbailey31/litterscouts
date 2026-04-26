import { getBadgeForScore, getNextBadgeProgress } from '@/utils/badges';

interface BadgeDisplayProps {
  impactScore: number;
  showProgress?: boolean;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Display user's badge based on impact score
 */
export function BadgeDisplay({ impactScore, showProgress = false, size = 'medium' }: BadgeDisplayProps) {
  const { currentBadge, nextBadge, progress, pointsToNext } = getNextBadgeProgress(impactScore);

  const sizeClasses = {
    small: 'h-12 w-12',
    medium: 'h-20 w-20',
    large: 'h-32 w-32',
  };

  return (
    <div className="flex flex-col items-center space-y-3">
      {/* Badge Image */}
      <div className="relative">
        <img
          src={currentBadge.image}
          alt={`${currentBadge.level} Badge`}
          className={`${sizeClasses[size]} object-contain`}
        />
      </div>

      {/* Badge Info */}
      <div className="text-center">
        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${currentBadge.color}`}>
          {currentBadge.level}
        </span>
        <p className="text-xs text-gray-600 mt-1">{currentBadge.description}</p>
      </div>

      {/* Progress to Next Badge */}
      {showProgress && nextBadge && (
        <div className="w-full max-w-xs">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Progress to {nextBadge.level}</span>
            <span>{pointsToNext} points to go</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{currentBadge.minScore}</span>
            <span>{nextBadge.minScore}</span>
          </div>
        </div>
      )}

      {/* Master Badge - No Progress */}
      {showProgress && !nextBadge && (
        <div className="text-center">
          <p className="text-sm font-semibold text-yellow-600">🏆 Maximum Level Achieved!</p>
          <p className="text-xs text-gray-600">You're an environmental legend</p>
        </div>
      )}
    </div>
  );
}
