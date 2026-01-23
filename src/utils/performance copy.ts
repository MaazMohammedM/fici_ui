import { memo, useCallback, useMemo } from 'react';

// Higher-order component for memoization
export const withMemo = <P extends object>(Component: React.ComponentType<P>) => 
  memo(Component);

// Custom hook for stable callbacks
export const useStableCallback = <T extends (...args: any[]) => any>(callback: T): T => 
  useCallback(callback, []);

// Custom hook for computed values
export const useComputedValue = <T>(factory: () => T, deps: React.DependencyList): T => 
  useMemo(factory, deps);