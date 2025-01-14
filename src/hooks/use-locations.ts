import { useState, useEffect } from 'react';
import { getLocations } from '@/lib/db/locations';
import { Location } from '@/types';
import { useAuthStore } from '@/store/auth';

export function useLocations() {
  const { user } = useAuthStore();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLocations() {
      if (!user?.organizationId) {
        setLoading(false);
        return;
      }

      try {
        const data = await getLocations(user.organizationId);
        setLocations(data);
        setError(null);
      } catch (err) {
        console.error('Error loading locations:', err);
        setError('Failed to load locations');
      } finally {
        setLoading(false);
      }
    }

    loadLocations();
  }, [user?.organizationId]);

  return { locations, loading, error };
}