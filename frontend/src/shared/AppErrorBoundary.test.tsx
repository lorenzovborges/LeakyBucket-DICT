import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AppErrorBoundary } from './AppErrorBoundary';

describe('AppErrorBoundary', () => {
  it('captures a child render error and shows fallback', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const ThrowingComponent = () => {
      throw new Error('Boom!');
    };

    render(
      <AppErrorBoundary>
        <ThrowingComponent />
      </AppErrorBoundary>,
    );

    expect(screen.getByText('Runtime error')).toBeInTheDocument();
    expect(screen.getByText('Boom!')).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  it('retries rendering after pressing the retry button', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    let shouldThrow = true;

    const FlakyComponent = () => {
      if (shouldThrow) {
        throw new Error('Temporary failure');
      }

      return <div>Recovered UI</div>;
    };

    render(
      <AppErrorBoundary>
        <FlakyComponent />
      </AppErrorBoundary>,
    );

    expect(screen.getByText('Runtime error')).toBeInTheDocument();

    shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(screen.getByText('Recovered UI')).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });
});
