'use client';

import { Component, type ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
          <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <p className="font-display text-lg font-bold text-text-main mb-2">Something went wrong</p>
          <p className="text-text-muted text-sm mb-6 max-w-sm">An unexpected error occurred. Try refreshing the page.</p>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            className="flex items-center gap-2 bg-surface border border-border hover:border-primary text-text-main px-5 py-2.5 rounded-xl font-semibold text-sm transition-all"
          >
            <RefreshCw size={16} /> Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
