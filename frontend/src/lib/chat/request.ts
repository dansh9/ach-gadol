/**
 * Request body for POST /api/chat/send.
 *
 * The session is identified by the signed HttpOnly ag_session cookie, never by
 * anything in the body (AG-SEC-02), so no session id is sent. `reset` is the
 * one way a client can ask the server to abandon the current session and issue
 * a new one.
 */
export interface SendBody {
  message: string;
  language: string;
  channel: "website";
  reset?: true;
}

export function buildSendBody(input: {
  message: string;
  locale: string;
  reset?: boolean;
}): SendBody {
  return {
    message: input.message.trim(),
    language: input.locale,
    channel: "website",
    ...(input.reset ? { reset: true as const } : {}),
  };
}
