import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/** Catches render errors so users see a message instead of a blank page. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      return (
        <div dir="rtl" lang="he" className="min-h-dvh bg-background p-6 text-foreground">
          <h1 className="font-display text-xl font-semibold text-destructive">שגיאה בטעינת המערכת</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            פתח את קונסול המפתחים (F12) לפרטים נוספים.
          </p>
          <pre className="mt-4 max-h-[50vh] overflow-auto rounded-md border border-border bg-muted/30 p-4 text-left text-xs" dir="ltr">
            {this.state.error.message}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
