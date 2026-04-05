import { buildApiUrl } from './apiConfig';

type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface ApiRequestJsonOptions<TBody = unknown> {
  readonly method?: ApiMethod;
  readonly apiBaseUrl?: string;
  readonly body?: TBody;
  readonly headers?: HeadersInit;
  readonly signal?: AbortSignal;
  readonly timeoutMs?: number;
}

type ApiClientErrorKind = 'network' | 'http' | 'invalid-json' | 'invalid-response' | 'timeout' | 'aborted';

export const DEFAULT_API_TIMEOUT_MS = 15000;

export class ApiClientError extends Error {
  readonly status: number | null;
  readonly url: string;
  readonly detail: string | null;
  readonly kind: ApiClientErrorKind;

  constructor(
    message: string,
    url: string,
    options?: { readonly status?: number | null; readonly detail?: string | null; readonly kind?: ApiClientErrorKind }
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.status = options?.status ?? null;
    this.url = url;
    this.detail = options?.detail ?? null;
    this.kind = options?.kind ?? 'http';
  }
}

export function isApiClientError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError;
}

export function isBackendReachabilityError(error: unknown): boolean {
  if (!isApiClientError(error)) {
    return false;
  }

  if (error.kind === 'network' || error.kind === 'timeout') {
    return true;
  }

  return error.status === 502 || error.status === 503 || error.status === 504;
}

export async function requestJson<TResponse, TBody = unknown>(
  path: string,
  options: ApiRequestJsonOptions<TBody> = {}
): Promise<TResponse> {
  const url = buildApiUrl(path, options.apiBaseUrl);
  const method = options.method ?? 'GET';
  const hasJsonBody = options.body !== undefined;
  const timeoutMs = options.timeoutMs ?? DEFAULT_API_TIMEOUT_MS;
  const abortController = new AbortController();
  const externalSignal = options.signal;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let timedOut = false;
  let aborted = false;

  if (externalSignal?.aborted) {
    throw new ApiClientError('API request was cancelled.', url, {
      kind: 'aborted',
    });
  }

  const abortFromExternalSignal = () => {
    aborted = true;
    abortController.abort();
  };

  externalSignal?.addEventListener('abort', abortFromExternalSignal);
  if (timeoutMs > 0) {
    timeoutId = setTimeout(() => {
      timedOut = true;
      abortController.abort();
    }, timeoutMs);
  }

  let response: Response;

  try {
    response = await fetch(url, {
      method,
      signal: abortController.signal,
      headers: {
        Accept: 'application/json',
        ...(hasJsonBody ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
      body: hasJsonBody ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    externalSignal?.removeEventListener('abort', abortFromExternalSignal);

    if (timedOut) {
      throw new ApiClientError('API request timed out.', url, {
        kind: 'timeout',
      });
    }

    if (aborted || externalSignal?.aborted) {
      throw new ApiClientError('API request was cancelled.', url, {
        kind: 'aborted',
      });
    }

    throw new ApiClientError('Unable to reach the API right now.', url, {
      kind: 'network',
    });
  }

  if (timeoutId !== null) {
    clearTimeout(timeoutId);
  }
  externalSignal?.removeEventListener('abort', abortFromExternalSignal);

  if (!response.ok) {
    let detail: string | null = null;

    try {
      const responseText = await response.text();
      detail = responseText.trim() ? responseText : null;
    } catch {
      detail = null;
    }

    throw new ApiClientError(`API request failed with status ${response.status}.`, url, {
      status: response.status,
      detail,
      kind: 'http',
    });
  }

  try {
    return (await response.json()) as TResponse;
  } catch {
    throw new ApiClientError('The API returned invalid JSON.', url, {
      status: response.status,
      kind: 'invalid-json',
    });
  }
}
