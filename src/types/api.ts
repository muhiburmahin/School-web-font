/**
 * Error JSON from the backend GlobalExceptionFilter.
 * There is no global success envelope. List endpoints that exist today return
 * `{ items, nextCursor }` rather than a shared wrapper.
 */
export interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  path: string;
  requestId: string;
  timestamp: string;
}

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
}
