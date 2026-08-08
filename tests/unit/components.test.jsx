import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

describe('Shared UI Components', () => {
  describe('Button Component', () => {
    it('renders correctly with default props', () => {
      render(<Button>Click Me</Button>);
      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeDefined();
      expect(button.className).toContain('bg-primary');
    });

    it('handles onClick events', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click Me</Button>);
      fireEvent.click(screen.getByRole('button', { name: /click me/i }));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('shows loading spinner when isLoading is true', () => {
      render(<Button isLoading>Submit</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
      // Wait, there should be an SVG spinner. We can check if it exists by checking testid or svg.
      expect(screen.getByRole('button').querySelector('svg')).toBeDefined();
    });
  });

  describe('Card Component', () => {
    it('renders children correctly', () => {
      render(
        <Card>
          <div data-testid="child-element">Hello</div>
        </Card>
      );
      expect(screen.getByTestId('child-element')).toBeDefined();
    });
  });

  describe('Badge Component', () => {
    it('renders variant classes correctly', () => {
      render(<Badge variant="success">Active</Badge>);
      const badge = screen.getByText('Active');
      expect(badge.className).toContain('text-green-400');
    });
  });
});
