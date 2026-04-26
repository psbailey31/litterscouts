import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

/**
 * User profile display component showing user info and sign-out option
 */
export function UserProfile() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();

  const handleViewProfile = () => {
    if (user?.id) {
      navigate(`/profile/${user.id}`);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center space-x-3">
        <div className="animate-pulse">
          <div className="h-10 w-10 bg-gray-300 rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <button
      onClick={handleViewProfile}
      className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
    >
      {user.imageUrl && (
        <img
          src={user.imageUrl}
          alt={user.fullName || user.username || 'User'}
          className="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
        />
      )}
      <div className="hidden md:block text-left">
        <p className="text-sm font-medium text-gray-900">
          {user.fullName || user.username || 'User'}
        </p>
        <p className="text-xs text-gray-500">
          {user.primaryEmailAddress?.emailAddress}
        </p>
      </div>
    </button>
  );
}
