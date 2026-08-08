import { describe, it, expect } from 'vitest';
import { cn } from '@/src/lib/utils';

describe('Utils', () => {
  describe('cn()', () => {
    it('should merge tailwind classes properly', () => {
      const result = cn('bg-red-500', 'text-white', 'px-4 py-2');
      expect(result).toBe('bg-red-500 text-white px-4 py-2');
    });

    it('should resolve tailwind conflicts', () => {
      // tailwind-merge should override the padding
      const result = cn('p-4', 'p-8');
      expect(result).toBe('p-8');
    });

    it('should handle conditional classes safely', () => {
      const isActive = true;
      const isError = false;
      const result = cn('base-class', isActive && 'active-class', isError && 'error-class');
      expect(result).toBe('base-class active-class');
    });
  });
});
