import { AlertCircle, RefreshCw } from 'lucide-react';

export function LoadingState() {
  return (
    <div role="status" className="space-y-300 p-600" aria-label="Loading progress" aria-busy="true">
      <p className="text-300 text-muted-foreground">Gathering the explorers...</p>
      {[1, 2, 3].map((row) => <div key={row} className="h-800 animate-pulse rounded-lg bg-muted" />)}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="rounded-xl border border-dashed p-600 text-center">
      <p className="font-heading font-semibold">{title}</p>
      <p className="mt-200 text-300 text-muted-foreground">{hint}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex items-start gap-300 rounded-xl border border-destructive/30 bg-destructive/5 p-400 text-300 text-destructive">
      <AlertCircle className="icon-size-300 shrink-0" />
      <div className="flex-1">
        <p>{message}</p>
        {onRetry && <button type="button" onClick={onRetry} className="mt-300 inline-flex items-center gap-200 font-semibold underline underline-offset-4"><RefreshCw className="icon-size-200" />Try again</button>}
      </div>
    </div>
  );
}
