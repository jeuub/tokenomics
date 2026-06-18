// @tokenomics/api-client
// Typed fetch client. No runtime dependencies — uses the platform `fetch`.

// ---------------------------------------------------------------------------
// Anthropic-compatible /v1/messages passthrough types (minimal, structural)
// ---------------------------------------------------------------------------

export interface MessageParam {
  role: "user" | "assistant";
  content: string | Array<{ type: string; [k: string]: unknown }>;
}

export interface CreateMessageRequest {
  model: string;
  messages: MessageParam[];
  max_tokens: number;
  system?: string;
  temperature?: number;
  stream?: boolean;
  [k: string]: unknown;
}

export interface Usage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}

export interface CreateMessageResponse {
  id: string;
  type: "message";
  role: "assistant";
  model: string;
  content: Array<{ type: string; text?: string; [k: string]: unknown }>;
  stop_reason: string | null;
  usage: Usage;
}

// ---------------------------------------------------------------------------
// Dashboard REST types
// ---------------------------------------------------------------------------

export interface Session {
  id: string;
  createdAt: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

export interface SessionsResponse {
  sessions: Session[];
  total: number;
}

export interface EstimateRequest {
  model: string;
  inputTokens: number;
  outputTokens: number;
}

export interface EstimateResponse {
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export interface ClientOptions {
  baseUrl: string;
  /** Returns the current access token (or null if unauthenticated). */
  getToken?: () => string | null;
  /**
   * Called once on a 401. Should refresh and return a new token (or null).
   * If it returns a token, the original request is retried once.
   */
  onUnauthorized?: () => Promise<string | null>;
  /** Optional fetch override (tests / SSR). Defaults to global fetch. */
  fetch?: typeof fetch;
}

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;
  constructor(status: number, body: unknown, message?: string) {
    super(message ?? `Request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export interface ApiClient {
  /** Imperatively set the in-memory access token. */
  setToken(token: string | null): void;
  createMessage(body: CreateMessageRequest): Promise<CreateMessageResponse>;
  listSessions(params?: { limit?: number; cursor?: string }): Promise<SessionsResponse>;
  estimate(body: EstimateRequest): Promise<EstimateResponse>;
}

export function createClient(options: ClientOptions): ApiClient {
  const fetchImpl: typeof fetch = options.fetch ?? globalThis.fetch;
  const base = options.baseUrl.replace(/\/$/, "");

  // In-memory access token. Seeded from getToken() if provided.
  let token: string | null = options.getToken ? options.getToken() : null;

  function authHeaders(): Record<string, string> {
    return token ? { authorization: `Bearer ${token}` } : {};
  }

  async function request<T>(path: string, init: RequestInit, retrying = false): Promise<T> {
    const res = await fetchImpl(`${base}${path}`, {
      ...init,
      headers: {
        "content-type": "application/json",
        ...authHeaders(),
        ...(init.headers as Record<string, string> | undefined),
      },
    });

    if (res.status === 401 && !retrying && options.onUnauthorized) {
      const refreshed = await options.onUnauthorized();
      if (refreshed) {
        token = refreshed;
        return request<T>(path, init, true);
      }
    }

    if (!res.ok) {
      let body: unknown = null;
      try {
        body = await res.json();
      } catch {
        // non-JSON error body; leave as null
      }
      throw new ApiError(res.status, body);
    }

    return (await res.json()) as T;
  }

  return {
    setToken(next: string | null): void {
      token = next;
    },

    createMessage(body: CreateMessageRequest): Promise<CreateMessageResponse> {
      return request<CreateMessageResponse>("/v1/messages", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },

    listSessions(params): Promise<SessionsResponse> {
      const qs = new URLSearchParams();
      if (params?.limit != null) qs.set("limit", String(params.limit));
      if (params?.cursor) qs.set("cursor", params.cursor);
      const suffix = qs.toString() ? `?${qs.toString()}` : "";
      return request<SessionsResponse>(`/api/sessions${suffix}`, {
        method: "GET",
      });
    },

    estimate(body: EstimateRequest): Promise<EstimateResponse> {
      return request<EstimateResponse>("/api/estimate", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
  };
}
