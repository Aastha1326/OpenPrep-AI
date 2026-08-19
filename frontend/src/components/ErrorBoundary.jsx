import { Component } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    // Auto-reload on deployment chunk mismatch
    const isChunkError =
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('Importing a module script failed');

    if (isChunkError) {
      const lastReload = sessionStorage.getItem('chunk_reload');
      const now = Date.now();
      if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
        sessionStorage.setItem('chunk_reload', now.toString());
        window.location.reload();
      }
    }
  }

  handleRetry = () => {
    const isChunkError =
      this.state.error?.message?.includes('Failed to fetch dynamically imported module') ||
      this.state.error?.message?.includes('Importing a module script failed');

    if (isChunkError) {
      window.location.reload();
    } else {
      this.setState({ hasError: false, error: null });
    }
  };

  render() {
    if (this.state.hasError) {
      const isChunkError =
        this.state.error?.message?.includes('Failed to fetch dynamically imported module') ||
        this.state.error?.message?.includes('Importing a module script failed');

      return (
        <div className="flex min-h-screen items-center justify-center bg-[#FFFBE9] dark:bg-[#000000] p-4 text-[#1F150C] dark:text-[#E1DCC9] font-inter">
          <div className="w-full max-w-md bg-[#E3CAA5]/70 dark:bg-[#1F150C]/95 backdrop-blur-xl rounded-3xl border border-[#CEAB93] dark:border-[#412D15] shadow-2xl p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </div>

            <h1 className="text-2xl font-extrabold font-playfair text-[#1F150C] dark:text-[#E1DCC9] mb-2">
              {isChunkError ? 'New Version Available' : 'Something went wrong'}
            </h1>
            <p className="text-[#412D15] dark:text-[#C4BA9D] text-sm mb-6 font-medium">
              {isChunkError
                ? 'A new version of OpenPrep AI was just deployed. Please reload to load the latest features.'
                : 'An unexpected error occurred. Please try again or return to the home page.'}
            </p>

            {this.state.error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-3.5 mb-6 text-left">
                <p className="text-xs text-red-700 dark:text-red-300 font-mono break-all">
                  {this.state.error.message || 'Unknown error'}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 btn-primary-theme font-bold rounded-xl shadow-md transition-all text-sm cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
                {isChunkError ? 'Reload Page' : 'Try Again'}
              </button>
              <a
                href="/"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 btn-secondary-theme font-bold rounded-xl shadow-sm transition-all text-sm cursor-pointer"
              >
                <Home className="h-4 w-4" />
                Go Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
