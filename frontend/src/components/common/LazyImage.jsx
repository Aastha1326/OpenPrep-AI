import React, { useState } from 'react';

/**
 * LazyImage Component
 * Features:
 * - Native loading="lazy" support
 * - Skeleton loader UI / Low-quality placeholder during fetch
 * - WebP <picture> fallback support
 * - Smooth fade-in animation on load
 * - Fallback image handling on error
 */
const LazyImage = ({
  src,
  alt = '',
  className = '',
  skeletonClassName = '',
  placeholderSrc,
  fallbackSrc,
  webpSrc,
  loading = 'lazy',
  onLoad,
  onError,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  const handleLoad = (e) => {
    setIsLoaded(true);
    if (onLoad) onLoad(e);
  };

  const handleError = (e) => {
    setIsError(true);
    setIsLoaded(true);
    if (fallbackSrc) {
      e.target.src = fallbackSrc;
    }
    if (onError) onError(e);
  };

  const currentSrc = isError ? (fallbackSrc || '/default-avatar.png') : src;

  return (
    <div className={`relative overflow-hidden inline-block ${className}`}>
      {/* Skeleton loader / placeholder visible while fetching */}
      {!isLoaded && (
        <div
          className={`absolute inset-0 bg-stone-200 dark:bg-slate-700 animate-pulse rounded-inherit ${skeletonClassName}`}
          data-testid="lazy-image-skeleton"
        />
      )}

      {webpSrc && !isError ? (
        <picture>
          <source srcSet={webpSrc} type="image/webp" />
          <img
            src={currentSrc}
            alt={alt}
            loading={loading}
            onLoad={handleLoad}
            onError={handleError}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            } ${className}`}
            {...props}
          />
        </picture>
      ) : (
        <img
          src={currentSrc}
          alt={alt}
          loading={loading}
          onLoad={handleLoad}
          onError={handleError}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          {...props}
        />
      )}
    </div>
  );
};

export default LazyImage;
