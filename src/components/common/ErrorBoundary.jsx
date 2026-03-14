import { Component } from "react";

/**
 * ErrorBoundary
 *
 * Catches unhandled render errors in the component tree below it
 * and shows a friendly fallback UI instead of a blank screen.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log to console in development; swap for a remote logger (e.g. Sentry) in production.
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Optional custom fallback via prop
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="glass-card max-w-md w-full p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <span className="text-2xl">⚠️</span>
            </div>
            <h1 className="text-lg font-semibold text-foreground">
              Something went wrong
            </h1>
            <p className="text-sm text-muted-foreground">
              An unexpected error occurred. Please try refreshing the page. If
              the problem persists, contact your administrator.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre className="text-left text-xs bg-muted rounded-md p-3 overflow-auto max-h-40 text-destructive">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 text-sm rounded-md border border-border bg-background hover:bg-accent transition-colors"
              >
                Try again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Reload page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
