import { SignIn } from '@clerk/clerk-react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Sign-in page with Clerk authentication
 */
export function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the redirect path from location state, default to home
  const from = (location.state as any)?.from?.pathname || '/';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to Litter Scouts
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Join the community in tracking and cleaning coastal pollution
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <SignIn
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            afterSignInUrl={from}
            appearance={{
              elements: {
                rootBox: 'w-full',
                card: 'shadow-none',
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
