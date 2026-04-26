import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';

/**
 * Custom hook for authentication state and user data
 * Wraps Clerk's useAuth and useUser hooks for easier access
 */
export function useAuth() {
  const { isLoaded: authLoaded, isSignedIn, userId } = useClerkAuth();
  const { user, isLoaded: userLoaded } = useUser();

  const isLoaded = authLoaded && userLoaded;

  return {
    isLoaded,
    isSignedIn,
    userId,
    user,
    isAuthenticated: isSignedIn && !!user,
  };
}
