export type ApiErrorKind =
  | "validation"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "rate_limited"
  | "client"
  | "server"
  | "network"
  | "timeout";

export class ApiError extends Error {
  readonly status: number;
  readonly kind: ApiErrorKind;
  readonly messages: string[];
  readonly fieldErrors: Record<string, string[]>;
  readonly requestId?: string;
  readonly retryAfterSeconds?: number;

  constructor(options: {
    status: number;
    kind: ApiErrorKind;
    messages: string[];
    fieldErrors?: Record<string, string[]>;
    requestId?: string;
    retryAfterSeconds?: number;
  }) {
    super(options.messages[0] ?? "Request failed.");
    this.name = "ApiError";
    this.status = options.status;
    this.kind = options.kind;
    this.messages = options.messages;
    this.fieldErrors = options.fieldErrors ?? {};
    this.requestId = options.requestId;
    this.retryAfterSeconds = options.retryAfterSeconds;
  }
}

export function apiErrorFromBody(status: number, body: unknown, retryAfterHeader?: string | null): ApiError {
  const parsed = readErrorBody(body);
  const messages = parsed.messages.length > 0 ? parsed.messages : [fallbackMessage(status)];
  return new ApiError({
    status,
    kind: kindForStatus(status),
    messages,
    fieldErrors: fieldErrorsFromMessages(messages),
    requestId: parsed.requestId,
    retryAfterSeconds: status === 429 ? parseRetryAfter(retryAfterHeader ?? null) : undefined,
  });
}

export function kindForStatus(status: number): ApiErrorKind {
  if (status === 400) return "validation";
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 409) return "conflict";
  if (status === 429) return "rate_limited";
  if (status === 0) return "network";
  if (status >= 500) return "server";
  return "client";
}

export function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined;
  if (/^\d+$/.test(value)) return Number(value);
  const date = Date.parse(value);
  if (Number.isNaN(date)) return undefined;
  return Math.max(0, Math.ceil((date - Date.now()) / 1000));
}

function fallbackMessage(status: number): string {
  if (status === 401) return "Unauthorized";
  if (status === 403) return "Forbidden";
  if (status >= 500) return "Internal server error";
  return "Request failed.";
}

function readErrorBody(body: unknown): { messages: string[]; requestId?: string } {
  if (!body || typeof body !== "object") return { messages: [] };
  const record = body as Record<string, unknown>;
  const requestId = typeof record.requestId === "string" ? record.requestId : undefined;
  const message = record.message;
  if (typeof message === "string" && message.trim()) return { messages: [message], requestId };
  if (Array.isArray(message)) {
    const messages = message.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
    return { messages, requestId };
  }
  return { messages: [], requestId };
}

function fieldErrorsFromMessages(messages: string[]): Record<string, string[]> {
  const fields: Record<string, string[]> = {};
  if (messages.length < 2 && messages[0] && !messages[0].includes(": ")) return fields;
  for (const message of messages) {
    const separator = message.indexOf(": ");
    if (separator <= 0) continue;
    const field = message.slice(0, separator);
    if (!/^[A-Za-z][A-Za-z0-9_.]*$/.test(field)) continue;
    const detail = message.slice(separator + 2);
    fields[field] = [...(fields[field] ?? []), detail];
  }
  return fields;
}
