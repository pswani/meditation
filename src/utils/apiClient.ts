import { buildApiUrl } from './apiConfig';

type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface ApiRequestJsonOptions<TBody = unknown> {
  readonly method?: ApiMethod;
  readonly apiBaseUrl?: string;
  readonly body?: TBody;
  readonly headers?: HeadersInit;
  readonly signal?: AbortSignal;
}

export class ApiClientError extends Error {
  readonly status: number | null;
  readonly url: string;
  readonly detail: string | null;

  constructor(message: string, url: string, options?: { readonly status?: number | null; readonly detail?: string | null }) {
    super(message);
    this.name = 'ApiClientError';
    this.status = options?.status ?? null;
    this.url = url;
    this.detail = options?.detail ?? null;
  }
}

export function isApiClientError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError;
}

export async function requestJson<TResponse, TBody = unknown>(
  path: string,
  options: ApiRequestJsonOptions<TBody> = {}
): Promise<TResponse> {
  const url = buildApiUrl(path, options.apiBaseUrl);
  const method = options.method ?? 'GET';
  const hasJsonBody = options.body !== undefined;

  let response: Response;

  try {
    response = await fetch(url, {
      method,
      signal: options.signal,
      headers: {
        Accept: 'application/json',
        ...(hasJsonBody ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
      body: hasJsonBody ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiClientError('Unable to reach the API right now.', url);
  }

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
    });
  }

  try {
    return (await response.json()) as TResponse;
  } catch {
    throw new ApiClientError('The API returned invalid JSON.', url, {
      status: response.status,
    });
  }
}
