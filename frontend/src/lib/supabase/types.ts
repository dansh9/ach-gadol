/* ===================================================================
 * TypeScript interfaces matching db/schema.sql tables.
 * Keep in sync with the database schema.
 * =================================================================== */

/* ---------- Enums ---------- */

export type UserRole = "soldier" | "volunteer" | "admin";
export type SoldierCategory =
  | "new_immigrant"
  | "alone_in_country"
  | "disconnected"
  | "single_parent"
  | "orphan"
  | "ward_of_state";
export type ServiceStatus = "in_service" | "released" | "reserves";
export type CaseStatus = "open" | "in_progress" | "waiting" | "closed";
export type CasePriority = "low" | "medium" | "high" | "urgent";
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type ApprovalRiskLevel = "green" | "yellow" | "red";
export type ChatChannel = "web" | "whatsapp" | "telegram";

/* ---------- Tables ---------- */

export interface User {
  id: string; // uuid
  email: string | null;
  phone: string | null;
  full_name: string;
  preferred_language: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SoldierProfile {
  id: string;
  user_id: string;
  personal_id: string | null;
  military_id: string | null;
  category: SoldierCategory;
  service_status: ServiceStatus;
  unit: string | null;
  draft_date: string | null;
  release_date: string | null;
  is_combat: boolean;
  country_of_origin: string | null;
  aliyah_date: string | null;
  has_family_in_israel: boolean;
  created_at: string;
  updated_at: string;
}

export interface Case {
  id: string;
  soldier_id: string;
  volunteer_id: string | null;
  title: string;
  description: string | null;
  status: CaseStatus;
  priority: CasePriority;
  category: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

export interface CaseEvent {
  id: string;
  case_id: string;
  actor_id: string | null;
  event_type: string;
  content: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface Document {
  id: string;
  case_id: string | null;
  user_id: string | null;
  file_name: string;
  file_url: string;
  file_type: string | null;
  uploaded_at: string;
}

export interface EligibilityResult {
  id: string;
  user_id: string | null;
  session_id: string | null;
  answers: Record<string, unknown>;
  results: Record<string, unknown>;
  total_monthly: number | null;
  created_at: string;
}

export interface KbDocument {
  id: string;
  title: string;
  source_url: string | null;
  category: string | null;
  language: string;
  content: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface KbChunk {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  embedding: number[] | null; // vector(1536)
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface Right {
  id: string;
  name: string;
  description: string | null;
  category: string;
  amount: number | null;
  currency: string;
  eligibility_conditions: Record<string, unknown> | null;
  source_url: string | null;
  language: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Rule {
  id: string;
  right_id: string | null;
  condition_json: Record<string, unknown>;
  action_json: Record<string, unknown>;
  priority: number;
  is_active: boolean;
  created_at: string;
}

export interface ChatSession {
  id: string;
  user_id: string | null;
  channel: ChatChannel;
  language: string;
  external_id: string | null;
  started_at: string;
  last_message_at: string | null;
  is_active: boolean;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  confidence: number | null;
  sources: string[] | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface ApprovalQueueItem {
  id: string;
  chat_message_id: string | null;
  risk_level: ApprovalRiskLevel;
  status: ApprovalStatus;
  reviewer_id: string | null;
  original_response: string;
  approved_response: string | null;
  review_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export interface FormTemplate {
  id: string;
  name: string;
  description: string | null;
  fields_json: Record<string, unknown>;
  language: string;
  is_active: boolean;
  created_at: string;
}

export interface Translation {
  id: string;
  key: string;
  language: string;
  value: string;
  namespace: string;
  created_at: string;
  updated_at: string;
}

export interface GlossaryEntry {
  id: string;
  term: string;
  definition: string;
  language: string;
  category: string | null;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}
