/* ===================================================================
 * TypeScript interfaces matching db/schema.sql tables.
 * Keep in sync with the database schema.
 * =================================================================== */

/* ---------- Enums ---------- */

export type ChatChannel = "website" | "whatsapp" | "telegram" | "facebook" | "other";

/* ---------- Tables ---------- */

export interface KbDocument {
  id: string;
  title: string;
  source_url: string | null;
  source_name: string | null;
  content: string;
  content_html: string | null;
  language: string;
  tags: string[];
  version: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface KbChunk {
  id: string;
  kb_document_id: string;
  chunk_text: string;
  chunk_index: number;
  embedding: number[] | null; // vector(1536)
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ChatSession {
  id: string;
  channel: ChatChannel;
  language: string;
  status: "active" | "escalated" | "closed";
  satisfaction_rating: number | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant" | "system" | "volunteer";
  content: string;
  sources: unknown[];
  suggested_actions: unknown[];
  confidence: number | null;
  created_at: string;
}
