import { useEffect, useState } from 'react';
import type { MediaAssetMetadata } from '../../types/mediaAsset';
import type { MediaAssetCatalogIssue, MediaAssetCatalogSource } from '../../utils/mediaAssetApi';
import { loadCustomPlayMediaAssets } from '../../utils/mediaAssetApi';

// refreshVersion can be incremented by the caller to re-fetch the catalog after a
// custom play save or delete — ensures the recording list stays current without a full reload.
export function useCustomPlayMediaCatalog(refreshVersion = 0) {
  const [mediaAssets, setMediaAssets] = useState<MediaAssetMetadata[]>([]);
  const [mediaCatalogSource, setMediaCatalogSource] = useState<MediaAssetCatalogSource>('sample-fallback');
  const [isMediaCatalogLoading, setIsMediaCatalogLoading] = useState(true);
  const [mediaLoadError, setMediaLoadError] = useState<string | null>(null);
  const [mediaLoadIssueKind, setMediaLoadIssueKind] = useState<MediaAssetCatalogIssue | null>(null);

  useEffect(() => {
    let mounted = true;

    loadCustomPlayMediaAssets()
      .then((result) => {
        if (!mounted) {
          return;
        }
        setMediaAssets(result.assets);
        setMediaCatalogSource(result.source);
        setMediaLoadError(result.errorMessage);
        setMediaLoadIssueKind(result.errorKind);
        setIsMediaCatalogLoading(false);
      })
      .catch(() => {
        if (!mounted) {
          return;
        }
        setMediaCatalogSource('sample-fallback');
        setMediaLoadError('Unable to load recording options right now.');
        setMediaLoadIssueKind('backend-error');
        setIsMediaCatalogLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [refreshVersion]);

  return {
    mediaAssets,
    mediaCatalogSource,
    isMediaCatalogLoading,
    mediaLoadError,
    mediaLoadIssueKind,
  };
}
