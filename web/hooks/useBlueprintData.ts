import { useState, useEffect } from 'react';
import { BlueprintIndex, BlueprintDerived } from '../types';
import { parseBlueprintData } from '../utils/blueprintUtils';
import { DATA_PATH, REMOTE_BASE_URL } from '../constants';

interface UseBlueprintDataReturn {
  blueprints: BlueprintDerived[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export const useBlueprintData = (): UseBlueprintDataReturn => {
  const [blueprints, setBlueprints] = useState<BlueprintDerived[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      let data: BlueprintIndex;
      let basePath = './';

      try {
        // 1. Try fetching local index.json
        try {
            const response = await fetch(DATA_PATH, {
                 cache: "no-store", 
                 headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) {
                // If 404 or other error, throw to catch block to trigger fallback
                throw new Error(response.statusText);
            }
            
            data = await response.json();
            
        } catch (localErr) {
            console.warn("Local data load failed. Switching to remote fallback.", localErr);
            
            // 2. Fallback to Remote GitHub Raw URL
            const response = await fetch(`${REMOTE_BASE_URL}index.json`, {
                 cache: "no-store" 
            });

            if (!response.ok) {
                 throw new Error(`Remote fetch failed: ${response.statusText}`);
            }

            data = await response.json();
            basePath = REMOTE_BASE_URL;
        }

        // Parse and enhance data with the determined base path
        const processed = data.blueprints.map(bp => parseBlueprintData(bp, basePath));
        setBlueprints(processed);

      } catch (err) {
        console.error("Data fetch error:", err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [trigger]);

  const refresh = () => setTrigger(prev => prev + 1);

  return { blueprints, loading, error, refresh };
};