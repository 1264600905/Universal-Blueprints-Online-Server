import { useState, useEffect } from 'react';
import { BlueprintListItem, BlueprintDetailData } from '../types';
import { buildXmlUrl } from '../utils/blueprintUtils';
import { parseXmlDetail } from '../utils/xmlDetailParser';
import { XML_FETCH_TIMEOUT_MS } from '../constants';

const detailCache: Record<string, BlueprintDetailData> = {};

interface UseBlueprintDetailReturn {
  detailData: BlueprintDetailData | null;
  loading: boolean;
  error: string | null;
}

export const useBlueprintDetail = (
  blueprint: BlueprintListItem | null,
  basePath: string
): UseBlueprintDetailReturn => {
  const [detailData, setDetailData] = useState<BlueprintDetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!blueprint) {
      setDetailData(null);
      setError(null);
      setLoading(false);
      return;
    }

    if (detailCache[blueprint.id]) {
      setDetailData(detailCache[blueprint.id]);
      setLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);

      try {
        const url = buildXmlUrl(blueprint, basePath);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), XML_FETCH_TIMEOUT_MS);

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Failed to fetch XML: ${response.statusText}`);
        }

        const xmlString = await response.text();
        const parsed = parseXmlDetail(xmlString);

        if (isMounted) {
          detailCache[blueprint.id] = parsed;
          setDetailData(parsed);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching/parsing blueprint detail:', err);
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDetail();

    return () => {
      isMounted = false;
    };
  }, [blueprint, basePath]);

  return { detailData, loading, error };
};