import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();

    if (!body.status || !["approved", "rejected", "changes_requested"].includes(body.status)) {
      return NextResponse.json(
        { error: "status must be approved, rejected, or changes_requested" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("approval_queue")
      .update({
        status: body.status,
        decided_by: body.reviewerId,
        decision_comment: body.comment || null,
        decided_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ approval: data });
  } catch (error) {
    console.error("Approval PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
