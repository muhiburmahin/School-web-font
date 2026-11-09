export interface ErrorReport {
  scope: string;
  status?: number;
  requestId?: string;
}

type ErrorReporter = (event: ErrorReport) => void;

let reporter: ErrorReporter = () => undefined;

export function reportError(event: ErrorReport): void {
  reporter(event);
}

export function setErrorReporter(next: ErrorReporter): void {
  reporter = next;
}
