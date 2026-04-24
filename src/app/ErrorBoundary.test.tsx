import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

function ThrowingChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('test render error');
  }
  return <div>safe content</div>;
}

describe('ErrorBoundary', () => {
  it('renders children when no error is thrown', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('safe content')).toBeDefined();
  });

  it('renders fallback UI when a child throws', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeDefined();
    expect(screen.getByText('Something went wrong.')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Reload' })).toBeDefined();

    consoleSpy.mockRestore();
  });

  it('calls onError callback with the thrown error', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowingChild shouldThrow />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledOnce();
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect((onError.mock.calls[0][0] as Error).message).toBe('test render error');

    consoleSpy.mockRestore();
  });

  it('renders custom fallback when provided', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary fallback={<div>custom error ui</div>}>
        <ThrowingChild shouldThrow />
      </ErrorBoundary>
    );

    expect(screen.getByText('custom error ui')).toBeDefined();

    consoleSpy.mockRestore();
  });
});
