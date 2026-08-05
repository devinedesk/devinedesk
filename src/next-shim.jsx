import React, { Suspense } from 'react';

// Mock next/navigation
export function useParams() {
  return {}; // Return empty params, tabs will fallback to initial defaults
}

export function useRouter() {
  return {
    push: (url) => {
      // Very basic hash navigation mock for standalone shell
      window.location.hash = url;
    },
    replace: (url) => {
      window.location.hash = url;
    },
    prefetch: () => {}
  };
}

export function usePathname() {
  return window.location.pathname;
}

export function useSearchParams() {
  return new URLSearchParams(window.location.search);
}

// Mock next/image
export default function Image({ src, alt, width, height, className, priority, fill, ...props }) {
  // eslint-disable-next-line jsx-a11y/alt-text
  return <img src={src} alt={alt} width={width} height={height} className={className} {...props} />;
}

// Mock next/dynamic
export function dynamic(dynamicOptions, options) {
  const LazyComponent = React.lazy(dynamicOptions);
  return function DynamicComponent(props) {
    return (
      <Suspense fallback={options?.loading ? options.loading() : <div>Loading...</div>}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}
