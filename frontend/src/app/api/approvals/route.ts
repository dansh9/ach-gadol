import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending";

    const { data, error } = await supabase
      .from("approval_queue")
      .select("*")
      .eq("status", status)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ approvals: data });
  } catch (error) {
    console.error("Approvals GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from("approval_queue")
      .insert({
        case_id: body.caseId,
        approval_type: body.approvalType,
        risk_level: body.riskLevel || "yellow",
        ai_suggestion: body.aiSuggestion,
        ai_sources: body.aiSources,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ approval: data }, { status: 201 });
  } catch (error) {
    console.error("Approvals POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
