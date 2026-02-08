import React, { type ReactNode } from 'react';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
  retryKey: number;
}

export class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    hasError: false,
    errorMessage: '',
    retryKey: 0,
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'Unexpected UI error',
      retryKey: 0,
    };
  }

  componentDidCatch(error: Error): void {
    // Keep this log for runtime diagnostics in devtools.
    console.error('AppErrorBoundary captured an error', error);
  }

  private handleRetry = (): void => {
    this.setState((prevState) => ({
      hasError: false,
      errorMessage: '',
      retryKey: prevState.retryKey + 1,
    }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="card" style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
            Runtime error
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 12 }}>
            {this.state.errorMessage}
          </p>
          <button className="btn btn-sm" onClick={this.handleRetry}>
            Try again
          </button>
        </div>
      );
    }

    return (
      <React.Fragment key={this.state.retryKey}>
        {this.props.children}
      </React.Fragment>
    );
  }
}
