import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RotateCcw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled UI error:', error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = '/'
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
          <div className="max-w-md w-full p-8 text-center bg-card border border-border rounded-2xl shadow-lg space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
              <AlertTriangle className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h1 className="font-display text-2xl font-medium text-foreground">Something went wrong</h1>
              <p className="text-sm text-muted-foreground">
                We encountered an unexpected error while loading this page. Our technical team has been notified.
              </p>
            </div>

            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <div className="p-3 bg-muted rounded-lg text-left text-xs font-mono text-destructive overflow-auto max-h-32">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button onClick={this.handleReset} className="w-full sm:w-auto gap-2">
                <RotateCcw className="h-4 w-4" />
                <span>Try Again</span>
              </Button>
              <Button variant="outline" onClick={this.handleGoHome} className="w-full sm:w-auto gap-2">
                <Home className="h-4 w-4" />
                <span>Return Home</span>
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
