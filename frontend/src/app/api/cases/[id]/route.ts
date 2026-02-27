import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("cases")
      .select("*, case_events(*)")
      .eq("id", params.id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ case: data });
  } catch (error) {
    console.error("Case GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.status) updates.case_status = body.status;
    if (body.volunteerId) updates.assigned_volunteer_id = body.volunteerId;
    if (body.priority) updates.priority = body.priority;
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.status === "closed") updates.closed_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("cases")
      .update(updates)
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log the event
    if (body.status) {
      await supabase.from("case_events").insert({
        case_id: params.id,
        event_type: "status_change",
        payload: { from: body.previousStatus, to: body.status },
        by_user_id: body.actorId || null,
      });
    }

    return NextResponse.json({ case: data });
  } catch (error) {
    console.error("Case PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
