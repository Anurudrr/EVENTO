import React from 'react';

type AppErrorBoundaryProps = {
  children: React.ReactNode;
};

type AppErrorBoundaryState = {
  errorMessage: string | null;
};

export class AppErrorBoundary extends React.Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    errorMessage: null,
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      errorMessage: error.message || 'Unexpected application error',
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[app-error-boundary]', error, errorInfo);
  }

  render() {
    if (this.state.errorMessage) {
      return (
        <div className="min-h-screen bg-noir-bg flex items-center justify-center px-6">
          <div className="w-full max-w-xl border border-red-500/20 bg-noir-card p-10 text-center">
            <div className="text-[10px] font-mono font-semibold uppercase tracking-[0.4em] text-red-500 mb-4">
              Application error
            </div>
            <h1 className="text-3xl font-display font-semibold text-noir-ink uppercase mb-4">
              Something crashed
            </h1>
            <p className="text-noir-muted mb-8">
              {this.state.errorMessage}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="btn-noir !rounded-none !px-8 !py-4"
            >
              Reload app
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
