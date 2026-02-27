import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/dashboard/stats
 * Returns aggregated dashboard statistics for the volunteer panel.
 */
export async function GET() {
  try {
    const supabase = createAdminClient();

    // Run all queries in parallel
    const [casesResult, approvalsResult, sessionsResult, kbResult] =
      await Promise.all([
        // Open cases count
        supabase
          .from("cases")
          .select("id", { count: "exact", head: true })
          .in("case_status", ["open", "in_progress", "awaiting_human", "awaiting_soldier"]),
        // Pending approvals count
        supabase
          .from("approval_queue")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
        // Active chat sessions count
        supabase
          .from("chat_sessions")
          .select("id", { count: "exact", head: true })
          .eq("status", "active"),
        // KB documents count
        supabase
          .from("kb_documents")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true),
      ]);

    return NextResponse.json({
      openCases: casesResult.count ?? 0,
      pendingApprovals: approvalsResult.count ?? 0,
      activeSessions: sessionsResult.count ?? 0,
      kbDocuments: kbResult.count ?? 0,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
