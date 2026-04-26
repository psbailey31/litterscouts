import { useState, useEffect } from 'react';
import type { Coordinates } from '@/types';

interface GeolocationState {
  coordinates: Coordinates | null;
  error: string | null;
  loading: boolean;
}

/**
 * Custom hook to get user's current geolocation
 */
export default function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    coordinates: null,
    error: null,
    loading: false,
  });

  const getCurrentPosition = () => {
    if (!navigator.geolocation) {
      setState({
        coordinates: null,
        error: 'Geolocation is not supported by your browser',
        loading: false,
      });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          coordinates: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
          error: null,
          loading: false,
        });
      },
      (error) => {
        setState({
          coordinates: null,
          error: error.message,
          loading: false,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return {
    ...state,
    getCurrentPosition,
  };
}
